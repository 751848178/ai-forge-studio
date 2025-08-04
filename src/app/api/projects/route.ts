import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { withTenant } from '@/lib/middleware/tenant'
import { createTenantPrisma } from '@/lib/middleware/tenant'

// 创建项目请求验证schema
const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string().optional(),
})

// 查询项目请求验证schema
const queryProjectsSchema = z.object({
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'TESTING', 'COMPLETED', 'ARCHIVED']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional(),
})

// 获取项目列表
export const GET = withAuth(
  withTenant(async (request: NextRequest, { user, tenant }) => {
    try {
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 验证查询参数
      const validationResult = queryProjectsSchema.safeParse(queryParams)
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

      const { status, page = 1, limit = 10 } = validationResult.data
      const offset = (page - 1) * limit

      // 构建查询条件
      const where: any = {}
      if (status) where.status = status

      // 使用租户感知的Prisma实例
      const tenantPrisma = createTenantPrisma(tenant.tenantId)

      // 查询项目列表
      const [projects, total] = await Promise.all([
        tenantPrisma.project.findMany({
          where,
          include: {
            requirements: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            modules: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            _count: {
              select: {
                requirements: true,
                modules: true,
              },
            },
          },
          orderBy: [
            { createdAt: 'desc' },
          ],
          skip: offset,
          take: limit,
        }),
        tenantPrisma.project.findMany({ where }).then(result => result.length),
      ])

      return NextResponse.json({
        success: true,
        data: {
          projects,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      console.error('获取项目列表错误:', error)
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

// 创建项目
export const POST = withAuth(
  withTenant(async (request: NextRequest, { user, tenant }) => {
    try {
      const body = await request.json()
      
      // 验证请求数据
      const validationResult = createProjectSchema.safeParse(body)
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

      const projectData = validationResult.data

      // 使用租户感知的Prisma实例
      const tenantPrisma = createTenantPrisma(tenant.tenantId)

      // 创建项目
      const project = await tenantPrisma.project.create({
        data: {
          ...projectData,
          status: 'PLANNING',
        },
        include: {
          _count: {
            select: {
              requirements: true,
              modules: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: project,
      })
    } catch (error) {
      console.error('创建项目错误:', error)
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
