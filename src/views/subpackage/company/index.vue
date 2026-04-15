<!-- 企业管理页面 -->
<template>
  <div class="page-content">
    <ElCard shadow="never" class="mb-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3 flex-wrap">
          <ElInput
            v-model="searchForm.name"
            placeholder="请输入企业名称"
            clearable
            class="w-52"
            @keyup.enter="handleSearch"
          />
          <ElSelect v-model="searchForm.type" placeholder="企业类型" clearable class="w-36">
            <ElOption label="劳务企业" value="1" />
            <ElOption label="专业分包企业" value="2" />
            <ElOption label="材料供应企业" value="3" />
          </ElSelect>
          <ElSelect v-model="searchForm.status" placeholder="资质状态" clearable class="w-32">
            <ElOption label="正常" value="1" />
            <ElOption label="即将到期" value="2" />
            <ElOption label="已过期" value="3" />
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
          新增企业
        </ElButton>
      </div>
    </ElCard>

    <ElCard shadow="never">
      <ElTable :data="tableData" stripe v-loading="loading" row-key="id">
        <ElTableColumn prop="name" label="企业名称" min-width="180" show-overflow-tooltip />
        <ElTableColumn prop="type" label="企业类型" width="130">
          <template #default="{ row }">
            <ElTag :type="typeTagMap[row.type]?.type" size="small">
              {{ typeTagMap[row.type]?.label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="creditCode" label="统一信用代码" width="180" />
        <ElTableColumn prop="legalPerson" label="法人代表" width="100" />
        <ElTableColumn prop="contact" label="联系电话" width="130" />
        <ElTableColumn prop="qualification" label="资质等级" width="110" />
        <ElTableColumn prop="qualExpiry" label="资质到期日" width="120">
          <template #default="{ row }">
            <span :class="getExpiryClass(row.qualExpiry)">{{ row.qualExpiry }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="workerCount" label="在场人数" width="90" align="right" />
        <ElTableColumn prop="status" label="资质状态" width="100">
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
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <ElFormItem label="企业名称" prop="name">
          <ElInput v-model="formData.name" placeholder="请输入企业名称" clearable />
        </ElFormItem>
        <ElFormItem label="企业类型" prop="type">
          <ElSelect v-model="formData.type" placeholder="请选择企业类型" class="w-full">
            <ElOption label="劳务企业" value="1" />
            <ElOption label="专业分包企业" value="2" />
            <ElOption label="材料供应企业" value="3" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="统一信用代码" prop="creditCode">
          <ElInput v-model="formData.creditCode" placeholder="请输入统一社会信用代码" clearable />
        </ElFormItem>
        <ElFormItem label="法人代表" prop="legalPerson">
          <ElInput v-model="formData.legalPerson" placeholder="请输入法人代表姓名" clearable />
        </ElFormItem>
        <ElFormItem label="联系电话" prop="contact">
          <ElInput v-model="formData.contact" placeholder="请输入联系电话" clearable />
        </ElFormItem>
        <ElFormItem label="资质等级" prop="qualification">
          <ElInput v-model="formData.qualification" placeholder="请输入资质等级" clearable />
        </ElFormItem>
        <ElFormItem label="资质到期日" prop="qualExpiry">
          <ElDatePicker
            v-model="formData.qualExpiry"
            type="date"
            placeholder="请选择资质到期日"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
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

  defineOptions({ name: 'SubpackageCompany' })

  interface CompanyItem {
    id: number
    name: string
    type: string
    creditCode: string
    legalPerson: string
    contact: string
    qualification: string
    qualExpiry: string
    workerCount: number
    status: string
  }

  const typeTagMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' }> = {
    '1': { label: '劳务企业', type: 'primary' },
    '2': { label: '专业分包企业', type: 'success' },
    '3': { label: '材料供应企业', type: 'warning' }
  }

  const statusTagMap: Record<string, { label: string; type: 'success' | 'warning' | 'danger' }> = {
    '1': { label: '正常', type: 'success' },
    '2': { label: '即将到期', type: 'warning' },
    '3': { label: '已过期', type: 'danger' }
  }

  const getExpiryClass = (date: string) => {
    const diff = new Date(date).getTime() - Date.now()
    const days = diff / (1000 * 60 * 60 * 24)
    if (days < 0) return 'text-red-500'
    if (days < 30) return 'text-orange-400'
    return ''
  }

  const loading = ref(false)
  const submitting = ref(false)
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增企业')
  const formRef = ref<FormInstance>()

  const searchForm = reactive({ name: '', type: '', status: '' })
  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

  const formData = reactive<Partial<CompanyItem>>({
    name: '',
    type: '',
    creditCode: '',
    legalPerson: '',
    contact: '',
    qualification: '',
    qualExpiry: ''
  })

  const formRules: FormRules = {
    name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择企业类型', trigger: 'change' }],
    creditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }]
  }

  const mockData: CompanyItem[] = [
    {
      id: 1,
      name: '鑫盛建筑劳务有限公司',
      type: '1',
      creditCode: '91310000MA1FL5XX3X',
      legalPerson: '张建国',
      contact: '138-0000-1001',
      qualification: '劳务承包壹级',
      qualExpiry: '2025-06-30',
      workerCount: 86,
      status: '2'
    },
    {
      id: 2,
      name: '宏远钢结构工程有限公司',
      type: '2',
      creditCode: '91310000MA1GH7YY4Z',
      legalPerson: '李明',
      contact: '139-0000-2002',
      qualification: '钢结构工程专业承包壹级',
      qualExpiry: '2026-12-31',
      workerCount: 42,
      status: '1'
    },
    {
      id: 3,
      name: '华通机电工程有限公司',
      type: '2',
      creditCode: '91310000MA1KJ9WW5A',
      legalPerson: '王芳',
      contact: '137-0000-3003',
      qualification: '机电安装工程专业承包贰级',
      qualExpiry: '2025-03-15',
      workerCount: 58,
      status: '3'
    },
    {
      id: 4,
      name: '恒泰建材供应链有限公司',
      type: '3',
      creditCode: '91310000MA1NP2VV6B',
      legalPerson: '刘伟',
      contact: '136-0000-4004',
      qualification: '-',
      qualExpiry: '2027-01-01',
      workerCount: 12,
      status: '1'
    },
    {
      id: 5,
      name: '美家装饰劳务有限公司',
      type: '1',
      creditCode: '91310000MA1QR4UU7C',
      legalPerson: '陈晓',
      contact: '135-0000-5005',
      qualification: '劳务承包贰级',
      qualExpiry: '2026-08-20',
      workerCount: 34,
      status: '1'
    }
  ]

  const tableData = ref<CompanyItem[]>([])

  const fetchData = () => {
    loading.value = true
    setTimeout(() => {
      const filtered = mockData.filter((item) => {
        const nameMatch = !searchForm.name || item.name.includes(searchForm.name)
        const typeMatch = !searchForm.type || item.type === searchForm.type
        const statusMatch = !searchForm.status || item.status === searchForm.status
        return nameMatch && typeMatch && statusMatch
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
    searchForm.type = ''
    searchForm.status = ''
    handleSearch()
  }

  const handleAdd = () => {
    dialogTitle.value = '新增企业'
    Object.assign(formData, {
      id: undefined,
      name: '',
      type: '',
      creditCode: '',
      legalPerson: '',
      contact: '',
      qualification: '',
      qualExpiry: ''
    })
    dialogVisible.value = true
  }

  const handleEdit = (row: CompanyItem) => {
    dialogTitle.value = '编辑企业'
    Object.assign(formData, { ...row })
    dialogVisible.value = true
  }

  const handleDetail = (row: CompanyItem) => {
    ElMessage.info(`查看企业：${row.name}`)
  }

  const handleDelete = (row: CompanyItem) => {
    ElMessageBox.confirm(`确定要删除企业「${row.name}」吗？`, '提示', {
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
        ElMessage.success(dialogTitle.value === '新增企业' ? '新增成功' : '编辑成功')
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
