import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

// JWT载荷接口
export interface JWTPayload {
  userId: string
  email: string
  tenantId?: string
  role?: string
  exp: number
  iat: number
}

// 认证结果接口
export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    tenantId?: string
    role?: string
  }
  error?: string
}

/**
 * 验证JWT Token
 */
export function verifyToken(token: string): AuthResult {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return { success: false, error: 'JWT密钥未配置' }
    }

    const payload = verify(token, secret) as JWTPayload
    
    // 检查token是否过期（JWT库会自动验证exp，这里不需要手动检查）
    // if (payload.exp < Date.now() / 1000) {
    //   return { success: false, error: 'Token已过期' }
    // }

    return {
      success: true,
      user: {
        id: payload.userId,
        email: payload.email,
        tenantId: payload.tenantId,
        role: payload.role,
      }
    }
  } catch (error) {
    return { success: false, error: 'Token无效' }
  }
}

/**
 * 从请求中提取Token
 */
export function extractToken(request: NextRequest): string | null {
  // 从Authorization header中提取
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 从Cookie中提取
  const cookieToken = request.cookies.get('auth-token')?.value
  if (cookieToken) {
    return cookieToken
  }

  return null
}

/**
 * 认证中间件
 */
export function withAuth(
  handler: (request: NextRequest, context: { user: AuthResult['user'] }) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const token = extractToken(request)
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '未提供认证令牌' } },
        { status: 401 }
      )
    }

    const authResult = verifyToken(token)
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: authResult.error } },
        { status: 401 }
      )
    }

    try {
      return await handler(request, { user: authResult.user! })
    } catch (error) {
      console.error('API处理错误:', error)
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
        { status: 500 }
      )
    }
  }
}

/**
 * 可选认证中间件（允许匿名访问）
 */
export function withOptionalAuth(
  handler: (request: NextRequest, context: { user?: AuthResult['user'] }) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const token = extractToken(request)
    let user: AuthResult['user'] | undefined

    if (token) {
      const authResult = verifyToken(token)
      if (authResult.success) {
        user = authResult.user
      }
    }

    try {
      return await handler(request, { user })
    } catch (error) {
      console.error('API处理错误:', error)
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
        { status: 500 }
      )
    }
  }
}

export default withAuth
