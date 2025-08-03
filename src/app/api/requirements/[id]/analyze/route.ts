import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeRequirement } from '@/lib/openai'

// POST /api/requirements/[id]/analyze - 分析需求并生成模块和任务
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requirementId = params.id

    // 获取需求信息
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: true }
    })

    if (!requirement) {
      return NextResponse.json({ error: '需求不存在' }, { status: 404 })
    }

    // 更新需求状态为分析中
    await prisma.requirement.update({
      where: { id: requirementId },
      data: { status: 'ANALYZING' }
    })

    try {
      // 使用AI分析需求
      const analysisResult = await analyzeRequirement(requirement.content)

      // 使用事务保存分析结果
      const result = await prisma.$transaction(async (tx) => {
        // 保存需求分析结果
        const analysis = await tx.requirementAnalysis.create({
          data: {
            requirementId,
            summary: analysisResult.summary,
            keyFeatures: analysisResult.keyFeatures,
            complexity: analysisResult.complexity,
            estimatedHours: analysisResult.estimatedHours,
            suggestions: analysisResult.suggestions,
          }
        })

        // 创建功能模块和任务
        const modules = []
        for (const moduleData of analysisResult.modules) {
          const module = await tx.module.create({
            data: {
              projectId: requirement.projectId,
              name: moduleData.name,
              description: moduleData.description,
              type: moduleData.type,
              priority: moduleData.priority,
              estimatedHours: moduleData.estimatedHours,
            }
          })

          // 创建模块的任务
          const tasks = []
          for (const taskData of moduleData.tasks) {
            const task = await tx.task.create({
              data: {
                moduleId: module.id,
                title: taskData.title,
                description: taskData.description,
                type: taskData.type,
                priority: taskData.priority,
                estimatedHours: taskData.estimatedHours,
                techStack: taskData.techStack,
                filePath: taskData.filePath,
              }
            })
            tasks.push(task)
          }

          modules.push({ ...module, tasks })
        }

        // 更新需求状态为已分析
        await tx.requirement.update({
          where: { id: requirementId },
          data: { status: 'ANALYZED' }
        })

        return { analysis, modules }
      })

      // 返回完整的分析结果
      const updatedRequirement = await prisma.requirement.findUnique({
        where: { id: requirementId },
        include: {
          analysis: true,
          project: {
            include: {
              modules: {
                include: {
                  tasks: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json({
        requirement: updatedRequirement,
        analysis: result.analysis,
        modules: result.modules
      })

    } catch (aiError) {
      // AI分析失败，更新需求状态
      await prisma.requirement.update({
        where: { id: requirementId },
        data: { status: 'PENDING' }
      })
      
      console.error('AI analysis failed:', aiError)
      return NextResponse.json({ 
        error: 'AI分析失败，请稍后重试',
        details: aiError instanceof Error ? aiError.message : '未知错误'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error analyzing requirement:', error)
    return NextResponse.json({ error: '分析需求失败' }, { status: 500 })
  }
}
