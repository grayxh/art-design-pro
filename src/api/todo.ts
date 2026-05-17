import { createTodoWorkflowList, type TodoWorkflowItem } from '@/mock/temp/todoWorkflow'

export function fetchGetTodoWorkflowList(): Promise<TodoWorkflowItem[]> {
  return Promise.resolve(createTodoWorkflowList())
}
