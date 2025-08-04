import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建种子数据...')

  // 创建租户
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ai-forge-studio' },
    update: {},
    create: {
      name: 'AI Forge Studio',
      slug: 'ai-forge-studio',
      adminId: 'temp-admin-id', // 临时管理员ID，稍后会更新
      settings: {
        allowUserRegistration: true,
        defaultUserRole: 'MEMBER',
      },
    },
  })

  console.log('创建租户:', tenant.name)

  // 创建测试用户
  const user = await prisma.user.upsert({
    where: { email: '494593337@qq.com' },
    update: {},
    create: {
      email: '494593337@qq.com',
      name: '测试用户',
      currentTenantId: tenant.id,
    },
  })

  console.log('创建用户:', user.email)

  // 更新租户的管理员ID
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { adminId: user.id },
  })

  // 创建用户租户关系
  await prisma.tenantMember.upsert({
    where: {
      tenantId_userId: {
        userId: user.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })

  console.log('创建用户租户关系')

  // 创建租户配额
  await prisma.tenantQuota.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      maxProjects: 50,
      maxUsers: 20,
      maxRequirements: 500,
      maxAIRequests: 5000,
      maxStorage: 1073741824, // 1GB
    },
  })

  console.log('创建租户配额')

  // 创建测试项目
  const project = await prisma.project.create({
    data: {
      name: '示例项目',
      description: '这是一个示例项目，用于演示平台功能',
      tenantId: tenant.id,
      status: 'PLANNING',
    },
  })

  console.log('创建项目:', project.name)

  // 创建测试需求
  const requirement = await prisma.requirement.create({
    data: {
      title: '用户管理功能',
      content: `实现完整的用户管理系统，包括用户注册、登录、个人信息管理等功能。支持邮箱注册、密码验证、JWT身份验证等。`,
      projectId: project.id,
      tenantId: tenant.id,
      type: 'FUNCTIONAL',
      priority: 'HIGH',
      status: 'PENDING',
    },
  })

  console.log('创建需求:', requirement.title)

  // 创建功能模块
  const module = await prisma.module.create({
    data: {
      name: '用户认证模块',
      description: '处理用户注册、登录、认证相关功能',
      type: 'FEATURE',
      priority: 'HIGH',
      status: 'TODO',
      estimatedHours: 40,
      projectId: project.id,
      tenantId: tenant.id,
    },
  })

  console.log('创建模块:', module.name)

  // 创建开发任务
  const task = await prisma.task.create({
    data: {
      title: '实现用户登录API',
      description: '创建用户登录接口，支持邮箱密码登录',
      type: 'DEVELOPMENT',
      priority: 'HIGH',
      status: 'TODO',
      estimatedHours: 8,
      techStack: {
        backend: ['Node.js', 'Express', 'JWT'],
        database: ['MySQL', 'Prisma'],
        validation: ['Zod']
      },
      filePath: 'src/app/api/auth/login/route.ts',
      moduleId: module.id,
      tenantId: tenant.id,
    },
  })

  console.log('创建任务:', task.title)

  console.log('种子数据创建完成!')
}

main()
  .catch((e) => {
    console.error('种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
