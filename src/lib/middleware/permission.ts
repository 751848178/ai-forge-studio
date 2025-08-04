import { NextRequest, NextResponse } from 'next/server'
import { AuthResult } from './auth'

// 权限定义接口
export interface Permission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

// 权限检查结果接口
export interface PermissionResult {
  allowed: boolean
  reason?: string
}

// 资源权限映射
export const PERMISSIONS = {
  // 项目权限
  PROJECT: {
    CREATE: 'project:create',
    READ: 'project:read',
    UPDATE: 'project:update',
    DELETE: 'project:delete',
    MANAGE: 'project:manage',
  },
  // 需求权限
  REQUIREMENT: {
    CREATE: 'requirement:create',
    READ: 'requirement:read',
    UPDATE: 'requirement:update',
    DELETE: 'requirement:delete',
    ANALYZE: 'requirement:analyze',
  },
  // 模块权限
  MODULE: {
    CREATE: 'module:create',
    READ: 'module:read',
    UPDATE: 'module:update',
    DELETE: 'module:delete',
    GENERATE: 'module:generate',
  },
  // 任务权限
  TASK: {
    CREATE: 'task:create',
    READ: 'task:read',
    UPDATE: 'task:update',
    DELETE: 'task:delete',
    ASSIGN: 'task:assign',
    GENERATE_CODE: 'task:generate_code',
  },
  // 租户权限
  TENANT: {
    READ: 'tenant:read',
    UPDATE: 'tenant:update',
    MANAGE_USERS: 'tenant:manage_users',
    MANAGE_SETTINGS: 'tenant:manage_settings',
  },
  // AI权限
  AI: {
    ANALYZE: 'ai:analyze',
    GENERATE: 'ai:generate',
    UNLIMITED: 'ai:unlimited',
  },
} as const

// 角色权限映射
export const ROLE_PERMISSIONS = {
  ADMIN: [
    // 项目权限
    PERMISSIONS.PROJECT.CREATE,
    PERMISSIONS.PROJECT.READ,
    PERMISSIONS.PROJECT.UPDATE,
    PERMISSIONS.PROJECT.DELETE,
    PERMISSIONS.PROJECT.MANAGE,
    // 需求权限
    PERMISSIONS.REQUIREMENT.CREATE,
    PERMISSIONS.REQUIREMENT.READ,
    PERMISSIONS.REQUIREMENT.UPDATE,
    PERMISSIONS.REQUIREMENT.DELETE,
    PERMISSIONS.REQUIREMENT.ANALYZE,
    // 模块权限
    PERMISSIONS.MODULE.CREATE,
    PERMISSIONS.MODULE.READ,
    PERMISSIONS.MODULE.UPDATE,
    PERMISSIONS.MODULE.DELETE,
    PERMISSIONS.MODULE.GENERATE,
    // 任务权限
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.READ,
    PERMISSIONS.TASK.UPDATE,
    PERMISSIONS.TASK.DELETE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.GENERATE_CODE,
    // 租户权限
    PERMISSIONS.TENANT.READ,
    PERMISSIONS.TENANT.UPDATE,
    PERMISSIONS.TENANT.MANAGE_USERS,
    PERMISSIONS.TENANT.MANAGE_SETTINGS,
    // AI权限
    PERMISSIONS.AI.ANALYZE,
    PERMISSIONS.AI.GENERATE,
    PERMISSIONS.AI.UNLIMITED,
  ],
  MANAGER: [
    // 项目权限
    PERMISSIONS.PROJECT.CREATE,
    PERMISSIONS.PROJECT.READ,
    PERMISSIONS.PROJECT.UPDATE,
    PERMISSIONS.PROJECT.MANAGE,
    // 需求权限
    PERMISSIONS.REQUIREMENT.CREATE,
    PERMISSIONS.REQUIREMENT.READ,
    PERMISSIONS.REQUIREMENT.UPDATE,
    PERMISSIONS.REQUIREMENT.ANALYZE,
    // 模块权限
    PERMISSIONS.MODULE.CREATE,
    PERMISSIONS.MODULE.READ,
    PERMISSIONS.MODULE.UPDATE,
    PERMISSIONS.MODULE.GENERATE,
    // 任务权限
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.READ,
    PERMISSIONS.TASK.UPDATE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.GENERATE_CODE,
    // 租户权限
    PERMISSIONS.TENANT.READ,
    // AI权限
    PERMISSIONS.AI.ANALYZE,
    PERMISSIONS.AI.GENERATE,
  ],
  MEMBER: [
    // 项目权限
    PERMISSIONS.PROJECT.READ,
    // 需求权限
    PERMISSIONS.REQUIREMENT.CREATE,
    PERMISSIONS.REQUIREMENT.READ,
    PERMISSIONS.REQUIREMENT.UPDATE,
    PERMISSIONS.REQUIREMENT.ANALYZE,
    // 模块权限
    PERMISSIONS.MODULE.READ,
    PERMISSIONS.MODULE.UPDATE,
    PERMISSIONS.MODULE.GENERATE,
    // 任务权限
    PERMISSIONS.TASK.READ,
    PERMISSIONS.TASK.UPDATE,
    PERMISSIONS.TASK.GENERATE_CODE,
    // 租户权限
    PERMISSIONS.TENANT.READ,
    // AI权限
    PERMISSIONS.AI.ANALYZE,
    PERMISSIONS.AI.GENERATE,
  ],
  VIEWER: [
    // 项目权限
    PERMISSIONS.PROJECT.READ,
    // 需求权限
    PERMISSIONS.REQUIREMENT.READ,
    // 模块权限
    PERMISSIONS.MODULE.READ,
    // 任务权限
    PERMISSIONS.TASK.READ,
    // 租户权限
    PERMISSIONS.TENANT.READ,
  ],
} as const

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(
  user: AuthResult['user'],
  permission: string,
  conditions?: Record<string, any>
): PermissionResult {
  if (!user) {
    return { allowed: false, reason: '用户未认证' }
  }

  const userRole = user.role as keyof typeof ROLE_PERMISSIONS
  if (!userRole) {
    return { allowed: false, reason: '用户角色未定义' }
  }

  const rolePermissions = ROLE_PERMISSIONS[userRole]
  if (!rolePermissions) {
    return { allowed: false, reason: '无效的用户角色' }
  }

  // 检查基础权限
  if (!rolePermissions.includes(permission as any)) {
    return { allowed: false, reason: '权限不足' }
  }

  // 检查条件权限（如资源所有者检查）
  if (conditions) {
    // 检查资源所有者
    if (conditions.ownerId && conditions.ownerId !== user.id) {
      // 只有ADMIN和MANAGER可以访问他人的资源
      if (!['ADMIN', 'MANAGER'].includes(userRole)) {
        return { allowed: false, reason: '只能访问自己的资源' }
      }
    }

    // 检查租户权限
    if (conditions.tenantId && conditions.tenantId !== user.tenantId) {
      return { allowed: false, reason: '跨租户访问被拒绝' }
    }
  }

  return { allowed: true }
}

/**
 * 权限验证中间件
 */
export function withPermission(
  permission: string,
  getConditions?: (request: NextRequest) => Record<string, any> | Promise<Record<string, any>>
) {
  return function(
    handler: (request: NextRequest, context: { user: AuthResult['user'] }) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context: { user: AuthResult['user'] }): Promise<NextResponse> => {
      const { user } = context

      // 获取条件
      let conditions: Record<string, any> = {}
      if (getConditions) {
        conditions = await getConditions(request)
      }

      // 检查权限
      const permissionResult = hasPermission(user, permission, conditions)
      
      if (!permissionResult.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'FORBIDDEN', 
              message: permissionResult.reason || '权限不足' 
            } 
          },
          { status: 403 }
        )
      }

      return handler(request, context)
    }
  }
}

/**
 * 资源所有者权限检查
 */
export function withOwnerPermission(
  getOwnerId: (request: NextRequest) => string | Promise<string>
) {
  return function(
    handler: (request: NextRequest, context: { user: AuthResult['user'] }) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context: { user: AuthResult['user'] }): Promise<NextResponse> => {
      const { user } = context
      const ownerId = await getOwnerId(request)

      // 检查是否为资源所有者或有管理权限
      if (user?.id !== ownerId && !['ADMIN', 'MANAGER'].includes(user?.role || '')) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'FORBIDDEN', 
              message: '只能访问自己的资源' 
            } 
          },
          { status: 403 }
        )
      }

      return handler(request, context)
    }
  }
}

/**
 * 租户权限检查
 */
export function withTenantPermission(
  getTenantId: (request: NextRequest) => string | Promise<string>
) {
  return function(
    handler: (request: NextRequest, context: { user: AuthResult['user'] }) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context: { user: AuthResult['user'] }): Promise<NextResponse> => {
      const { user } = context
      const tenantId = await getTenantId(request)

      // 检查租户权限
      if (user?.tenantId !== tenantId) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'FORBIDDEN', 
              message: '跨租户访问被拒绝' 
            } 
          },
          { status: 403 }
        )
      }

      return handler(request, context)
    }
  }
}

export default withPermission
