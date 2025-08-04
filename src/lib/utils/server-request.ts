import { NextRequest } from 'next/server'

// 服务端请求配置接口
export interface ServerRequestConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  retries?: number
  retryDelay?: number
}

// 服务端请求响应接口
export interface ServerResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  status: number
  headers: Record<string, string>
}

/**
 * 服务端HTTP请求工具类
 * 用于在API路由中发起HTTP请求
 */
export class ServerRequest {
  private config: Required<ServerRequestConfig>

  constructor(config: ServerRequestConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Platform-Server/1.0',
        ...config.headers,
      },
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    }
  }

  /**
   * 执行HTTP请求
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options: Partial<ServerRequestConfig> = {}
  ): Promise<ServerResponse<T>> {
    const fullUrl = this.config.baseURL + url
    const headers = { ...this.config.headers, ...options.headers }
    const timeout = options.timeout || this.config.timeout
    const retries = options.retries ?? this.config.retries

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const requestInit: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        }

        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
          requestInit.body = JSON.stringify(data)
        }

        const response = await fetch(fullUrl, requestInit)
        clearTimeout(timeoutId)

        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        let responseData: any
        const contentType = response.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          responseData = await response.json()
        } else {
          responseData = await response.text()
        }

        if (response.ok) {
          return {
            success: true,
            data: responseData,
            status: response.status,
            headers: responseHeaders,
          }
        } else {
          return {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: responseData?.message || response.statusText || '请求失败',
              details: responseData,
            },
            status: response.status,
            headers: responseHeaders,
          }
        }
      } catch (error) {
        lastError = error as Error
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt === retries) {
          break
        }

        // 等待重试延迟
        if (this.config.retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || '请求失败',
        details: lastError,
      },
      status: 0,
      headers: {},
    }
  }

  /**
   * GET请求
   */
  async get<T>(url: string, options?: Partial<ServerRequestConfig>): Promise<ServerResponse<T>> {
    return this.request<T>('GET', url, undefined, options)
  }

  /**
   * POST请求
   */
  async post<T>(url: string, data?: any, options?: Partial<ServerRequestConfig>): Promise<ServerResponse<T>> {
    return this.request<T>('POST', url, data, options)
  }

  /**
   * PUT请求
   */
  async put<T>(url: string, data?: any, options?: Partial<ServerRequestConfig>): Promise<ServerResponse<T>> {
    return this.request<T>('PUT', url, data, options)
  }

  /**
   * PATCH请求
   */
  async patch<T>(url: string, data?: any, options?: Partial<ServerRequestConfig>): Promise<ServerResponse<T>> {
    return this.request<T>('PATCH', url, data, options)
  }

  /**
   * DELETE请求
   */
  async delete<T>(url: string, options?: Partial<ServerRequestConfig>): Promise<ServerResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options)
  }

  /**
   * 设置认证头
   */
  setAuthToken(token: string): void {
    this.config.headers['Authorization'] = `Bearer ${token}`
  }

  /**
   * 设置租户ID
   */
  setTenantId(tenantId: string): void {
    this.config.headers['X-Tenant-ID'] = tenantId
  }

  /**
   * 从NextRequest创建带认证的请求实例
   */
  static fromRequest(request: NextRequest, config?: ServerRequestConfig): ServerRequest {
    const instance = new ServerRequest(config)
    
    // 复制认证头
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      instance.config.headers['Authorization'] = authHeader
    }

    // 复制租户ID
    const tenantId = request.headers.get('x-tenant-id')
    if (tenantId) {
      instance.config.headers['X-Tenant-ID'] = tenantId
    }

    // 复制其他相关头
    const userAgent = request.headers.get('user-agent')
    if (userAgent) {
      instance.config.headers['User-Agent'] = userAgent
    }

    return instance
  }
}

// 创建默认实例
export const serverRequest = new ServerRequest()

// 便捷方法
export const serverGet = <T>(url: string, options?: Partial<ServerRequestConfig>) => 
  serverRequest.get<T>(url, options)

export const serverPost = <T>(url: string, data?: any, options?: Partial<ServerRequestConfig>) => 
  serverRequest.post<T>(url, data, options)

export const serverPut = <T>(url: string, data?: any, options?: Partial<ServerRequestConfig>) => 
  serverRequest.put<T>(url, data, options)

export const serverPatch = <T>(url: string, data?: any, options?: Partial<ServerRequestConfig>) => 
  serverRequest.patch<T>(url, data, options)

export const serverDelete = <T>(url: string, options?: Partial<ServerRequestConfig>) => 
  serverRequest.delete<T>(url, options)

export default ServerRequest
