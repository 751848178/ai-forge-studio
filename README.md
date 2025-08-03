# AI需求分析平台

基于AI的需求分析和代码生成平台，使用React + Next.js前端和Node.js后端，帮助开发团队智能分析需求文档，自动拆解功能模块，生成原子化开发任务和代码。

## 🚀 功能特性

### 核心功能
- **智能需求分析**: 使用OpenAI GPT-4分析需求文档，提取关键功能点
- **自动模块拆解**: 将复杂需求智能拆解为可管理的功能模块
- **原子化任务生成**: 每个模块进一步拆解为独立的开发任务
- **AI代码生成**: 为每个任务生成高质量的代码片段
- **项目管理**: 完整的项目生命周期管理
- **进度跟踪**: 实时跟踪开发进度和任务状态

### 技术特性
- **现代化技术栈**: Next.js 15 + React 19 + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **UI组件**: Ant Design + Tailwind CSS
- **状态管理**: Zustand
- **AI集成**: OpenAI GPT-4
- **类型安全**: 完整的TypeScript支持

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **UI库**: React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS + Ant Design
- **状态管理**: Zustand
- **图标**: Ant Design Icons

### 后端
- **运行时**: Node.js
- **框架**: Next.js API Routes
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **验证**: Zod
- **AI服务**: OpenAI API

### 开发工具
- **包管理**: pnpm
- **代码规范**: ESLint
- **类型检查**: TypeScript
- **构建工具**: Next.js (Turbopack)

## 📦 安装和运行

### 环境要求
- Node.js 18+
- PostgreSQL 12+
- pnpm 8+

### 1. 克隆项目
```bash
git clone <repository-url>
cd ai-requirement-analyzer
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 环境配置
复制环境变量模板并配置：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：
```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/ai_requirement_analyzer"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI API
OPENAI_API_KEY="your-openai-api-key-here"

# GitHub集成（可选）
GITHUB_TOKEN="your-github-token-here"
```

### 4. 数据库设置
```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# （可选）查看数据库
npx prisma studio
```

### 5. 启动开发服务器
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
ai-requirement-analyzer/
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── public/                    # 静态资源
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API路由
│   │   │   ├── projects/     # 项目管理API
│   │   │   ├── requirements/ # 需求管理API
│   │   │   └── tasks/        # 任务管理API
│   │   ├── projects/         # 项目管理页面
│   │   ├── requirements/     # 需求管理页面
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 首页
│   ├── lib/                  # 工具库
│   │   ├── prisma.ts         # Prisma客户端
│   │   └── openai.ts         # OpenAI服务
│   ├── store/                # 状态管理
│   │   └── index.ts          # Zustand store
│   └── generated/            # 生成的文件
│       └── prisma/           # Prisma客户端
├── .env.example              # 环境变量模板
├── package.json              # 项目配置
└── README.md                 # 项目文档
```

## 🎯 使用指南

### 1. 创建项目
1. 访问首页，点击"创建新项目"
2. 填写项目名称和描述
3. 选择项目状态

### 2. 添加需求
1. 进入项目详情页
2. 点击"添加需求文档"
3. 输入需求标题和详细内容
4. 选择需求类型和优先级

### 3. AI分析需求
1. 在需求列表中找到待分析的需求
2. 点击"AI分析"按钮
3. 系统将自动：
   - 分析需求内容
   - 提取关键功能点
   - 评估复杂度和工时
   - 拆解为功能模块
   - 生成开发任务

### 4. 生成代码
1. 查看生成的任务列表
2. 选择需要生成代码的任务
3. 点击"生成代码"
4. 系统将根据任务描述和技术栈生成代码

### 5. 项目管理
- 跟踪项目进度
- 管理任务状态
- 查看工时统计
- 导出项目报告

## 🔧 API文档

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建新项目
- `PUT /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目

### 需求管理
- `GET /api/requirements` - 获取需求列表
- `POST /api/requirements` - 创建新需求
- `POST /api/requirements/[id]/analyze` - AI分析需求

### 任务管理
- `POST /api/tasks/[id]/generate-code` - 生成任务代码

## 🗄️ 数据模型

### 核心实体
- **User**: 用户信息
- **Project**: 项目信息
- **Requirement**: 需求文档
- **RequirementAnalysis**: AI分析结果
- **Module**: 功能模块
- **Task**: 开发任务

### 关系图
```
User (1) ──── (N) Project
Project (1) ──── (N) Requirement
Project (1) ──── (N) Module
Requirement (1) ──── (1) RequirementAnalysis
Module (1) ──── (N) Task
```

## 🤖 AI集成

### OpenAI配置
项目使用OpenAI GPT-4进行智能分析：
- **需求分析**: 提取功能点、评估复杂度
- **模块拆解**: 将需求拆分为逻辑模块
- **任务生成**: 创建原子化开发任务
- **代码生成**: 生成高质量代码片段

### 提示工程
系统使用精心设计的提示模板：
- 结构化输出格式
- 上下文感知分析
- 技术栈适配
- 最佳实践集成

## 🚀 部署

### 生产构建
```bash
pnpm build
pnpm start
```

### Docker部署
```dockerfile
# Dockerfile示例
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 环境变量
生产环境需要配置：
- `DATABASE_URL`: 生产数据库连接
- `NEXTAUTH_SECRET`: 安全密钥
- `OPENAI_API_KEY`: OpenAI API密钥

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Ant Design](https://ant.design/) - UI组件库
- [Prisma](https://prisma.io/) - 数据库ORM
- [OpenAI](https://openai.com/) - AI服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

## 📞 支持

如有问题或建议，请：
- 创建Issue
- 发送邮件至：support@example.com
- 查看文档：[项目Wiki](wiki-url)

---

**AI需求分析平台** - 让需求分析更智能，让开发更高效！
