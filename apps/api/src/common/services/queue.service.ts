import { Inject, Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface JobOptions {
  delay?: number; // Delay in milliseconds
  attempts?: number; // Number of retry attempts
  backoff?: 'fixed' | 'exponential';
  priority?: number; // Higher number = higher priority
  removeOnComplete?: number; // Keep only N completed jobs
  removeOnFail?: number; // Keep only N failed jobs
}

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  options: JobOptions;
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: any;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

type JobProcessor<T = any> = (job: Job<T>) => Promise<any>;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private redis!: Redis;
  private processors = new Map<string, JobProcessor>();
  private activeJobs = new Map<string, Job>();
  private isProcessing = false;
  private processingInterval!: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl, {
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.redis.connect();
      this.logger.info('Queue service connected to Redis successfully');

      // Start job processing
      this.startProcessing();
    } catch (error) {
      this.logger.error('Failed to connect to Redis for queue service:', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.redis) {
      await this.redis.disconnect();
    }
  }

  /**
   * Add a job to the queue
   */
  async add<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options: JobOptions = {}
  ): Promise<string> {
    try {
      const jobId = `${queueName}:${jobName}:${Date.now()}:${Math.random().toString(36).substring(2, 11)}`;

      const job: Job<T> = {
        id: jobId,
        name: jobName,
        data,
        options: {
          attempts: 3,
          backoff: 'exponential',
          priority: 0,
          removeOnComplete: 100,
          removeOnFail: 50,
          ...options,
        },
        attempts: 0,
        createdAt: new Date(),
      };

      const queueKey = `queue:${queueName}`;
      const jobKey = `job:${jobId}`;

      // Store job data
      await this.redis.hset(jobKey, {
        data: JSON.stringify(job),
        status: 'waiting',
      });

      // Add to appropriate queue based on delay and priority
      if (options.delay && options.delay > 0) {
        const delayedTime = Date.now() + options.delay;
        await this.redis.zadd(`${queueKey}:delayed`, delayedTime, jobId);
      } else {
        const priority = options.priority || 0;
        await this.redis.zadd(`${queueKey}:waiting`, -priority, jobId); // Negative for descending order
      }

      this.logger.debug('Job added to queue', { queueName, jobName, jobId });
      return jobId;
    } catch (error) {
      this.logger.error('Failed to add job to queue', { error, queueName, jobName });
      throw error;
    }
  }

  /**
   * Register a job processor
   */
  process<T = any>(queueName: string, jobName: string, processor: JobProcessor<T>): void {
    const key = `${queueName}:${jobName}`;
    this.processors.set(key, processor);
    this.logger.info('Job processor registered', { queueName, jobName });
  }

  /**
   * Get queue statistics
   */
  async getStats(queueName: string): Promise<QueueStats> {
    try {
      const queueKey = `queue:${queueName}`;

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.redis.zcard(`${queueKey}:waiting`),
        this.redis.zcard(`${queueKey}:active`),
        this.redis.zcard(`${queueKey}:completed`),
        this.redis.zcard(`${queueKey}:failed`),
        this.redis.zcard(`${queueKey}:delayed`),
      ]);

      return { waiting, active, completed, failed, delayed };
    } catch (error) {
      this.logger.error('Failed to get queue stats', { error, queueName });
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const jobKey = `job:${jobId}`;
      const jobData = await this.redis.hget(jobKey, 'data');

      if (!jobData) {
        return null;
      }

      return JSON.parse(jobData);
    } catch (error) {
      this.logger.error('Failed to get job', { error, jobId });
      return null;
    }
  }

  /**
   * Remove job from queue
   */
  async removeJob(jobId: string): Promise<void> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        return;
      }

      const queueName = jobId.split(':')[0];
      const queueKey = `queue:${queueName}`;
      const jobKey = `job:${jobId}`;

      // Remove from all possible queues
      await Promise.all([
        this.redis.zrem(`${queueKey}:waiting`, jobId),
        this.redis.zrem(`${queueKey}:active`, jobId),
        this.redis.zrem(`${queueKey}:completed`, jobId),
        this.redis.zrem(`${queueKey}:failed`, jobId),
        this.redis.zrem(`${queueKey}:delayed`, jobId),
        this.redis.del(jobKey),
      ]);

      this.logger.debug('Job removed', { jobId });
    } catch (error) {
      this.logger.error('Failed to remove job', { error, jobId });
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<void> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const queueName = jobId.split(':')[0];
      const queueKey = `queue:${queueName}`;
      const jobKey = `job:${jobId}`;

      // Reset job status
      job.attempts = 0;
      delete job.error;
      delete job.failedAt;

      // Update job data
      await this.redis.hset(jobKey, {
        data: JSON.stringify(job),
        status: 'waiting',
      });

      // Move from failed to waiting queue
      await Promise.all([
        this.redis.zrem(`${queueKey}:failed`, jobId),
        this.redis.zadd(`${queueKey}:waiting`, -(job.options.priority || 0), jobId),
      ]);

      this.logger.info('Job retried', { jobId });
    } catch (error) {
      this.logger.error('Failed to retry job', { error, jobId });
      throw error;
    }
  }

  /**
   * Clean up completed and failed jobs
   */
  async clean(queueName: string): Promise<void> {
    try {
      const queueKey = `queue:${queueName}`;

      // Get jobs to clean up
      const [completedJobs, failedJobs] = await Promise.all([
        this.redis.zrange(`${queueKey}:completed`, 0, -101), // Keep last 100
        this.redis.zrange(`${queueKey}:failed`, 0, -51), // Keep last 50
      ]);

      // Remove old jobs
      const jobsToRemove = [...completedJobs, ...failedJobs];
      if (jobsToRemove.length > 0) {
        const pipeline = this.redis.pipeline();

        for (const jobId of jobsToRemove) {
          if (jobId) {
            pipeline.del(`job:${jobId}`);
          }
        }

        if (completedJobs.length > 0) {
          const validCompletedJobs = completedJobs.filter(Boolean);
          if (validCompletedJobs.length > 0) {
            for (const jobId of validCompletedJobs) {
              pipeline.zrem(`${queueKey}:completed`, jobId);
            }
          }
        }

        if (failedJobs.length > 0) {
          const validFailedJobs = failedJobs.filter(Boolean);
          if (validFailedJobs.length > 0) {
            for (const jobId of validFailedJobs) {
              pipeline.zrem(`${queueKey}:failed`, jobId);
            }
          }
        }

        await pipeline.exec();
      }

      this.logger.debug('Queue cleaned', { queueName, removedJobs: jobsToRemove.length });
    } catch (error) {
      this.logger.error('Failed to clean queue', { error, queueName });
    }
  }

  private startProcessing(): void {
    this.isProcessing = true;

    // Process jobs every second
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) return;

      try {
        await this.processDelayedJobs();
        await this.processWaitingJobs();
      } catch (error) {
        this.logger.error('Error in job processing cycle', error);
      }
    }, 1000);
  }

  private async processDelayedJobs(): Promise<void> {
    try {
      // Get all queue names with delayed jobs
      const keys = await this.redis.keys('queue:*:delayed');

      for (const key of keys) {
        const now = Date.now();
        const readyJobs = await this.redis.zrangebyscore(key, 0, now);

        if (readyJobs.length > 0) {
          const queueName = key.replace('queue:', '').replace(':delayed', '');
          const waitingKey = `queue:${queueName}:waiting`;

          const pipeline = this.redis.pipeline();

          for (const jobId of readyJobs) {
            const job = await this.getJob(jobId);
            if (job) {
              const priority = -(job.options.priority || 0);
              pipeline.zadd(waitingKey, priority, jobId);
              pipeline.zrem(key, jobId);
            }
          }

          await pipeline.exec();
        }
      }
    } catch (error) {
      this.logger.error('Error processing delayed jobs', error);
    }
  }

  private async processWaitingJobs(): Promise<void> {
    try {
      // Get all queue names with waiting jobs
      const keys = await this.redis.keys('queue:*:waiting');

      for (const key of keys) {
        const queueName = key.replace('queue:', '').replace(':waiting', '');
        await this.processQueueJobs(queueName);
      }
    } catch (error) {
      this.logger.error('Error processing waiting jobs', error);
    }
  }

  private async processQueueJobs(queueName: string): Promise<void> {
    try {
      const queueKey = `queue:${queueName}`;
      const waitingKey = `${queueKey}:waiting`;
      const activeKey = `${queueKey}:active`;

      // Get next job with highest priority
      const jobIds = await this.redis.zrange(waitingKey, 0, 0);

      if (jobIds.length === 0) {
        return;
      }

      const jobId = jobIds[0];
      if (!jobId) {
        return;
      }
      
      const job = await this.getJob(jobId);

      if (!job) {
        await this.redis.zrem(waitingKey, jobId);
        return;
      }

      // Move job to active queue
      await Promise.all([
        this.redis.zrem(waitingKey, jobId),
        this.redis.zadd(activeKey, Date.now(), jobId),
      ]);

      // Process the job
      await this.executeJob(queueName, job);
    } catch (error) {
      this.logger.error('Error processing queue jobs', { error, queueName });
    }
  }

  private async executeJob(queueName: string, job: Job): Promise<void> {
    const processorKey = `${queueName}:${job.name}`;
    const processor = this.processors.get(processorKey);

    if (!processor) {
      this.logger.warn('No processor found for job', { queueName, jobName: job.name });
      await this.failJob(queueName, job, 'No processor found');
      return;
    }

    const jobKey = `job:${job.id}`;

    try {
      this.logger.debug('Processing job', { jobId: job.id, jobName: job.name });

      // Update job status
      job.processedAt = new Date();
      job.attempts++;

      await this.redis.hset(jobKey, {
        data: JSON.stringify(job),
        status: 'active',
      });

      this.activeJobs.set(job.id, job);

      // Execute the processor
      const result = await processor(job);

      // Job completed successfully
      await this.completeJob(queueName, job, result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Job processing failed', {
        jobId: job.id,
        jobName: job.name,
        error: errorMessage,
        attempts: job.attempts
      });

      // Check if we should retry
      if (job.attempts < (job.options.attempts || 3)) {
        await this.retryJobWithBackoff(queueName, job, errorMessage);
      } else {
        await this.failJob(queueName, job, errorMessage);
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  private async completeJob(queueName: string, job: Job, result: any): Promise<void> {
    const queueKey = `queue:${queueName}`;
    const jobKey = `job:${job.id}`;

    job.completedAt = new Date();
    job.result = result;

    await Promise.all([
      this.redis.hset(jobKey, {
        data: JSON.stringify(job),
        status: 'completed',
      }),
      this.redis.zrem(`${queueKey}:active`, job.id),
      this.redis.zadd(`${queueKey}:completed`, Date.now(), job.id),
    ]);

    this.logger.debug('Job completed', { jobId: job.id, jobName: job.name });
  }

  private async failJob(queueName: string, job: Job, error: string): Promise<void> {
    const queueKey = `queue:${queueName}`;
    const jobKey = `job:${job.id}`;

    job.failedAt = new Date();
    job.error = error;

    await Promise.all([
      this.redis.hset(jobKey, {
        data: JSON.stringify(job),
        status: 'failed',
      }),
      this.redis.zrem(`${queueKey}:active`, job.id),
      this.redis.zadd(`${queueKey}:failed`, Date.now(), job.id),
    ]);

    this.logger.error('Job failed', { jobId: job.id, jobName: job.name, error });
  }

  private async retryJobWithBackoff(queueName: string, job: Job, error: string): Promise<void> {
    const queueKey = `queue:${queueName}`;
    const jobKey = `job:${job.id}`;

    job.error = error;

    // Calculate backoff delay
    let delay = 0;
    if (job.options.backoff === 'exponential') {
      delay = Math.pow(2, job.attempts) * 1000; // 2^attempts seconds
    } else {
      delay = 5000; // Fixed 5 seconds
    }

    const retryTime = Date.now() + delay;

    await Promise.all([
      this.redis.hset(jobKey, {
        data: JSON.stringify(job),
        status: 'delayed',
      }),
      this.redis.zrem(`${queueKey}:active`, job.id),
      this.redis.zadd(`${queueKey}:delayed`, retryTime, job.id),
    ]);

    this.logger.info('Job scheduled for retry', {
      jobId: job.id,
      jobName: job.name,
      attempts: job.attempts,
      retryIn: delay
    });
  }
}

