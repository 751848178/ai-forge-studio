import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface RequirementAnalysisResult {
  summary: string
  keyFeatures: string[]
  complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  estimatedHours: number
  suggestions: string
  modules: {
    name: string
    description: string
    type: 'FEATURE' | 'COMPONENT' | 'SERVICE' | 'UTILITY' | 'INTEGRATION'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    estimatedHours: number
    tasks: {
      title: string
      description: string
      type: 'DEVELOPMENT' | 'TESTING' | 'DOCUMENTATION' | 'DEPLOYMENT' | 'REFACTORING'
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
      estimatedHours: number
      techStack: string[]
      filePath?: string
    }[]
  }[]
}

export async function analyzeRequirement(content: string): Promise<RequirementAnalysisResult> {
  const prompt = `
作为一个资深的软件架构师和项目经理，请分析以下需求文档，并按照指定的JSON格式返回分析结果：

需求文档内容：
${content}

请按照以下JSON格式返回分析结果：
{
  "summary": "需求的简洁摘要",
  "keyFeatures": ["关键功能点1", "关键功能点2", "..."],
  "complexity": "LOW|MEDIUM|HIGH|VERY_HIGH",
  "estimatedHours": 总预估工时数字,
  "suggestions": "实现建议和注意事项",
  "modules": [
    {
      "name": "模块名称",
      "description": "模块描述",
      "type": "FEATURE|COMPONENT|SERVICE|UTILITY|INTEGRATION",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "estimatedHours": 模块预估工时,
      "tasks": [
        {
          "title": "任务标题",
          "description": "任务描述",
          "type": "DEVELOPMENT|TESTING|DOCUMENTATION|DEPLOYMENT|REFACTORING",
          "priority": "LOW|MEDIUM|HIGH|URGENT",
          "estimatedHours": 任务预估工时,
          "techStack": ["技术栈1", "技术栈2"],
          "filePath": "建议的文件路径（可选）"
        }
      ]
    }
  ]
}

分析要求：
1. 将需求拆解为合理的功能模块
2. 每个模块进一步拆解为原子化的开发任务
3. 每个任务应该是独立的、可测试的代码单元
4. 合理评估复杂度和工时
5. 提供技术实现建议
6. 考虑前端React和后端Node.js的技术栈

请只返回JSON格式的结果，不要包含其他文字说明。
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的软件需求分析师，擅长将复杂需求拆解为可执行的开发任务。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })

    const result = response.choices[0]?.message?.content
    if (!result) {
      throw new Error('No response from OpenAI')
    }

    // 尝试解析JSON
    try {
      return JSON.parse(result) as RequirementAnalysisResult
    } catch (parseError) {
      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as RequirementAnalysisResult
      }
      throw new Error('Failed to parse AI response as JSON')
    }
  } catch (error) {
    console.error('Error analyzing requirement:', error)
    throw error
  }
}

export async function generateCode(taskDescription: string, techStack: string[], filePath?: string): Promise<string> {
  const prompt = `
作为一个资深的全栈开发工程师，请根据以下任务描述生成高质量的代码：

任务描述：${taskDescription}
技术栈：${techStack.join(', ')}
${filePath ? `文件路径：${filePath}` : ''}

要求：
1. 生成完整、可运行的代码
2. 遵循最佳实践和编码规范
3. 包含必要的类型定义（如果是TypeScript）
4. 添加适当的注释
5. 考虑错误处理和边界情况
6. 如果是React组件，使用函数式组件和Hooks
7. 如果是API路由，包含适当的验证和错误处理

请只返回代码，不要包含其他说明文字。
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的全栈开发工程师，擅长编写高质量、可维护的代码。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 3000
    })

    const result = response.choices[0]?.message?.content
    if (!result) {
      throw new Error('No response from OpenAI')
    }

    return result
  } catch (error) {
    console.error('Error generating code:', error)
    throw error
  }
}
