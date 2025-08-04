'use client'

import { useState } from 'react'
import { Button, Card, Space, Typography, message } from 'antd'
import { request } from '@/lib/utils/request'

const { Title, Text } = Typography

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const testEndpoints = [
    { name: '项目列表', url: '/api/projects', method: 'GET' },
    { name: '需求列表', url: '/api/requirements', method: 'GET' },
    { name: '模块列表', url: '/api/modules', method: 'GET' },
    { name: '任务列表', url: '/api/tasks', method: 'GET' },
  ]

  const testEndpoint = async (endpoint: { name: string; url: string; method: string }) => {
    setLoading(true)
    try {
      let response
      switch (endpoint.method) {
        case 'GET':
          response = await request.get(endpoint.url)
          break
        case 'POST':
          response = await request.post(endpoint.url)
          break
        case 'PUT':
          response = await request.put(endpoint.url)
          break
        case 'DELETE':
          response = await request.delete(endpoint.url)
          break
        default:
          response = await request.get(endpoint.url)
      }
      
      setResults(prev => [...prev, {
        name: endpoint.name,
        status: 'success',
        data: response,
        timestamp: new Date().toLocaleTimeString()
      }])
      
      message.success(`${endpoint.name} 测试成功`)
    } catch (error: any) {
      setResults(prev => [...prev, {
        name: endpoint.name,
        status: 'error',
        error: error.message || '未知错误',
        timestamp: new Date().toLocaleTimeString()
      }])
      
      message.error(`${endpoint.name} 测试失败`)
    } finally {
      setLoading(false)
    }
  }

  const testAllEndpoints = async () => {
    setResults([])
    for (const endpoint of testEndpoints) {
      await testEndpoint(endpoint)
      // 添加小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="p-6">
      <Title level={2}>API 端点测试</Title>
      <Text type="secondary">测试各个 API 端点是否正常工作</Text>
      
      <div className="mt-6">
        <Space>
          <Button 
            type="primary" 
            onClick={testAllEndpoints}
            loading={loading}
          >
            测试所有端点
          </Button>
          <Button onClick={clearResults}>清空结果</Button>
        </Space>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {testEndpoints.map((endpoint) => (
          <Card 
            key={endpoint.name}
            title={endpoint.name}
            extra={
              <Button 
                size="small"
                onClick={() => testEndpoint(endpoint)}
                loading={loading}
              >
                测试
              </Button>
            }
          >
            <Text code>{endpoint.method} {endpoint.url}</Text>
          </Card>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-6">
          <Title level={3}>测试结果</Title>
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card 
                key={index}
                size="small"
                className={result.status === 'success' ? 'border-green-200' : 'border-red-200'}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Text strong>{result.name}</Text>
                    <Text type="secondary" className="ml-2">
                      {result.timestamp}
                    </Text>
                  </div>
                  <Text 
                    type={result.status === 'success' ? 'success' : 'danger'}
                  >
                    {result.status === 'success' ? '成功' : '失败'}
                  </Text>
                </div>
                
                {result.status === 'success' ? (
                  <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                ) : (
                  <Text type="danger" className="mt-2 block">
                    错误: {result.error}
                  </Text>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
