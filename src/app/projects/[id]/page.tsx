'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Layout, 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Statistic,
  Row,
  Col,
  Descriptions,
  Progress,
  App
} from 'antd'
import { 
  ProjectOutlined, 
  FileTextOutlined, 
  CodeOutlined, 
  PlusOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BugOutlined
} from '@ant-design/icons'
import { useAppStore, Project, Requirement, Module, Task } from '@/store'
import { request } from '@/lib/utils/request'
import Link from 'next/link'

const { Header, Content } = Layout
const { Title, Paragraph } = Typography

const statusColors = {
  PLANNING: 'blue',
  IN_PROGRESS: 'orange',
  TESTING: 'purple',
  COMPLETED: 'green',
  ARCHIVED: 'gray'
}

const statusLabels = {
  PLANNING: '规划中',
  IN_PROGRESS: '进行中',
  TESTING: '测试中',
  COMPLETED: '已完成',
  ARCHIVED: '已归档'
}

function ProjectDetailContent() {
  const params = useParams()
  const projectId = params.id as string
  const { message } = App.useApp()
  
  const { 
    currentProject,
    setCurrentProject,
    requirements,
    setRequirements,
    modules,
    setModules,
    tasks,
    setTasks,
    loading,
    setLoading 
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (projectId && projectId !== 'new') {
      loadProjectDetail()
    } else if (projectId === 'new') {
      // 如果是新建项目页面，设置一个默认的项目对象
      setCurrentProject({
        id: 'new',
        name: '新建项目',
        description: '',
        status: 'PLANNING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: '',
        requirements: [],
        modules: []
      } as any)
    }
  }, [projectId])

  const loadProjectDetail = async () => {
    setLoading(true)
    try {
      const response = await request.get<any>(`/projects/${projectId}`)
      if (response.success && response.data) {
        const project = response.data
        setCurrentProject(project)
        setRequirements(project.requirements || [])
        setModules(project.modules || [])
        
        // 获取所有任务
        const allTasks: Task[] = []
        if (project.modules) {
          project.modules.forEach((module: Module) => {
            if (module.tasks) {
              allTasks.push(...module.tasks)
            }
          })
        }
        setTasks(allTasks)
      } else {
        message.error(response.error?.message || '加载项目详情失败')
      }
    } catch (error) {
      console.error('Error loading project detail:', error)
      message.error('加载项目详情失败')
    } finally {
      setLoading(false)
    }
  }

  if (!currentProject) {
    return (
      <Layout className="min-h-screen">
        <Content className="p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Card loading={loading}>
              <div className="text-center py-8">
                <Title level={4}>加载中...</Title>
              </div>
            </Card>
          </div>
        </Content>
      </Layout>
    )
  }

  // 统计数据
  const stats = {
    totalRequirements: requirements.length,
    analyzedRequirements: requirements.filter(r => r.status === 'ANALYZED').length,
    totalModules: modules.length,
    completedModules: modules.filter(m => m.status === 'COMPLETED').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
  }

  const requirementColumns = [
    {
      title: '需求标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Requirement) => (
        <Link href={`/requirements/${record.id}`} className="text-blue-600 hover:text-blue-800">
          {text}
        </Link>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors = {
          FUNCTIONAL: 'blue',
          NON_FUNCTIONAL: 'orange',
          BUSINESS: 'green',
          TECHNICAL: 'purple'
        }
        const labels = {
          FUNCTIONAL: '功能需求',
          NON_FUNCTIONAL: '非功能需求',
          BUSINESS: '业务需求',
          TECHNICAL: '技术需求'
        }
        return <Tag color={colors[type as keyof typeof colors]}>{labels[type as keyof typeof labels]}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          PENDING: 'default',
          ANALYZING: 'processing',
          ANALYZED: 'success',
          APPROVED: 'green',
          REJECTED: 'red'
        }
        const labels = {
          PENDING: '待处理',
          ANALYZING: '分析中',
          ANALYZED: '已分析',
          APPROVED: '已批准',
          REJECTED: '已拒绝'
        }
        return <Tag color={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN')
    }
  ]

  const moduleColumns = [
    {
      title: '模块名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors = {
          FEATURE: 'blue',
          COMPONENT: 'green',
          SERVICE: 'orange',
          UTILITY: 'purple',
          INTEGRATION: 'cyan'
        }
        const labels = {
          FEATURE: '功能',
          COMPONENT: '组件',
          SERVICE: '服务',
          UTILITY: '工具',
          INTEGRATION: '集成'
        }
        return <Tag color={colors[type as keyof typeof colors]}>{labels[type as keyof typeof labels]}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          TODO: 'default',
          IN_PROGRESS: 'processing',
          TESTING: 'warning',
          COMPLETED: 'success',
          BLOCKED: 'error'
        }
        const labels = {
          TODO: '待开始',
          IN_PROGRESS: '进行中',
          TESTING: '测试中',
          COMPLETED: '已完成',
          BLOCKED: '阻塞'
        }
        return <Tag color={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Tag>
      }
    },
    {
      title: '任务数',
      key: 'taskCount',
      render: (text: any, record: Module) => record?.tasks?.length || 0
    }
  ]

  const tabItems = [
    {
      key: 'overview',
      label: '项目概览',
      children: (
        <>
          {/* 项目信息 */}
          <Card className="mb-6">
            <Descriptions title="项目信息" bordered>
              <Descriptions.Item label="项目名称">{currentProject.name}</Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Tag color={statusColors[currentProject.status as keyof typeof statusColors]}>
                  {statusLabels[currentProject.status as keyof typeof statusLabels]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(currentProject.createdAt).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="项目描述" span={3}>
                {currentProject.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 统计数据 */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="需求文档"
                  value={stats.totalRequirements}
                  prefix={<FileTextOutlined />}
                  suffix={`/ ${stats.analyzedRequirements} 已分析`}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="功能模块"
                  value={stats.totalModules}
                  prefix={<CodeOutlined />}
                  suffix={`/ ${stats.completedModules} 已完成`}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="开发任务"
                  value={stats.totalTasks}
                  prefix={<CheckCircleOutlined />}
                  suffix={`/ ${stats.completedTasks} 已完成`}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="进行中任务"
                  value={stats.inProgressTasks}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 进度条 */}
          <Card title="项目进度" className="mb-6">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div className="text-center">
                  <Title level={5}>需求分析进度</Title>
                  <Progress 
                    type="circle" 
                    percent={stats.totalRequirements > 0 ? Math.round((stats.analyzedRequirements / stats.totalRequirements) * 100) : 0}
                    format={() => `${stats.analyzedRequirements}/${stats.totalRequirements}`}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <Title level={5}>模块开发进度</Title>
                  <Progress 
                    type="circle" 
                    percent={stats.totalModules > 0 ? Math.round((stats.completedModules / stats.totalModules) * 100) : 0}
                    format={() => `${stats.completedModules}/${stats.totalModules}`}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <Title level={5}>任务完成进度</Title>
                  <Progress 
                    type="circle" 
                    percent={stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}
                    format={() => `${stats.completedTasks}/${stats.totalTasks}`}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </>
      )
    },
    {
      key: 'requirements',
      label: '需求文档',
      children: (
        <Card>
          <Table
            columns={requirementColumns}
            dataSource={requirements}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个需求`
            }}
          />
        </Card>
      )
    },
    {
      key: 'modules',
      label: '功能模块',
      children: (
        <Card>
          <Table
            columns={moduleColumns}
            dataSource={modules}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个模块`
            }}
          />
        </Card>
      )
    }
  ]

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-4">
            <ProjectOutlined className="text-2xl text-blue-600" />
            <div>
              <Title level={3} className="!mb-0 !text-gray-800">
                {currentProject.name}
              </Title>
              <Tag color={statusColors[currentProject.status as keyof typeof statusColors]}>
                {statusLabels[currentProject.status as keyof typeof statusLabels]}
              </Tag>
            </div>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              href={`/requirements/new?projectId=${projectId}`}
            >
              添加需求
            </Button>
          </Space>
        </div>
      </Header>

      <Content className="p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={tabItems}
          />
        </div>
      </Content>
    </Layout>
  )
}

export default function ProjectDetailPage() {
  return (
    <App>
      <ProjectDetailContent />
    </App>
  )
}
