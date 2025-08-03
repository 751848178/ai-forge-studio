import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// 类型定义
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'ARCHIVED'
  userId: string
  createdAt: string
  updatedAt: string
  requirements?: Requirement[]
  modules?: Module[]
  _count?: {
    requirements: number
    modules: number
  }
}

export interface Requirement {
  id: string
  title: string
  content: string
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'BUSINESS' | 'TECHNICAL'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'ANALYZING' | 'ANALYZED' | 'APPROVED' | 'REJECTED'
  projectId: string
  createdAt: string
  updatedAt: string
  analysis?: RequirementAnalysis
  project?: {
    id: string
    name: string
  }
}

export interface RequirementAnalysis {
  id: string
  summary: string
  keyFeatures: string[]
  complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  estimatedHours?: number
  suggestions?: string
  requirementId: string
  createdAt: string
  updatedAt: string
}

export interface Module {
  id: string
  name: string
  description?: string
  type: 'FEATURE' | 'COMPONENT' | 'SERVICE' | 'UTILITY' | 'INTEGRATION'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'TESTING' | 'COMPLETED' | 'BLOCKED'
  estimatedHours?: number
  actualHours?: number
  projectId: string
  createdAt: string
  updatedAt: string
  tasks?: Task[]
}

export interface Task {
  id: string
  title: string
  description?: string
  type: 'DEVELOPMENT' | 'TESTING' | 'DOCUMENTATION' | 'DEPLOYMENT' | 'REFACTORING'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'TESTING' | 'COMPLETED' | 'BLOCKED'
  estimatedHours?: number
  actualHours?: number
  techStack?: string[]
  generatedCode?: string
  codeLanguage?: string
  filePath?: string
  moduleId: string
  createdAt: string
  updatedAt: string
  module?: {
    id: string
    name: string
    project: {
      id: string
      name: string
    }
  }
}

// Store 接口定义
interface AppState {
  // 用户状态
  user: User | null
  setUser: (user: User | null) => void

  // 项目状态
  projects: Project[]
  currentProject: Project | null
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void

  // 需求状态
  requirements: Requirement[]
  currentRequirement: Requirement | null
  setRequirements: (requirements: Requirement[]) => void
  setCurrentRequirement: (requirement: Requirement | null) => void
  addRequirement: (requirement: Requirement) => void
  updateRequirement: (id: string, updates: Partial<Requirement>) => void

  // 模块状态
  modules: Module[]
  currentModule: Module | null
  setModules: (modules: Module[]) => void
  setCurrentModule: (module: Module | null) => void
  addModule: (module: Module) => void
  updateModule: (id: string, updates: Partial<Module>) => void

  // 任务状态
  tasks: Task[]
  currentTask: Task | null
  setTasks: (tasks: Task[]) => void
  setCurrentTask: (task: Task | null) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void

  // UI 状态
  loading: boolean
  setLoading: (loading: boolean) => void
  
  // 侧边栏状态
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

// 创建 Store
export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // 用户状态
      user: null,
      setUser: (user) => set({ user }),

      // 项目状态
      projects: [],
      currentProject: null,
      setProjects: (projects) => set({ projects }),
      setCurrentProject: (project) => set({ currentProject: project }),
      addProject: (project) => set((state) => ({ 
        projects: [project, ...state.projects] 
      })),
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(p => 
          p.id === id ? { ...p, ...updates } : p
        ),
        currentProject: state.currentProject?.id === id 
          ? { ...state.currentProject, ...updates }
          : state.currentProject
      })),

      // 需求状态
      requirements: [],
      currentRequirement: null,
      setRequirements: (requirements) => set({ requirements }),
      setCurrentRequirement: (requirement) => set({ currentRequirement: requirement }),
      addRequirement: (requirement) => set((state) => ({ 
        requirements: [requirement, ...state.requirements] 
      })),
      updateRequirement: (id, updates) => set((state) => ({
        requirements: state.requirements.map(r => 
          r.id === id ? { ...r, ...updates } : r
        ),
        currentRequirement: state.currentRequirement?.id === id 
          ? { ...state.currentRequirement, ...updates }
          : state.currentRequirement
      })),

      // 模块状态
      modules: [],
      currentModule: null,
      setModules: (modules) => set({ modules }),
      setCurrentModule: (module) => set({ currentModule: module }),
      addModule: (module) => set((state) => ({ 
        modules: [module, ...state.modules] 
      })),
      updateModule: (id, updates) => set((state) => ({
        modules: state.modules.map(m => 
          m.id === id ? { ...m, ...updates } : m
        ),
        currentModule: state.currentModule?.id === id 
          ? { ...state.currentModule, ...updates }
          : state.currentModule
      })),

      // 任务状态
      tasks: [],
      currentTask: null,
      setTasks: (tasks) => set({ tasks }),
      setCurrentTask: (task) => set({ currentTask: task }),
      addTask: (task) => set((state) => ({ 
        tasks: [task, ...state.tasks] 
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === id ? { ...t, ...updates } : t
        ),
        currentTask: state.currentTask?.id === id 
          ? { ...state.currentTask, ...updates }
          : state.currentTask
      })),

      // UI 状态
      loading: false,
      setLoading: (loading) => set({ loading }),
      
      // 侧边栏状态
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'ai-requirement-analyzer-store',
    }
  )
)
