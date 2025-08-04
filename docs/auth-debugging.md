# 认证问题调试指南

## 问题描述
登录后请求API接口返回：`{"success":false,"error":{"code":"UNAUTHORIZED","message":"Token无效"}}`

## 调试步骤

### 1. 测试基础认证
首先测试基础认证是否正常工作：

```bash
# 使用你的登录token测试
curl -X GET http://localhost:3000/api/test-auth \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. 测试租户认证
测试租户认证是否正常：

```bash
# 使用你的登录token和租户ID测试
curl -X POST http://localhost:3000/api/test-auth \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "x-tenant-id: YOUR_TENANT_ID_HERE" \
  -H "Content-Type: application/json"
```

### 3. 检查登录响应
确保登录接口返回的数据格式正确：

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "用户名",
      "tenantId": "tenant-id",
      "role": "ADMIN"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### 4. 验证JWT Token
你可以在 [jwt.io](https://jwt.io) 上解码你的JWT token，确保包含以下字段：

```json
{
  "userId": "user-id",
  "email": "user@example.com", 
  "tenantId": "tenant-id",
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 5. 检查环境变量
确保 `.env` 文件中包含正确的JWT密钥：

```env
JWT_SECRET=your-secret-key-here
```

### 6. 检查前端请求头
确保前端请求包含正确的头部：

```javascript
fetch('/api/projects', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': user.tenantId,
    'Content-Type': 'application/json'
  }
})
```

## 常见问题

### 问题1：Token格式错误
- 确保Authorization头部格式为：`Bearer <token>`
- 检查token中是否包含多余的引号或空格

### 问题2：租户ID缺失
- 确保请求头中包含 `x-tenant-id`
- 检查用户对象中是否包含 `tenantId` 字段

### 问题3：JWT密钥不匹配
- 确保服务器和客户端使用相同的JWT_SECRET
- 重新启动开发服务器以确保环境变量生效

### 问题4：Token过期
- JWT token默认有效期为1小时
- 如果token过期，需要重新登录或使用refresh token

## 测试用例

### 正确的登录请求
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "494593337@qq.com",
    "password": "123456",
    "tenantSlug": "ai-forge-studio"
  }'
```

### 正确的API请求
```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID"
```

## 解决方案

如果以上步骤都正常，但仍然出现认证错误，可能的原因：

1. **JWT库版本问题**：确保使用兼容的jsonwebtoken版本
2. **时间同步问题**：确保服务器时间正确
3. **中间件执行顺序**：确保认证中间件在租户中间件之前执行
4. **数据库连接问题**：确保数据库连接正常，用户和租户数据存在

## 调试日志

在认证中间件中添加调试日志：

```typescript
console.log('Token:', token)
console.log('Auth result:', authResult)
console.log('User:', authResult.user)
```

这将帮助你确定问题出现在哪个环节。
