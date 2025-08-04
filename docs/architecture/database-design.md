# 数据库设计文档

## 📋 设计原则

### 核心原则
1. **无外键约束**：所有表关联通过业务层维护，提高扩展性
2. **多租户隔离**：每个表都包含tenantId字段实现数据隔离
3. **字符串枚举**：使用字符串类型存储枚举值，便于扩展
4. **Json灵活配置**：使用Json字段存储动态配置数据
5. **索引优化**：为查询频繁的字段建立合适的索引

### 命名规范
- 表名：使用下划线分隔的复数形式（如：tenant_members）
- 字段名：使用驼峰命名法（如：createdAt）
- 索引名：使用表名_字段名格式（如：idx_tenants_slug）

## 🗄️ 表结构设计

### 1. 租户相关表

#### tenants（租户表）
```sql
CREATE TABLE tenants (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT '租户名称',
  slug VARCHAR(100) UNIQUE NOT NULL COMMENT '租户标识符',
  domain VARCHAR(255) NULL COMMENT '自定义域名',
  logo VARCHAR(500) NULL COMMENT '租户Logo URL',
  settings JSON NULL COMMENT '租户配置',
  plan VARCHAR(50) DEFAULT 'FREE' COMMENT '订阅计划',
  status VARCHAR(50) DEFAULT 'ACTIVE' COMMENT '状态',
  adminId VARCHAR(30) NOT NULL COMMENT '管理员ID',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tenants_slug (slug),
  INDEX idx_tenants_domain (domain),
  INDEX idx_tenants_adminId (adminId)
);
```

#### tenant_members（租户成员表）
```sql
CREATE TABLE tenant_members (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  userId VARCHAR(30) NOT NULL COMMENT '用户ID',
  role VARCHAR(50) DEFAULT 'MEMBER' COMMENT '角色',
  status VARCHAR(50) DEFAULT 'ACTIVE' COMMENT '状态',
  joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_tenant_members_user_tenant (userId, tenantId),
  INDEX idx_tenant_members_tenantId (tenantId),
  INDEX idx_tenant_members_userId (userId)
);
```

#### tenant_quotas（租户配额表）
```sql
CREATE TABLE tenant_quotas (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) UNIQUE NOT NULL COMMENT '租户ID',
  maxProjects INT DEFAULT 10 COMMENT '最大项目数',
  maxUsers INT DEFAULT 50 COMMENT '最大用户数',
  maxRequirements INT DEFAULT 1000 COMMENT '最大需求数',
  maxAIRequests INT DEFAULT 10000 COMMENT '每月AI请求限制',
  maxStorage INT DEFAULT 1024 COMMENT '最大存储空间(MB)',
  usedProjects INT DEFAULT 0 COMMENT '已使用项目数',
  usedUsers INT DEFAULT 0 COMMENT '已使用用户数',
  usedRequirements INT DEFAULT 0 COMMENT '已使用需求数',
  usedAIRequests INT DEFAULT 0 COMMENT '已使用AI请求数',
  usedStorage INT DEFAULT 0 COMMENT '已使用存储空间',
  resetAt DATETIME NOT NULL COMMENT '配额重置时间',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tenant_quotas_tenantId (tenantId)
);
```

### 2. 用户相关表

#### users（用户表）
```sql
CREATE TABLE users (
  id VARCHAR(30) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL COMMENT '邮箱',
  name VARCHAR(255) NULL COMMENT '姓名',
  avatar VARCHAR(500) NULL COMMENT '头像URL',
  currentTenantId VARCHAR(30) NULL COMMENT '当前活跃租户ID',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_users_email (email),
  INDEX idx_users_currentTenantId (currentTenantId)
);
```

### 3. 项目相关表

#### projects（项目表）
```sql
CREATE TABLE projects (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  name VARCHAR(255) NOT NULL COMMENT '项目名称',
  description TEXT NULL COMMENT '项目描述',
  status VARCHAR(50) DEFAULT 'PLANNING' COMMENT '项目状态',
  ownerId VARCHAR(30) NOT NULL COMMENT '项目负责人ID',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_projects_tenantId (tenantId),
  INDEX idx_projects_ownerId (ownerId),
  INDEX idx_projects_status (status)
);
```

#### repositories（仓库表）
```sql
CREATE TABLE repositories (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  projectId VARCHAR(30) NOT NULL COMMENT '项目ID',
  name VARCHAR(255) NOT NULL COMMENT '仓库名称',
  url VARCHAR(500) NOT NULL COMMENT '仓库URL',
  type VARCHAR(50) DEFAULT 'GIT' COMMENT '仓库类型',
  accessToken VARCHAR(500) NULL COMMENT '访问令牌',
  branch VARCHAR(100) NULL COMMENT '默认分支',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_repositories_tenantId (tenantId),
  INDEX idx_repositories_projectId (projectId)
);
```

### 4. 需求相关表

#### requirements（需求表）
```sql
CREATE TABLE requirements (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  projectId VARCHAR(30) NOT NULL COMMENT '项目ID',
  title VARCHAR(500) NOT NULL COMMENT '需求标题',
  content LONGTEXT NOT NULL COMMENT '需求内容',
  type VARCHAR(50) DEFAULT 'FUNCTIONAL' COMMENT '需求类型',
  priority VARCHAR(50) DEFAULT 'MEDIUM' COMMENT '优先级',
  status VARCHAR(50) DEFAULT 'PENDING' COMMENT '状态',
  createdBy VARCHAR(30) NOT NULL COMMENT '创建人ID',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_requirements_tenantId (tenantId),
  INDEX idx_requirements_projectId (projectId),
  INDEX idx_requirements_createdBy (createdBy),
  INDEX idx_requirements_status (status)
);
```

#### document_integrations（文档集成表）
```sql
CREATE TABLE document_integrations (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  requirementId VARCHAR(30) NOT NULL COMMENT '需求ID',
  name VARCHAR(255) NOT NULL COMMENT '文档名称',
  type VARCHAR(50) NOT NULL COMMENT '文档类型',
  url VARCHAR(500) NOT NULL COMMENT '文档URL',
  accessToken VARCHAR(500) NULL COMMENT '访问令牌',
  lastSyncAt DATETIME NULL COMMENT '最后同步时间',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_document_integrations_tenantId (tenantId),
  INDEX idx_document_integrations_requirementId (requirementId)
);
```

#### requirement_analyses（需求分析表）
```sql
CREATE TABLE requirement_analyses (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  requirementId VARCHAR(30) UNIQUE NOT NULL COMMENT '需求ID',
  summary TEXT NOT NULL COMMENT 'AI生成的摘要',
  keyFeatures JSON NOT NULL COMMENT '关键功能点',
  complexity VARCHAR(50) DEFAULT 'MEDIUM' COMMENT '复杂度',
  estimatedHours INT NULL COMMENT '预估工时',
  suggestions TEXT NULL COMMENT 'AI建议',
  flowchartUrl VARCHAR(500) NULL COMMENT '流程图URL',
  e2eTests JSON NULL COMMENT 'E2E测试用例',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_requirement_analyses_tenantId (tenantId),
  INDEX idx_requirement_analyses_requirementId (requirementId)
);
```

### 5. 功能模块相关表

#### modules（功能模块表）
```sql
CREATE TABLE modules (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  projectId VARCHAR(30) NOT NULL COMMENT '项目ID',
  requirementId VARCHAR(30) NULL COMMENT '关联需求ID',
  parentId VARCHAR(30) NULL COMMENT '父模块ID',
  name VARCHAR(255) NOT NULL COMMENT '模块名称',
  description TEXT NULL COMMENT '模块描述',
  type VARCHAR(50) DEFAULT 'FEATURE' COMMENT '模块类型',
  priority VARCHAR(50) DEFAULT 'MEDIUM' COMMENT '优先级',
  status VARCHAR(50) DEFAULT 'TODO' COMMENT '状态',
  isBackendRequired BOOLEAN DEFAULT FALSE COMMENT '是否需要后端开发',
  isFrontendRequired BOOLEAN DEFAULT TRUE COMMENT '是否需要前端开发',
  estimatedHours INT NULL COMMENT '预估工时',
  actualHours INT NULL COMMENT '实际工时',
  `order` INT DEFAULT 0 COMMENT '排序',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_modules_tenantId (tenantId),
  INDEX idx_modules_projectId (projectId),
  INDEX idx_modules_requirementId (requirementId),
  INDEX idx_modules_parentId (parentId),
  INDEX idx_modules_order (`order`)
);
```

#### tasks（开发任务表）
```sql
CREATE TABLE tasks (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  moduleId VARCHAR(30) NOT NULL COMMENT '模块ID',
  title VARCHAR(500) NOT NULL COMMENT '任务标题',
  description TEXT NULL COMMENT '任务描述',
  type VARCHAR(50) DEFAULT 'DEVELOPMENT' COMMENT '任务类型',
  priority VARCHAR(50) DEFAULT 'MEDIUM' COMMENT '优先级',
  status VARCHAR(50) DEFAULT 'TODO' COMMENT '状态',
  estimatedHours INT NULL COMMENT '预估工时',
  actualHours INT NULL COMMENT '实际工时',
  techStack JSON NULL COMMENT '技术栈',
  generatedCode LONGTEXT NULL COMMENT 'AI生成的代码',
  codeLanguage VARCHAR(50) NULL COMMENT '代码语言',
  filePath VARCHAR(500) NULL COMMENT '文件路径',
  assigneeId VARCHAR(30) NULL COMMENT '分配给谁',
  `order` INT DEFAULT 0 COMMENT '排序',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tasks_tenantId (tenantId),
  INDEX idx_tasks_moduleId (moduleId),
  INDEX idx_tasks_assigneeId (assigneeId),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_order (`order`)
);
```

#### task_groups（任务组合表）
```sql
CREATE TABLE task_groups (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  moduleId VARCHAR(30) NOT NULL COMMENT '模块ID',
  name VARCHAR(255) NOT NULL COMMENT '组合名称',
  description TEXT NULL COMMENT '组合描述',
  status VARCHAR(50) DEFAULT 'TODO' COMMENT '状态',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_task_groups_tenantId (tenantId),
  INDEX idx_task_groups_moduleId (moduleId)
);
```

#### task_group_items（任务组合项表）
```sql
CREATE TABLE task_group_items (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  taskGroupId VARCHAR(30) NOT NULL COMMENT '任务组ID',
  taskId VARCHAR(30) NOT NULL COMMENT '任务ID',
  `order` INT DEFAULT 0 COMMENT '排序',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_task_group_items_tenantId (tenantId),
  INDEX idx_task_group_items_taskGroupId (taskGroupId),
  INDEX idx_task_group_items_taskId (taskId),
  INDEX idx_task_group_items_order (`order`)
);
```

### 6. 工作流相关表

#### workflows（工作流定义表）
```sql
CREATE TABLE workflows (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  projectId VARCHAR(30) NULL COMMENT '项目ID',
  name VARCHAR(255) NOT NULL COMMENT '工作流名称',
  description TEXT NULL COMMENT '工作流描述',
  steps JSON NOT NULL COMMENT '工作流步骤定义',
  isDefault BOOLEAN DEFAULT FALSE COMMENT '是否默认工作流',
  isActive BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_workflows_tenantId (tenantId),
  INDEX idx_workflows_projectId (projectId),
  INDEX idx_workflows_isDefault (isDefault)
);
```

#### requirement_workflows（需求工作流状态表）
```sql
CREATE TABLE requirement_workflows (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  requirementId VARCHAR(30) UNIQUE NOT NULL COMMENT '需求ID',
  workflowId VARCHAR(30) NOT NULL COMMENT '工作流ID',
  currentStep VARCHAR(100) NOT NULL COMMENT '当前步骤',
  stepData JSON NULL COMMENT '步骤数据',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_requirement_workflows_tenantId (tenantId),
  INDEX idx_requirement_workflows_requirementId (requirementId),
  INDEX idx_requirement_workflows_workflowId (workflowId)
);
```

#### external_workflows（外部工作流集成表）
```sql
CREATE TABLE external_workflows (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  projectId VARCHAR(30) NULL COMMENT '项目ID',
  name VARCHAR(255) NOT NULL COMMENT '工作流名称',
  type VARCHAR(50) NOT NULL COMMENT '工作流类型',
  endpoint VARCHAR(500) NOT NULL COMMENT '接口地址',
  apiKey VARCHAR(500) NULL COMMENT 'API密钥',
  config JSON NULL COMMENT '配置信息',
  isActive BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_external_workflows_tenantId (tenantId),
  INDEX idx_external_workflows_projectId (projectId)
);
```

### 7. 日志审计表

#### ai_request_logs（AI请求日志表）
```sql
CREATE TABLE ai_request_logs (
  id VARCHAR(30) PRIMARY KEY,
  tenantId VARCHAR(30) NOT NULL COMMENT '租户ID',
  userId VARCHAR(30) NOT NULL COMMENT '用户ID',
  requestType VARCHAR(50) NOT NULL COMMENT '请求类型',
  resourceId VARCHAR(30) NULL COMMENT '关联资源ID',
  resourceType VARCHAR(50) NULL COMMENT '资源类型',
  tokens INT NULL COMMENT '消耗的token数',
  cost DECIMAL(10,4) NULL COMMENT '成本',
  status VARCHAR(50) NOT NULL COMMENT '状态',
  errorMessage TEXT NULL COMMENT '错误信息',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_ai_request_logs_tenantId (tenantId),
  INDEX idx_ai_request_logs_userId (userId),
  INDEX idx_ai_request_logs_createdAt (createdAt),
  INDEX idx_ai_request_logs_requestType (requestType)
);
```

## 📈 枚举值定义

### 租户相关枚举
```typescript
// 租户计划
enum TenantPlan {
  FREE = 'FREE',
  BASIC = 'BASIC', 
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

// 租户状态
enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

// 租户角色
enum TenantRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

// 成员状态
enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  SUSPENDED = 'SUSPENDED'
}
```

### 项目相关枚举
```typescript
// 项目状态
enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  TESTING = 'TESTING',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

// 仓库类型
enum RepositoryType {
  GIT = 'GIT',
  SVN = 'SVN',
  MERCURIAL = 'MERCURIAL'
}
```

### 需求相关枚举
```typescript
// 需求类型
enum RequirementType {
  FUNCTIONAL = 'FUNCTIONAL',
  NON_FUNCTIONAL = 'NON_FUNCTIONAL',
  BUSINESS = 'BUSINESS',
  TECHNICAL = 'TECHNICAL'
}

// 需求状态
enum RequirementStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  ANALYZED = 'ANALYZED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// 文档类型
enum DocumentType {
  YUQUE = 'YUQUE',
  FEISHU = 'FEISHU',
  WOLAI = 'WOLAI',
  NOTION = 'NOTION'
}

// 复杂度
enum Complexity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}
```

### 模块任务相关枚举
```typescript
// 优先级
enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// 模块类型
enum ModuleType {
  FEATURE = 'FEATURE',
  COMPONENT = 'COMPONENT',
  SERVICE = 'SERVICE',
  UTILITY = 'UTILITY',
  INTEGRATION = 'INTEGRATION'
}

// 模块状态
enum ModuleStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  TESTING = 'TESTING',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED'
}

// 任务类型
enum TaskType {
  DEVELOPMENT = 'DEVELOPMENT',
  TESTING = 'TESTING',
  DOCUMENTATION = 'DOCUMENTATION',
  DEPLOYMENT = 'DEPLOYMENT',
  REFACTORING = 'REFACTORING'
}

// 任务状态
enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  TESTING = 'TESTING',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED'
}
```

### 工作流相关枚举
```typescript
// 外部工作流类型
enum ExternalWorkflowType {
  COZE = 'COZE',
  DIFY = 'DIFY',
  N8N = 'N8N',
  ZAPIER = 'ZAPIER'
}

// AI请求类型
enum AIRequestType {
  ANALYZE_REQUIREMENT = 'ANALYZE_REQUIREMENT',
  GENERATE_MODULES = 'GENERATE_MODULES',
  GENERATE_TASKS = 'GENERATE_TASKS',
  GENERATE_CODE = 'GENERATE_CODE',
  GENERATE_FLOWCHART = 'GENERATE_FLOWCHART',
  GENERATE_E2E = 'GENERATE_E2E'
}
```

## 🔍 查询优化建议

### 1. 索引策略
- **复合索引**：为常用的查询组合建立复合索引
- **覆盖索引**：对于只查询索引字段的情况，使用覆盖索引
- **分区索引**：对于大表考虑按时间分区

### 2. 查询模式
```sql
-- 租户级别的数据查询（最常用）
SELECT * FROM projects WHERE tenantId = ? AND status = ?;

-- 层级查询（模块树结构）
WITH RECURSIVE module_tree AS (
  SELECT * FROM modules WHERE tenantId = ? AND parentId IS NULL
  UNION ALL
  SELECT m.* FROM modules m 
  INNER JOIN module_tree mt ON m.parentId = mt.id
)
SELECT * FROM module_tree;

-- 统计查询（配额使用情况）
SELECT 
  COUNT(*) as projectCount,
  SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activeProjects
FROM projects 
WHERE tenantId = ?;
```

### 3. 性能监控
- 监控慢查询日志
- 定期分析表的查询模式
- 根据实际使用情况调整索引策略

## 🔒 数据安全考虑

### 1. 敏感数据加密
- accessToken字段需要加密存储
- apiKey字段需要加密存储
- 用户邮箱可考虑脱敏处理

### 2. 数据备份策略
- 按租户进行数据备份
- 定期全量备份 + 增量备份
- 跨地域备份保证数据安全

### 3. 审计日志
- 记录所有数据变更操作
- 保留操作人、操作时间、操作内容
- 定期归档历史日志

---

**维护者**：AI需求分析平台开发团队  
**最后更新**：2025年1月3日  
**文档版本**：v1.0.0
