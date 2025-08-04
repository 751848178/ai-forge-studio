// 基础类型定义

// 通用ID类型
export type ID = string

// 通用时间戳类型
export type Timestamp = string

// 通用状态类型
export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'

// 优先级类型
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// 复杂度类型
export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'

// 租户相关类型
export interface Tenant {
  id: ID
  name: string
  slug: string
  domain?: string
  logo?: string
  settings?: Record<string, any>
  plan: TenantPlan
  status: TenantStatus
  adminId: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type TenantPlan = 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
export type TenantRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'
export type MemberStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED'

export interface TenantMember {
  id: ID
  tenantId: ID
  userId: ID
  role: TenantRole
  status: MemberStatus
  joinedAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TenantQuota {
  id: ID
  tenantId: ID
  maxProjects: number
  maxUsers: number
  maxRequirements: number
  maxAIRequests: number
  maxStorage: number
  usedProjects: number
  usedUsers: number
  usedRequirements: number
  usedAIRequests: number
  usedStorage: number
  resetAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 用户相关类型
export interface User {
  id: ID
  email: string
  name?: string
  avatar?: string
  currentTenantId?: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 项目相关类型
export interface Project {
  id: ID
  tenantId: ID
  name: string
  description?: string
  status: ProjectStatus
  ownerId: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'ARCHIVED'

export interface Repository {
  id: ID
  tenantId: ID
  projectId: ID
  name: string
  url: string
  type: RepositoryType
  accessToken?: string
  branch?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type RepositoryType = 'GIT' | 'SVN' | 'MERCURIAL'

// 需求相关类型
export interface Requirement {
  id: ID
  tenantId: ID
  projectId: ID
  title: string
  content: string
  type: RequirementType
  priority: Priority
  status: RequirementStatus
  createdBy: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type RequirementType = 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'BUSINESS' | 'TECHNICAL'
export type RequirementStatus = 'PENDING' | 'ANALYZING' | 'ANALYZED' | 'APPROVED' | 'REJECTED'

export interface DocumentIntegration {
  id: ID
  tenantId: ID
  requirementId: ID
  name: string
  type: DocumentType
  url: string
  accessToken?: string
  lastSyncAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type DocumentType = 'YUQUE' | 'FEISHU' | 'WOLAI' | 'NOTION'

export interface RequirementAnalysis {
  id: ID
  tenantId: ID
  requirementId: ID
  summary: string
  keyFeatures: string[]
  complexity: Complexity
  estimatedHours?: number
  suggestions?: string
  flowchartUrl?: string
  e2eTests?: any[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 功能模块相关类型
export interface Module {
  id: ID
  tenantId: ID
  projectId: ID
  requirementId?: ID
  parentId?: ID
  name: string
  description?: string
  type: ModuleType
  priority: Priority
  status: ModuleStatus
  isBackendRequired: boolean
  isFrontendRequired: boolean
  estimatedHours?: number
  actualHours?: number
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ModuleType = 'FEATURE' | 'COMPONENT' | 'SERVICE' | 'UTILITY' | 'INTEGRATION'
export type ModuleStatus = 'TODO' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'BLOCKED'

// 开发任务相关类型
export interface Task {
  id: ID
  tenantId: ID
  moduleId: ID
  title: string
  description?: string
  type: TaskType
  priority: Priority
  status: TaskStatus
  estimatedHours?: number
  actualHours?: number
  techStack?: string[]
  generatedCode?: string
  codeLanguage?: string
  filePath?: string
  assigneeId?: ID
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type TaskType = 'DEVELOPMENT' | 'TESTING' | 'DOCUMENTATION' | 'DEPLOYMENT' | 'REFACTORING'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'TESTING' | 'COMPLETED' | 'BLOCKED'

export interface TaskGroup {
  id: ID
  tenantId: ID
  moduleId: ID
  name: string
  description?: string
  status: TaskStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TaskGroupItem {
  id: ID
  tenantId: ID
  taskGroupId: ID
  taskId: ID
  order: number
  createdAt: Timestamp
}

// 工作流相关类型
export interface Workflow {
  id: ID
  tenantId: ID
  projectId?: ID
  name: string
  description?: string
  steps: WorkflowStep[]
  isDefault: boolean
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'MANUAL' | 'AUTOMATED' | 'AI'
  description?: string
  config?: Record<string, any>
  nextSteps?: string[]
}

export interface RequirementWorkflow {
  id: ID
  tenantId: ID
  requirementId: ID
  workflowId: ID
  currentStep: string
  stepData?: Record<string, any>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ExternalWorkflow {
  id: ID
  tenantId: ID
  projectId?: ID
  name: string
  type: ExternalWorkflowType
  endpoint: string
  apiKey?: string
  config?: Record<string, any>
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ExternalWorkflowType = 'COZE' | 'DIFY' | 'N8N' | 'ZAPIER'

// AI相关类型
export interface AIRequestLog {
  id: ID
  tenantId: ID
  userId: ID
  requestType: AIRequestType
  resourceId?: ID
  resourceType?: string
  tokens?: number
  cost?: number
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  errorMessage?: string
  createdAt: Timestamp
}

export type AIRequestType = 
  | 'ANALYZE_REQUIREMENT' 
  | 'GENERATE_MODULES' 
  | 'GENERATE_TASKS' 
  | 'GENERATE_CODE' 
  | 'GENERATE_FLOWCHART' 
  | 'GENERATE_E2E'

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

// 分页类型
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 表单类型
export interface FormField<T = any> {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number'
  value?: T
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ label: string; value: any }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    message?: string
  }
}

// 菜单类型
export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  permission?: string
  disabled?: boolean
}

// 权限类型
export interface Permission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

// 上下文类型
export interface AppContext {
  user?: User
  tenant?: Tenant
  permissions: Permission[]
  theme: 'light' | 'dark'
  locale: string
}

// 事件类型
export interface AppEvent<T = any> {
  type: string
  payload: T
  timestamp: number
  source?: string
}

// 配置类型
export interface AppConfig {
  apiBaseUrl: string
  enableDevTools: boolean
  enableAnalytics: boolean
  maxFileSize: number
  supportedFileTypes: string[]
  features: {
    aiAnalysis: boolean
    documentIntegration: boolean
    workflowEngine: boolean
    codeGeneration: boolean
  }
}

// 导出所有类型
// 其他类型文件将在后续开发中添加
