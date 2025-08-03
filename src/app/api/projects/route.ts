import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string().optional(),
  userId: z.string().min(1, '用户ID不能为空'),
})

// GET /api/projects - 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        requirements: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        modules: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        },
        _count: {
          select: {
            requirements: true,
            modules: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: '获取项目列表失败' }, { status: 500 })
  }
}

// POST /api/projects - 创建新项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    const project = await prisma.project.create({
      data: validatedData,
      include: {
        requirements: true,
        modules: true,
        _count: {
          select: {
            requirements: true,
            modules: true,
          }
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating project:', error)
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 })
  }
}
