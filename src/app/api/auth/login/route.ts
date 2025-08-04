import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sign } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// 登录请求验证schema
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  tenantSlug: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证请求数据
    const validationResult = loginSchema.safeParse(body)
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

    const { email, password, tenantSlug } = validationResult.data

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenantMemberships: {
          include: {
            tenant: true,
          },
          where: {
            status: 'ACTIVE',
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        },
        { status: 404 }
      )
    }

    // 验证密码（这里需要先实现用户注册时的密码哈希）
    // 暂时跳过密码验证，实际项目中需要添加password字段到User模型
    // const isValidPassword = await bcrypt.compare(password, user.password)
    // if (!isValidPassword) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: {
    //         code: 'INVALID_PASSWORD',
    //         message: '密码错误',
    //       },
    //     },
    //     { status: 401 }
    //   )
    // }

    // 确定要登录的租户
    let targetTenant = null
    if (tenantSlug) {
      // 指定了租户slug，查找对应的租户成员关系
      const membership = user.tenantMemberships.find(
        m => m.tenant.slug === tenantSlug
      )
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
      targetTenant = membership.tenant
    } else {
      // 没有指定租户，使用用户的当前租户或第一个租户
      if (user.currentTenantId) {
        const currentMembership = user.tenantMemberships.find(
          m => m.tenantId === user.currentTenantId
        )
        if (currentMembership) {
          targetTenant = currentMembership.tenant
        }
      }
      
      if (!targetTenant && user.tenantMemberships.length > 0) {
        targetTenant = user.tenantMemberships[0].tenant
      }
    }

    if (!targetTenant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_TENANT_ACCESS',
            message: '用户没有可访问的租户',
          },
        },
        { status: 403 }
      )
    }

    // 获取用户在目标租户中的角色
    const membership = user.tenantMemberships.find(
      m => m.tenantId === targetTenant.id
    )
    const userRole = membership?.role || 'MEMBER'

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
      userId: user.id,
      email: user.email,
      tenantId: targetTenant.id,
      role: userRole,
    }

    const token = sign(tokenPayload, jwtSecret, {
      expiresIn: '1h',
    })

    const refreshToken = sign(
      { userId: user.id, type: 'refresh' },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // 更新用户的当前租户
    if (user.currentTenantId !== targetTenant.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentTenantId: targetTenant.id },
      })
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          tenantId: targetTenant.id,
          role: userRole,
        },
        token,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('登录错误:', error)
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
