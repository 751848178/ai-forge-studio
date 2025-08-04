'use client'

import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Space, Typography } from 'antd'
import { 
  ProjectOutlined, 
  FileTextOutlined, 
  AppstoreOutlined, 
  CheckSquareOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FolderOutlined
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

const { Header, Sider, Content } = Layout
const { Title } = Typography

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '概览',
    },
    {
      key: '/projects',
      icon: <FolderOutlined />,
      label: '项目管理',
    },
    {
      key: '/requirements',
      icon: <FileTextOutlined />,
      label: '需求管理',
    },
    {
      key: '/modules',
      icon: <AppstoreOutlined />,
      label: '功能模块',
    },
    {
      key: '/tasks',
      icon: <CheckSquareOutlined />,
      label: '开发任务',
    },
  ]

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        router.push('/login')
      },
    },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key)
  }

  // 防止hydration不匹配，在客户端挂载前不渲染
  if (!mounted) {
    return null
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'AI' : 'AI需求分析'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px 0 rgba(29,35,41,.05)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space>
            {user && (
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  <span>{user.name || user.email}</span>
                </Space>
              </Dropdown>
            )}
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '24px', 
          padding: '24px', 
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
