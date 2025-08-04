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
  CheckSquareOutlined,
  CodeOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { request } from '@/lib/utils/request'
import MainLayout from '@/components/layout/MainLayout'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { TextArea } = Input

interface Task {
  id: string
  title: string
  description?: string
  type: 'DEVELOPMENT' | 'TESTING' | 'DOCUMENTATION' | 'DEPLOYMENT' | 'REFACTORING'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'TESTING' | 'COMPLETED' | 'BLOCKED'
  estimatedHours?: number
  techStack?: Record<string, any>
  filePath?: string
  moduleId: string
  createdAt: string
  updatedAt: string
  module: {
    id: string
    name: string
    project: {
      id: string
      name: string
    }
  }
}

interface Module {
  id: string
  name: string
  project: {
    id: string
    name: string
  }
}

const typeColors = {
  DEVELOPMENT: 'blue',
  TESTING: 'green',
  DOCUMENTATION: 'orange',
  DEPLOYMENT: 'purple',
  REFACTORING: 'cyan'
}

const typeLabels = {
  DEVELOPMENT: '开发任务',
  TESTING: '测试任务',
  DOCUMENTATION: '文档任务',
  DEPLOYMENT: '部署任务',
  REFACTORING: '重构任务'
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
  REVIEW: 'warning',
  TESTING: 'orange',
  COMPLETED: 'success',
  BLOCKED: 'error'
}

const statusLabels = {
  TODO: '待开始',
  IN_PROGRESS: '进行中',
  REVIEW: '待评审',
  TESTING: '测试中',
  COMPLETED: '已完成',
  BLOCKED: '已阻塞'
}

export default function TasksPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [generatingCode, setGeneratingCode] = useState<string | null>(null)
  const [form] = Form.useForm()

  // 获取任务列表
  const fetchTasks = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const result = await request.get<{ tasks: Task[] }>('/tasks')
      if (result.success && result.data) {
        setTasks(result.data.tasks)
      } else {
        message.error(result.error?.message || '获取任务列表失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 获取模块列表
  const fetchModules = async () => {
    if (!isAuthenticated) return

    try {
      const result = await request.get<{ modules: Module[] }>('/modules')
      if (result.success && result.data) {
        setModules(result.data.modules)
      }
    } catch (error) {
      console.error('获取模块列表失败:', error)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchModules()
  }, [isAuthenticated, user])

  // 创建/更新任务
  const handleSubmit = async (values: any) => {
    try {
      let result
      if (editingTask) {
        result = await request.put<Task>(`/tasks/${editingTask.id}`, values)
      } else {
        result = await request.post<Task>('/tasks', values)
      }

      if (result.success) {
        message.success(editingTask ? '任务更新成功' : '任务创建成功')
        setModalVisible(false)
        setEditingTask(null)
        form.resetFields()
        fetchTasks()
      } else {
        message.error(result.error?.message || '操作失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  // 删除任务
  const handleDelete = async (id: string) => {
    try {
      const result = await request.delete(`/tasks/${id}`)
      if (result.success) {
        message.success('任务删除成功')
        fetchTasks()
      } else {
        message.error(result.error?.message || '删除失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  // AI生成代码
  const handleGenerateCode = async (id: string) => {
    setGeneratingCode(id)
    try {
      const result = await request.post(`/tasks/${id}/generate-code`)
      if (result.success) {
        message.success('代码生成完成')
        fetchTasks()
      } else {
        message.error(result.error?.message || 'AI代码生成失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    } finally {
      setGeneratingCode(null)
    }
  }

  // 打开编辑模态框
  const handleEdit = (task: Task) => {
    setEditingTask(task)
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: task.status,
      moduleId: task.moduleId,
      estimatedHours: task.estimatedHours,
      filePath: task.filePath
    })
    setModalVisible(true)
  }

  // 打开新建模态框
  const handleCreate = () => {
    setEditingTask(null)
    form.resetFields()
    setModalVisible(true)
  }

  const columns: ColumnsType<Task> = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <CheckSquareOutlined />
          <a onClick={() => router.push(`/tasks/${record.id}`)}>
            {text}
          </a>
        </Space>
      )
    },
    {
      title: '所属模块',
      key: 'module',
      render: (_, record) => (
        <div>
          <div>{record.module.name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {record.module.project.name}
          </div>
        </div>
      )
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
      title: '预估工时',
      dataIndex: 'estimatedHours',
      key: 'estimatedHours',
      render: (hours) => hours ? `${hours}h` : '-'
    },
    {
      title: '文件路径',
      dataIndex: 'filePath',
      key: 'filePath',
      ellipsis: true,
      render: (path) => path || '-'
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
              onClick={() => router.push(`/tasks/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="生成代码">
            <Button 
              type="text" 
              icon={<CodeOutlined />}
              loading={generatingCode === record.id}
              onClick={() => handleGenerateCode(record.id)}
              disabled={record.type !== 'DEVELOPMENT'}
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
            title="确定要删除这个任务吗？"
            description="删除后将无法恢复。"
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
            开发任务
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建任务
          </Button>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个任务`
            }}
          />
        </Card>

        <Modal
          title={editingTask ? '编辑任务' : '新建任务'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setEditingTask(null)
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
              label="任务标题"
              rules={[{ required: true, message: '请输入任务标题' }]}
            >
              <Input placeholder="请输入任务标题" />
            </Form.Item>

            <Form.Item
              name="moduleId"
              label="所属模块"
              rules={[{ required: true, message: '请选择所属模块' }]}
            >
              <Select placeholder="请选择所属模块">
                {modules.map(module => (
                  <Select.Option key={module.id} value={module.id}>
                    {module.project.name} - {module.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="type"
              label="任务类型"
              rules={[{ required: true, message: '请选择任务类型' }]}
            >
              <Select placeholder="请选择任务类型">
                <Select.Option value="DEVELOPMENT">开发任务</Select.Option>
                <Select.Option value="TESTING">测试任务</Select.Option>
                <Select.Option value="DOCUMENTATION">文档任务</Select.Option>
                <Select.Option value="DEPLOYMENT">部署任务</Select.Option>
                <Select.Option value="REFACTORING">重构任务</Select.Option>
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

            {editingTask && (
              <Form.Item
                name="status"
                label="任务状态"
                rules={[{ required: true, message: '请选择任务状态' }]}
              >
                <Select placeholder="请选择任务状态">
                  <Select.Option value="TODO">待开始</Select.Option>
                  <Select.Option value="IN_PROGRESS">进行中</Select.Option>
                  <Select.Option value="REVIEW">待评审</Select.Option>
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

            <Form.Item
              name="filePath"
              label="文件路径"
            >
              <Input placeholder="请输入文件路径（可选）" />
            </Form.Item>

            <Form.Item
              name="description"
              label="任务描述"
            >
              <TextArea 
                rows={4} 
                placeholder="请输入任务描述（可选）" 
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  )
}
