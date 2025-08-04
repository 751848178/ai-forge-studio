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
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ProjectOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { request } from '@/lib/utils/request'
import MainLayout from '@/components/layout/MainLayout'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { TextArea } = Input

interface Project {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  _count: {
    requirements: number
    modules: number
  }
}

const statusColors = {
  PLANNING: 'blue',
  IN_PROGRESS: 'processing',
  TESTING: 'warning',
  COMPLETED: 'success',
  ARCHIVED: 'default'
}

const statusLabels = {
  PLANNING: '规划中',
  IN_PROGRESS: '进行中',
  TESTING: '测试中',
  COMPLETED: '已完成',
  ARCHIVED: '已归档'
}

export default function ProjectsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form] = Form.useForm()

  // 获取项目列表
  const fetchProjects = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const result = await request.get<{ projects: Project[] }>('/projects')
      if (result.success && result.data) {
        setProjects(result.data.projects)
      } else {
        message.error(result.error?.message || '获取项目列表失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [isAuthenticated, user])

  // 创建/更新项目
  const handleSubmit = async (values: any) => {
    try {
      let result
      if (editingProject) {
        result = await request.put<Project>(`/projects/${editingProject.id}`, values)
      } else {
        result = await request.post<Project>('/projects', values)
      }

      if (result.success) {
        message.success(editingProject ? '项目更新成功' : '项目创建成功')
        setModalVisible(false)
        setEditingProject(null)
        form.resetFields()
        fetchProjects()
      } else {
        message.error(result.error?.message || '操作失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  // 删除项目
  const handleDelete = async (id: string) => {
    try {
      const result = await request.delete(`/projects/${id}`)
      if (result.success) {
        message.success('项目删除成功')
        fetchProjects()
      } else {
        message.error(result.error?.message || '删除失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  // 打开编辑模态框
  const handleEdit = (project: Project) => {
    setEditingProject(project)
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      status: project.status
    })
    setModalVisible(true)
  }

  // 打开新建模态框
  const handleCreate = () => {
    setEditingProject(null)
    form.resetFields()
    setModalVisible(true)
  }

  const columns: ColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <ProjectOutlined />
          <a onClick={() => router.push(`/projects/${record.id}`)}>
            {text}
          </a>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-'
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
      title: '需求数',
      key: 'requirements',
      render: (_, record) => record._count.requirements
    },
    {
      title: '模块数',
      key: 'modules',
      render: (_, record) => record._count.modules
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
              onClick={() => router.push(`/projects/${record.id}`)}
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
            title="确定要删除这个项目吗？"
            description="删除后将无法恢复，相关的需求和模块也会被删除。"
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
            项目管理
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建项目
          </Button>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={projects}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个项目`
            }}
          />
        </Card>

        <Modal
          title={editingProject ? '编辑项目' : '新建项目'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setEditingProject(null)
            form.resetFields()
          }}
          onOk={() => form.submit()}
          okText="确定"
          cancelText="取消"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="项目描述"
            >
              <TextArea 
                rows={4} 
                placeholder="请输入项目描述（可选）" 
              />
            </Form.Item>

            {editingProject && (
              <Form.Item
                name="status"
                label="项目状态"
                rules={[{ required: true, message: '请选择项目状态' }]}
              >
                <Select placeholder="请选择项目状态">
                  <Select.Option value="PLANNING">规划中</Select.Option>
                  <Select.Option value="IN_PROGRESS">进行中</Select.Option>
                  <Select.Option value="TESTING">测试中</Select.Option>
                  <Select.Option value="COMPLETED">已完成</Select.Option>
                  <Select.Option value="ARCHIVED">已归档</Select.Option>
                </Select>
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </MainLayout>
  )
}
