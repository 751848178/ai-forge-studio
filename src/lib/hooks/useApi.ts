import { useCallback, useEffect, useState } from 'react'
import { ApiResponse } from '../utils/request'

// API请求Hook的状态接口
interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

// API请求Hook的返回接口
interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

/**
 * 通用API请求Hook
 * 提供加载状态、错误处理和数据管理
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  immediate: boolean = false
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await apiFunction(...args)
        if (response.success) {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
          })
          return response.data || null
        } else {
          const error = new Error(response.error?.message || '请求失败')
          setState({
            data: null,
            loading: false,
            error,
          })
          return null
        }
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error as Error,
        })
        return null
      }
    },
    [apiFunction]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    ...state,
    execute,
    reset,
  }
}

export default useApi
