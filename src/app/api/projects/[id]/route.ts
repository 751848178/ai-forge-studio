import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'TESTING', 'COMPLETED', 'ARCHIVED']).optional(),
})

// GET /api/projects/[id] - 获取单个项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        requirements: {
          include: {
            analysis: true
          }
        },
        modules: {
          include: {
            tasks: true
          }
        },
        _count: {
          select: {
            requirements: true,
            modules: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: '获取项目详情失败' }, { status: 500 })
  }
}

// PUT /api/projects/[id] - 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    const project = await prisma.project.update({
      where: { id: projectId },
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

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating project:', error)
    return NextResponse.json({ error: '更新项目失败' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    await prisma.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json({ message: '项目删除成功' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: '删除项目失败' }, { status: 500 })
  }
}
