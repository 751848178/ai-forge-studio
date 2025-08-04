import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { withTenant } from '@/lib/middleware/tenant'
import { createTenantPrisma } from '@/lib/middleware/tenant'

// 创建需求请求验证schema
const createRequirementSchema = z.object({
  title: z.string().min(1, '需求标题不能为空'),
  content: z.string().min(1, '需求内容不能为空'),
  projectId: z.string().min(1, '项目ID不能为空'),
  type: z.enum(['FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS', 'TECHNICAL']).default('FUNCTIONAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

// 查询需求请求验证schema
const queryRequirementsSchema = z.object({
  projectId: z.string().optional(),
  type: z.enum(['FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS', 'TECHNICAL']).optional(),
  status: z.enum(['PENDING', 'ANALYZING', 'ANALYZED', 'APPROVED', 'REJECTED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional(),
})

// 获取需求列表
export const GET = withAuth(
  withTenant(async (request: NextRequest, { user, tenant }) => {
    try {
      const { searchParams } = new URL(request.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 验证查询参数
      const validationResult = queryRequirementsSchema.safeParse(queryParams)
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
      const where: any = {}
      if (projectId) where.projectId = projectId
      if (type) where.type = type
      if (status) where.status = status
      if (priority) where.priority = priority

      // 使用租户感知的Prisma实例
      const tenantPrisma = createTenantPrisma(tenant.tenantId)

      // 查询需求列表
      const [requirements, total] = await Promise.all([
        tenantPrisma.requirement.findMany({
          where,
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            analysis: true,
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          skip: offset,
          take: limit,
        }),
        tenantPrisma.requirement.findMany({ where }).then(result => result.length),
      ])

      return NextResponse.json({
        success: true,
        data: {
          requirements,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      console.error('获取需求列表错误:', error)
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

// 创建需求
export const POST = withAuth(
  withTenant(async (request: NextRequest, { user, tenant }) => {
    try {
      const body = await request.json()
      
      // 验证请求数据
      const validationResult = createRequirementSchema.safeParse(body)
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

      const requirementData = validationResult.data

      // 使用租户感知的Prisma实例
      const tenantPrisma = createTenantPrisma(tenant.tenantId)

      // 验证项目是否存在且属于当前租户
      const project = await tenantPrisma.project.findUnique({
        where: { id: requirementData.projectId },
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

      // 创建需求
      const requirement = await tenantPrisma.requirement.create({
        data: {
          ...requirementData,
          status: 'PENDING',
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
        data: requirement,
      })
    } catch (error) {
      console.error('创建需求错误:', error)
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
