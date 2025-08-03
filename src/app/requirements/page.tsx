'use client'

import { useState, useEffect } from 'react'
import { 
  Layout, 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Modal, 
  Form, 
  Input, 
  Select,
  message,
  Popconfirm,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  FileTextOutlined,
  RobotOutlined,
  LoadingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useAppStore, Requirement, Project } from '@/store'
import Link from 'next/link'

const { Header, Content } = Layout
const { Title } = Typography
const { TextArea } = Input

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

export default function RequirementsPage() {
  const { 
    requirements, 
    setRequirements, 
    addRequirement, 
    updateRequirement,
    projects,
    setProjects,
    user,
    loading,
    setLoading 
  } = useAppStore()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null)
  const [form] = Form.useForm()

  // 加载数据
  useEffect(() => {
    if (user) {
      loadProjects()
      loadRequirements()
    }
  }, [user])

  const loadProjects = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/projects?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadRequirements = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // 获取用户所有项目的需求
      const projectsResponse = await fetch(`/api/projects?userId=${user.id}`)
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        
        // 获取所有需求
        const allRequirements: Requirement[] = []
        for (const project of projectsData) {
          const reqResponse = await fetch(`/api/requirements?projectId=${project.id}`)
          if (reqResponse.ok) {
            const reqData = await reqResponse.json()
            allRequirements.push(...reqData)
          }
        }
        
        setRequirements(allRequirements)
      }
    } catch (error) {
      console.error('Error loading requirements:', error)
      message.error('加载需求列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequirement = () => {
    setEditingRequirement(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditRequirement = (requirement: Requirement) => {
    setEditingRequirement(requirement)
    form.setFieldsValue(requirement)
    setIsModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    if (!user) return

    setLoading(true)
    try {
      if (editingRequirement) {
        // 更新需求
        const response = await fetch(`/api/requirements/${editingRequirement.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
        
        if (response.ok) {
          const updatedRequirement = await response.json()
          updateRequirement(editingRequirement.id, updatedRequirement)
          message.success('需求更新成功')
        } else {
          message.error('需求更新失败')
        }
      } else {
        // 创建新需求
        const response = await fetch('/api/requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
        
        if (response.ok) {
          const newRequirement = await response.json()
          addRequirement(newRequirement)
          message.success('需求创建成功')
        } else {
          message.error('需求创建失败')
        }
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Error saving requirement:', error)
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRequirement = async (requirementId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/requirements/${requirementId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setRequirements(requirements.filter(r => r.id !== requirementId))
        message.success('需求删除成功')
      } else {
        message.error('需求删除失败')
      }
    } catch (error) {
      console.error('Error deleting requirement:', error)
      message.error('需求删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeRequirement = async (requirementId: string) => {
    setLoading(true)
    try {
      // 更新状态为分析中
      updateRequirement(requirementId, { status: 'ANALYZING' })
      
      const response = await fetch(`/api/requirements/${requirementId}/analyze`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        updateRequirement(requirementId, result.requirement)
        message.success('需求分析完成')
        
        // 刷新需求列表以获取最新数据
        loadRequirements()
      } else {
        const error = await response.json()
        message.error(error.error || 'AI分析失败')
        updateRequirement(requirementId, { status: 'PENDING' })
      }
    } catch (error) {
      console.error('Error analyzing requirement:', error)
      message.error('AI分析失败')
      updateRequirement(requirementId, { status: 'PENDING' })
    } finally {
      setLoading(false)
    }
  }

  const columns = [
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
      title: '所属项目',
      key: 'project',
      render: (record: Requirement) => record.project?.name || '-'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: keyof typeof typeColors) => (
        <Tag color={typeColors[type]}>
          {typeLabels[type]}
        </Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: keyof typeof priorityColors) => (
        <Tag color={priorityColors[priority]}>
          {priorityLabels[priority]}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusColors, record: Requirement) => (
        <div className="flex items-center space-x-2">
          <Tag color={statusColors[status]}>
            {status === 'ANALYZING' && <LoadingOutlined className="mr-1" />}
            {statusLabels[status]}
          </Tag>
          {record.analysis && (
            <Tooltip title="已完成AI分析">
              <CheckCircleOutlined className="text-green-500" />
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: Requirement) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            href={`/requirements/${record.id}`}
          >
            查看
          </Button>
          {record.status === 'PENDING' && (
            <Button 
              type="link" 
              icon={<RobotOutlined />}
              onClick={() => handleAnalyzeRequirement(record.id)}
            >
              AI分析
            </Button>
          )}
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditRequirement(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个需求吗？"
            description="删除后将无法恢复，包括所有相关的分析结果。"
            onConfirm={() => handleDeleteRequirement(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-4">
            <FileTextOutlined className="text-2xl text-blue-600" />
            <Title level={3} className="!mb-0 !text-gray-800">
              需求管理
            </Title>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateRequirement}
          >
            添加需求
          </Button>
        </div>
      </Header>

      <Content className="p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Card>
            <Table
              columns={columns}
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
        </div>
      </Content>

      {/* 创建/编辑需求模态框 */}
      <Modal
        title={editingRequirement ? '编辑需求' : '添加需求'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="projectId"
            label="所属项目"
            rules={[{ required: true, message: '请选择所属项目' }]}
          >
            <Select placeholder="请选择项目">
              {projects.map(project => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="需求标题"
            rules={[{ required: true, message: '请输入需求标题' }]}
          >
            <Input placeholder="请输入需求标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="需求内容"
            rules={[{ required: true, message: '请输入需求内容' }]}
          >
            <TextArea 
              rows={8} 
              placeholder="请详细描述需求内容，包括功能点、业务流程、技术要求等" 
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="需求类型"
            initialValue="FUNCTIONAL"
          >
            <Select>
              <Select.Option value="FUNCTIONAL">功能需求</Select.Option>
              <Select.Option value="NON_FUNCTIONAL">非功能需求</Select.Option>
              <Select.Option value="BUSINESS">业务需求</Select.Option>
              <Select.Option value="TECHNICAL">技术需求</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            initialValue="MEDIUM"
          >
            <Select>
              <Select.Option value="LOW">低</Select.Option>
              <Select.Option value="MEDIUM">中</Select.Option>
              <Select.Option value="HIGH">高</Select.Option>
              <Select.Option value="URGENT">紧急</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingRequirement ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
