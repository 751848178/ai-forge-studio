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
  Popconfirm
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ProjectOutlined
} from '@ant-design/icons'
import { useAppStore, Project } from '@/store'
import Link from 'next/link'

const { Header, Content } = Layout
const { Title } = Typography
const { TextArea } = Input

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

export default function ProjectsPage() {
  const { 
    projects, 
    setProjects, 
    addProject, 
    updateProject,
    user,
    loading,
    setLoading 
  } = useAppStore()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form] = Form.useForm()

  // 加载项目列表
  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/projects?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        message.error('加载项目列表失败')
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      message.error('加载项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = () => {
    setEditingProject(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    form.setFieldsValue(project)
    setIsModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    if (!user) return

    setLoading(true)
    try {
      if (editingProject) {
        // 更新项目
        const response = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
        
        if (response.ok) {
          const updatedProject = await response.json()
          updateProject(editingProject.id, updatedProject)
          message.success('项目更新成功')
        } else {
          message.error('项目更新失败')
        }
      } else {
        // 创建新项目
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, userId: user.id })
        })
        
        if (response.ok) {
          const newProject = await response.json()
          addProject(newProject)
          message.success('项目创建成功')
        } else {
          message.error('项目创建失败')
        }
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Error saving project:', error)
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId))
        message.success('项目删除成功')
      } else {
        message.error('项目删除失败')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      message.error('项目删除失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <Link href={`/projects/${record.id}`} className="text-blue-600 hover:text-blue-800">
          {text}
        </Link>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
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
      title: '需求数量',
      key: 'requirementCount',
      render: (record: Project) => record._count?.requirements || 0
    },
    {
      title: '模块数量',
      key: 'moduleCount',
      render: (record: Project) => record._count?.modules || 0
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
      render: (record: Project) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            href={`/projects/${record.id}`}
          >
            查看
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditProject(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个项目吗？"
            description="删除后将无法恢复，包括所有相关的需求和任务。"
            onConfirm={() => handleDeleteProject(record.id)}
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
            <ProjectOutlined className="text-2xl text-blue-600" />
            <Title level={3} className="!mb-0 !text-gray-800">
              项目管理
            </Title>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateProject}
          >
            创建项目
          </Button>
        </div>
      </Header>

      <Content className="p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Card>
            <Table
              columns={columns}
              dataSource={projects}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 个项目`
              }}
            />
          </Card>
        </div>
      </Content>

      {/* 创建/编辑项目模态框 */}
      <Modal
        title={editingProject ? '编辑项目' : '创建项目'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
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

          <Form.Item
            name="status"
            label="项目状态"
            initialValue="PLANNING"
          >
            <Select>
              <Select.Option value="PLANNING">规划中</Select.Option>
              <Select.Option value="IN_PROGRESS">进行中</Select.Option>
              <Select.Option value="TESTING">测试中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="ARCHIVED">已归档</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProject ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
