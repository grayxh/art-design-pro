export interface TodoWorkflowStep {
  label: string
  completed: boolean
  completedAt?: string
}

export interface TodoWorkflowItem {
  id: number
  title: string
  owner: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  currentStep: number
  steps: TodoWorkflowStep[]
}

export type TodoWorkflowStatus = 'not_started' | 'in_progress' | 'completed'

export const TODO_WORKFLOW_STEP_LABELS = ['步骤1', '步骤2', '步骤3', '步骤4', '步骤5', '步骤6']

const createSteps = (completedCount: number): TodoWorkflowStep[] =>
  TODO_WORKFLOW_STEP_LABELS.map((label, index) => ({
    label,
    completed: index < completedCount,
    completedAt: index < completedCount ? `2026-04-${String(index + 10).padStart(2, '0')}` : ''
  }))

const TODO_WORKFLOW_MOCK: Omit<TodoWorkflowItem, 'currentStep'>[] = [
  {
    id: 1,
    title: '北江航道项目周报提报',
    owner: '张颖',
    dueDate: '2026-04-24',
    priority: 'high',
    steps: createSteps(0)
  },
  {
    id: 2,
    title: '分包合同审批流转',
    owner: '李铭',
    dueDate: '2026-04-25',
    priority: 'high',
    steps: createSteps(1)
  },
  {
    id: 3,
    title: '现场安全巡检闭环',
    owner: '王楠',
    dueDate: '2026-04-26',
    priority: 'medium',
    steps: createSteps(2)
  },
  {
    id: 4,
    title: '月度计量资料复核',
    owner: '周洁',
    dueDate: '2026-04-27',
    priority: 'medium',
    steps: createSteps(3)
  },
  {
    id: 5,
    title: '劳务实名制数据校验',
    owner: '陈思',
    dueDate: '2026-04-28',
    priority: 'low',
    steps: createSteps(4)
  },
  {
    id: 6,
    title: '材料进场验收归档',
    owner: '何凯',
    dueDate: '2026-04-29',
    priority: 'medium',
    steps: createSteps(5)
  },
  {
    id: 7,
    title: '施工方案内部评审',
    owner: '刘婷',
    dueDate: '2026-04-30',
    priority: 'high',
    steps: createSteps(6)
  },
  {
    id: 8,
    title: '专项会议纪要确认',
    owner: '赵恒',
    dueDate: '2026-05-02',
    priority: 'low',
    steps: createSteps(2)
  },
  {
    id: 9,
    title: '关键设备维保登记',
    owner: '杨帆',
    dueDate: '2026-05-03',
    priority: 'medium',
    steps: createSteps(1)
  },
  {
    id: 10,
    title: '船机调度申请处理',
    owner: '宋雪',
    dueDate: '2026-05-04',
    priority: 'high',
    steps: createSteps(4)
  },
  {
    id: 11,
    title: '设计变更签认跟踪',
    owner: '高原',
    dueDate: '2026-05-05',
    priority: 'high',
    steps: createSteps(3)
  },
  {
    id: 12,
    title: '班组进场资料补全',
    owner: '许诺',
    dueDate: '2026-05-06',
    priority: 'low',
    steps: createSteps(0)
  }
]

export function getTodoWorkflowStatus(item: Pick<TodoWorkflowItem, 'steps'>): TodoWorkflowStatus {
  const completedCount = item.steps.filter((step) => step.completed).length
  if (completedCount === 0) return 'not_started'
  if (completedCount === item.steps.length) return 'completed'
  return 'in_progress'
}

export function getTodoWorkflowCurrentStep(item: Pick<TodoWorkflowItem, 'steps'>): number {
  const firstPendingIndex = item.steps.findIndex((step) => !step.completed)
  return firstPendingIndex === -1 ? item.steps.length : firstPendingIndex
}

export function getTodoWorkflowCurrentStepLabel(item: Pick<TodoWorkflowItem, 'steps'>): string {
  const currentStep = getTodoWorkflowCurrentStep(item)
  return currentStep >= item.steps.length ? '已完成' : item.steps[currentStep].label
}

export function createTodoWorkflowList(): TodoWorkflowItem[] {
  return TODO_WORKFLOW_MOCK.map((item) => {
    const steps = item.steps.map((step) => ({ ...step }))
    return {
      ...item,
      steps,
      currentStep: getTodoWorkflowCurrentStep({ steps })
    }
  })
}
