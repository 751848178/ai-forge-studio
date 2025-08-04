# 数据库设置指南

本文档介绍如何为AI需求分析平台设置MySQL数据库。

## 环境要求

- MySQL 8.0 或更高版本
- Node.js 18 或更高版本
- pnpm 包管理器

## MySQL 安装

### macOS (使用 Homebrew)
```bash
brew install mysql
brew services start mysql
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Windows
下载并安装 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

## 数据库配置

### 1. 创建数据库
```sql
-- 登录MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE ai_requirement_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选，推荐）
CREATE USER 'ai_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ai_requirement_analyzer.* TO 'ai_user'@'localhost';
FLUSH PRIVILEGES;

-- 退出MySQL
EXIT;
```

### 2. 配置环境变量
复制环境变量示例文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 使用root用户（开发环境）
DATABASE_URL="mysql://root:your_root_password@localhost:3306/ai_requirement_analyzer"

# 或使用专用用户（推荐）
DATABASE_URL="mysql://ai_user:your_password@localhost:3306/ai_requirement_analyzer"

# OpenAI API密钥
OPENAI_API_KEY="your-openai-api-key-here"

# NextAuth配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 3. 初始化数据库
```bash
# 生成Prisma客户端
pnpm prisma generate

# 推送数据库模式
pnpm prisma db push

# 验证数据库连接
pnpm prisma db seed # 如果有种子数据
```

## 数据库管理

### 查看数据库
使用Prisma Studio查看和管理数据：
```bash
pnpm prisma studio
```
访问 http://localhost:5555 查看数据库内容。

### 重置数据库
如果需要重置数据库：
```bash
pnpm prisma db push --force-reset
```

### 数据库迁移
在生产环境中使用迁移：
```bash
# 创建迁移
pnpm prisma migrate dev --name init

# 应用迁移
pnpm prisma migrate deploy
```

## 数据模型说明

### 核心表结构

1. **users** - 用户表
   - 存储用户基本信息
   - 关联项目

2. **projects** - 项目表
   - 项目基本信息和状态
   - 关联需求和模块

3. **requirements** - 需求表
   - 需求文档内容
   - 类型、优先级、状态

4. **requirement_analyses** - 需求分析表
   - AI分析结果
   - 摘要、关键功能、复杂度

5. **modules** - 功能模块表
   - 模块信息和状态
   - 关联开发任务

6. **tasks** - 开发任务表
   - 原子化开发任务
   - 生成的代码和技术栈

### 关系说明
- User 1:N Project
- Project 1:N Requirement
- Project 1:N Module
- Requirement 1:1 RequirementAnalysis
- Module 1:N Task

## 故障排除

### 常见问题

1. **连接被拒绝**
   ```
   Error: P1001: Can't reach database server
   ```
   - 检查MySQL服务是否运行
   - 验证连接字符串中的主机和端口
   - 检查防火墙设置

2. **认证失败**
   ```
   Error: P1000: Authentication failed
   ```
   - 验证用户名和密码
   - 检查用户权限
   - 确认数据库存在

3. **字符集问题**
   ```
   Error: Incorrect string value
   ```
   - 确保数据库使用 utf8mb4 字符集
   - 检查表的字符集设置

### 性能优化

1. **索引优化**
   - Prisma会自动创建必要的索引
   - 根据查询模式添加复合索引

2. **连接池配置**
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/db?connection_limit=10&pool_timeout=20"
   ```

3. **查询优化**
   - 使用 `select` 和 `include` 优化查询
   - 避免 N+1 查询问题

## 生产环境部署

### 环境变量
```env
DATABASE_URL="mysql://user:password@prod-host:3306/ai_requirement_analyzer?sslmode=require"
```

### 安全建议
1. 使用专用数据库用户
2. 启用SSL连接
3. 定期备份数据库
4. 监控数据库性能
5. 设置适当的连接限制

### 备份策略
```bash
# 创建备份
mysqldump -u user -p ai_requirement_analyzer > backup.sql

# 恢复备份
mysql -u user -p ai_requirement_analyzer < backup.sql
```

## 开发工具

### 推荐工具
- **MySQL Workbench** - 图形化管理工具
- **Prisma Studio** - 数据浏览和编辑
- **DBeaver** - 通用数据库工具
- **phpMyAdmin** - Web界面管理

### 监控工具
- **MySQL Performance Schema**
- **Slow Query Log**
- **EXPLAIN 分析查询计划**

---

如有问题，请参考 [Prisma文档](https://www.prisma.io/docs/) 或 [MySQL文档](https://dev.mysql.com/doc/)。
