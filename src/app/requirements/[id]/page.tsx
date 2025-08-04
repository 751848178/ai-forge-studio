'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { request } from '@/lib/utils/request'
import { 
  Layout, 
  Card, 
  Tabs, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Descriptions,
  Row,
  Col,
  Timeline,
  List,
  Progress,
  Divider,
  App
} from 'antd'
import { 
  FileTextOutlined, 
  RobotOutlined, 
  CodeOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  BugOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useAppStore, Requirement, RequirementAnalysis, Module, Task } from '@/store'
import Link from 'next/link'

const { Header, Content } = Layout
const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

const statusColors = {
  PENDING: 'default',
  ANALYZING: 'processing',
  ANALYZED: 'success',
  APPROVED: 'green',
  REJECTED: 'red'
}

const statusLabels = {
  PENDING: '待处理',
  ANALYZING: '分析中',
  ANALYZED: '已分析',
  APPROVED: '已批准',
  REJECTED: '已拒绝'
}

const typeColors = {
  FUNCTIONAL: 'blue',
  NON_FUNCTIONAL: 'orange',
  BUSINESS: 'green',
  TECHNICAL: 'purple'
}

const typeLabels = {
  FUNCTIONAL: '功能需求',
  NON_FUNCTIONAL: '非功能需求',
  BUSINESS: '业务需求',
  TECHNICAL: '技术需求'
}

const priorityColors = {
  LOW: 'default',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red'
}

const priorityLabels = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急'
}

function RequirementDetailContent() {
  const params = useParams()
  const requirementId = params.id as string
  const { message } = App.useApp()
  
  const { 
    currentRequirement,
    setCurrentRequirement,
    modules,
    setModules,
    tasks,
    setTasks,
    loading,
    setLoading 
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (requirementId) {
      loadRequirementDetail()
    }
  }, [requirementId])

  const loadRequirementDetail = async () => {
    setLoading(true)
    try {
      const result = await request.get<Requirement>(`/requirements/${requirementId}`)
      if (result.success && result.data) {
        const requirement = result.data as any
        setCurrentRequirement(requirement)
        
        // 如果有分析结果，加载相关的模块和任务
        if (requirement.analysis && requirement.project) {
          const projectModules = requirement.project.modules || []
          setModules(projectModules)
          
          // 获取所有任务
          const allTasks: Task[] = []
          projectModules.forEach((module: Module) => {
            if (module.tasks) {
              allTasks.push(...module.tasks)
            }
          })
          setTasks(allTasks)
        }
      } else {
        message.error('加载需求详情失败')
      }
    } catch (error) {
      console.error('Error loading requirement detail:', error)
      message.error('加载需求详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeRequirement = async () => {
    if (!currentRequirement) return
    
    setLoading(true)
    try {
      // 更新本地状态
      setCurrentRequirement({
        ...currentRequirement,
        status: 'ANALYZING'
      } as Requirement)
      
      const result = await request.post(`/requirements/${requirementId}/analyze`)
      
      if (result.success && result.data) {
        const data = result.data as any
        setCurrentRequirement(data.requirement)
        setModules(data.modules || [])
        message.success('需求分析完成')
        
        // 重新加载详情以获取最新数据
        loadRequirementDetail()
      } else {
        message.error(result.error?.message || 'AI分析失败')
        setCurrentRequirement({
          ...currentRequirement,
          status: 'PENDING'
        })
      }
    } catch (error) {
      console.error('Error analyzing requirement:', error)
      message.error('AI分析失败')
      setCurrentRequirement({
        ...currentRequirement,
        status: 'PENDING'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!currentRequirement) {
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

  const analysis = currentRequirement.analysis as RequirementAnalysis | null

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-4">
            <Link href="/requirements">
              <Button icon={<ArrowLeftOutlined />} type="text">
                返回需求列表
              </Button>
            </Link>
            <FileTextOutlined className="text-2xl text-blue-600" />
            <div>
              <Title level={3} className="!mb-0 !text-gray-800">
                {currentRequirement.title}
              </Title>
              <Space>
                <Tag color={statusColors[currentRequirement.status as keyof typeof statusColors]}>
                  {statusLabels[currentRequirement.status as keyof typeof statusLabels]}
                </Tag>
                <Tag color={typeColors[currentRequirement.type as keyof typeof typeColors]}>
                  {typeLabels[currentRequirement.type as keyof typeof typeLabels]}
                </Tag>
                <Tag color={priorityColors[currentRequirement.priority as keyof typeof priorityColors]}>
                  {priorityLabels[currentRequirement.priority as keyof typeof priorityLabels]}
                </Tag>
              </Space>
            </div>
          </div>
          <Space>
            {currentRequirement.status === 'PENDING' && (
              <Button 
                type="primary" 
                icon={<RobotOutlined />}
                onClick={handleAnalyzeRequirement}
                loading={loading}
              >
                AI分析
              </Button>
            )}
          </Space>
        </div>
      </Header>

      <Content className="p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="需求概览" key="overview">
              {/* 需求基本信息 */}
              <Card className="mb-6">
                <Descriptions title="需求信息" bordered>
                  <Descriptions.Item label="需求标题">{currentRequirement.title}</Descriptions.Item>
                  <Descriptions.Item label="所属项目">
                    {currentRequirement.project ? (
                      <Link href={`/projects/${currentRequirement.project.id}`} className="text-blue-600">
                        {currentRequirement.project.name}
                      </Link>
                    ) : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {new Date(currentRequirement.createdAt).toLocaleDateString('zh-CN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="需求内容" span={3}>
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
                      {currentRequirement.content}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* AI分析结果 */}
              {analysis && (
                <Card title="AI分析结果" className="mb-6">
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Title level={5}>需求摘要</Title>
                      <Paragraph>{analysis.summary}</Paragraph>
                    </Col>
                    
                    <Col span={12}>
                      <Title level={5}>关键功能点</Title>
                      <List
                        size="small"
                        dataSource={Array.isArray(analysis.keyFeatures) ? analysis.keyFeatures : []}
                        renderItem={(feature: string) => (
                          <List.Item>
                            <CheckCircleOutlined className="text-green-500 mr-2" />
                            {feature}
                          </List.Item>
                        )}
                      />
                    </Col>
                    
                    <Col span={12}>
                      <Title level={5}>复杂度评估</Title>
                      <div className="space-y-2">
                        <div>
                          <Text strong>复杂度等级: </Text>
                          <Tag color={analysis.complexity === 'HIGH' ? 'red' : analysis.complexity === 'MEDIUM' ? 'orange' : 'green'}>
                            {analysis.complexity === 'HIGH' ? '高' : analysis.complexity === 'MEDIUM' ? '中' : '低'}
                          </Tag>
                        </div>
                        <div>
                          <Text strong>预估工时: </Text>
                          <Text>{analysis.estimatedHours} 小时</Text>
                        </div>
                      </div>
                    </Col>
                    
                    {analysis.suggestions && analysis.suggestions.length > 0 && (
                      <Col span={24}>
                        <Title level={5}>建议和注意事项</Title>
                        <List
                          size="small"
                          dataSource={Array.isArray(analysis.suggestions) ? analysis.suggestions : []}
                          renderItem={(suggestion: string) => (
                            <List.Item>
                              <BugOutlined className="text-orange-500 mr-2" />
                              {suggestion}
                            </List.Item>
                          )}
                        />
                      </Col>
                    )}
                  </Row>
                </Card>
              )}
            </TabPane>

            {analysis && (
              <TabPane tab="功能模块" key="modules">
                <Card>
                  <Row gutter={[16, 16]}>
                    {modules.map((module) => (
                      <Col span={24} key={module.id}>
                        <Card 
                          size="small" 
                          title={
                            <div className="flex items-center justify-between">
                              <span>{module.name}</span>
                              <Space>
                                <Tag color="blue">{module.type}</Tag>
                                <Tag color="orange">{module.estimatedHours}h</Tag>
                              </Space>
                            </div>
                          }
                        >
                          <Paragraph>{module.description}</Paragraph>
                          
                          {module.tasks && module.tasks.length > 0 && (
                            <div>
                              <Divider orientation="left" plain>开发任务</Divider>
                              <List
                                size="small"
                                dataSource={module.tasks}
                                renderItem={(task) => (
                                  <List.Item>
                                    <List.Item.Meta
                                      avatar={<CodeOutlined />}
                                      title={task.title}
                                      description={
                                        <div>
                                          <div>{task.description}</div>
                                          <Space className="mt-2">
                                            <Tag color="purple">{task.type}</Tag>
                                            <Tag color="blue">{task.estimatedHours}h</Tag>
                                            {task.filePath && (
                                              <Tag color="green">{task.filePath}</Tag>
                                            )}
                                          </Space>
                                        </div>
                                      }
                                    />
                                  </List.Item>
                                )}
                              />
                            </div>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </TabPane>
            )}

            <TabPane tab="处理历史" key="history">
              <Card>
                <Timeline>
                  <Timeline.Item 
                    color="blue"
                    dot={<FileTextOutlined />}
                  >
                    <div>
                      <Text strong>需求创建</Text>
                      <br />
                      <Text type="secondary">
                        {new Date(currentRequirement.createdAt).toLocaleString('zh-CN')}
                      </Text>
                    </div>
                  </Timeline.Item>
                  
                  {analysis && (
                    <Timeline.Item 
                      color="green"
                      dot={<RobotOutlined />}
                    >
                      <div>
                        <Text strong>AI分析完成</Text>
                        <br />
                        <Text type="secondary">
                          生成了 {modules.length} 个功能模块，{tasks.length} 个开发任务
                        </Text>
                        <br />
                        <Text type="secondary">
                          {new Date(analysis.createdAt).toLocaleString('zh-CN')}
                        </Text>
                      </div>
                    </Timeline.Item>
                  )}
                  
                  {currentRequirement.status === 'APPROVED' && (
                    <Timeline.Item 
                      color="green"
                      dot={<CheckCircleOutlined />}
                    >
                      <div>
                        <Text strong>需求已批准</Text>
                        <br />
                        <Text type="secondary">可以开始开发</Text>
                      </div>
                    </Timeline.Item>
                  )}
                </Timeline>
              </Card>
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  )
}

export default function RequirementDetailPage() {
  return (
    <App>
      <RequirementDetailContent />
    </App>
  )
}
