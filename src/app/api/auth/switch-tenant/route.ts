import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sign } from 'jsonwebtoken'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

// 切换租户请求验证schema
const switchTenantSchema = z.object({
  tenantId: z.string().min(1, '租户ID不能为空'),
})

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json()
    
    // 验证请求数据
    const validationResult = switchTenantSchema.safeParse(body)
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

    const { tenantId } = validationResult.data

    // 验证用户是否有权限访问目标租户
    const membership = await prisma.tenantMember.findFirst({
      where: {
        userId: user!.id,
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        tenant: true,
      },
    })

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TENANT_ACCESS_DENIED',
            message: '无权访问指定租户',
          },
        },
        { status: 403 }
      )
    }

    // 检查租户状态
    if (membership.tenant.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TENANT_INACTIVE',
            message: '租户已被停用',
          },
        },
        { status: 403 }
      )
    }

    // 生成新的JWT Token
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
      userId: user!.id,
      email: user!.email,
      tenantId: membership.tenantId,
      role: membership.role,
    }

    const token = sign(tokenPayload, jwtSecret, {
      expiresIn: '1h',
    })

    const refreshToken = sign(
      { userId: user!.id, type: 'refresh' },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // 更新用户的当前租户
    await prisma.user.update({
      where: { id: user!.id },
      data: { currentTenantId: tenantId },
    })

    // 获取完整的用户信息
    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    })

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: fullUser!.id,
          email: fullUser!.email,
          name: fullUser!.name,
          avatar: fullUser!.avatar,
          tenantId: membership.tenantId,
          role: membership.role,
        },
        token,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('切换租户错误:', error)
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
