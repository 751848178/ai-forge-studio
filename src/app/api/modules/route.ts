import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { withTenant } from '@/lib/middleware/tenant'
import { createTenantPrisma } from '@/lib/middleware/tenant'

// 创建模块请求验证schema
const createModuleSchema = z.object({
  name: z.string().min(1, '模块名称不能为空'),
  description: z.string().optional(),
  type: z.enum(['FEATURE', 'COMPONENT', 'SERVICE', 'UTILITY', 'INTEGRATION']).default('FEATURE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  projectId: z.string().min(1, '项目ID不能为空'),
  estimatedHours: z.number().min(0).optional(),
})

// 查询模块请求验证schema
const queryModulesSchema = z.object({
  projectId: z.string().optional(),
  type: z.enum(['FEATURE', 'COMPONENT', 'SERVICE', 'UTILITY', 'INTEGRATION']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'TESTING', 'COMPLETED', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional(),
})

// 获取模块列表
export const GET = withAuth(
  withTenant(async (request: NextRequest, { user, tenant }) => {
    try {
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 验证查询参数
      const validationResult = queryModulesSchema.safeParse(queryParams)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '查询参数格式错误',
              details: validationResult.error.errors,
            },
          },
          { status: 400 }
        )
      }

      const { projectId, type, status, priority, page = 1, limit = 10 } = validationResult.data
      const offset = (page - 1) * limit

      // 构建查询条件
      const where: Record<string, unknown> = {}
      if (projectId) where.projectId = projectId
      if (type) where.type = type
      if (status) where.status = status
      if (priority) where.priority = priority

      // 使用租户感知的Prisma实例
      const tenantPrisma = createTenantPrisma(tenant.tenantId)

      // 查询模块列表
      const [modules, total] = await Promise.all([
        tenantPrisma.module.findMany({
          where,
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          skip: offset,
          take: limit,
        }),
        tenantPrisma.module.findMany({ where }).then(result => result.length),
      ])

      return NextResponse.json({
        success: true,
        data: {
          modules,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      console.error('获取模块列表错误:', error)
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
  })
)

// 创建模块
export const POST = withAuth(
  withTenant(async (request: NextRequest, { user, tenant }) => {
    try {
      const body = await request.json()
      
      // 验证请求数据
      const validationResult = createModuleSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '请求数据格式错误',
              details: validationResult.error.errors,
            },
          },
          { status: 400 }
        )
      }

      const moduleData = validationResult.data

      // 使用租户感知的Prisma实例
      const tenantPrisma = createTenantPrisma(tenant.tenantId)

      // 验证项目是否存在且属于当前租户
      const project = await tenantPrisma.project.findUnique({
        where: { id: moduleData.projectId },
      })

      if (!project) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROJECT_NOT_FOUND',
              message: '项目不存在',
            },
          },
          { status: 404 }
        )
      }

      // 创建模块
      const newModule = await tenantPrisma.module.create({
        data: {
          ...moduleData,
          status: 'TODO',
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: newModule,
      })
    } catch (error) {
      console.error('创建模块错误:', error)
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
  })
)
