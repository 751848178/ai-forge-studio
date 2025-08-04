import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result, Button } from 'antd'
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons'

// 错误边界的属性接口
export interface ErrorBoundaryProps {
  children: ReactNode
  /** 自定义错误页面 */
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode
  /** 错误回调函数 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** 是否显示错误详情 */
  showErrorDetails?: boolean
  /** 自定义错误标题 */
  title?: string
  /** 自定义错误描述 */
  description?: string
}

// 错误边界的状态接口
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * 错误边界组件
 * 用于捕获和处理React组件树中的JavaScript错误
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  // 捕获错误并更新状态
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  // 捕获错误信息
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 在开发环境下打印错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  // 重置错误状态
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  // 刷新页面
  handleReload = () => {
    window.location.reload()
  }

  // 返回首页
  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const {
      children,
      fallback,
      showErrorDetails = false,
      title = '页面出现错误',
      description = '抱歉，页面遇到了一些问题。请尝试刷新页面或联系技术支持。',
    } = this.props

    if (hasError && error) {
      // 如果提供了自定义错误页面，使用它
      if (fallback) {
        return fallback(error, errorInfo!)
      }

      // 默认错误页面
      return (
        <div className="error-boundary" style={{ padding: '50px 20px' }}>
          <Result
            status="error"
            title={title}
            subTitle={description}
            extra={[
              <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={this.handleReset}>
                重试
              </Button>,
              <Button key="reload" icon={<ReloadOutlined />} onClick={this.handleReload}>
                刷新页面
              </Button>,
              <Button key="home" icon={<HomeOutlined />} onClick={this.handleGoHome}>
                返回首页
              </Button>,
            ]}
          >
            {showErrorDetails && (
              <div className="error-details" style={{ marginTop: '20px' }}>
                <details style={{ textAlign: 'left' }}>
                  <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                    查看错误详情
                  </summary>
                  <div style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '15px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>错误信息:</strong>
                      <br />
                      {error.message}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>错误堆栈:</strong>
                      <br />
                      {error.stack}
                    </div>
                    {errorInfo && (
                      <div>
                        <strong>组件堆栈:</strong>
                        <br />
                        {errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
          </Result>
        </div>
      )
    }

    return children
  }
}

// 简化的错误边界Hook版本
interface UseErrorBoundaryReturn {
  resetError: () => void
  captureError: (error: Error) => void
}

/**
 * 错误边界Hook
 * 用于在函数组件中处理错误
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { resetError, captureError }
}

// 高阶组件版本的错误边界
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// 异步错误处理器
export class AsyncErrorHandler {
  private static errorHandlers: Array<(error: Error) => void> = []

  // 添加错误处理器
  static addErrorHandler(handler: (error: Error) => void) {
    this.errorHandlers.push(handler)
  }

  // 移除错误处理器
  static removeErrorHandler(handler: (error: Error) => void) {
    const index = this.errorHandlers.indexOf(handler)
    if (index > -1) {
      this.errorHandlers.splice(index, 1)
    }
  }

  // 处理异步错误
  static handleAsyncError(error: Error) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error)
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError)
      }
    })

    // 如果没有处理器，抛出错误
    if (this.errorHandlers.length === 0) {
      console.error('Unhandled async error:', error)
    }
  }
}

// 全局错误处理设置
export function setupGlobalErrorHandling() {
  // 处理未捕获的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    AsyncErrorHandler.handleAsyncError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    )
    event.preventDefault()
  })

  // 处理全局JavaScript错误
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    AsyncErrorHandler.handleAsyncError(
      event.error instanceof Error ? event.error : new Error(event.message)
    )
  })
}

export default ErrorBoundary
