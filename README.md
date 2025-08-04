# AI需求分析平台

一个基于AI的需求分析平台，能够自动将需求文档拆解为功能模块和开发任务，并生成相应的代码。

## 🚀 功能特性

### 核心功能
- **智能需求分析**: 使用AI分析需求文档，自动提取关键功能点
- **模块化拆解**: 将复杂需求拆分为可管理的功能模块
- **任务生成**: 为每个模块生成具体的开发任务
- **代码生成**: 为每个任务自动生成高质量的代码
- **项目管理**: 完整的项目生命周期管理

### 技术特性
- **现代化技术栈**: Next.js 15 + React 19 + TypeScript
- **AI集成**: OpenAI GPT模型驱动的智能分析
- **类型安全**: 完整的TypeScript类型定义
- **响应式设计**: 基于Ant Design的现代UI
- **数据持久化**: Prisma ORM + MySQL

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **UI库**: React 19 + TypeScript
- **组件库**: Ant Design 5.x
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **表单验证**: Zod

### 后端
- **API**: Next.js API Routes
- **数据库**: MySQL
- **ORM**: Prisma
- **AI服务**: OpenAI API
- **验证**: Zod schemas

### 开发工具
- **包管理**: pnpm
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript
- **开发规则**: .clinerules配置

## 📁 项目结构

```
ai-requirement-analyzer/
├── prisma/                    # 数据库模式和迁移
│   └── schema.prisma         # Prisma数据模型
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API路由
│   │   │   ├── projects/    # 项目相关API
│   │   │   ├── requirements/ # 需求相关API
│   │   │   └── tasks/       # 任务相关API
│   │   ├── projects/        # 项目页面
│   │   ├── requirements/    # 需求页面
│   │   ├── layout.tsx       # 根布局
│   │   └── page.tsx         # 首页
│   ├── lib/                 # 工具库
│   │   ├── prisma.ts        # Prisma客户端
│   │   └── openai.ts        # OpenAI服务
│   └── store/               # 状态管理
│       └── index.ts         # Zustand store
├── .clinerules/             # 开发规则配置
│   ├── ai-platform-development.md
│   ├── api-development-patterns.md
│   ├── component-architecture.md
│   └── react-hooks-patterns.md
├── .env.example             # 环境变量示例
└── README.md               # 项目文档
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- OpenAI API密钥

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd ai-requirement-analyzer
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：
```env
# 数据库连接
DATABASE_URL="mysql://username:password@localhost:3306/ai_requirement_analyzer"

# OpenAI API
OPENAI_API_KEY="your-openai-api-key"

# Next.js配置
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

4. **初始化数据库**
```bash
# 生成Prisma客户端
pnpm prisma generate

# 运行数据库迁移
pnpm prisma db push

# (可选) 查看数据库
pnpm prisma studio
```

5. **启动开发服务器**
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📖 使用指南

### 1. 创建项目
- 在首页点击"创建新项目"
- 填写项目名称和描述
- 选择项目状态和优先级

### 2. 添加需求
- 进入项目详情页
- 点击"添加需求文档"
- 输入需求标题和详细内容
- 选择需求类型和优先级

### 3. AI分析需求
- 在需求详情页点击"AI分析"
- 系统将自动分析需求内容
- 生成需求摘要、关键功能点和复杂度评估
- 自动拆解为功能模块和开发任务

### 4. 查看分析结果
- 查看AI生成的需求摘要
- 浏览功能模块列表
- 查看每个模块的开发任务
- 查看预估工时和技术栈建议

### 5. 代码生成
- 选择具体的开发任务
- 点击"生成代码"
- 查看AI生成的代码
- 下载或复制代码到项目中

## 🔧 API文档

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建新项目
- `GET /api/projects/[id]` - 获取项目详情
- `PUT /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目

### 需求管理
- `GET /api/requirements` - 获取需求列表
- `POST /api/requirements` - 创建新需求
- `GET /api/requirements/[id]` - 获取需求详情
- `PUT /api/requirements/[id]` - 更新需求
- `DELETE /api/requirements/[id]` - 删除需求
- `POST /api/requirements/[id]/analyze` - AI分析需求

### 任务管理
- `POST /api/tasks/[id]/generate-code` - 为任务生成代码

## 🎯 核心特性详解

### AI需求分析
系统使用OpenAI GPT模型对需求文档进行智能分析：
- **需求理解**: 深度理解需求内容和业务逻辑
- **功能提取**: 自动识别和提取关键功能点
- **复杂度评估**: 评估开发复杂度和预估工时
- **模块拆解**: 将需求拆分为逻辑清晰的功能模块
- **任务生成**: 为每个模块生成具体的开发任务

### 代码生成
为每个开发任务生成高质量的代码：
- **技术栈适配**: 根据项目技术栈生成相应代码
- **最佳实践**: 遵循行业最佳实践和编码规范
- **类型安全**: 生成完整的TypeScript类型定义
- **组件化**: 生成可复用的React组件
- **API集成**: 生成完整的前后端API集成代码

### 项目管理
完整的项目生命周期管理：
- **项目创建**: 快速创建和配置新项目
- **需求管理**: 结构化的需求文档管理
- **进度跟踪**: 实时跟踪项目和任务进度
- **团队协作**: 支持多人协作开发
- **版本控制**: 完整的变更历史记录

## 🔒 开发规范

项目遵循严格的开发规范，详见 `.clinerules/` 目录：

### 通用规范
- 所有开发沟通使用中文
- 代码注释和文档使用中文
- 变量和函数名使用英文
- 遵循TypeScript最佳实践

### API开发
- 使用RESTful设计模式
- 实现完整的错误处理
- 使用Zod进行请求验证
- 返回一致的JSON响应格式

### 组件开发
- 使用函数式组件和Hooks
- 实现完整的TypeScript类型
- 遵循Ant Design设计规范
- 实现响应式设计

### 状态管理
- 使用Zustand进行状态管理
- 实现领域分离的store结构
- 包含完整的loading和error状态

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React全栈框架
- [Ant Design](https://ant.design/) - 企业级UI设计语言
- [Prisma](https://prisma.io/) - 现代数据库工具包
- [OpenAI](https://openai.com/) - AI能力支持
- [Zustand](https://github.com/pmndrs/zustand) - 轻量级状态管理

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 创建 [Issue](../../issues)
- 发送邮件至: [your-email@example.com]

---

**AI需求分析平台** - 让AI助力软件开发，提升开发效率 🚀
