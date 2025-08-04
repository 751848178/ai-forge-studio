import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { withTenant } from '@/lib/middleware/tenant'
import { createTenantPrisma } from '@/lib/middleware/tenant'

// 创建任务请求验证schema
const createTaskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空'),
  description: z.string().optional(),
  type: z.enum(['DEVELOPMENT', 'TESTING', 'DOCUMENTATION', 'DEPLOYMENT', 'REFACTORING']).default('DEVELOPMENT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  moduleId: z.string().min(1, '模块ID不能为空'),
  estimatedHours: z.number().min(0).optional(),
  techStack: z.record(z.any()).optional(),
  filePath: z.string().optional(),
})

// 查询任务请求验证schema
const queryTasksSchema = z.object({
  moduleId: z.string().optional(),
  projectId: z.string().optional(),
  type: z.enum(['DEVELOPMENT', 'TESTING', 'DOCUMENTATION', 'DEPLOYMENT', 'REFACTORING']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'COMPLETED', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional(),
})

// 获取任务列表
export const GET = withAuth(
  withTenant(async (request: NextRequest, { user, tenant }) => {
    try {
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 验证查询参数
      const validationResult = queryTasksSchema.safeParse(queryParams)
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

      const { moduleId, projectId, type, status, priority, page = 1, limit = 10 } = validationResult.data
      const offset = (page - 1) * limit

      // 构建查询条件
      const where: any = {}
      if (moduleId) where.moduleId = moduleId
      if (type) where.type = type
      if (status) where.status = status
      if (priority) where.priority = priority

      // 如果指定了projectId，需要通过module关联查询
      if (projectId) {
        where.module = {
          projectId: projectId,
        }
      }

      // 使用租户感知的Prisma实例
      const tenantPrisma = createTenantPrisma(tenant.tenantId)

      // 查询任务列表
      const [tasks, total] = await Promise.all([
        tenantPrisma.task.findMany({
          where,
          include: {
            module: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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
        tenantPrisma.task.findMany({ where }).then(result => result.length),
      ])

      return NextResponse.json({
        success: true,
        data: {
          tasks,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      console.error('获取任务列表错误:', error)
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

// 创建任务
export const POST = withAuth(
  withTenant(async (request: NextRequest, { user, tenant }) => {
    try {
      const body = await request.json()
      
      // 验证请求数据
      const validationResult = createTaskSchema.safeParse(body)
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

      const taskData = validationResult.data

      // 使用租户感知的Prisma实例
      const tenantPrisma = createTenantPrisma(tenant.tenantId)

      // 验证模块是否存在且属于当前租户
      const module = await tenantPrisma.module.findUnique({
        where: { id: taskData.moduleId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!module) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MODULE_NOT_FOUND',
              message: '模块不存在',
            },
          },
          { status: 404 }
        )
      }

      // 创建任务
      const task = await tenantPrisma.task.create({
        data: {
          ...taskData,
          status: 'TODO',
        },
        include: {
          module: {
            select: {
              id: true,
              name: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: task,
      })
    } catch (error) {
      console.error('创建任务错误:', error)
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
