'use client'

import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Button, Typography, Space, Spin } from 'antd'
import { 
  ProjectOutlined, 
  FileTextOutlined, 
  AppstoreOutlined, 
  CheckSquareOutlined,
  PlusOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useApi } from '@/lib/hooks/useApi'
import { request } from '@/lib/utils/request'
import MainLayout from '@/components/layout/MainLayout'

const { Title, Paragraph } = Typography

interface DashboardStats {
  projects: number
  requirements: number
  modules: number
  tasks: number
}

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    requirements: 0,
    modules: 0,
    tasks: 0
  })
  const [loading, setLoading] = useState(true)

  // 如果未认证，跳转到登录页
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return

      try {
        setLoading(true)
        
        // 使用我们的请求工具类并行获取各种统计数据
        const [projects, requirements, modules, tasks] = await Promise.all([
          request.get('/projects?limit=1', { showError: false }),
          request.get('/requirements?limit=1', { showError: false }),
          request.get('/modules?limit=1', { showError: false }),
          request.get('/tasks?limit=1', { showError: false })
        ])

        setStats({
          projects: (projects.data as any)?.pagination?.total || 0,
          requirements: (requirements.data as any)?.pagination?.total || 0,
          modules: (modules.data as any)?.pagination?.total || 0,
          tasks: (tasks.data as any)?.pagination?.total || 0,
        })
      } catch (error) {
        console.error('获取统计数据失败:', error)
        // 如果获取统计数据失败，设置为0
        setStats({
          projects: 0,
          requirements: 0,
          modules: 0,
          tasks: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isAuthenticated, user])

  // 如果正在加载认证状态，显示加载中
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    )
  }

  // 如果未认证，不渲染内容（会跳转到登录页）
  if (!isAuthenticated) {
    return null
  }

  const quickActions = [
    {
      title: '创建项目',
      description: '开始一个新的项目',
      icon: <ProjectOutlined />,
      action: () => router.push('/projects/new'),
      color: '#1890ff'
    },
    {
      title: '添加需求',
      description: '记录新的需求文档',
      icon: <FileTextOutlined />,
      action: () => router.push('/requirements/new'),
      color: '#52c41a'
    },
    {
      title: '查看模块',
      description: '管理功能模块',
      icon: <AppstoreOutlined />,
      action: () => router.push('/modules'),
      color: '#faad14'
    },
    {
      title: '处理任务',
      description: '查看开发任务',
      icon: <CheckSquareOutlined />,
      action: () => router.push('/tasks'),
      color: '#f5222d'
    }
  ]

  return (
    <MainLayout>
      <div>
        {/* 欢迎区域 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            欢迎回来，{user?.name || user?.email}！
          </Title>
          <Paragraph type="secondary">
            这里是您的AI需求分析平台工作台，您可以管理项目、需求、模块和开发任务。
          </Paragraph>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="项目总数"
                value={stats.projects}
                prefix={<ProjectOutlined />}
                loading={loading}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="需求总数"
                value={stats.requirements}
                prefix={<FileTextOutlined />}
                loading={loading}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="功能模块"
                value={stats.modules}
                prefix={<AppstoreOutlined />}
                loading={loading}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="开发任务"
                value={stats.tasks}
                prefix={<CheckSquareOutlined />}
                loading={loading}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 快速操作 */}
        <Card title="快速操作" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card
                  hoverable
                  onClick={action.action}
                  style={{ 
                    textAlign: 'center',
                    borderColor: action.color,
                    cursor: 'pointer'
                  }}
                  styles={{ body: { padding: '24px 16px' } }}
                >
                  <div style={{ 
                    fontSize: '32px', 
                    color: action.color, 
                    marginBottom: 12 
                  }}>
                    {action.icon}
                  </div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {action.title}
                  </Title>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {action.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 最近活动 */}
        <Card title="最近活动" extra={
          <Button type="link" icon={<RightOutlined />}>
            查看全部
          </Button>
        }>
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 0',
            color: '#999'
          }}>
            暂无最近活动
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
