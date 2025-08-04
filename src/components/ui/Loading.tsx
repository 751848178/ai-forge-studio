import React from 'react'
import { Spin, SpinProps } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

// 加载组件的属性接口
export interface LoadingProps extends Omit<SpinProps, 'indicator'> {
  /** 加载文本 */
  text?: string
  /** 是否显示加载图标 */
  showIcon?: boolean
  /** 自定义图标 */
  icon?: React.ReactNode
  /** 加载状态的类型 */
  type?: 'default' | 'overlay' | 'inline' | 'page'
  /** 最小高度 */
  minHeight?: number | string
}

// 默认加载图标
const defaultIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />

/**
 * 通用加载组件
 * 支持多种加载状态展示方式
 */
export const Loading: React.FC<LoadingProps> = ({
  text = '加载中...',
  showIcon = true,
  icon,
  type = 'default',
  minHeight,
  className = '',
  style = {},
  ...props
}) => {
  // 根据类型设置样式
  const getTypeStyles = () => {
    const baseStyle: React.CSSProperties = {
      minHeight,
      ...style,
    }

    switch (type) {
      case 'overlay':
        return {
          ...baseStyle,
          position: 'fixed' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }
      case 'page':
        return {
          ...baseStyle,
          minHeight: minHeight || '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }
      case 'inline':
        return {
          ...baseStyle,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }
      default:
        return {
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }
    }
  }

  const typeStyles = getTypeStyles()
  const typeClassName = `loading-${type} ${className}`.trim()

  return (
    <div className={typeClassName} style={typeStyles}>
      <Spin
        indicator={showIcon ? (icon || defaultIcon) as any : undefined}
        tip={text}
        {...props}
      />
    </div>
  )
}

// 页面级加载组件
export const PageLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="page" {...props} />
)

// 覆盖层加载组件
export const OverlayLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="overlay" {...props} />
)

// 内联加载组件
export const InlineLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="inline" {...props} />
)

// 按钮加载状态组件
interface ButtonLoadingProps {
  loading?: boolean
  children: React.ReactNode
  icon?: React.ReactNode
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading = false,
  children,
  icon,
}) => {
  if (loading) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <LoadingOutlined />
        {children}
      </span>
    )
  }

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {icon}
      {children}
    </span>
  )
}

export default Loading
