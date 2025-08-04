import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { withTenant } from '@/lib/middleware/tenant'

// 测试认证的简单API
export const GET = withAuth(async (request: NextRequest, { user }) => {
  return NextResponse.json({
    success: true,
    message: '认证成功',
    data: {
      user,
      headers: {
        authorization: request.headers.get('authorization'),
        'x-tenant-id': request.headers.get('x-tenant-id'),
      }
    }
  })
})

// 测试租户认证的API
export const POST = withAuth(
  withTenant(async (request: NextRequest, { user, tenant }) => {
    return NextResponse.json({
      success: true,
      message: '租户认证成功',
      data: {
        user,
        tenant,
        headers: {
          authorization: request.headers.get('authorization'),
          'x-tenant-id': request.headers.get('x-tenant-id'),
        }
      }
    })
  })
)
