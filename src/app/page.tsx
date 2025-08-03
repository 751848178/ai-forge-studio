'use client'

import { Layout, Card, Row, Col, Statistic, Button, Typography, Space } from 'antd'
import { 
  ProjectOutlined, 
  FileTextOutlined, 
  CodeOutlined, 
  PlusOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useAppStore } from '@/store'
import { useEffect } from 'react'

const { Header, Content } = Layout
const { Title, Paragraph } = Typography

export default function Home() {
  const { 
    projects, 
    requirements, 
    modules, 
    tasks,
    user,
    setUser 
  } = useAppStore()

  // 模拟用户登录（实际项目中应该使用真实的认证）
  useEffect(() => {
    if (!user) {
      setUser({
        id: 'demo-user-1',
        email: 'demo@example.com',
        name: '演示用户',
      })
    }
  }, [user, setUser])

  // 统计数据
  const stats = {
    totalProjects: projects.length,
    totalRequirements: requirements.length,
    totalModules: modules.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
  }

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-4">
            <RobotOutlined className="text-2xl text-blue-600" />
            <Title level={3} className="!mb-0 !text-gray-800">
              AI需求分析平台
            </Title>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">欢迎，{user?.name || '用户'}</span>
          </div>
        </div>
      </Header>

      <Content className="p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* 欢迎区域 */}
          <div className="mb-8">
            <Title level={2}>仪表板</Title>
            <Paragraph className="text-gray-600 text-lg">
              使用AI智能分析需求文档，自动拆解功能模块，生成开发任务和代码
            </Paragraph>
          </div>

          {/* 统计卡片 */}
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="项目总数"
                  value={stats.totalProjects}
                  prefix={<ProjectOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="需求文档"
                  value={stats.totalRequirements}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="功能模块"
                  value={stats.totalModules}
                  prefix={<CodeOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="开发任务"
                  value={stats.totalTasks}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 任务进度 */}
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} lg={12}>
              <Card title="任务进度" extra={<ClockCircleOutlined />}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="已完成"
                      value={stats.completedTasks}
                      suffix={`/ ${stats.totalTasks}`}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="进行中"
                      value={stats.inProgressTasks}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="快速操作">
                <Space direction="vertical" className="w-full">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    size="large"
                    className="w-full"
                    href="/projects/new"
                  >
                    创建新项目
                  </Button>
                  <Button 
                    icon={<FileTextOutlined />} 
                    size="large"
                    className="w-full"
                    href="/requirements/new"
                  >
                    添加需求文档
                  </Button>
                  <Button 
                    icon={<RobotOutlined />} 
                    size="large"
                    className="w-full"
                    href="/analysis"
                  >
                    AI智能分析
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* 功能介绍 */}
          <Card title="平台功能" className="mb-8">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <div className="text-center">
                  <FileTextOutlined className="text-4xl text-blue-600 mb-4" />
                  <Title level={4}>需求分析</Title>
                  <Paragraph className="text-gray-600">
                    上传需求文档，AI自动分析并提取关键功能点，评估复杂度和工时
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-center">
                  <CodeOutlined className="text-4xl text-green-600 mb-4" />
                  <Title level={4}>模块拆解</Title>
                  <Paragraph className="text-gray-600">
                    智能将需求拆解为功能模块，每个模块包含详细的开发任务
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-center">
                  <RobotOutlined className="text-4xl text-purple-600 mb-4" />
                  <Title level={4}>代码生成</Title>
                  <Paragraph className="text-gray-600">
                    为每个原子化任务生成高质量的代码，支持React和Node.js技术栈
                  </Paragraph>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </Content>
    </Layout>
  )
}
