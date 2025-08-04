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
  InputNumber
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { request } from '@/lib/utils/request'
import MainLayout from '@/components/layout/MainLayout'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { TextArea } = Input

interface Module {
  id: string
  name: string
  description?: string
  type: 'FEATURE' | 'COMPONENT' | 'SERVICE' | 'UTILITY' | 'INTEGRATION'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'BLOCKED'
  estimatedHours?: number
  actualHours?: number
  projectId: string
  createdAt: string
  updatedAt: string
  project: {
    id: string
    name: string
  }
  _count: {
    tasks: number
  }
}

interface Project {
  id: string
  name: string
}

const typeColors = {
  FEATURE: 'blue',
  COMPONENT: 'green',
  SERVICE: 'orange',
  UTILITY: 'purple',
  INTEGRATION: 'cyan'
}

const typeLabels = {
  FEATURE: '功能模块',
  COMPONENT: '组件模块',
  SERVICE: '服务模块',
  UTILITY: '工具模块',
  INTEGRATION: '集成模块'
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
  TODO: 'default',
  IN_PROGRESS: 'processing',
  TESTING: 'warning',
  COMPLETED: 'success',
  BLOCKED: 'error'
}

const statusLabels = {
  TODO: '待开始',
  IN_PROGRESS: '进行中',
  TESTING: '测试中',
  COMPLETED: '已完成',
  BLOCKED: '已阻塞'
}

export default function ModulesPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [form] = Form.useForm()

  // 获取模块列表
  const fetchModules = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const result = await request.get<{ modules: Module[] }>('/modules')
      if (result.success && result.data) {
        setModules(result.data.modules)
      } else {
        message.error(result.error?.message || '获取模块列表失败')
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
    fetchModules()
    fetchProjects()
  }, [isAuthenticated, user])

  // 创建/更新模块
  const handleSubmit = async (values: any) => {
    try {
      let result
      if (editingModule) {
        result = await request.put<Module>(`/modules/${editingModule.id}`, values)
      } else {
        result = await request.post<Module>('/modules', values)
      }

      if (result.success) {
        message.success(editingModule ? '模块更新成功' : '模块创建成功')
        setModalVisible(false)
        setEditingModule(null)
        form.resetFields()
        fetchModules()
      } else {
        message.error(result.error?.message || '操作失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  // 删除模块
  const handleDelete = async (id: string) => {
    try {
      const result = await request.delete(`/modules/${id}`)
      if (result.success) {
        message.success('模块删除成功')
        fetchModules()
      } else {
        message.error(result.error?.message || '删除失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  // 打开编辑模态框
  const handleEdit = (module: Module) => {
    setEditingModule(module)
    form.setFieldsValue({
      name: module.name,
      description: module.description,
      type: module.type,
      priority: module.priority,
      status: module.status,
      projectId: module.projectId,
      estimatedHours: module.estimatedHours,
      actualHours: module.actualHours
    })
    setModalVisible(true)
  }

  // 打开新建模态框
  const handleCreate = () => {
    setEditingModule(null)
    form.resetFields()
    setModalVisible(true)
  }

  const columns: ColumnsType<Module> = [
    {
      title: '模块名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <AppstoreOutlined />
          <a onClick={() => router.push(`/modules/${record.id}`)}>
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
      title: '工时',
      key: 'hours',
      render: (_, record) => {
        const estimated = record.estimatedHours || 0
        const actual = record.actualHours || 0
        return (
          <div>
            <div>预估: {estimated}h</div>
            {actual > 0 && <div>实际: {actual}h</div>}
          </div>
        )
      }
    },
    {
      title: '任务数',
      key: 'tasks',
      render: (_, record) => record._count?.tasks || 0
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
              onClick={() => router.push(`/modules/${record.id}`)}
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
            title="确定要删除这个模块吗？"
            description="删除后将无法恢复，相关的任务也会被删除。"
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
            功能模块
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建模块
          </Button>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={modules}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个模块`
            }}
          />
        </Card>

        <Modal
          title={editingModule ? '编辑模块' : '新建模块'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setEditingModule(null)
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
              name="name"
              label="模块名称"
              rules={[{ required: true, message: '请输入模块名称' }]}
            >
              <Input placeholder="请输入模块名称" />
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
              label="模块类型"
              rules={[{ required: true, message: '请选择模块类型' }]}
            >
              <Select placeholder="请选择模块类型">
                <Select.Option value="FEATURE">功能模块</Select.Option>
                <Select.Option value="COMPONENT">组件模块</Select.Option>
                <Select.Option value="SERVICE">服务模块</Select.Option>
                <Select.Option value="UTILITY">工具模块</Select.Option>
                <Select.Option value="INTEGRATION">集成模块</Select.Option>
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

            {editingModule && (
              <Form.Item
                name="status"
                label="模块状态"
                rules={[{ required: true, message: '请选择模块状态' }]}
              >
                <Select placeholder="请选择模块状态">
                  <Select.Option value="TODO">待开始</Select.Option>
                  <Select.Option value="IN_PROGRESS">进行中</Select.Option>
                  <Select.Option value="TESTING">测试中</Select.Option>
                  <Select.Option value="COMPLETED">已完成</Select.Option>
                  <Select.Option value="BLOCKED">已阻塞</Select.Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item
              name="estimatedHours"
              label="预估工时（小时）"
            >
              <InputNumber 
                min={0} 
                max={1000} 
                placeholder="请输入预估工时"
                style={{ width: '100%' }}
              />
            </Form.Item>

            {editingModule && (
              <Form.Item
                name="actualHours"
                label="实际工时（小时）"
              >
                <InputNumber 
                  min={0} 
                  max={1000} 
                  placeholder="请输入实际工时"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}

            <Form.Item
              name="description"
              label="模块描述"
            >
              <TextArea 
                rows={4} 
                placeholder="请输入模块描述（可选）" 
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  )
}
