import { gql } from '@apollo/client';

// Fragments
export const PROJECT_FRAGMENT = gql`
  fragment ProjectFragment on Project {
    id
    projectCode
    projectName
    description
    projectType
    status
    priority
    startDate
    endDate
    expectedStartDate
    expectedEndDate
    actualStartDate
    actualEndDate
    percentComplete
    projectManagerId
    companyId
    customFields
    isTemplate
    templateId
    createdAt
    updatedAt
  }
`;

export const PROJECT_TASK_FRAGMENT = gql`
  fragment ProjectTaskFragment on ProjectTask {
    id
    taskCode
    taskName
    description
    projectId
    parentTaskId
    assignedToId
    status
    priority
    taskType
    startDate
    endDate
    expectedStartDate
    expectedEndDate
    actualStartDate
    actualEndDate
    duration
    estimatedHours
    actualHours
    percentComplete
    isMilestone
    customFields
    createdAt
    updatedAt
  }
`;

export const TASK_DEPENDENCY_FRAGMENT = gql`
  fragment TaskDependencyFragment on TaskDependency {
    id
    predecessorTaskId
    successorTaskId
    dependencyType
    lagDays
    createdAt
  }
`;

export const PROJECT_TEAM_MEMBER_FRAGMENT = gql`
  fragment ProjectTeamMemberFragment on ProjectTeamMember {
    id
    projectId
    userId
    role
    allocationPercentage
    startDate
    endDate
    isActive
    createdAt
  }
`;

export const PROJECT_MILESTONE_FRAGMENT = gql`
  fragment ProjectMilestoneFragment on ProjectMilestone {
    id
    projectId
    milestoneName
    description
    targetDate
    actualDate
    status
    isCompleted
    createdAt
    updatedAt
  }
`;

// Queries
export const GET_PROJECTS = gql`
  query GetProjects($filter: ProjectFilter) {
    projects(filter: $filter) {
      ...ProjectFragment
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      ...ProjectFragment
      tasks {
        ...ProjectTaskFragment
      }
      teamMembers {
        ...ProjectTeamMemberFragment
      }
      milestones {
        ...ProjectMilestoneFragment
      }
    }
  }
  ${PROJECT_FRAGMENT}
  ${PROJECT_TASK_FRAGMENT}
  ${PROJECT_TEAM_MEMBER_FRAGMENT}
  ${PROJECT_MILESTONE_FRAGMENT}
`;

export const GET_PROJECT_TASKS = gql`
  query GetProjectTasks($projectId: ID!) {
    projectTasks(projectId: $projectId) {
      ...ProjectTaskFragment
    }
  }
  ${PROJECT_TASK_FRAGMENT}
`;

export const GET_PROJECT_TASK = gql`
  query GetProjectTask($id: ID!) {
    projectTask(id: $id) {
      ...ProjectTaskFragment
    }
  }
  ${PROJECT_TASK_FRAGMENT}
`;

export const GET_PROJECT_GANTT_DATA = gql`
  query GetProjectGanttData($projectId: ID!) {
    projectGanttData(projectId: $projectId) {
      tasks {
        id
        text
        start_date
        end_date
        duration
        progress
        parent
        type
        open
      }
      links {
        id
        source
        target
        type
        lag
      }
    }
  }
`;

export const GET_PROJECT_CRITICAL_PATH = gql`
  query GetProjectCriticalPath($projectId: ID!) {
    projectCriticalPath(projectId: $projectId) {
      projectId
      criticalPath {
        taskId
        taskName
        duration
        earlyStart
        earlyFinish
        lateStart
        lateFinish
        totalFloat
        isCritical
      }
      projectDuration
      analysisDate
    }
  }
`;

export const GET_PROJECT_TEMPLATES = gql`
  query GetProjectTemplates {
    projectTemplates {
      id
      templateName
      description
      category
      companyId
      isPublic
      templateData
      createdAt
      updatedAt
    }
  }
`;

export const GET_PROJECT_TEAM_MEMBERS = gql`
  query GetProjectTeamMembers($projectId: ID!) {
    projectTeamMembers(projectId: $projectId) {
      ...ProjectTeamMemberFragment
    }
  }
  ${PROJECT_TEAM_MEMBER_FRAGMENT}
`;

export const GET_PROJECT_MILESTONES = gql`
  query GetProjectMilestones($projectId: ID!) {
    projectMilestones(projectId: $projectId) {
      ...ProjectMilestoneFragment
    }
  }
  ${PROJECT_MILESTONE_FRAGMENT}
`;

// Mutations
export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      ...ProjectFragment
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      ...ProjectFragment
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const CREATE_PROJECT_TASK = gql`
  mutation CreateProjectTask($input: CreateProjectTaskInput!) {
    createProjectTask(input: $input) {
      ...ProjectTaskFragment
    }
  }
  ${PROJECT_TASK_FRAGMENT}
`;

export const UPDATE_PROJECT_TASK = gql`
  mutation UpdateProjectTask($id: ID!, $input: UpdateProjectTaskInput!) {
    updateProjectTask(id: $id, input: $input) {
      ...ProjectTaskFragment
    }
  }
  ${PROJECT_TASK_FRAGMENT}
`;

export const DELETE_PROJECT_TASK = gql`
  mutation DeleteProjectTask($id: ID!) {
    deleteProjectTask(id: $id)
  }
`;

export const CREATE_TASK_DEPENDENCY = gql`
  mutation CreateTaskDependency($input: CreateTaskDependencyInput!) {
    createTaskDependency(input: $input)
  }
`;

export const DELETE_TASK_DEPENDENCY = gql`
  mutation DeleteTaskDependency($predecessorId: ID!, $successorId: ID!) {
    deleteTaskDependency(
      predecessorId: $predecessorId
      successorId: $successorId
    )
  }
`;

export const ADD_PROJECT_TEAM_MEMBER = gql`
  mutation AddProjectTeamMember($input: CreateProjectTeamMemberInput!) {
    addProjectTeamMember(input: $input)
  }
`;

export const REMOVE_PROJECT_TEAM_MEMBER = gql`
  mutation RemoveProjectTeamMember($projectId: ID!, $userId: ID!) {
    removeProjectTeamMember(projectId: $projectId, userId: $userId)
  }
`;

export const CREATE_PROJECT_MILESTONE = gql`
  mutation CreateProjectMilestone($input: CreateProjectMilestoneInput!) {
    createProjectMilestone(input: $input)
  }
`;

export const UPDATE_PROJECT_MILESTONE = gql`
  mutation UpdateProjectMilestone(
    $id: ID!
    $input: UpdateProjectMilestoneInput!
  ) {
    updateProjectMilestone(id: $id, input: $input)
  }
`;

export const CREATE_PROJECT_TEMPLATE = gql`
  mutation CreateProjectTemplate($input: CreateProjectTemplateInput!) {
    createProjectTemplate(input: $input)
  }
`;

export const APPLY_PROJECT_TEMPLATE = gql`
  mutation ApplyProjectTemplate($projectId: ID!, $templateId: ID!) {
    applyProjectTemplate(projectId: $projectId, templateId: $templateId)
  }
`;
