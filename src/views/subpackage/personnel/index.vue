<!-- 人员管理页面 -->
<template>
  <div class="page-content">
    <ElCard shadow="never" class="mb-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3 flex-wrap">
          <ElInput
            v-model="searchForm.name"
            placeholder="请输入姓名"
            clearable
            class="w-44"
            @keyup.enter="handleSearch"
          />
          <ElInput
            v-model="searchForm.company"
            placeholder="请输入所属企业"
            clearable
            class="w-48"
            @keyup.enter="handleSearch"
          />
          <ElSelect v-model="searchForm.type" placeholder="人员类型" clearable class="w-32">
            <ElOption label="管理人员" value="1" />
            <ElOption label="作业工人" value="2" />
            <ElOption label="特种作业人员" value="3" />
          </ElSelect>
          <ElSelect v-model="searchForm.status" placeholder="在场状态" clearable class="w-32">
            <ElOption label="在场" value="1" />
            <ElOption label="离场" value="2" />
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
        <div class="flex gap-2">
          <ElButton @click="handleExport">
            <template #icon><ArtIcon name="ri:download-line" /></template>
            导出
          </ElButton>
          <ElButton type="primary" @click="handleAdd">
            <template #icon><ArtIcon name="ri:add-line" /></template>
            新增人员
          </ElButton>
        </div>
      </div>
    </ElCard>

    <ElCard shadow="never">
      <ElTable :data="tableData" stripe v-loading="loading" row-key="id">
        <ElTableColumn prop="name" label="姓名" width="90" />
        <ElTableColumn prop="gender" label="性别" width="70">
          <template #default="{ row }">{{ row.gender === '1' ? '男' : '女' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="idCard" label="身份证号" width="185" />
        <ElTableColumn prop="type" label="人员类型" width="120">
          <template #default="{ row }">
            <ElTag :type="typeTagMap[row.type]?.type" size="small">
              {{ typeTagMap[row.type]?.label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="company" label="所属企业" min-width="160" show-overflow-tooltip />
        <ElTableColumn prop="role" label="工种/岗位" width="120" />
        <ElTableColumn prop="phone" label="联系电话" width="130" />
        <ElTableColumn prop="certNo" label="证书编号" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-sm">{{ row.certNo || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="entryDate" label="进场日期" width="110" />
        <ElTableColumn prop="status" label="在场状态" width="90">
          <template #default="{ row }">
            <ElBadge :type="row.status === '1' ? 'success' : 'info'" is-dot class="mr-1.5" />
            <span>{{ row.status === '1' ? '在场' : '离场' }}</span>
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
      width="580px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="姓名" prop="name">
              <ElInput v-model="formData.name" placeholder="请输入姓名" clearable />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="性别" prop="gender">
              <ElRadioGroup v-model="formData.gender">
                <ElRadio value="1">男</ElRadio>
                <ElRadio value="2">女</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="身份证号" prop="idCard">
          <ElInput v-model="formData.idCard" placeholder="请输入身份证号" clearable />
        </ElFormItem>
        <ElFormItem label="人员类型" prop="type">
          <ElSelect v-model="formData.type" placeholder="请选择人员类型" class="w-full">
            <ElOption label="管理人员" value="1" />
            <ElOption label="作业工人" value="2" />
            <ElOption label="特种作业人员" value="3" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="所属企业" prop="company">
          <ElInput v-model="formData.company" placeholder="请输入所属企业" clearable />
        </ElFormItem>
        <ElFormItem label="工种/岗位" prop="role">
          <ElInput v-model="formData.role" placeholder="请输入工种或岗位" clearable />
        </ElFormItem>
        <ElFormItem label="联系电话" prop="phone">
          <ElInput v-model="formData.phone" placeholder="请输入联系电话" clearable />
        </ElFormItem>
        <ElFormItem label="证书编号" prop="certNo">
          <ElInput v-model="formData.certNo" placeholder="特种作业人员请填写证书编号" clearable />
        </ElFormItem>
        <ElFormItem label="进场日期" prop="entryDate">
          <ElDatePicker
            v-model="formData.entryDate"
            type="date"
            placeholder="请选择进场日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </ElFormItem>
        <ElFormItem label="在场状态" prop="status">
          <ElRadioGroup v-model="formData.status">
            <ElRadio value="1">在场</ElRadio>
            <ElRadio value="2">离场</ElRadio>
          </ElRadioGroup>
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

  defineOptions({ name: 'SubpackagePersonnel' })

  interface PersonnelItem {
    id: number
    name: string
    gender: string
    idCard: string
    type: string
    company: string
    role: string
    phone: string
    certNo: string
    entryDate: string
    status: string
  }

  const typeTagMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' }> = {
    '1': { label: '管理人员', type: 'primary' },
    '2': { label: '作业工人', type: 'success' },
    '3': { label: '特种作业', type: 'warning' }
  }

  const loading = ref(false)
  const submitting = ref(false)
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增人员')
  const formRef = ref<FormInstance>()

  const searchForm = reactive({ name: '', company: '', type: '', status: '' })
  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

  const formData = reactive<Partial<PersonnelItem>>({
    name: '',
    gender: '1',
    idCard: '',
    type: '',
    company: '',
    role: '',
    phone: '',
    certNo: '',
    entryDate: '',
    status: '1'
  })

  const formRules: FormRules = {
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    idCard: [{ required: true, message: '请输入身份证号', trigger: 'blur' }],
    type: [{ required: true, message: '请选择人员类型', trigger: 'change' }],
    company: [{ required: true, message: '请输入所属企业', trigger: 'blur' }]
  }

  const mockData: PersonnelItem[] = [
    {
      id: 1,
      name: '张建国',
      gender: '1',
      idCard: '310101198001011234',
      type: '1',
      company: '鑫盛建筑劳务有限公司',
      role: '项目经理',
      phone: '138-0000-1001',
      certNo: '',
      entryDate: '2024-03-01',
      status: '1'
    },
    {
      id: 2,
      name: '李明',
      gender: '1',
      idCard: '310101199002025678',
      type: '1',
      company: '宏远钢结构工程有限公司',
      role: '技术负责人',
      phone: '139-0000-2002',
      certNo: '',
      entryDate: '2024-01-15',
      status: '2'
    },
    {
      id: 3,
      name: '王芳',
      gender: '2',
      idCard: '310101198503039012',
      type: '1',
      company: '华通机电工程有限公司',
      role: '质量员',
      phone: '137-0000-3003',
      certNo: '',
      entryDate: '2024-05-01',
      status: '1'
    },
    {
      id: 4,
      name: '赵强',
      gender: '1',
      idCard: '310101199204043456',
      type: '3',
      company: '鑫盛建筑劳务有限公司',
      role: '电焊工',
      phone: '136-0000-4004',
      certNo: 'TZ31000000012345',
      entryDate: '2024-03-15',
      status: '1'
    },
    {
      id: 5,
      name: '陈晓',
      gender: '2',
      idCard: '310101198905057890',
      type: '2',
      company: '美家装饰劳务有限公司',
      role: '抹灰工',
      phone: '135-0000-5005',
      certNo: '',
      entryDate: '2024-07-01',
      status: '1'
    },
    {
      id: 6,
      name: '刘建军',
      gender: '1',
      idCard: '310101197806062345',
      type: '3',
      company: '华通机电工程有限公司',
      role: '高压电工',
      phone: '134-0000-6006',
      certNo: 'DG31000000067890',
      entryDate: '2024-05-20',
      status: '1'
    },
    {
      id: 7,
      name: '孙丽',
      gender: '2',
      idCard: '310101199307076789',
      type: '2',
      company: '鑫盛建筑劳务有限公司',
      role: '钢筋工',
      phone: '133-0000-7007',
      certNo: '',
      entryDate: '2024-04-10',
      status: '2'
    }
  ]

  const tableData = ref<PersonnelItem[]>([])

  const fetchData = () => {
    loading.value = true
    setTimeout(() => {
      const filtered = mockData.filter((item) => {
        const nameMatch = !searchForm.name || item.name.includes(searchForm.name)
        const companyMatch = !searchForm.company || item.company.includes(searchForm.company)
        const typeMatch = !searchForm.type || item.type === searchForm.type
        const statusMatch = !searchForm.status || item.status === searchForm.status
        return nameMatch && companyMatch && typeMatch && statusMatch
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
    searchForm.company = ''
    searchForm.type = ''
    searchForm.status = ''
    handleSearch()
  }

  const handleExport = () => {
    ElMessage.success('导出成功')
  }

  const handleAdd = () => {
    dialogTitle.value = '新增人员'
    Object.assign(formData, {
      id: undefined,
      name: '',
      gender: '1',
      idCard: '',
      type: '',
      company: '',
      role: '',
      phone: '',
      certNo: '',
      entryDate: '',
      status: '1'
    })
    dialogVisible.value = true
  }

  const handleEdit = (row: PersonnelItem) => {
    dialogTitle.value = '编辑人员'
    Object.assign(formData, { ...row })
    dialogVisible.value = true
  }

  const handleDetail = (row: PersonnelItem) => {
    ElMessage.info(`查看人员：${row.name}`)
  }

  const handleDelete = (row: PersonnelItem) => {
    ElMessageBox.confirm(`确定要删除人员「${row.name}」吗？`, '提示', {
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
        ElMessage.success(dialogTitle.value === '新增人员' ? '新增成功' : '编辑成功')
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
