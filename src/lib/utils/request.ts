// 注意：message 将通过参数传入，不再直接导入

// 请求配置接口
export interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  showError?: boolean
  showLoading?: boolean
}

// 标准API响应格式
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

// 请求错误类
export class RequestError extends Error {
  code: string
  status?: number
  details?: any

  constructor(message: string, code: string, status?: number, details?: any) {
    super(message)
    this.name = 'RequestError'
    this.code = code
    this.status = status
    this.details = details
  }
}

// 默认配置
const DEFAULT_CONFIG: RequestConfig = {
  timeout: 10000,
  retries: 3,
  showError: true,
  showLoading: false,
}

// 请求拦截器类型
type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>
type ResponseInterceptor = (response: Response) => Response | Promise<Response>
type ErrorInterceptor = (error: Error) => Error | Promise<Error>

// API客户端类
export class ApiClient {
  private baseURL: string
  private defaultConfig: RequestConfig
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private errorInterceptors: ErrorInterceptor[] = []

  constructor(baseURL: string = '', defaultConfig: Partial<RequestConfig> = {}) {
    this.baseURL = baseURL
    this.defaultConfig = { ...DEFAULT_CONFIG, ...defaultConfig }
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor)
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor)
  }

  // 添加错误拦截器
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor)
  }

  // 构建完整URL
  private buildURL(url: string): string {
    if (url.startsWith('http')) {
      return url
    }
    return `${this.baseURL}${url.startsWith('/') ? url : `/${url}`}`
  }

  // 处理请求配置
  private async processRequestConfig(
    url: string,
    options: RequestInit,
    config: RequestConfig
  ): Promise<RequestInit> {
    let processedOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
        ...(config.headers || {}),
      },
    }

    // 应用请求拦截器
    for (const interceptor of this.requestInterceptors) {
      processedOptions = await interceptor(processedOptions)
    }

    return processedOptions
  }

  // 处理响应
  private async processResponse(response: Response): Promise<Response> {
    let processedResponse = response

    // 应用响应拦截器
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse)
    }

    return processedResponse
  }

  // 处理错误
  private async processError(error: Error): Promise<Error> {
    let processedError = error

    // 应用错误拦截器
    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError)
    }

    return processedError
  }

  // 核心请求方法
  private async request<T>(
    url: string,
    options: RequestInit = {},
    config: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    const mergedConfig = { ...this.defaultConfig, ...config }
    const fullURL = this.buildURL(url)

    let attempt = 0
    const maxAttempts = mergedConfig.retries! + 1

    while (attempt < maxAttempts) {
      try {
        // 显示加载状态
        if (mergedConfig.showLoading && attempt === 0) {
          console.log('请求处理中...')
        }

        // 处理请求配置
        const processedOptions = await this.processRequestConfig(
          fullURL,
          options,
          mergedConfig
        )

        // 设置超时
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, mergedConfig.timeout)

        // 发送请求
        const response = await fetch(fullURL, {
          ...processedOptions,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // 处理响应
        const processedResponse = await this.processResponse(response)

        // 隐藏加载状态
        if (mergedConfig.showLoading) {
          console.log('请求完成')
        }

        // 检查响应状态
        if (!processedResponse.ok) {
          const errorText = await processedResponse.text()
          let errorData: any
          
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }

          throw new RequestError(
            errorData.error?.message || errorData.message || `HTTP ${processedResponse.status}`,
            errorData.error?.code || 'HTTP_ERROR',
            processedResponse.status,
            errorData
          )
        }

        // 解析响应数据
        const responseText = await processedResponse.text()
        let responseData: ApiResponse<T>

        try {
          responseData = JSON.parse(responseText)
        } catch {
          // 如果不是JSON格式，包装为标准格式
          responseData = {
            success: true,
            data: responseText as any,
          }
        }

        return responseData

      } catch (error) {
        attempt++

        // 隐藏加载状态
        if (mergedConfig.showLoading) {
          console.log('请求失败')
        }

        // 处理错误
        const processedError = await this.processError(error as Error)

        // 如果是最后一次尝试或者不是网络错误，抛出错误
        if (attempt >= maxAttempts || !(processedError instanceof TypeError)) {
          // 显示错误信息
          if (mergedConfig.showError) {
            const errorMessage = processedError instanceof RequestError 
              ? processedError.message 
              : '请求失败，请稍后重试'
            console.error('请求错误:', errorMessage)
          }

          throw processedError
        }

        // 重试前等待
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }

    throw new Error('请求失败')
  }

  // GET请求
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' }, config)
  }

  // POST请求
  async post<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      url,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    )
  }

  // PUT请求
  async put<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      url,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    )
  }

  // DELETE请求
  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' }, config)
  }

  // PATCH请求
  async patch<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      url,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    )
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient('/api')

// 添加默认的租户拦截器
apiClient.addRequestInterceptor((config) => {
  // 从localStorage获取用户信息，提取租户ID
  const userStr = localStorage.getItem('auth-user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user.tenantId) {
        config.headers = {
          ...config.headers,
          'x-tenant-id': user.tenantId,
        }
      }
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
  return config
})

// 添加认证拦截器
apiClient.addRequestInterceptor((config) => {
  // 从localStorage获取认证token（与useAuth hook保持一致）
  const token = localStorage.getItem('auth-token')
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    }
  }
  return config
})

// 添加错误处理拦截器
apiClient.addErrorInterceptor((error) => {
  if (error instanceof RequestError) {
    // 处理特定错误码
    switch (error.code) {
      case 'UNAUTHORIZED':
        // 清除认证信息并跳转到登录页
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
        localStorage.removeItem('refresh-token')
        window.location.href = '/login'
        break
      case 'FORBIDDEN':
        console.error('权限不足')
        break
      case 'TENANT_NOT_FOUND':
        console.error('租户不存在')
        break
      default:
        break
    }
  }
  return error
})

// 导出便捷方法
export const request = {
  get: <T>(url: string, config?: RequestConfig) => apiClient.get<T>(url, config),
  post: <T>(url: string, data?: any, config?: RequestConfig) => 
    apiClient.post<T>(url, data, config),
  put: <T>(url: string, data?: any, config?: RequestConfig) => 
    apiClient.put<T>(url, data, config),
  delete: <T>(url: string, config?: RequestConfig) => 
    apiClient.delete<T>(url, config),
  patch: <T>(url: string, data?: any, config?: RequestConfig) => 
    apiClient.patch<T>(url, data, config),
}

export default request
