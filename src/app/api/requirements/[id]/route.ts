import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRequirementSchema = z.object({
  title: z.string().min(1, '需求标题不能为空').optional(),
  content: z.string().min(1, '需求内容不能为空').optional(),
  type: z.enum(['FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS', 'TECHNICAL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'ANALYZING', 'ANALYZED', 'APPROVED', 'REJECTED']).optional(),
})

// GET /api/requirements/[id] - 获取单个需求详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requirementId = params.id

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
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

    if (!requirement) {
      return NextResponse.json({ error: '需求不存在' }, { status: 404 })
    }

    return NextResponse.json(requirement)
  } catch (error) {
    console.error('Error fetching requirement:', error)
    return NextResponse.json({ error: '获取需求详情失败' }, { status: 500 })
  }
}

// PUT /api/requirements/[id] - 更新需求
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requirementId = params.id
    const body = await request.json()
    const validatedData = updateRequirementSchema.parse(body)

    const requirement = await prisma.requirement.update({
      where: { id: requirementId },
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

    return NextResponse.json(requirement)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating requirement:', error)
    return NextResponse.json({ error: '更新需求失败' }, { status: 500 })
  }
}

// DELETE /api/requirements/[id] - 删除需求
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requirementId = params.id

    await prisma.requirement.delete({
      where: { id: requirementId }
    })

    return NextResponse.json({ message: '需求删除成功' })
  } catch (error) {
    console.error('Error deleting requirement:', error)
    return NextResponse.json({ error: '删除需求失败' }, { status: 500 })
  }
}
