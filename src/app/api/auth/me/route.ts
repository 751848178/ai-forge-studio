import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    // 获取完整的用户信息
    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
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

    if (!fullUser) {
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

    // 获取当前租户信息
    const currentTenant = fullUser.tenantMemberships.find(
      m => m.tenantId === user!.tenantId
    )

    return NextResponse.json({
      success: true,
      data: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        avatar: fullUser.avatar,
        tenantId: user!.tenantId,
        role: user!.role,
        tenants: fullUser.tenantMemberships.map(m => ({
          id: m.tenant.id,
          name: m.tenant.name,
          slug: m.tenant.slug,
          role: m.role,
          isCurrent: m.tenantId === user!.tenantId,
        })),
      },
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
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
