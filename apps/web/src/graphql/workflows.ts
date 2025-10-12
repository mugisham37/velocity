import { gql } from '@apollo/client';

// Fragments
export const WORKFLOW_NODE_FRAGMENT = gql`
  fragment WorkflowNodeFragment on WorkflowNode {
    id
    type
    label
    data
    position
  }
`;

export const WORKFLOW_EDGE_FRAGMENT = gql`
  fragment WorkflowEdgeFragment on WorkflowEdge {
    id
    source
    target
    data
  }
`;

export const WORKFLOW_DEFINITION_FRAGMENT = gql`
  fragment WorkflowDefinitionFragment on WorkflowDefinition {
    nodes {
      ...WorkflowNodeFragment
    }
    edges {
      ...WorkflowEdgeFragment
    }
    settings
  }
  ${WORKFLOW_NODE_FRAGMENT}
  ${WORKFLOW_EDGE_FRAGMENT}
`;

export const WORKFLOW_FRAGMENT = gql`
  fragment WorkflowFragment on Workflow {
    id
    companyId
    name
    description
    category
    version
    isActive
    isTemplate
    definition {
      ...WorkflowDefinitionFragment
    }
    tags
    permissions
    createdBy
    updatedBy
    createdAt
    updatedAt
  }
  ${WORKFLOW_DEFINITION_FRAGMENT}
`;

export const WORKFLOW_STEP_FRAGMENT = gql`
  fragment WorkflowStepFragment on WorkflowStep {
    id
    instanceId
    stepId
    name
    type
    status
    assignedTo
    assignedRole
    inputData
    outputData
    startedAt
    completedAt
    dueDate
    comments
    attachments
    createdAt
    updatedAt
  }
`;

export const WORKFLOW_APPROVAL_FRAGMENT = gql`
  fragment WorkflowApprovalFragment on WorkflowApproval {
    id
    stepId
    instanceId
    approverId
    status
    decision
    comments
    reason
    delegatedTo
    delegationReason
    requestedAt
    respondedAt
    dueDate
    createdAt
    updatedAt
  }
`;

export const WORKFLOW_INSTANCE_FRAGMENT = gql`
  fragment WorkflowInstanceFragment on WorkflowInstance {
    id
    workflowId
    companyId
    name
    status
    priority
    contextData
    currentStep
    startedAt
    completedAt
    dueDate
    slaBreached
    slaBreachedAt
    initiatedBy
    createdAt
    updatedAt
  }
`;

export const WORKFLOW_TEMPLATE_FRAGMENT = gql`
  fragment WorkflowTemplateFragment on WorkflowTemplate {
    id
    name
    description
    category
    industry
    definition {
      ...WorkflowDefinitionFragment
    }
    usageCount
    isPublic
    tags
    createdBy
    createdAt
    updatedAt
  }
  ${WORKFLOW_DEFINITION_FRAGMENT}
`;

export const WORKFLOW_METRICS_FRAGMENT = gql`
  fragment WorkflowMetricsFragment on WorkflowMetrics {
    totalWorkflows
    activeInstances
    completedToday
    overdueTasks
    slaBreaches
    averageCompletionTime
    byCategory {
      category
      count
      averageTime
    }
  }
`;

// Queries
export const GET_WORKFLOWS = gql`
  query GetWorkflows(
    $category: String
    $isActive: Boolean
    $isTemplate: Boolean
    $limit: Int
    $offset: Int
  ) {
    workflows(
      category: $category
      isActive: $isActive
      isTemplate: $isTemplate
      limit: $limit
      offset: $offset
    ) {
      ...WorkflowFragment
    }
  }
  ${WORKFLOW_FRAGMENT}
`;

export const GET_WORKFLOW = gql`
  query GetWorkflow($id: ID!) {
    workflow(id: $id) {
      ...WorkflowFragment
    }
  }
  ${WORKFLOW_FRAGMENT}
`;

export const GET_WORKFLOW_CATEGORIES = gql`
  query GetWorkflowCategories {
    workflowCategories
  }
`;

export const VALIDATE_WORKFLOW_DEFINITION = gql`
  query ValidateWorkflowDefinition($definition: JSON!) {
    validateWorkflowDefinition(definition: $definition)
  }
`;

export const GET_WORKFLOW_INSTANCES = gql`
  query GetWorkflowInstances(
    $workflowId: ID!
    $status: [WorkflowStatus!]
    $limit: Int
    $offset: Int
  ) {
    workflowInstances(
      workflowId: $workflowId
      status: $status
      limit: $limit
      offset: $offset
    ) {
      ...WorkflowInstanceFragment
      workflow {
        ...WorkflowFragment
      }
      steps {
        ...WorkflowStepFragment
        approvals {
          ...WorkflowApprovalFragment
        }
      }
    }
  }
  ${WORKFLOW_INSTANCE_FRAGMENT}
  ${WORKFLOW_FRAGMENT}
  ${WORKFLOW_STEP_FRAGMENT}
  ${WORKFLOW_APPROVAL_FRAGMENT}
`;

export const GET_WORKFLOW_INSTANCE = gql`
  query GetWorkflowInstance($id: ID!) {
    workflowInstance(id: $id) {
      ...WorkflowInstanceFragment
      workflow {
        ...WorkflowFragment
      }
      steps {
        ...WorkflowStepFragment
        approvals {
          ...WorkflowApprovalFragment
        }
      }
    }
  }
  ${WORKFLOW_INSTANCE_FRAGMENT}
  ${WORKFLOW_FRAGMENT}
  ${WORKFLOW_STEP_FRAGMENT}
  ${WORKFLOW_APPROVAL_FRAGMENT}
`;

export const GET_PENDING_APPROVALS = gql`
  query GetPendingApprovals {
    pendingApprovals {
      ...WorkflowApprovalFragment
    }
  }
  ${WORKFLOW_APPROVAL_FRAGMENT}
`;

export const GET_WORKFLOW_TEMPLATES = gql`
  query GetWorkflowTemplates(
    $category: String
    $industry: String
    $isPublic: Boolean
    $search: String
    $tags: [String!]
    $limit: Int
    $offset: Int
  ) {
    workflowTemplates(
      category: $category
      industry: $industry
      isPublic: $isPublic
      search: $search
      tags: $tags
      limit: $limit
      offset: $offset
    ) {
      ...WorkflowTemplateFragment
    }
  }
  ${WORKFLOW_TEMPLATE_FRAGMENT}
`;

export const GET_WORKFLOW_TEMPLATE = gql`
  query GetWorkflowTemplate($id: ID!) {
    workflowTemplate(id: $id) {
      ...WorkflowTemplateFragment
    }
  }
  ${WORKFLOW_TEMPLATE_FRAGMENT}
`;

export const GET_POPULAR_WORKFLOW_TEMPLATES = gql`
  query GetPopularWorkflowTemplates($limit: Int) {
    popularWorkflowTemplates(limit: $limit) {
      ...WorkflowTemplateFragment
    }
  }
  ${WORKFLOW_TEMPLATE_FRAGMENT}
`;

export const GET_WORKFLOW_TEMPLATE_CATEGORIES = gql`
  query GetWorkflowTemplateCategories {
    workflowTemplateCategories
  }
`;

export const GET_WORKFLOW_TEMPLATE_INDUSTRIES = gql`
  query GetWorkflowTemplateIndustries {
    workflowTemplateIndustries
  }
`;

export const GET_WORKFLOW_TEMPLATE_TAGS = gql`
  query GetWorkflowTemplateTags {
    workflowTemplateTags
  }
`;

export const SEARCH_WORKFLOW_TEMPLATES = gql`
  query SearchWorkflowTemplates(
    $query: String!
    $category: String
    $industry: String
    $tags: [String!]
  ) {
    searchWorkflowTemplates(
      query: $query
      category: $category
      industry: $industry
      tags: $tags
    ) {
      ...WorkflowTemplateFragment
    }
  }
  ${WORKFLOW_TEMPLATE_FRAGMENT}
`;

export const GET_WORKFLOW_METRICS = gql`
  query GetWorkflowMetrics($filter: WorkflowAnalyticsFilter) {
    workflowMetrics(filter: $filter) {
      ...WorkflowMetricsFragment
    }
  }
  ${WORKFLOW_METRICS_FRAGMENT}
`;

export const GET_WORKFLOW_PERFORMANCE = gql`
  query GetWorkflowPerformance($workflowId: ID!, $period: String) {
    workflowPerformance(workflowId: $workflowId, period: $period)
  }
`;

export const GET_APPROVAL_ANALYTICS = gql`
  query GetApprovalAnalytics($filter: WorkflowAnalyticsFilter) {
    approvalAnalytics(filter: $filter)
  }
`;

export const GET_WORKFLOW_INSIGHTS = gql`
  query GetWorkflowInsights {
    workflowInsights
  }
`;

// Mutations
export const CREATE_WORKFLOW = gql`
  mutation CreateWorkflow($input: CreateWorkflowInput!) {
    createWorkflow(input: $input) {
      ...WorkflowFragment
    }
  }
  ${WORKFLOW_FRAGMENT}
`;

export const UPDATE_WORKFLOW = gql`
  mutation UpdateWorkflow($id: ID!, $input: UpdateWorkflowInput!) {
    updateWorkflow(id: $id, input: $input) {
      ...WorkflowFragment
    }
  }
  ${WORKFLOW_FRAGMENT}
`;

export const DELETE_WORKFLOW = gql`
  mutation DeleteWorkflow($id: ID!) {
    deleteWorkflow(id: $id)
  }
`;

export const DUPLICATE_WORKFLOW = gql`
  mutation DuplicateWorkflow($id: ID!, $newName: String) {
    duplicateWorkflow(id: $id, newName: $newName) {
      ...WorkflowFragment
    }
  }
  ${WORKFLOW_FRAGMENT}
`;

export const CREATE_WORKFLOW_VERSION = gql`
  mutation CreateWorkflowVersion($id: ID!) {
    createWorkflowVersion(id: $id) {
      ...WorkflowFragment
    }
  }
  ${WORKFLOW_FRAGMENT}
`;

export const CREATE_WORKFLOW_INSTANCE = gql`
  mutation CreateWorkflowInstance($input: CreateWorkflowInstanceInput!) {
    createWorkflowInstance(input: $input) {
      ...WorkflowInstanceFragment
    }
  }
  ${WORKFLOW_INSTANCE_FRAGMENT}
`;

export const EXECUTE_WORKFLOW_STEP = gql`
  mutation ExecuteWorkflowStep($stepId: ID!, $data: JSON) {
    executeWorkflowStep(stepId: $stepId, data: $data) {
      ...WorkflowStepFragment
    }
  }
  ${WORKFLOW_STEP_FRAGMENT}
`;

export const COMPLETE_WORKFLOW_STEP = gql`
  mutation CompleteWorkflowStep($stepId: ID!, $data: JSON) {
    completeWorkflowStep(stepId: $stepId, data: $data)
  }
`;

export const CANCEL_WORKFLOW_INSTANCE = gql`
  mutation CancelWorkflowInstance($id: ID!) {
    cancelWorkflowInstance(id: $id)
  }
`;

export const PROCESS_APPROVAL = gql`
  mutation ProcessApproval($input: WorkflowApprovalInput!) {
    processApproval(input: $input) {
      ...WorkflowApprovalFragment
    }
  }
  ${WORKFLOW_APPROVAL_FRAGMENT}
`;

export const BULK_APPROVE = gql`
  mutation BulkApprove($approvalIds: [ID!]!, $comments: String) {
    bulkApprove(approvalIds: $approvalIds, comments: $comments) {
      ...WorkflowApprovalFragment
    }
  }
  ${WORKFLOW_APPROVAL_FRAGMENT}
`;

export const CREATE_WORKFLOW_TEMPLATE = gql`
  mutation CreateWorkflowTemplate($input: CreateWorkflowTemplateInput!) {
    createWorkflowTemplate(input: $input) {
      ...WorkflowTemplateFragment
    }
  }
  ${WORKFLOW_TEMPLATE_FRAGMENT}
`;

export const USE_WORKFLOW_TEMPLATE = gql`
  mutation UseWorkflowTemplate(
    $templateId: ID!
    $name: String
    $description: String
  ) {
    useWorkflowTemplate(
      templateId: $templateId
      name: $name
      description: $description
    ) {
      ...WorkflowFragment
    }
  }
  ${WORKFLOW_FRAGMENT}
`;

export const DELETE_WORKFLOW_TEMPLATE = gql`
  mutation DeleteWorkflowTemplate($id: ID!) {
    deleteWorkflowTemplate(id: $id)
  }
`;

export const CREATE_TEMPLATE_FROM_WORKFLOW = gql`
  mutation CreateTemplateFromWorkflow(
    $workflowId: ID!
    $name: String!
    $category: String!
    $description: String
    $industry: String
    $tags: [String!]
    $isPublic: Boolean
  ) {
    createTemplateFromWorkflow(
      workflowId: $workflowId
      name: $name
      category: $category
      description: $description
      industry: $industry
      tags: $tags
      isPublic: $isPublic
    ) {
      ...WorkflowTemplateFragment
    }
  }
  ${WORKFLOW_TEMPLATE_FRAGMENT}
`;
