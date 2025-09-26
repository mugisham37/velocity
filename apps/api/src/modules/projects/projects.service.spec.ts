import { DrizzleService } from '@/database/drizzle.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
    CreateProject,
    CreateProjectTask,
    CreateTaskDependency,
    ProjectStatusType,
    TaskStatusType
} from '@packages/shared/types/projects';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockDrizzleService: jest.Mocked<DrizzleService>;

  const mockProject = {
    id: 'project-1',
    projectCode: 'PROJ-001',
    projectName: 'Test Project',
    description: 'Test Description',
    projectType: 'Software Development',
    status: 'Draft' as ProjectStatusType,
    prioedium',
    percentComplete: 0,
    companyId: 'company-1',
    isTemplate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTask = {
    id: 'task-1',
    taskCode: 'TASK-001',
    taskName: 'Test Task',
    projectId: 'project-1',
    status: 'Open' as TaskStatusType,
    priority: 'Medium',
    taskType: 'Task',
    actualHours: 0,
    percentComplete: 0,
    isMilestone: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockDb = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      limit: jest.fn().mockReturnThis(),
    };

    mockDrizzleService = {
      db: mockDb,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const createProjectData: CreateProject = {
        projectCode: 'PROJ-001',
        projectName: 'Test Project',
        description: 'Test Description',
        projectType: 'Software Development',
        priority: 'Medium',
      };

      mockDrizzleService.db.returning.mockResolvedValue([mockProject]);

      const result = await service.createProject('company-1', createProjectData);

      expect(result).toEqual(mockProject);
      expect(mockDrizzleService.db.insert).toHaveBeenCalled();
      expect(mockDrizzleService.db.values).toHaveBeenCalledWith({
        ...createProjectData,
        companyId: 'company-1',
        status: 'Draft',
        percentComplete: 0,
      });
    });

    it('should apply template when templateId is provided', async () => {
      const createProjectData: CreateProject = {
        projectCode: 'PROJ-001',
        projectName: 'Test Project',
        projectType: 'Software Development',
        priority: 'Medium',
        templateId: 'template-1',
      };

      mockDrizzleService.db.returning.mockResolvedValue([mockProject]);

      // Mock template data
      const mockTemplate = {
        id: 'template-1',
        templateData: {
          tasks: [
            {
              id: 'template-task-1',
              taskName: 'Template Task',
              taskCode: 'TMPL-001',
              priority: 'Medium',
              taskType: 'Task',
            },
          ],
        },
      };

      mockDrizzleService.db.returning
        .mockResolvedValueOnce([mockProject])
        .mockResolvedValueOnce([mockTemplate])
        .mockResolvedValueOnce([mockTask]);

      jest.spyOn(service, 'applyProjectTemplate').mockResolvedValue();

      const result = await service.createProject('company-1', createProjectData);

      expect(result).toEqual(mockProject);
      expect(service.applyProjectTemplate).toHaveBeenCalledWith(mockProject.id, 'template-1');
    });
  });

  describe('updateProject', () => {
    it('should update a project successfully', async () => {
      const updateData = {
        projectName: 'Updated Project Name',
        status: 'Active' as ProjectStatusType,
      };

      const updatedProject = { ...mockProject, ...updateData };
      mockDrizzleService.db.returning.mockResolvedValue([updatedProject]);

      const result = await service.updateProject('project-1', 'company-1', updateData);

      expect(result).toEqual(updatedProject);
      expect(mockDrizzleService.db.update).toHaveBeenCalled();
      expect(mockDrizzleService.db.set).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockDrizzleService.db.returning.mockResolvedValue([]);

      await expect(
        service.updateProject('nonexistent', 'company-1', { projectName: 'Updated' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProject', () => {
    it('should return a project when found', async () => {
      mockDrizzleService.db.select().from().where.mockResolvedValue([mockProject]);

      const result = await service.getProject('project-1', 'company-1');

      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException when project not found', async () => {
      mockDrizzleService.db.select().from().where.mockResolvedValue([]);

      await expect(
        service.getProject('nonexistent', 'company-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const createTaskData: CreateProjectTask = {
        taskCode: 'TASK-001',
        taskName: 'Test Task',
        projectId: 'project-1',
        priority: 'Medium',
        taskType: 'Task',
        isMilestone: false,
      };

      // Mock project exists check
      mockDrizzleService.db.select().from().where().limit.mockResolvedValue([mockProject]);

      // Mock task count for code generation
      mockDrizzleService.db.select().from().where.mockResolvedValue([{ count: 0 }]);

      // Mock task creation
      mockDrizzleService.db.returning.mockResolvedValue([mockTask]);

      const result = await service.createTask(createTaskData);

      expect(result).toEqual(mockTask);
      expect(mockDrizzleService.db.insert).toHaveBeenCalled();
    });

    it('should throw NotFoundException when project not found', async () => {
      const createTaskData: CreateProjectTask = {
        taskCode: 'TASK-001',
        taskName: 'Test Task',
        projectId: 'nonexistent',
        priority: 'Medium',
        taskType: 'Task',
        isMilestone: false,
      };

      mockDrizzleService.db.select().from().where().limit.mockResolvedValue([]);

      await expect(service.createTask(createTaskData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTaskDependency', () => {
    it('should create a task dependency successfully', async () => {
      const dependencyData: CreateTaskDependency = {
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        dependencyType: 'FS',
        lagDays: 0,
      };

      // Mock tasks exist
      jest.spyOn(service, 'getTask')
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({ ...mockTask, id: 'task-2' });

      // Mock circular dependency check
      jest.spyOn(service as any, 'wouldCreateCircularDependency').mockResolvedValue(false);

      mockDrizzleService.db.insert().values.mockResolvedValue(undefined);

      await service.createTaskDependency(dependencyData);

      expect(mockDrizzleService.db.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException for circular dependency', async () => {
      const dependencyData: CreateTaskDependency = {
        predecessorTaskId: 'task-1',
        successorTaskId: 'task-2',
        dependencyType: 'FS',
        lagDays: 0,
      };

      jest.spyOn(service, 'getTask')
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({ ...mockTask, id: 'task-2' });

      jest.spyOn(service as any, 'wouldCreateCircularDependency').mockResolvedValue(true);

      await expect(service.createTaskDependency(dependencyData)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('calculateCriticalPath', () => {
    it('should calculate critical path correctly', async () => {
      const tasks = [
        { ...mockTask, id: 'task-1', duration: 5 },
        { ...mockTask, id: 'task-2', duration: 3 },
        { ...mockTask, id: 'task-3', duration: 4 },
      ];

      const dependencies = [
        {
          id: 'dep-1',
          predecessorTaskId: 'task-1',
          successorTaskId: 'task-2',
          dependencyType: 'FS',
          lagDays: 0,
        },
        {
          id: 'dep-2',
          predecessorTaskId: 'task-2',
          successorTaskId: 'task-3',
          dependencyType: 'FS',
          lagDays: 0,
        },
      ];

      jest.spyOn(service, 'getProjectTasks').mockResolvedValue(tasks as any);
      jest.spyOn(service as any, 'getTaskDependencies').mockResolvedValue(dependencies);

      const result = await service.calculateCriticalPath('project-1');

      expect(result.projectId).toBe('project-1');
      expect(result.projectDuration).toBe(12); // 5 + 3 + 4
      expect(result.criticalPath).toHaveLength(3); // All tasks are critical in this linear path
      expect(result.criticalPath.every(task => task.isCritical)).toBe(true);
    });
  });

  describe('getGanttData', () => {
    it('should return formatted Gantt data', async () => {
      const tasks = [
        {
          ...mockTask,
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          duration: 5,
        },
      ];

      const dependencies = [
        {
          id: 'dep-1',
          predecessorTaskId: 'task-1',
          successorTaskId: 'task-2',
          dependencyType: 'FS',
        },
      ];

      jest.spyOn(service, 'getProjectTasks').mockResolvedValue(tasks as any);
      jest.spyOn(service as any, 'getTaskDependencies').mockResolvedValue(dependencies);

      const result = await service.getGanttData('project-1');

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0]).toMatchObject({
        id: 'task-1',
        text: 'Test Task',
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        duration: 5,
        progress: 0,
        type: 'task',
      });

      expect(result.links).toHaveLength(1);
      expect(result.links[0]).toMatchObject({
        id: 'dep-1',
        source: 'task-1',
        target: 'task-2',
        type: '0', // FS mapped to '0'
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete task when no dependencies exist', async () => {
      // Mock no dependencies
      mockDrizzleService.db.select().from().where.mockResolvedValue([]);

      // Mock successful deletion
      mockDrizzleService.db.delete().where.mockResolvedValue({ rowCount: 1 });

      await service.deleteTask('task-1');

      expect(mockDrizzleService.db.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when task has dependencies', async () => {
      // Mock existing dependencies
      mockDrizzleService.db.select().from().where.mockResolvedValue([
        { id: 'dep-1', predecessorTaskId: 'task-1', successorTaskId: 'task-2' },
      ]);

      await expect(service.deleteTask('task-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockDrizzleService.db.select().from().where.mockResolvedValue([]);
      mockDrizzleService.db.delete().where.mockResolvedValue({ rowCount: 0 });

      await expect(service.deleteTask('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
