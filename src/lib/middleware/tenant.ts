import { NextRequest, NextResponse } from 'next/server'
import { AuthResult } from './auth'
import { prisma } from '../prisma'

// 租户上下文接口
export interface TenantContext {
  tenantId: string
  tenant: {
    id: string
    name: string
    slug: string
    status: string
    plan: string
  }
}

// 租户识别结果接口
export interface TenantResolutionResult {
  success: boolean
  tenantId?: string
  tenant?: TenantContext['tenant']
  error?: string
}

/**
 * 从请求中识别租户
 */
export async function resolveTenant(request: NextRequest): Promise<TenantResolutionResult> {
  try {
    // 1. 从Header中获取租户ID
    const tenantIdFromHeader = request.headers.get('x-tenant-id')
    if (tenantIdFromHeader) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdFromHeader },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true,
        },
      })

      if (tenant && tenant.status === 'ACTIVE') {
        return {
          success: true,
          tenantId: tenant.id,
          tenant,
        }
      }
    }

    // 2. 从子域名识别租户
    const host = request.headers.get('host')
    if (host) {
      const subdomain = host.split('.')[0]
      
      // 排除主域名和常见子域名
      if (!['www', 'api', 'admin', 'app', 'localhost'].includes(subdomain)) {
        const tenant = await prisma.tenant.findUnique({
          where: { slug: subdomain },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            plan: true,
          },
        })

        if (tenant && tenant.status === 'ACTIVE') {
          return {
            success: true,
            tenantId: tenant.id,
            tenant,
          }
        }
      }
    }

    // 3. 从URL路径识别租户 (如 /tenant/[slug]/...)
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
    if (pathSegments[0] === 'tenant' && pathSegments[1]) {
      const tenantSlug = pathSegments[1]
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true,
        },
      })

      if (tenant && tenant.status === 'ACTIVE') {
        return {
          success: true,
          tenantId: tenant.id,
          tenant,
        }
      }
    }

    return {
      success: false,
      error: '无法识别租户',
    }
  } catch (error) {
    console.error('租户识别错误:', error)
    return {
      success: false,
      error: '租户识别失败',
    }
  }
}

/**
 * 验证用户是否属于指定租户
 */
export async function validateUserTenant(
  userId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const membership = await prisma.tenantMember.findFirst({
      where: {
        userId,
        tenantId,
        status: 'ACTIVE',
      },
    })

    return Boolean(membership)
  } catch (error) {
    console.error('用户租户验证错误:', error)
    return false
  }
}

/**
 * 检查租户配额
 */
export async function checkTenantQuota(
  tenantId: string,
  resource: 'projects' | 'users' | 'requirements' | 'aiRequests' | 'storage'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  try {
    const quota = await prisma.tenantQuota.findUnique({
      where: { tenantId },
    })

    if (!quota) {
      return { allowed: false, current: 0, limit: 0 }
    }

    const resourceMap = {
      projects: { current: quota.usedProjects, limit: quota.maxProjects },
      users: { current: quota.usedUsers, limit: quota.maxUsers },
      requirements: { current: quota.usedRequirements, limit: quota.maxRequirements },
      aiRequests: { current: quota.usedAIRequests, limit: quota.maxAIRequests },
      storage: { current: quota.usedStorage, limit: quota.maxStorage },
    }

    const { current, limit } = resourceMap[resource]
    return {
      allowed: current < limit,
      current,
      limit,
    }
  } catch (error) {
    console.error('租户配额检查错误:', error)
    return { allowed: false, current: 0, limit: 0 }
  }
}

/**
 * 更新租户配额使用量
 */
export async function updateTenantQuotaUsage(
  tenantId: string,
  resource: 'projects' | 'users' | 'requirements' | 'aiRequests' | 'storage',
  delta: number
): Promise<boolean> {
  try {
    const updateData: any = {}
    
    switch (resource) {
      case 'projects':
        updateData.usedProjects = { increment: delta }
        break
      case 'users':
        updateData.usedUsers = { increment: delta }
        break
      case 'requirements':
        updateData.usedRequirements = { increment: delta }
        break
      case 'aiRequests':
        updateData.usedAIRequests = { increment: delta }
        break
      case 'storage':
        updateData.usedStorage = { increment: delta }
        break
    }

    await prisma.tenantQuota.update({
      where: { tenantId },
      data: updateData,
    })

    return true
  } catch (error) {
    console.error('租户配额更新错误:', error)
    return false
  }
}

/**
 * 租户中间件
 */
export function withTenant(
  handler: (
    request: NextRequest,
    context: { user?: AuthResult['user']; tenant: TenantContext }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { user?: AuthResult['user'] }
  ): Promise<NextResponse> => {
    // 识别租户
    const tenantResult = await resolveTenant(request)
    
    if (!tenantResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: tenantResult.error || '租户不存在',
          },
        },
        { status: 404 }
      )
    }

    // 如果有用户信息，验证用户是否属于该租户
    if (context.user) {
      const isValidMember = await validateUserTenant(
        context.user.id,
        tenantResult.tenantId!
      )

      if (!isValidMember) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TENANT_ACCESS_DENIED',
              message: '无权访问该租户',
            },
          },
          { status: 403 }
        )
      }
    }

    const tenantContext: TenantContext = {
      tenantId: tenantResult.tenantId!,
      tenant: tenantResult.tenant!,
    }

    try {
      return await handler(request, { ...context, tenant: tenantContext })
    } catch (error) {
      console.error('租户中间件处理错误:', error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '服务器内部错误',
          },
        },
        { status: 500 }
      )
    }
  }
}

/**
 * 租户配额检查中间件
 */
export function withTenantQuota(
  resource: 'projects' | 'users' | 'requirements' | 'aiRequests' | 'storage'
) {
  return function(
    handler: (
      request: NextRequest,
      context: { user?: AuthResult['user']; tenant: TenantContext }
    ) => Promise<NextResponse>
  ) {
    return async (
      request: NextRequest,
      context: { user?: AuthResult['user']; tenant: TenantContext }
    ): Promise<NextResponse> => {
      // 检查配额
      const quotaCheck = await checkTenantQuota(context.tenant.tenantId, resource)
      
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: `${resource}配额已用完`,
              details: {
                current: quotaCheck.current,
                limit: quotaCheck.limit,
              },
            },
          },
          { status: 429 }
        )
      }

      return handler(request, context)
    }
  }
}

/**
 * 多租户数据库查询助手
 */
export class TenantAwarePrisma {
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  // 项目查询
  get project() {
    return {
      findMany: (args: any = {}) => {
        return prisma.project.findMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      findUnique: (args: any) => {
        return prisma.project.findFirst({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      create: (args: any) => {
        return prisma.project.create({
          ...args,
          data: {
            ...args.data,
            tenantId: this.tenantId,
          },
        })
      },
      update: (args: any) => {
        return prisma.project.updateMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      delete: (args: any) => {
        return prisma.project.deleteMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
    }
  }

  // 需求查询
  get requirement() {
    return {
      findMany: (args: any = {}) => {
        return prisma.requirement.findMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      findUnique: (args: any) => {
        return prisma.requirement.findFirst({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      create: (args: any) => {
        return prisma.requirement.create({
          ...args,
          data: {
            ...args.data,
            tenantId: this.tenantId,
          },
        })
      },
      update: (args: any) => {
        return prisma.requirement.updateMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      delete: (args: any) => {
        return prisma.requirement.deleteMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
    }
  }

  // 模块查询
  get module() {
    return {
      findMany: (args: any = {}) => {
        return prisma.module.findMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      findUnique: (args: any) => {
        return prisma.module.findFirst({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      create: (args: any) => {
        return prisma.module.create({
          ...args,
          data: {
            ...args.data,
            tenantId: this.tenantId,
          },
        })
      },
      update: (args: any) => {
        return prisma.module.updateMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      delete: (args: any) => {
        return prisma.module.deleteMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
    }
  }

  // 任务查询
  get task() {
    return {
      findMany: (args: any = {}) => {
        return prisma.task.findMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      findUnique: (args: any) => {
        return prisma.task.findFirst({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      create: (args: any) => {
        return prisma.task.create({
          ...args,
          data: {
            ...args.data,
            tenantId: this.tenantId,
          },
        })
      },
      update: (args: any) => {
        return prisma.task.updateMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
      delete: (args: any) => {
        return prisma.task.deleteMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        })
      },
    }
  }
}

/**
 * 创建租户感知的Prisma实例
 */
export function createTenantPrisma(tenantId: string): TenantAwarePrisma {
  return new TenantAwarePrisma(tenantId)
}

export default withTenant
