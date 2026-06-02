<template>
  <div class="company-page art-full-height">
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="8"
      :show-expand="false"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #name>
        <ElInput
          v-model="searchForm.name"
          placeholder="请输入企业名称"
          clearable
          @keyup.enter="handleSearch"
        />
      </template>
    </ArtSearchBar>

    <ElCard class="art-table-card">
      <ArtTableHeader
        v-model:columns="columnChecks"
        :loading="loading"
        @refresh="fetchData"
        layout="refresh,size,fullscreen,columns,settings"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="handleAdd" v-ripple>
              <ElIcon>
                <Plus />
              </ElIcon>
              新增
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #admissionStatus="{ row }">
          <ElTag :type="admissionStatusMap[row.admissionStatus]?.type ?? 'info'" effect="light">
            {{ admissionStatusMap[row.admissionStatus]?.label ?? '未知' }}
          </ElTag>
        </template>

        <template #operation="{ row }">
          <div class="flex">
            <ArtButtonTable type="view" @click="handleDetail(row)" />
            <ArtButtonTable type="edit" @click="handleEdit(row)" />
            <ArtButtonTable type="delete" @click="handleDelete(row)" />
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="企业名称" prop="name">
              <ElInput
                v-model="formData.name"
                placeholder="请输入企业名称"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="简称" prop="shortName">
              <ElInput
                v-model="formData.shortName"
                placeholder="请输入企业简称"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="统一信用代码" prop="creditCode">
              <ElInput
                v-model="formData.creditCode"
                placeholder="请输入统一信用代码"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="纳税人规模" prop="taxpayerScale">
              <ElSelect
                v-model="formData.taxpayerScale"
                placeholder="请选择纳税人规模"
                class="w-full"
                :disabled="dialogMode === 'detail'"
              >
                <ElOption label="一般纳税人" value="一般纳税人" />
                <ElOption label="小规模纳税人" value="小规模纳税人" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="准入号" prop="admissionCode">
              <ElInput
                v-model="formData.admissionCode"
                placeholder="请输入准入号"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="准入状态" prop="admissionStatus">
              <ElSelect
                v-model="formData.admissionStatus"
                placeholder="请选择准入状态"
                class="w-full"
                :disabled="dialogMode === 'detail'"
              >
                <ElOption
                  v-for="item in admissionStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="联系人" prop="contactPerson">
              <ElInput
                v-model="formData.contactPerson"
                placeholder="请输入联系人"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="联系电话" prop="contactPhone">
              <ElInput
                v-model="formData.contactPhone"
                placeholder="请输入联系电话"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{
          dialogMode === 'detail' ? '关闭' : '取消'
        }}</ElButton>
        <ElButton
          v-if="dialogMode !== 'detail'"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          确定
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import type { ColumnOption } from '@/types/component'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import { Plus } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import {
    fetchAddCompany,
    fetchDeleteCompany,
    fetchEditCompany,
    fetchGetCompanyList
  } from '@/api/company'

  defineOptions({ name: 'SubpackageCompany' })

  type CompanyItem = Api.SystemManage.CompanyListItem
  type CompanySubmitParams = Api.SystemManage.CompanySubmitParams
  type DialogMode = 'add' | 'edit' | 'detail'

  const admissionStatusMap: Record<
    string,
    { label: string; type: 'success' | 'warning' | 'danger' | 'info' }
  > = {
    enabled: { label: '已准入', type: 'success' },
    pending: { label: '待准入', type: 'warning' },
    disabled: { label: '已停用', type: 'danger' }
  }

  const admissionStatusOptions = [
    { label: '已准入', value: 'enabled' },
    { label: '待准入', value: 'pending' },
    { label: '已停用', value: 'disabled' }
  ]

  const searchForm = ref<{ name?: string }>({ name: undefined })
  const loading = ref(false)
  const submitting = ref(false)
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增企业')
  const dialogMode = ref<DialogMode>('add')
  const formRef = ref<FormInstance>()
  const currentEditId = ref<number | null>(null)

  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const tableData = ref<CompanyItem[]>([])

  const searchItems: SearchFormItem[] = [
    {
      key: 'name',
      label: '企业名称',
      type: 'input',
      span: 8,
      placeholder: '请输入企业名称'
    }
  ]

  const formData = reactive<Partial<CompanyItem>>({
    name: '',
    shortName: '',
    creditCode: '',
    taxpayerScale: '',
    admissionCode: '',
    admissionStatus: 'enabled',
    contactPerson: '',
    contactPhone: ''
  })

  const formRules: FormRules = {
    name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
    shortName: [{ required: true, message: '请输入企业简称', trigger: 'blur' }],
    creditCode: [{ required: true, message: '请输入统一信用代码', trigger: 'blur' }],
    taxpayerScale: [{ required: true, message: '请选择纳税人规模', trigger: 'change' }],
    admissionCode: [{ required: true, message: '请输入准入号', trigger: 'blur' }],
    admissionStatus: [{ required: true, message: '请选择准入状态', trigger: 'change' }],
    contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
    contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
  }

  const { columns, columnChecks } = useTableColumns<CompanyItem>(
    () =>
      [
        {
          type: 'index',
          label: '序号',
          width: 70
        },
        {
          prop: 'name',
          label: '企业名称',
          minWidth: 180,
          showOverflowTooltip: true
        },
        {
          prop: 'shortName',
          label: '简称',
          minWidth: 120,
          showOverflowTooltip: true
        },
        {
          prop: 'creditCode',
          label: '统一信用代码',
          minWidth: 190
        },
        {
          prop: 'taxpayerScale',
          label: '纳税人规模',
          minWidth: 130
        },
        {
          prop: 'admissionCode',
          label: '准入号',
          minWidth: 130
        },
        {
          prop: 'admissionStatus',
          label: '准入状态',
          width: 110,
          useSlot: true
        },
        {
          prop: 'contactPerson',
          label: '联系人',
          minWidth: 100
        },
        {
          prop: 'contactPhone',
          label: '联系电话',
          minWidth: 140
        },
        {
          prop: 'operation',
          label: '操作',
          width: 150,
          fixed: 'right',
          useSlot: true
        }
      ] as ColumnOption<CompanyItem>[]
  )

  const getSubmitPayload = (): CompanySubmitParams => ({
    name: formData.name || '',
    shortName: formData.shortName || '',
    creditCode: formData.creditCode || '',
    taxpayerScale: formData.taxpayerScale || '',
    admissionCode: formData.admissionCode || '',
    admissionStatus: (formData.admissionStatus || 'enabled') as CompanyItem['admissionStatus'],
    contactPerson: formData.contactPerson || '',
    contactPhone: formData.contactPhone || ''
  })

  const resetFormData = () => {
    Object.assign(formData, {
      name: '',
      shortName: '',
      creditCode: '',
      taxpayerScale: '',
      admissionCode: '',
      admissionStatus: 'enabled',
      contactPerson: '',
      contactPhone: ''
    })
  }

  const fetchData = async () => {
    loading.value = true

    try {
      const data = await fetchGetCompanyList({
        current: pagination.current,
        size: pagination.size,
        name: searchForm.value.name?.trim()
      })

      tableData.value = data.records || []
      pagination.total = data.total || 0
      pagination.current = data.current || pagination.current
      pagination.size = data.size || pagination.size
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    pagination.current = 1
    fetchData()
  }

  const handleReset = () => {
    searchForm.value = { name: undefined }
    pagination.current = 1
    fetchData()
  }

  const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    fetchData()
  }

  const handleCurrentChange = (current: number) => {
    pagination.current = current
    fetchData()
  }

  const handleAdd = () => {
    dialogMode.value = 'add'
    currentEditId.value = null
    dialogTitle.value = '新增企业'
    resetFormData()
    dialogVisible.value = true
  }

  const handleEdit = (row: CompanyItem) => {
    dialogMode.value = 'edit'
    currentEditId.value = row.id
    dialogTitle.value = '编辑企业'
    Object.assign(formData, row)
    dialogVisible.value = true
  }

  const handleDetail = (row: CompanyItem) => {
    dialogMode.value = 'detail'
    currentEditId.value = row.id
    dialogTitle.value = '企业详情'
    Object.assign(formData, row)
    dialogVisible.value = true
  }

  const handleDelete = (row: CompanyItem) => {
    ElMessageBox.confirm(`确定要删除企业“${row.name}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchDeleteCompany(row.id)

      if (pagination.current > 1 && tableData.value.length === 1) {
        pagination.current -= 1
      }

      fetchData()
    })
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true

    try {
      const payload = getSubmitPayload()

      if (dialogMode.value === 'add') {
        await fetchAddCompany(payload)
      } else if (dialogMode.value === 'edit' && currentEditId.value != null) {
        await fetchEditCompany(currentEditId.value, payload)
      }

      dialogVisible.value = false
      fetchData()
    } finally {
      submitting.value = false
    }
  }

  onMounted(() => {
    fetchData()
  })
</script>
