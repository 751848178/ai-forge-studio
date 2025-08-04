import { useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from './index'
import { request } from '../utils/request'

// 用户信息接口
export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string
  tenantId?: string
  role?: string
}

// 认证状态接口
export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// 登录参数接口
export interface LoginParams {
  email: string
  password: string
  tenantSlug?: string
}

// 注册参数接口
export interface RegisterParams {
  email: string
  password: string
  name?: string
  tenantName?: string
}

// 认证响应接口
export interface AuthResponse {
  success: boolean
  data?: {
    user: AuthUser
    token: string
    refreshToken?: string
  }
  error?: {
    code: string
    message: string
  }
}

/**
 * 认证Hook
 * 提供用户登录、注册、登出等功能
 */
export function useAuth() {
  const [token, setToken] = useLocalStorage<string | null>('auth-token', null)
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>('refresh-token', null)
  const [user, setUser] = useLocalStorage<AuthUser | null>('auth-user', null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = Boolean(token && user)

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 设置认证信息
  const setAuthData = useCallback((authData: { user: AuthUser; token: string; refreshToken?: string }) => {
    setUser(authData.user)
    setToken(authData.token)
    if (authData.refreshToken) {
      setRefreshToken(authData.refreshToken)
    }
    setError(null)
  }, [setUser, setToken, setRefreshToken])

  // 清除认证信息
  const clearAuthData = useCallback(() => {
    setUser(null)
    setToken(null)
    setRefreshToken(null)
    setError(null)
  }, [setUser, setToken, setRefreshToken])

  // 登录
  const login = useCallback(async (params: LoginParams): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await request.post<{ user: AuthUser; token: string; refreshToken?: string }>('/auth/login', params)

      if (result.success && result.data) {
        setAuthData(result.data)
        return true
      } else {
        setError(result.error?.message || '登录失败')
        return false
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [setAuthData])

  // 注册
  const register = useCallback(async (params: RegisterParams): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await request.post<{ user: AuthUser; token: string; refreshToken?: string }>('/auth/register', params)

      if (result.success && result.data) {
        setAuthData(result.data)
        return true
      } else {
        setError(result.error?.message || '注册失败')
        return false
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [setAuthData])

  // 登出
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)

    try {
      // 调用登出API（可选）
      if (token) {
        await request.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      clearAuthData()
      setIsLoading(false)
    }
  }, [token, clearAuthData])

  // 刷新Token
  const refreshAuthToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      return false
    }

    try {
      const result = await request.post<{ user: AuthUser; token: string; refreshToken?: string }>('/auth/refresh', { refreshToken })

      if (result.success && result.data) {
        setAuthData(result.data)
        return true
      } else {
        clearAuthData()
        return false
      }
    } catch (error) {
      clearAuthData()
      return false
    }
  }, [refreshToken, setAuthData, clearAuthData])

  // 获取当前用户信息
  const getCurrentUser = useCallback(async (): Promise<AuthUser | null> => {
    if (!token) {
      return null
    }

    setIsLoading(true)

    try {
      const result = await request.get<AuthUser>('/auth/me')

      if (result.success && result.data) {
        setUser(result.data)
        return result.data
      } else {
        // Token可能已过期，尝试刷新
        const refreshed = await refreshAuthToken()
        if (!refreshed) {
          clearAuthData()
        }
        return null
      }
    } catch (error) {
      setError('获取用户信息失败')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [token, refreshAuthToken, clearAuthData, setUser])

  // 更新用户信息
  const updateUser = useCallback(async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!token || !user) {
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await request.put<AuthUser>('/auth/profile', userData)

      if (result.success && result.data) {
        setUser({ ...user, ...result.data })
        return true
      } else {
        setError(result.error?.message || '更新用户信息失败')
        return false
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [token, user, setUser])

  // 检查权限
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.role) {
      return false
    }

    // 这里可以根据实际的权限系统实现
    // 暂时简单实现
    const rolePermissions: Record<string, string[]> = {
      ADMIN: ['*'], // 管理员拥有所有权限
      MANAGER: ['project:*', 'requirement:*', 'module:*', 'task:*'],
      MEMBER: ['project:read', 'requirement:*', 'module:read', 'task:*'],
      VIEWER: ['project:read', 'requirement:read', 'module:read', 'task:read'],
    }

    const userPermissions = rolePermissions[user.role] || []
    
    return userPermissions.includes('*') || 
           userPermissions.includes(permission) ||
           userPermissions.some(p => p.endsWith(':*') && permission.startsWith(p.replace(':*', ':')))
  }, [user])

  // 初始化时验证Token
  useEffect(() => {
    if (token && !user) {
      getCurrentUser()
    }
  }, [token, user, getCurrentUser])

  // 自动刷新Token
  useEffect(() => {
    if (!token || !refreshToken) {
      return
    }

    // 设置定时刷新Token（例如每50分钟刷新一次，假设Token有效期为1小时）
    const interval = setInterval(() => {
      refreshAuthToken()
    }, 50 * 60 * 1000) // 50分钟

    return () => clearInterval(interval)
  }, [token, refreshToken, refreshAuthToken])

  const authState: AuthState = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
  }

  return {
    ...authState,
    login,
    register,
    logout,
    refreshAuthToken,
    getCurrentUser,
    updateUser,
    hasPermission,
    clearError,
  }
}

export default useAuth
