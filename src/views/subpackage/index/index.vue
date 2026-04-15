<!-- 分包管理页面 -->
<template>
  <div class="page-content">
    <ElCard shadow="never" class="mb-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3 flex-wrap">
          <ElInput
            v-model="searchForm.name"
            placeholder="请输入分包名称"
            clearable
            class="w-52"
            @keyup.enter="handleSearch"
          />
          <ElSelect v-model="searchForm.status" placeholder="状态" clearable class="w-32">
            <ElOption label="执行中" value="1" />
            <ElOption label="已完成" value="2" />
            <ElOption label="已暂停" value="3" />
          </ElSelect>
          <ElButton type="primary" @click="handleSearch">
            <template #icon><ArtIcon name="ri:search-line" /></template>
            查询
          </ElButton>
          <ElButton @click="handleReset">
            <template #icon><ArtIcon name="ri:refresh-line" /></template>
            重置
          </ElButton>
        </div>
        <ElButton type="primary" @click="handleAdd">
          <template #icon><ArtIcon name="ri:add-line" /></template>
          新增分包
        </ElButton>
      </div>
    </ElCard>

    <ElCard shadow="never">
      <ElTable :data="tableData" stripe v-loading="loading" row-key="id">
        <ElTableColumn prop="name" label="分包名称" min-width="140" show-overflow-tooltip />
        <ElTableColumn prop="type" label="分包类型" width="120">
          <template #default="{ row }">
            <ElTag :type="typeTagMap[row.type]?.type" size="small">
              {{ typeTagMap[row.type]?.label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="contractor" label="承包方" min-width="130" show-overflow-tooltip />
        <ElTableColumn prop="contact" label="联系人" width="100" />
        <ElTableColumn prop="amount" label="合同金额（万元）" width="150" align="right">
          <template #default="{ row }">
            <span class="text-primary font-medium">{{ row.amount.toLocaleString() }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="progress" label="完成进度" width="160">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <ElProgress
                :percentage="row.progress"
                :stroke-width="8"
                class="flex-1"
                :status="row.progress === 100 ? 'success' : undefined"
              />
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="startDate" label="开始日期" width="110" />
        <ElTableColumn prop="endDate" label="结束日期" width="110" />
        <ElTableColumn prop="status" label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="statusTagMap[row.status]?.type" size="small">
              {{ statusTagMap[row.status]?.label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton link type="primary" size="small" @click="handleDetail(row)">详情</ElButton>
            <ElButton link type="danger" size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex justify-end mt-4">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @change="fetchData"
        />
      </div>
    </ElCard>

    <!-- 新增/编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <ElFormItem label="分包名称" prop="name">
          <ElInput v-model="formData.name" placeholder="请输入分包名称" clearable />
        </ElFormItem>
        <ElFormItem label="分包类型" prop="type">
          <ElSelect v-model="formData.type" placeholder="请选择分包类型" class="w-full">
            <ElOption label="劳务分包" value="1" />
            <ElOption label="专业分包" value="2" />
            <ElOption label="材料供应" value="3" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="承包方" prop="contractor">
          <ElInput v-model="formData.contractor" placeholder="请输入承包方名称" clearable />
        </ElFormItem>
        <ElFormItem label="联系人" prop="contact">
          <ElInput v-model="formData.contact" placeholder="请输入联系人姓名" clearable />
        </ElFormItem>
        <ElFormItem label="合同金额" prop="amount">
          <ElInputNumber
            v-model="formData.amount"
            :min="0"
            :precision="2"
            placeholder="万元"
            class="w-full"
            controls-position="right"
          />
        </ElFormItem>
        <ElFormItem label="开始日期" prop="startDate">
          <ElDatePicker
            v-model="formData.startDate"
            type="date"
            placeholder="请选择开始日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </ElFormItem>
        <ElFormItem label="结束日期" prop="endDate">
          <ElDatePicker
            v-model="formData.endDate"
            type="date"
            placeholder="请选择结束日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </ElFormItem>
        <ElFormItem label="状态" prop="status">
          <ElSelect v-model="formData.status" placeholder="请选择状态" class="w-full">
            <ElOption label="执行中" value="1" />
            <ElOption label="已完成" value="2" />
            <ElOption label="已暂停" value="3" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'SubpackageList' })

  interface SubpackageItem {
    id: number
    name: string
    type: string
    contractor: string
    contact: string
    amount: number
    progress: number
    startDate: string
    endDate: string
    status: string
  }

  const typeTagMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' }> = {
    '1': { label: '劳务分包', type: 'primary' },
    '2': { label: '专业分包', type: 'success' },
    '3': { label: '材料供应', type: 'warning' }
  }

  const statusTagMap: Record<
    string,
    { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }
  > = {
    '1': { label: '执行中', type: 'primary' },
    '2': { label: '已完成', type: 'success' },
    '3': { label: '已暂停', type: 'warning' }
  }

  const loading = ref(false)
  const submitting = ref(false)
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增分包')
  const formRef = ref<FormInstance>()

  const searchForm = reactive({ name: '', status: '' })
  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

  const formData = reactive<Partial<SubpackageItem>>({
    name: '',
    type: '',
    contractor: '',
    contact: '',
    amount: 0,
    startDate: '',
    endDate: '',
    status: '1'
  })

  const formRules: FormRules = {
    name: [{ required: true, message: '请输入分包名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择分包类型', trigger: 'change' }],
    contractor: [{ required: true, message: '请输入承包方', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const mockData: SubpackageItem[] = [
    {
      id: 1,
      name: '基础土建劳务分包',
      type: '1',
      contractor: '鑫盛建筑劳务有限公司',
      contact: '张建国',
      amount: 280.5,
      progress: 75,
      startDate: '2024-03-01',
      endDate: '2024-09-30',
      status: '1'
    },
    {
      id: 2,
      name: '钢结构专业分包',
      type: '2',
      contractor: '宏远钢结构工程有限公司',
      contact: '李明',
      amount: 520.0,
      progress: 100,
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      status: '2'
    },
    {
      id: 3,
      name: '机电安装专业分包',
      type: '2',
      contractor: '华通机电工程有限公司',
      contact: '王芳',
      amount: 360.8,
      progress: 45,
      startDate: '2024-05-01',
      endDate: '2024-12-31',
      status: '1'
    },
    {
      id: 4,
      name: '建筑材料供应',
      type: '3',
      contractor: '恒泰建材供应链有限公司',
      contact: '刘伟',
      amount: 180.2,
      progress: 60,
      startDate: '2024-02-01',
      endDate: '2024-11-30',
      status: '1'
    },
    {
      id: 5,
      name: '装饰装修劳务分包',
      type: '1',
      contractor: '美家装饰劳务有限公司',
      contact: '陈晓',
      amount: 95.6,
      progress: 30,
      startDate: '2024-07-01',
      endDate: '2025-01-31',
      status: '3'
    }
  ]

  const tableData = ref<SubpackageItem[]>([])

  const fetchData = () => {
    loading.value = true
    setTimeout(() => {
      const filtered = mockData.filter((item) => {
        const nameMatch = !searchForm.name || item.name.includes(searchForm.name)
        const statusMatch = !searchForm.status || item.status === searchForm.status
        return nameMatch && statusMatch
      })
      pagination.total = filtered.length
      const start = (pagination.page - 1) * pagination.pageSize
      tableData.value = filtered.slice(start, start + pagination.pageSize)
      loading.value = false
    }, 300)
  }

  const handleSearch = () => {
    pagination.page = 1
    fetchData()
  }

  const handleReset = () => {
    searchForm.name = ''
    searchForm.status = ''
    handleSearch()
  }

  const handleAdd = () => {
    dialogTitle.value = '新增分包'
    Object.assign(formData, {
      id: undefined,
      name: '',
      type: '',
      contractor: '',
      contact: '',
      amount: 0,
      startDate: '',
      endDate: '',
      status: '1'
    })
    dialogVisible.value = true
  }

  const handleEdit = (row: SubpackageItem) => {
    dialogTitle.value = '编辑分包'
    Object.assign(formData, { ...row })
    dialogVisible.value = true
  }

  const handleDetail = (row: SubpackageItem) => {
    ElMessage.info(`查看分包：${row.name}`)
  }

  const handleDelete = (row: SubpackageItem) => {
    ElMessageBox.confirm(`确定要删除分包「${row.name}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      ElMessage.success('删除成功')
      fetchData()
    })
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
      if (!valid) return
      submitting.value = true
      setTimeout(() => {
        ElMessage.success(dialogTitle.value === '新增分包' ? '新增成功' : '编辑成功')
        dialogVisible.value = false
        submitting.value = false
        fetchData()
      }, 500)
    })
  }

  onMounted(() => {
    fetchData()
  })
</script>
