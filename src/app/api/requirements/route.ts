import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeRequirement } from '@/lib/openai'
import { z } from 'zod'

const createRequirementSchema = z.object({
  title: z.string().min(1, '需求标题不能为空'),
  content: z.string().min(1, '需求内容不能为空'),
  projectId: z.string().min(1, '项目ID不能为空'),
  type: z.enum(['FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS', 'TECHNICAL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

// GET /api/requirements - 获取需求列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: '缺少项目ID' }, { status: 400 })
    }

    const requirements = await prisma.requirement.findMany({
      where: { projectId },
      include: {
        analysis: true,
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(requirements)
  } catch (error) {
    console.error('Error fetching requirements:', error)
    return NextResponse.json({ error: '获取需求列表失败' }, { status: 500 })
  }
}

// POST /api/requirements - 创建新需求
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createRequirementSchema.parse(body)

    const requirement = await prisma.requirement.create({
      data: validatedData,
      include: {
        analysis: true,
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json(requirement, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating requirement:', error)
    return NextResponse.json({ error: '创建需求失败' }, { status: 500 })
  }
}
