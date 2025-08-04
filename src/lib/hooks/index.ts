// 原子化Hooks导出
export { default as useDebounce } from './useDebounce'
export { default as useThrottle } from './useThrottle'
export { useApi } from './useApi'

// 其他Hooks将在后续开发中拆分为独立文件
// 临时保留在此文件中的Hooks

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiResponse, RequestConfig, request } from '../utils/request'
import { useApi } from './useApi'

// 本地存储Hook
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        if (item === null) {
          return initialValue
        }
        
        // 如果初始值是字符串类型，直接返回存储的字符串
        if (typeof initialValue === 'string') {
          return item as T
        }
        
        // 否则尝试解析JSON
        try {
          return JSON.parse(item)
        } catch {
          // 如果解析失败，返回原始字符串
          return item as T
        }
      }
      return initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          // 如果值是字符串类型，直接存储
          if (typeof valueToStore === 'string') {
            window.localStorage.setItem(key, valueToStore)
          } else {
            // 否则JSON序列化
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          }
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}

// 会话存储Hook
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.sessionStorage.getItem(key)
        if (item === null) {
          return initialValue
        }
        
        // 如果初始值是字符串类型，直接返回存储的字符串
        if (typeof initialValue === 'string') {
          return item as T
        }
        
        // 否则尝试解析JSON
        try {
          return JSON.parse(item)
        } catch {
          // 如果解析失败，返回原始字符串
          return item as T
        }
      }
      return initialValue
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          // 如果值是字符串类型，直接存储
          if (typeof valueToStore === 'string') {
            window.sessionStorage.setItem(key, valueToStore)
          } else {
            // 否则JSON序列化
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
          }
        }
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}

// 简化的API请求Hooks
export function useGet<T = any>(url: string, config?: RequestConfig, immediate: boolean = true) {
  return useApi<T>(() => request.get<T>(url, config), immediate)
}

export function usePost<T = any>(url: string, config?: RequestConfig) {
  return useApi<T>((data: any) => request.post<T>(url, data, config))
}

export function usePut<T = any>(url: string, config?: RequestConfig) {
  return useApi<T>((data: any) => request.put<T>(url, data, config))
}

export function useDelete<T = any>(url: string, config?: RequestConfig) {
  return useApi<T>(() => request.delete<T>(url, config))
}

// 分页Hook
interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  total?: number
}

interface UsePaginationReturn {
  current: number
  pageSize: number
  total: number
  setCurrent: (page: number) => void
  setPageSize: (size: number) => void
  setTotal: (total: number) => void
  onChange: (page: number, size?: number) => void
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, initialPageSize = 10, total: initialTotal = 0 } = options

  const [current, setCurrent] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(initialTotal)

  const onChange = useCallback((page: number, size?: number) => {
    setCurrent(page)
    if (size && size !== pageSize) {
      setPageSize(size)
    }
  }, [pageSize])

  return {
    current,
    pageSize,
    total,
    setCurrent,
    setPageSize,
    setTotal,
    onChange,
  }
}

// 表单Hook
interface UseFormOptions<T> {
  initialValues?: Partial<T>
  onSubmit?: (values: T) => void | Promise<void>
  validate?: (values: T) => Record<string, string> | null
}

interface UseFormReturn<T> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  setValue: (field: keyof T, value: any) => void
  setValues: (values: Partial<T>) => void
  setError: (field: keyof T, error: string) => void
  setTouched: (field: keyof T, touched: boolean) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
}

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T> = {}
): UseFormReturn<T> {
  const { initialValues = {} as T, onSubmit, validate } = options

  const [values, setValues] = useState<T>(initialValues as T)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    // 清除该字段的错误
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }, [errors])

  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }))
  }, [])

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }))
  }, [])

  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [field as string]: isTouched }))
  }, [])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setIsSubmitting(true)

    // 验证表单
    if (validate) {
      const validationErrors = validate(values)
      if (validationErrors) {
        setErrors(validationErrors)
        setIsSubmitting(false)
        return
      }
    }

    try {
      if (onSubmit) {
        await onSubmit(values)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues as T)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setValues: setFormValues,
    setError,
    setTouched: setFieldTouched,
    handleSubmit,
    reset,
  }
}

// 复制到剪贴板Hook
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
      setIsCopied(false)
    }
  }, [])

  return [isCopied, copyToClipboard]
}

// 窗口大小Hook
interface WindowSize {
  width: number | undefined
  height: number | undefined
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      handleResize()

      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return windowSize
}

// 媒体查询Hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query)
      if (media.matches !== matches) {
        setMatches(media.matches)
      }

      const listener = () => setMatches(media.matches)
      media.addEventListener('change', listener)

      return () => media.removeEventListener('change', listener)
    }
  }, [matches, query])

  return matches
}

// 点击外部Hook
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void
): React.RefObject<T> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handler])

  return ref as React.RefObject<T>
}

// 键盘快捷键Hook
export function useKeyPress(targetKey: string, handler: () => void): void {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [targetKey, handler])
}

// 组合键Hook
export function useKeyCombo(
  keys: string[],
  handler: () => void,
  options: { preventDefault?: boolean } = {}
): void {
  const { preventDefault = true } = options

  useEffect(() => {
    const pressedKeys = new Set<string>()

    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.add(event.key)

      const allKeysPressed = keys.every(key => pressedKeys.has(key))
      if (allKeysPressed) {
        if (preventDefault) {
          event.preventDefault()
        }
        handler()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [keys, handler, preventDefault])
}
