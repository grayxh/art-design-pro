<template>
  <div class="todo-page art-full-height">
    <ElCard shadow="never" class="mb-4">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3 flex-wrap">
          <ElInput
            v-model="searchForm.keyword"
            placeholder="请输入事项名称"
            clearable
            class="w-64"
            @keyup.enter="handleSearch"
          />
          <ElSelect v-model="searchForm.status" placeholder="全部状态" clearable class="w-36">
            <ElOption label="未开始" value="not_started" />
            <ElOption label="进行中" value="in_progress" />
            <ElOption label="已完成" value="completed" />
          </ElSelect>
          <ElButton type="primary" @click="handleSearch">
            <template #icon><ArtSvgIcon icon="ri:search-line" /></template>
            查询
          </ElButton>
          <ElButton @click="handleReset">
            <template #icon><ArtSvgIcon icon="ri:refresh-line" /></template>
            重置
          </ElButton>
        </div>
        <div class="text-sm text-g-500">
          共 <span class="text-theme font-medium">{{ filteredList.length }}</span> 项待办
        </div>
      </div>
    </ElCard>

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="handleRefresh" />

      <ArtTable
        row-key="id"
        :loading="loading"
        :data="pagedList"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import type { ColumnOption } from '@/types'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { ElMessage, ElTag } from 'element-plus'
  import { fetchGetTodoWorkflowList } from '@/api/todo'
  import {
    TODO_WORKFLOW_STEP_LABELS,
    getTodoWorkflowCurrentStep,
    getTodoWorkflowCurrentStepLabel,
    getTodoWorkflowStatus,
    type TodoWorkflowItem,
    type TodoWorkflowStatus
  } from '@/mock/temp/todoWorkflow'

  defineOptions({ name: 'DashboardTodo' })

  type PriorityType = TodoWorkflowItem['priority']

  interface SearchForm {
    keyword: string
    status: '' | TodoWorkflowStatus
  }

  const loading = ref(false)
  const tableData = ref<TodoWorkflowItem[]>([])
  const searchForm = reactive<SearchForm>({
    keyword: '',
    status: ''
  })
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const PRIORITY_MAP: Record<PriorityType, { label: string; type: 'danger' | 'warning' | 'info' }> =
    {
      high: { label: '高优先级', type: 'danger' },
      medium: { label: '中优先级', type: 'warning' },
      low: { label: '低优先级', type: 'info' }
    }

  const STATUS_MAP: Record<
    TodoWorkflowStatus,
    { label: string; type: 'info' | 'warning' | 'success' }
  > = {
    not_started: { label: '未开始', type: 'info' },
    in_progress: { label: '进行中', type: 'warning' },
    completed: { label: '已完成', type: 'success' }
  }

  const normalizeTodoItem = (item: TodoWorkflowItem): TodoWorkflowItem => ({
    ...item,
    currentStep: getTodoWorkflowCurrentStep(item),
    steps: item.steps.map((step) => ({ ...step }))
  })

  const filteredList = computed(() => {
    const keyword = searchForm.keyword.trim().toLowerCase()

    return tableData.value.filter((item) => {
      const matchesKeyword = !keyword || item.title.toLowerCase().includes(keyword)
      const matchesStatus = !searchForm.status || getTodoWorkflowStatus(item) === searchForm.status
      return matchesKeyword && matchesStatus
    })
  })

  const pagedList = computed(() => {
    const start = (pagination.current - 1) * pagination.size
    return filteredList.value.slice(start, start + pagination.size)
  })

  watch(
    filteredList,
    (list) => {
      pagination.total = list.length

      const maxPage = Math.max(1, Math.ceil(list.length / pagination.size))
      if (pagination.current > maxPage) {
        pagination.current = maxPage
      }
    },
    { immediate: true }
  )

  const getProgressText = (row: TodoWorkflowItem) => {
    const completedCount = row.steps.filter((step) => step.completed).length
    return `${completedCount}/${row.steps.length}`
  }

  const getStepVisualState = (row: TodoWorkflowItem, stepIndex: number) => {
    const step = row.steps[stepIndex]
    if (step.completed) return 'completed'
    if (stepIndex === row.currentStep && getTodoWorkflowStatus(row) !== 'completed')
      return 'current'
    return 'pending'
  }

  const getStepClass = (row: TodoWorkflowItem, stepIndex: number) => {
    const visualState = getStepVisualState(row, stepIndex)
    return ['todo-step-cell', `is-${visualState}`]
  }

  const toggleStepStatus = (row: TodoWorkflowItem, stepIndex: number) => {
    const targetStep = row.steps[stepIndex]

    if (!targetStep.completed) {
      const hasPendingBefore = row.steps.slice(0, stepIndex).some((step) => !step.completed)
      if (hasPendingBefore) {
        ElMessage.warning('请按顺序推进步骤，前置步骤完成后才能继续')
        return
      }

      targetStep.completed = true
      targetStep.completedAt = new Date().toISOString().slice(0, 10)
    } else {
      row.steps.slice(stepIndex).forEach((step) => {
        step.completed = false
        step.completedAt = ''
      })
    }

    row.currentStep = getTodoWorkflowCurrentStep(row)
  }

  const createStepColumn = (label: string, stepIndex: number): ColumnOption<TodoWorkflowItem> => ({
    prop: `step-${stepIndex + 1}`,
    label,
    width: 120,
    align: 'center',
    formatter: (row) =>
      h(
        'button',
        {
          type: 'button',
          class: getStepClass(row, stepIndex),
          onClick: () => toggleStepStatus(row, stepIndex)
        },
        [
          h('span', { class: 'status-text' }, row.steps[stepIndex].completed ? '已完成' : '待处理'),
          h('span', { class: 'status-dot' })
        ]
      )
  })

  const { columns, columnChecks } = useTableColumns<TodoWorkflowItem>(() => [
    {
      prop: 'title',
      label: '事项名称',
      minWidth: 220,
      fixed: 'left',
      formatter: (row) =>
        h('div', { class: 'leading-5' }, [
          h('p', { class: 'font-medium text-g-900' }, row.title),
          h('p', { class: 'text-xs text-g-500 mt-1' }, `负责人：${row.owner}`)
        ])
    },
    {
      prop: 'dueDate',
      label: '截止时间',
      width: 120
    },
    {
      prop: 'priority',
      label: '优先级',
      width: 110,
      align: 'center',
      formatter: (row) => {
        const priority = PRIORITY_MAP[row.priority]
        return h(ElTag, { type: priority.type }, () => priority.label)
      }
    },
    {
      prop: 'currentStepDisplay',
      label: '当前进度',
      width: 150,
      formatter: (row) =>
        h('div', { class: 'leading-5' }, [
          h('p', { class: 'text-g-900 font-medium' }, getTodoWorkflowCurrentStepLabel(row)),
          h('p', { class: 'text-xs text-g-500 mt-1' }, `完成 ${getProgressText(row)}`)
        ])
    },
    {
      prop: 'status',
      label: '整体状态',
      width: 110,
      align: 'center',
      formatter: (row) => {
        const status = STATUS_MAP[getTodoWorkflowStatus(row)]
        return h(ElTag, { type: status.type }, () => status.label)
      }
    },
    ...TODO_WORKFLOW_STEP_LABELS.map((label, stepIndex) => createStepColumn(label, stepIndex))
  ])

  const loadTodoList = async () => {
    loading.value = true

    try {
      const list = await fetchGetTodoWorkflowList()
      tableData.value = list.map(normalizeTodoItem)
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    pagination.current = 1
  }

  const handleReset = async () => {
    searchForm.keyword = ''
    searchForm.status = ''
    pagination.current = 1
    pagination.size = 10
    await loadTodoList()
  }

  const handleRefresh = async () => {
    pagination.current = 1
    await loadTodoList()
  }

  const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
  }

  const handleCurrentChange = (current: number) => {
    pagination.current = current
  }

  onMounted(() => {
    loadTodoList()
  })
</script>

<style lang="scss" scoped>
  :deep(.todo-step-cell) {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 40px;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  :deep(.todo-step-cell .status-dot) {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 999px;
  }

  :deep(.todo-step-cell.is-completed) {
    color: var(--el-color-success);
    background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
    border-color: color-mix(in srgb, var(--el-color-success) 24%, transparent);
  }

  :deep(.todo-step-cell.is-completed .status-dot) {
    background: var(--el-color-success);
  }

  :deep(.todo-step-cell.is-current) {
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 10%, transparent);
    border-color: color-mix(in srgb, var(--theme-color) 28%, transparent);
  }

  :deep(.todo-step-cell.is-current .status-dot) {
    background: var(--theme-color);
  }

  :deep(.todo-step-cell.is-pending) {
    color: var(--art-gray-500);
    background: var(--art-gray-100);
    border-color: var(--el-border-color-light);
  }

  :deep(.todo-step-cell.is-pending .status-dot) {
    background: var(--art-gray-400);
  }

  :deep(.todo-step-cell:hover) {
    transform: translateY(-1px);
  }

  .dark {
    :deep(.todo-step-cell.is-pending) {
      color: rgb(255 255 255 / 60%);
      background: rgb(255 255 255 / 4%);
      border-color: rgb(255 255 255 / 10%);
    }
  }
</style>
