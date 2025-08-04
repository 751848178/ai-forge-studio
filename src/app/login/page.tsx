'use client'

import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, Tabs, App } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

const { Title, Text } = Typography

interface LoginForm {
  email: string
  password: string
  tenantSlug?: string
}

interface RegisterForm {
  email: string
  password: string
  name?: string
  tenantName?: string
}

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const router = useRouter()
  const { login, register } = useAuth()
  const { message } = App.useApp()

  const handleLogin = async (values: LoginForm) => {
    setLoading(true)
    try {
      const success = await login({
        email: values.email,
        password: values.password,
        tenantSlug: values.tenantSlug
      })
      if (success) {
        message.success('登录成功')
        router.push('/')
      } else {
        message.error('登录失败')
      }
    } catch (error: any) {
      message.error(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: RegisterForm) => {
    setLoading(true)
    try {
      const success = await register({
        email: values.email,
        password: values.password,
        name: values.name,
        tenantName: values.tenantName
      })
      if (success) {
        message.success('注册成功')
        router.push('/')
      } else {
        message.error('注册失败')
      }
    } catch (error: any) {
      message.error(error.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱地址"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="tenantSlug"
            label="租户标识（可选）"
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="租户标识，留空使用默认租户"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          name="register"
          onFinish={handleRegister}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱地址"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码（至少6位）"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名（可选）"
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="您的姓名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="tenantName"
            label="工作空间名称（可选）"
          >
            <Input
              placeholder="工作空间名称，留空使用默认名称"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 400,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
            AI需求分析平台
          </Title>
          <Text type="secondary">
            基于AI的需求分析和代码生成平台
          </Text>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          centered
          items={tabItems}
        />
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <App>
      <LoginContent />
    </App>
  )
}
