import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sign } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// 注册请求验证schema
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  name: z.string().min(1, '姓名不能为空').optional(),
  tenantName: z.string().min(1, '租户名称不能为空').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证请求数据
    const validationResult = registerSchema.safeParse(body)
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

    const { email, password, name, tenantName } = validationResult.data

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: '用户已存在',
          },
        },
        { status: 409 }
      )
    }

    // 生成租户slug
    const tenantSlug = tenantName 
      ? tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      : `tenant-${Date.now()}`

    // 检查租户slug是否已存在
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    })

    if (existingTenant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TENANT_EXISTS',
            message: '租户名称已被使用',
          },
        },
        { status: 409 }
      )
    }

    // 哈希密码（暂时跳过，因为User模型还没有password字段）
    // const hashedPassword = await bcrypt.hash(password, 12)

    // 使用事务创建用户和租户
    const result = await prisma.$transaction(async (tx) => {
      // 创建用户
      const user = await tx.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          // password: hashedPassword, // 需要在User模型中添加password字段
        },
      })

      // 创建租户
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName || `${user.name}的工作空间`,
          slug: tenantSlug,
          adminId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      })

      // 创建租户成员关系
      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      // 创建租户配额
      await tx.tenantQuota.create({
        data: {
          tenantId: tenant.id,
          maxProjects: 10,
          maxUsers: 5,
          maxRequirements: 100,
          maxAIRequests: 1000,
          maxStorage: 1073741824, // 1GB
        },
      })

      // 更新用户的当前租户
      await tx.user.update({
        where: { id: user.id },
        data: { currentTenantId: tenant.id },
      })

      return { user, tenant }
    })

    // 生成JWT Token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET环境变量未设置')
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: '服务器配置错误',
          },
        },
        { status: 500 }
      )
    }

    const tokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: 'ADMIN',
    }

    const token = sign(tokenPayload, jwtSecret, {
      expiresIn: '1h',
    })

    const refreshToken = sign(
      { userId: result.user.id, type: 'refresh' },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatar: result.user.avatar,
          tenantId: result.tenant.id,
          role: 'ADMIN',
        },
        token,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('注册错误:', error)
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
