import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ProjectsModule } from './projects.module';

describe('Projects GraphQL Integration', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    companyId: 'company-1',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          context: ({ req }) => ({ req }),
        }),
        DatabaseModule,
        AuthModule,
        ProjectsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generate auth token for testing
    authToken = jwtService.sign(mockUser);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Project Management', () => {
    let createdProjectId: string;

    it('should create a project', async () => {
      const createProjectMutation = `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            projectCode
            projectName
            description
            projectType
            status
            priority
            percentComplete
            companyId
          }
        }
      `;

      const variables = {
        input: {
          projectCode: 'PROJ-TEST-001',
          projectName: 'Test Project',
          description: 'Integration test project',
          projectType: 'Software Development',
          priority: 'Medium',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: createProjectMutation,
          variables,
        })
        .expect(200);

      expect(response.body.data.createProject).toMatchObject({
        projectCode: 'PROJ-TEST-001',
        projectName: 'Test Project',
        description: 'Integration test project',
        projectType: 'Software Development',
        status: 'Draft',
        priority: 'Medium',
        percentComplete: 0,
        companyId: 'company-1',
      });

      createdProjectId = response.body.data.createProject.id;
    });

    it('should get projects list', async () => {
      const getProjectsQuery = `
        query GetProjects($filter: ProjectFilter) {
          projects(filter: $filter) {
            id
            projectCode
            projectName
            status
            priority
            percentComplete
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getProjectsQuery,
          variables: { filter: {} },
        })
        .expect(200);

      expect(response.body.data.projects).toBeInstanceOf(Array);
      expect(response.body.data.projects.length).toBeGreaterThan(0);

      const testProject = response.body.data.projects.find(
        p => p.id === createdProjectId
      );
      expect(testProject).toBeDefined();
    });

    it('should get a specific project', async () => {
      const getProjectQuery = `
        query GetProject($id: ID!) {
          project(id: $id) {
            id
            projectCode
            projectName
            description
            status
            tasks {
              id
              taskName
            }
            teamMembers {
              id
              role
            }
            milestones {
              id
              milestoneName
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getProjectQuery,
          variables: { id: createdProjectId },
        })
        .expect(200);

      expect(response.body.data.project).toMatchObject({
        id: createdProjectId,
        projectCode: 'PROJ-TEST-001',
        projectName: 'Test Project',
        description: 'Integration test project',
        status: 'Draft',
      });
    });

    it('should update a project', async () => {
      const updateProjectMutation = `
        mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
          updateProject(id: $id, input: $input) {
            id
            projectName
            status
            priority
          }
        }
      `;

      const variables = {
        id: createdProjectId,
        input: {
          projectName: 'Updated Test Project',
          status: 'Active',
          priority: 'High',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: updateProjectMutation,
          variables,
        })
        .expect(200);

      expect(response.body.data.updateProject).toMatchObject({
        id: createdProjectId,
        projectName: 'Updated Test Project',
        status: 'Active',
        priority: 'High',
      });
    });
  });

  describe('Task Management', () => {
    let projectId: string;
    let taskId: string;

    beforeAll(async () => {
      // Create a project for task testing
      const createProjectMutation = `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: createProjectMutation,
          variables: {
            input: {
              projectCode: 'PROJ-TASK-001',
              projectName: 'Task Test Project',
              projectType: 'Testing',
              priority: 'Medium',
            },
          },
        });

      projectId = response.body.data.createProject.id;
    });

    it('should create a project task', async () => {
      const createTaskMutation = `
        mutation CreateProjectTask($input: CreateProjectTaskInput!) {
          createProjectTask(input: $input) {
            id
            taskCode
            taskName
            projectId
            status
            priority
            taskType
            percentComplete
          }
        }
      `;

      const variables = {
        input: {
          taskCode: 'TASK-001',
          taskName: 'Test Task',
          projectId,
          priority: 'Medium',
          taskType: 'Task',
          estimatedHours: 8,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: createTaskMutation,
          variables,
        })
        .expect(200);

      expect(response.body.data.createProjectTask).toMatchObject({
        taskCode: 'TASK-001',
        taskName: 'Test Task',
        projectId,
        status: 'Open',
        priority: 'Medium',
        taskType: 'Task',
        percentComplete: 0,
      });

      taskId = response.body.data.createProjectTask.id;
    });

    it('should get project tasks', async () => {
      const getTasksQuery = `
        query GetProjectTasks($projectId: ID!) {
          projectTasks(projectId: $projectId) {
            id
            taskCode
            taskName
            status
            priority
            percentComplete
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getTasksQuery,
          variables: { projectId },
        })
        .expect(200);

      expect(response.body.data.projectTasks).toBeInstanceOf(Array);
      expect(response.body.data.projectTasks.length).toBeGreaterThan(0);

      const testTask = response.body.data.projectTasks.find(
        t => t.id === taskId
      );
      expect(testTask).toBeDefined();
    });

    it('should update a project task', async () => {
      const updateTaskMutation = `
        mutation UpdateProjectTask($id: ID!, $input: UpdateProjectTaskInput!) {
          updateProjectTask(id: $id, input: $input) {
            id
            taskName
            status
            percentComplete
            actualHours
          }
        }
      `;

      const variables = {
        id: taskId,
        input: {
          taskName: 'Updated Test Task',
          status: 'Working',
          percentComplete: 50,
          actualHours: 4,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: updateTaskMutation,
          variables,
        })
        .expect(200);

      expect(response.body.data.updateProjectTask).toMatchObject({
        id: taskId,
        taskName: 'Updated Test Task',
        status: 'Working',
        percentComplete: 50,
        actualHours: 4,
      });
    });
  });

  describe('Gantt Chart Data', () => {
    let projectId: string;

    beforeAll(async () => {
      // Create project with tasks for Gantt testing
      const createProjectResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation CreateProject($input: CreateProjectInput!) {
              createProject(input: $input) {
                id
              }
            }
          `,
          variables: {
            input: {
              projectCode: 'PROJ-GANTT-001',
              projectName: 'Gantt Test Project',
              projectType: 'Testing',
              priority: 'Medium',
            },
          },
        });

      projectId = createProjectResponse.body.data.createProject.id;

      // Create some tasks
      await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation CreateProjectTask($input: CreateProjectTaskInput!) {
              createProjectTask(input: $input) {
                id
              }
            }
          `,
          variables: {
            input: {
              taskCode: 'GANTT-TASK-001',
              taskName: 'Gantt Task 1',
              projectId,
              startDate: '2024-01-01',
              endDate: '2024-01-05',
              duration: 5,
            },
          },
        });
    });

    it('should get Gantt chart data', async () => {
      const getGanttDataQuery = `
        query GetProjectGanttData($projectId: ID!) {
          projectGanttData(projectId: $projectId) {
            tasks {
              id
              text
              start_date
              end_date
              duration
              progress
              type
            }
            links {
              id
              source
              target
              type
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getGanttDataQuery,
          variables: { projectId },
        })
        .expect(200);

      expect(response.body.data.projectGanttData).toMatchObject({
        tasks: expect.arrayContaining([
          expect.objectContaining({
            text: 'Gantt Task 1',
            start_date: '2024-01-01',
            end_date: '2024-01-05',
            duration: 5,
            type: 'task',
          }),
        ]),
        links: expect.any(Array),
      });
    });

    it('should get critical path analysis', async () => {
      const getCriticalPathQuery = `
        query GetProjectCriticalPath($projectId: ID!) {
          projectCriticalPath(projectId: $projectId) {
            projectId
            criticalPath {
              taskId
              taskName
              duration
              isCritical
            }
            projectDuration
            analysisDate
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getCriticalPathQuery,
          variables: { projectId },
        })
        .expect(200);

      expect(response.body.data.projectCriticalPath).toMatchObject({
        projectId,
        criticalPath: expect.any(Array),
        projectDuration: expect.any(Number),
        analysisDate: expect.any(String),
      });
    });
  });

  describe('Error Handling', () => {
    it('should return error for non-existent project', async () => {
      const getProjectQuery = `
        query GetProject($id: ID!) {
          project(id: $id) {
            id
            projectName
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: getProjectQuery,
          variables: { id: 'non-existent-id' },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Project not found');
    });

    it('should return validation error for invalid input', async () => {
      const createProjectMutation = `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: createProjectMutation,
          variables: {
            input: {
              // Missing required fields
              projectName: 'Test',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication', async () => {
      const getProjectsQuery = `
        query GetProjects {
          projects {
            id
            projectName
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getProjectsQuery,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });
});
