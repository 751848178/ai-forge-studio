import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCode } from '@/lib/openai'

// POST /api/tasks/[id]/generate-code - 为任务生成代码
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    // 获取任务信息
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: {
          include: {
            project: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    // 更新任务状态为进行中
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' }
    })

    try {
      // 构建任务描述
      const taskDescription = `
任务标题: ${task.title}
任务描述: ${task.description || ''}
所属模块: ${task.module.name}
项目名称: ${task.module.project.name}
${task.filePath ? `目标文件路径: ${task.filePath}` : ''}
`

      // 获取技术栈
      const techStack = Array.isArray(task.techStack) 
        ? task.techStack as string[]
        : ['React', 'TypeScript', 'Next.js']

      // 使用AI生成代码
      const generatedCode = await generateCode(
        taskDescription,
        techStack,
        task.filePath || undefined
      )

      // 检测代码语言
      let codeLanguage = 'typescript'
      if (task.filePath) {
        const extension = task.filePath.split('.').pop()?.toLowerCase()
        switch (extension) {
          case 'js':
            codeLanguage = 'javascript'
            break
          case 'ts':
          case 'tsx':
            codeLanguage = 'typescript'
            break
          case 'css':
            codeLanguage = 'css'
            break
          case 'html':
            codeLanguage = 'html'
            break
          case 'json':
            codeLanguage = 'json'
            break
          default:
            codeLanguage = 'typescript'
        }
      }

      // 更新任务，保存生成的代码
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          generatedCode,
          codeLanguage,
          status: 'REVIEW', // 生成完成后需要审查
        },
        include: {
          module: {
            include: {
              project: true
            }
          }
        }
      })

      return NextResponse.json({
        task: updatedTask,
        generatedCode,
        codeLanguage
      })

    } catch (aiError) {
      // AI代码生成失败，恢复任务状态
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'TODO' }
      })
      
      console.error('Code generation failed:', aiError)
      return NextResponse.json({ 
        error: 'AI代码生成失败，请稍后重试',
        details: aiError instanceof Error ? aiError.message : '未知错误'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error generating code for task:', error)
    return NextResponse.json({ error: '生成代码失败' }, { status: 500 })
  }
}
