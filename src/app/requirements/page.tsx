'use client'

import React, { useState, useEffect } from 'react'
import { 
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
  Tooltip,
  Divider
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  FileTextOutlined,
  RobotOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { request } from '@/lib/utils/request'
import MainLayout from '@/components/layout/MainLayout'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { TextArea } = Input

interface Requirement {
  id: string
  title: string
  content: string
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'BUSINESS' | 'TECHNICAL'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'ANALYZING' | 'ANALYZED' | 'APPROVED' | 'REJECTED'
  projectId: string
  createdAt: string
  updatedAt: string
  project: {
    id: string
    name: string
  }
  analysis?: {
    id: string
    summary: string
    complexity: string
    estimatedHours: number
  }
}

interface Project {
  id: string
  name: string
}

const typeColors = {
  FUNCTIONAL: 'blue',
  NON_FUNCTIONAL: 'green',
  BUSINESS: 'orange',
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
  MEDIUM: 'processing',
  HIGH: 'warning',
  URGENT: 'error'
}

const priorityLabels = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急'
}

const statusColors = {
  PENDING: 'default',
  ANALYZING: 'processing',
  ANALYZED: 'success',
  APPROVED: 'success',
  REJECTED: 'error'
}

const statusLabels = {
  PENDING: '待处理',
  ANALYZING: '分析中',
  ANALYZED: '已分析',
  APPROVED: '已批准',
  REJECTED: '已拒绝'
}

export default function RequirementsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  // 获取需求列表
  const fetchRequirements = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const result = await request.get<{ requirements: Requirement[] }>('/requirements')
      if (result.success && result.data) {
        setRequirements(result.data.requirements)
      } else {
        message.error(result.error?.message || '获取需求列表失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 获取项目列表
  const fetchProjects = async () => {
    if (!isAuthenticated) return

    try {
      const result = await request.get<{ projects: Project[] }>('/projects')
      if (result.success && result.data) {
        setProjects(result.data.projects)
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
    }
  }

  useEffect(() => {
    fetchRequirements()
    fetchProjects()
  }, [isAuthenticated, user])

  // 创建/更新需求
  const handleSubmit = async (values: any) => {
    try {
      let result
      if (editingRequirement) {
        result = await request.put<Requirement>(`/requirements/${editingRequirement.id}`, values)
      } else {
        result = await request.post<Requirement>('/requirements', values)
      }

      if (result.success) {
        message.success(editingRequirement ? '需求更新成功' : '需求创建成功')
        setModalVisible(false)
        setEditingRequirement(null)
        form.resetFields()
        fetchRequirements()
      } else {
        message.error(result.error?.message || '操作失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  // 删除需求
  const handleDelete = async (id: string) => {
    try {
      const result = await request.delete(`/requirements/${id}`)
      if (result.success) {
        message.success('需求删除成功')
        fetchRequirements()
      } else {
        message.error(result.error?.message || '删除失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  // AI分析需求
  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id)
    try {
      const result = await request.post(`/requirements/${id}/analyze`)
      if (result.success) {
        message.success('需求分析完成')
        fetchRequirements()
      } else {
        message.error(result.error?.message || 'AI分析失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    } finally {
      setAnalyzingId(null)
    }
  }

  // 打开编辑模态框
  const handleEdit = (requirement: Requirement) => {
    setEditingRequirement(requirement)
    form.setFieldsValue({
      title: requirement.title,
      content: requirement.content,
      type: requirement.type,
      priority: requirement.priority,
      projectId: requirement.projectId,
      status: requirement.status
    })
    setModalVisible(true)
  }

  // 打开新建模态框
  const handleCreate = () => {
    setEditingRequirement(null)
    form.resetFields()
    setModalVisible(true)
  }

  const columns: ColumnsType<Requirement> = [
    {
      title: '需求标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <FileTextOutlined />
          <a onClick={() => router.push(`/requirements/${record.id}`)}>
            {text}
          </a>
        </Space>
      )
    },
    {
      title: '所属项目',
      key: 'project',
      render: (_, record) => record.project.name
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
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    },
    {
      title: '分析结果',
      key: 'analysis',
      render: (_, record) => {
        if (record.analysis) {
          return (
            <div>
              <div>复杂度: {record.analysis.complexity}</div>
              <div>预估工时: {record.analysis.estimatedHours}h</div>
            </div>
          )
        }
        return '-'
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => router.push(`/requirements/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="AI分析">
            <Button 
              type="text" 
              icon={<RobotOutlined />}
              loading={analyzingId === record.id}
              onClick={() => handleAnalyze(record.id)}
              disabled={record.status === 'ANALYZING'}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个需求吗？"
            description="删除后将无法恢复，相关的分析结果也会被删除。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  if (!isAuthenticated) {
    return null
  }

  return (
    <MainLayout>
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 24 
        }}>
          <Title level={2} style={{ margin: 0 }}>
            需求管理
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建需求
          </Button>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={requirements}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个需求`
            }}
          />
        </Card>

        <Modal
          title={editingRequirement ? '编辑需求' : '新建需求'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setEditingRequirement(null)
            form.resetFields()
          }}
          onOk={() => form.submit()}
          okText="确定"
          cancelText="取消"
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="title"
              label="需求标题"
              rules={[{ required: true, message: '请输入需求标题' }]}
            >
              <Input placeholder="请输入需求标题" />
            </Form.Item>

            <Form.Item
              name="projectId"
              label="所属项目"
              rules={[{ required: true, message: '请选择所属项目' }]}
            >
              <Select placeholder="请选择所属项目">
                {projects.map(project => (
                  <Select.Option key={project.id} value={project.id}>
                    {project.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="type"
              label="需求类型"
              rules={[{ required: true, message: '请选择需求类型' }]}
            >
              <Select placeholder="请选择需求类型">
                <Select.Option value="FUNCTIONAL">功能需求</Select.Option>
                <Select.Option value="NON_FUNCTIONAL">非功能需求</Select.Option>
                <Select.Option value="BUSINESS">业务需求</Select.Option>
                <Select.Option value="TECHNICAL">技术需求</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select placeholder="请选择优先级">
                <Select.Option value="LOW">低</Select.Option>
                <Select.Option value="MEDIUM">中</Select.Option>
                <Select.Option value="HIGH">高</Select.Option>
                <Select.Option value="URGENT">紧急</Select.Option>
              </Select>
            </Form.Item>

            {editingRequirement && (
              <Form.Item
                name="status"
                label="需求状态"
                rules={[{ required: true, message: '请选择需求状态' }]}
              >
                <Select placeholder="请选择需求状态">
                  <Select.Option value="PENDING">待处理</Select.Option>
                  <Select.Option value="ANALYZING">分析中</Select.Option>
                  <Select.Option value="ANALYZED">已分析</Select.Option>
                  <Select.Option value="APPROVED">已批准</Select.Option>
                  <Select.Option value="REJECTED">已拒绝</Select.Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item
              name="content"
              label="需求内容"
              rules={[{ required: true, message: '请输入需求内容' }]}
            >
              <TextArea 
                rows={8} 
                placeholder="请详细描述需求内容，包括功能描述、业务场景、验收标准等" 
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  )
}
