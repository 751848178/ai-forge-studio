import { NextRequest, NextResponse } from 'next/server'
import { withOptionalAuth } from '@/lib/middleware/auth'

export const POST = withOptionalAuth(async (request: NextRequest, { user }) => {
  try {
    // 在实际项目中，这里可以：
    // 1. 将token加入黑名单
    // 2. 记录登出日志
    // 3. 清理相关会话数据
    
    if (user) {
      console.log(`用户 ${user.email} 已登出`)
    }

    return NextResponse.json({
      success: true,
      message: '登出成功',
    })
  } catch (error) {
    console.error('登出错误:', error)
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
