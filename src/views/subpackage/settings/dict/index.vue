<template>
  <div class="dict-page art-full-height">
    <ElCard class="art-card-xs mb-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 class="m-0 text-base font-semibold">字典管理</h3>
          <p class="mt-2 text-sm leading-6 text-g-700">
            当前采用混合字典方案：简单枚举维护在 <code>sys_dict</code>，复杂证件类型维护在
            <code>certificate_type_dict</code>，统一使用同一管理入口。
          </p>
        </div>
        <ElRadioGroup v-model="activeMode" @change="handleModeChange">
          <ElRadioButton label="sys">通用字典</ElRadioButton>
          <ElRadioButton label="certificate">证件类型字典</ElRadioButton>
        </ElRadioGroup>
      </div>
    </ElCard>

    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="6"
      @search="handleSearch"
      @reset="handleReset"
    />

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
              {{ activeMode === 'sys' ? '新增通用字典' : '新增证件类型' }}
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
        <template #dictType="{ row }">
          <template v-if="row.kind === 'sys'">
            <ElTag type="primary" effect="light">{{ row.dictType }}</ElTag>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #dictKey="{ row }">
          <template v-if="row.kind === 'sys'">
            <span>{{ row.dictKey }}</span>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #dictValue="{ row }">
          <template v-if="row.kind === 'sys'">
            <div class="flex items-center gap-2">
              <ElTag
                v-if="row.tagType"
                :type="row.tagType"
                effect="light"
                :style="row.color ? { borderColor: row.color, color: row.color } : undefined"
              >
                {{ row.dictValue }}
              </ElTag>
              <span v-else>{{ row.dictValue }}</span>
            </div>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #parentId="{ row }">
          <template v-if="row.kind === 'sys'">
            <span>{{ row.parentId }}</span>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #color="{ row }">
          <template v-if="row.kind === 'sys'">
            <div class="flex items-center gap-2">
              <span
                v-if="row.color"
                class="inline-block h-3 w-3 rounded-full border border-solid border-g-300"
                :style="{ backgroundColor: row.color }"
              ></span>
              <span>{{ row.color || '-' }}</span>
            </div>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #tagType="{ row }">
          <template v-if="row.kind === 'sys'">
            <span>{{ row.tagType || '-' }}</span>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #targetType="{ row }">
          <template v-if="row.kind === 'certificate'">
            <ElTag :type="getTargetTypeMeta(row.targetType).type" effect="light">
              {{ getTargetTypeMeta(row.targetType).label }}
            </ElTag>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #category="{ row }">
          <template v-if="row.kind === 'certificate'">
            <ElTag :type="getCategoryMeta(row.category).type" effect="light">
              {{ getCategoryMeta(row.category).label }}
            </ElTag>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #icon="{ row }">
          <template v-if="row.kind === 'certificate'">
            <div class="flex items-center gap-2">
              <ArtSvgIcon v-if="row.icon" :icon="row.icon" class="text-base text-theme" />
              <span class="truncate">{{ row.icon || '-' }}</span>
            </div>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #formTemplate="{ row }">
          <template v-if="row.kind === 'certificate'">
            <span class="text-sm text-g-700">
              {{
                row.formTemplate?.fields?.length ? `${row.formTemplate.fields.length} 个字段` : '-'
              }}
            </span>
          </template>
          <span v-else class="text-g-600">-</span>
        </template>

        <template #status="{ row }">
          <ElTag :type="row.status === 1 ? 'success' : 'info'" effect="light">
            {{ row.status === 1 ? '启用' : '禁用' }}
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
      width="760px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElForm
        v-if="activeMode === 'sys'"
        ref="sysFormRef"
        :model="sysFormData"
        :rules="sysFormRules"
        label-width="110px"
      >
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="字典类型" prop="dictType">
              <ElInput
                v-model="sysFormData.dictType"
                placeholder="例如 gender / nation"
                clearable
                :disabled="dialogMode !== 'add'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="字典键" prop="dictKey">
              <ElInput
                v-model="sysFormData.dictKey"
                placeholder="例如 M / F / phone"
                clearable
                :disabled="dialogMode !== 'add'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="字典值" prop="dictValue">
              <ElInput
                v-model="sysFormData.dictValue"
                placeholder="例如 男 / 女 / 手机"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="父级ID" prop="parentId">
              <ElInputNumber
                v-model="sysFormData.parentId"
                :min="0"
                class="w-full"
                controls-position="right"
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="排序" prop="sortOrder">
              <ElInputNumber
                v-model="sysFormData.sortOrder"
                :min="0"
                class="w-full"
                controls-position="right"
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="颜色" prop="color">
              <ElInput
                v-model="sysFormData.color"
                placeholder="例如 #409EFF"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="标签类型" prop="tagType">
              <ElSelect
                v-model="sysFormData.tagType"
                placeholder="请选择标签类型"
                class="w-full"
                clearable
                :disabled="dialogMode === 'detail'"
              >
                <ElOption label="Primary" value="primary" />
                <ElOption label="Success" value="success" />
                <ElOption label="Warning" value="warning" />
                <ElOption label="Danger" value="danger" />
                <ElOption label="Info" value="info" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="状态" prop="status">
              <ElRadioGroup v-model="sysFormData.status" :disabled="dialogMode === 'detail'">
                <ElRadio :value="1">启用</ElRadio>
                <ElRadio :value="0">禁用</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElFormItem label="备注" prop="remark">
          <ElInput
            v-model="sysFormData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            :disabled="dialogMode === 'detail'"
          />
        </ElFormItem>
      </ElForm>

      <ElForm
        v-else
        ref="certificateFormRef"
        :model="certificateFormData"
        :rules="certificateFormRules"
        label-width="110px"
      >
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="类型名称" prop="typeName">
              <ElInput
                v-model="certificateFormData.typeName"
                placeholder="请输入类型名称"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="所属主体" prop="targetType">
              <ElSelect
                v-model="certificateFormData.targetType"
                placeholder="请选择所属主体"
                class="w-full"
                :disabled="dialogMode === 'detail'"
              >
                <ElOption label="人员" value="person" />
                <ElOption label="企业" value="company" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="系统分类" prop="category">
              <ElSelect
                v-model="certificateFormData.category"
                placeholder="请选择系统分类"
                class="w-full"
                :disabled="dialogMode === 'detail'"
              >
                <ElOption
                  v-for="item in categoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="图标" prop="icon">
              <ElInput
                v-model="certificateFormData.icon"
                placeholder="例如 ri:wallet-3-line"
                clearable
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="排序" prop="sortOrder">
              <ElInputNumber
                v-model="certificateFormData.sortOrder"
                :min="0"
                class="w-full"
                controls-position="right"
                :disabled="dialogMode === 'detail'"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="状态" prop="status">
              <ElRadioGroup
                v-model="certificateFormData.status"
                :disabled="dialogMode === 'detail'"
              >
                <ElRadio :value="1">启用</ElRadio>
                <ElRadio :value="0">禁用</ElRadio>
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElFormItem label="表单模板" prop="formTemplateText">
          <ElInput
            v-model="certificateFormTemplateText"
            type="textarea"
            :rows="9"
            placeholder='请输入 JSON，例如 {"fields":[{"label":"姓名","name":"name","type":"text"}]}'
            :disabled="dialogMode === 'detail'"
          />
        </ElFormItem>

        <ElFormItem label="备注" prop="remark">
          <ElInput
            v-model="certificateFormData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            :disabled="dialogMode === 'detail'"
          />
        </ElFormItem>
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
    fetchAddCertificateTypeDict,
    fetchAddSysDict,
    fetchDeleteCertificateTypeDict,
    fetchDeleteSysDict,
    fetchEditCertificateTypeDict,
    fetchEditSysDict,
    fetchGetCertificateTypeDictDetail,
    fetchGetCertificateTypeDictList,
    fetchGetSysDictDetail,
    fetchGetSysDictList
  } from '@/api/dict'

  defineOptions({ name: 'SubpackageDict' })

  type DictMode = 'sys' | 'certificate'
  type DialogMode = 'add' | 'edit' | 'detail'
  type CertificateItem = Api.SystemManage.CertificateTypeDictItem
  type SysItem = Api.SystemManage.SysDictItem
  type MixedDictRow =
    | ({
        kind: 'sys'
      } & SysItem)
    | ({
        kind: 'certificate'
      } & CertificateItem)

  const activeMode = ref<DictMode>('sys')
  const dialogMode = ref<DialogMode>('add')
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增字典')
  const currentId = ref<number | null>(null)
  const loading = ref(false)
  const submitting = ref(false)

  const sysFormRef = ref<FormInstance>()
  const certificateFormRef = ref<FormInstance>()

  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const tableData = ref<MixedDictRow[]>([])

  const targetTypeMap: Record<
    CertificateItem['targetType'],
    { label: string; type: 'primary' | 'success' }
  > = {
    person: { label: '人员', type: 'primary' },
    company: { label: '企业', type: 'success' }
  }

  const categoryMap: Record<
    CertificateItem['category'],
    { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }
  > = {
    certificate: { label: '证件', type: 'primary' },
    id_card: { label: '身份证件', type: 'success' },
    qualification: { label: '资质资格', type: 'warning' },
    license: { label: '许可证照', type: 'danger' },
    others: { label: '其他', type: 'info' }
  }

  const categoryOptions = [
    { label: '证件', value: 'certificate' },
    { label: '身份证件', value: 'id_card' },
    { label: '资质资格', value: 'qualification' },
    { label: '许可证照', value: 'license' },
    { label: '其他', value: 'others' }
  ]

  const getTargetTypeMeta = (targetType: unknown) => {
    const key = targetType as CertificateItem['targetType']
    return targetTypeMap[key] || { label: String(targetType || '-'), type: 'info' as const }
  }

  const getCategoryMeta = (category: unknown) => {
    const key = category as CertificateItem['category']
    return categoryMap[key] || { label: String(category || '-'), type: 'info' as const }
  }

  const searchForm = ref<Record<string, any>>({
    dictType: undefined,
    dictKey: undefined,
    dictValue: undefined,
    typeName: undefined,
    targetType: undefined,
    category: undefined,
    status: undefined
  })

  const sysSearchItems: SearchFormItem[] = [
    {
      key: 'dictType',
      label: '字典类型',
      type: 'input',
      span: 6,
      placeholder: '例如 gender'
    },
    {
      key: 'dictKey',
      label: '字典键',
      type: 'input',
      span: 6,
      placeholder: '请输入字典键'
    },
    {
      key: 'dictValue',
      label: '字典值',
      type: 'input',
      span: 6,
      placeholder: '请输入字典值'
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 6,
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 }
      ],
      placeholder: '请选择状态'
    }
  ]

  const certificateSearchItems: SearchFormItem[] = [
    {
      key: 'typeName',
      label: '类型名称',
      type: 'input',
      span: 6,
      placeholder: '请输入类型名称'
    },
    {
      key: 'targetType',
      label: '所属主体',
      type: 'select',
      span: 6,
      options: [
        { label: '人员', value: 'person' },
        { label: '企业', value: 'company' }
      ],
      placeholder: '请选择所属主体'
    },
    {
      key: 'category',
      label: '系统分类',
      type: 'select',
      span: 6,
      options: categoryOptions,
      placeholder: '请选择系统分类'
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 6,
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 }
      ],
      placeholder: '请选择状态'
    }
  ]

  const searchItems = computed(() =>
    activeMode.value === 'sys' ? sysSearchItems : certificateSearchItems
  )

  const sysFormData = reactive<Partial<SysItem>>({
    dictType: '',
    dictKey: '',
    dictValue: '',
    parentId: 0,
    sortOrder: 0,
    color: '',
    tagType: null,
    status: 1,
    remark: ''
  })

  const certificateFormData = reactive<Partial<CertificateItem>>({
    typeName: '',
    targetType: 'person',
    category: 'certificate',
    formTemplate: null,
    icon: '',
    sortOrder: 0,
    status: 1,
    remark: ''
  })

  const certificateFormTemplateText = ref('')

  const validateJsonTemplate = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (!value?.trim()) {
      callback()
      return
    }

    try {
      JSON.parse(value)
      callback()
    } catch {
      callback(new Error('表单模板必须是合法 JSON'))
    }
  }

  const sysFormRules: FormRules = {
    dictType: [{ required: true, message: '请输入字典类型', trigger: 'blur' }],
    dictKey: [{ required: true, message: '请输入字典键', trigger: 'blur' }],
    dictValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const certificateFormRules: FormRules = {
    typeName: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
    targetType: [{ required: true, message: '请选择所属主体', trigger: 'change' }],
    category: [{ required: true, message: '请选择系统分类', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    formTemplateText: [{ validator: validateJsonTemplate, trigger: 'blur' }]
  }

  const { columns, columnChecks, resetColumns } = useTableColumns<MixedDictRow>(() =>
    activeMode.value === 'sys'
      ? ([
          { type: 'index', label: '序号', width: 70 },
          {
            prop: 'dictType',
            label: '字典类型',
            minWidth: 120,
            useSlot: true
          },
          {
            prop: 'dictKey',
            label: '字典键',
            minWidth: 120,
            useSlot: true
          },
          {
            prop: 'dictValue',
            label: '字典值',
            minWidth: 140,
            useSlot: true
          },
          {
            prop: 'parentId',
            label: '父级ID',
            width: 90,
            useSlot: true
          },
          {
            prop: 'sortOrder',
            label: '排序',
            width: 90
          },
          {
            prop: 'color',
            label: '颜色',
            minWidth: 120,
            useSlot: true
          },
          {
            prop: 'tagType',
            label: '标签类型',
            width: 110,
            useSlot: true
          },
          {
            prop: 'status',
            label: '状态',
            width: 90,
            useSlot: true
          },
          {
            prop: 'remark',
            label: '备注',
            minWidth: 180,
            showOverflowTooltip: true
          },
          {
            prop: 'operation',
            label: '操作',
            width: 150,
            fixed: 'right',
            useSlot: true
          }
        ] as ColumnOption<MixedDictRow>[])
      : ([
          { type: 'index', label: '序号', width: 70 },
          {
            prop: 'typeName',
            label: '类型名称',
            minWidth: 160,
            showOverflowTooltip: true
          },
          {
            prop: 'targetType',
            label: '所属主体',
            width: 100,
            useSlot: true
          },
          {
            prop: 'category',
            label: '系统分类',
            width: 120,
            useSlot: true
          },
          {
            prop: 'icon',
            label: '图标',
            minWidth: 160,
            useSlot: true
          },
          {
            prop: 'formTemplate',
            label: '表单模板',
            width: 110,
            useSlot: true
          },
          {
            prop: 'sortOrder',
            label: '排序',
            width: 90
          },
          {
            prop: 'status',
            label: '状态',
            width: 90,
            useSlot: true
          },
          {
            prop: 'remark',
            label: '备注',
            minWidth: 180,
            showOverflowTooltip: true
          },
          {
            prop: 'operation',
            label: '操作',
            width: 150,
            fixed: 'right',
            useSlot: true
          }
        ] as ColumnOption<MixedDictRow>[])
  )

  const resetSearchForm = () => {
    searchForm.value = {
      dictType: undefined,
      dictKey: undefined,
      dictValue: undefined,
      typeName: undefined,
      targetType: undefined,
      category: undefined,
      status: undefined
    }
  }

  const resetSysFormData = () => {
    Object.assign(sysFormData, {
      dictType: '',
      dictKey: '',
      dictValue: '',
      parentId: 0,
      sortOrder: 0,
      color: '',
      tagType: null,
      status: 1,
      remark: ''
    })
  }

  const resetCertificateFormData = () => {
    Object.assign(certificateFormData, {
      typeName: '',
      targetType: 'person',
      category: 'certificate',
      formTemplate: null,
      icon: '',
      sortOrder: 0,
      status: 1,
      remark: ''
    })
    certificateFormTemplateText.value = ''
  }

  const handleModeChange = () => {
    pagination.current = 1
    resetSearchForm()
    resetColumns()
    fetchData()
  }

  const fetchData = async () => {
    loading.value = true

    try {
      if (activeMode.value === 'sys') {
        const data = await fetchGetSysDictList({
          current: pagination.current,
          size: pagination.size,
          dictType: searchForm.value.dictType?.trim(),
          dictKey: searchForm.value.dictKey?.trim(),
          dictValue: searchForm.value.dictValue?.trim(),
          status: searchForm.value.status
        })

        tableData.value = (data.records || []).map((item) => ({
          ...item,
          kind: 'sys'
        }))
        pagination.total = data.total || 0
        pagination.current = data.current || pagination.current
        pagination.size = data.size || pagination.size
        return
      }

      const data = await fetchGetCertificateTypeDictList({
        current: pagination.current,
        size: pagination.size,
        typeName: searchForm.value.typeName?.trim(),
        targetType: searchForm.value.targetType,
        category: searchForm.value.category,
        status: searchForm.value.status
      })

      tableData.value = (data.records || []).map((item) => ({
        ...item,
        kind: 'certificate'
      }))
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
    resetSearchForm()
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
    currentId.value = null
    dialogTitle.value = activeMode.value === 'sys' ? '新增通用字典' : '新增证件类型'
    resetSysFormData()
    resetCertificateFormData()
    dialogVisible.value = true
  }

  const fillSysForm = (row: SysItem) => {
    Object.assign(sysFormData, {
      ...row,
      color: row.color || '',
      tagType: row.tagType || null,
      remark: row.remark || ''
    })
  }

  const fillCertificateForm = (row: CertificateItem) => {
    Object.assign(certificateFormData, {
      ...row,
      icon: row.icon || '',
      remark: row.remark || ''
    })
    certificateFormTemplateText.value = row.formTemplate
      ? JSON.stringify(row.formTemplate, null, 2)
      : ''
  }

  const handleEdit = async (row: MixedDictRow) => {
    dialogMode.value = 'edit'
    currentId.value = row.id
    dialogTitle.value = activeMode.value === 'sys' ? '编辑通用字典' : '编辑证件类型'

    if (row.kind === 'sys') {
      const detail = await fetchGetSysDictDetail(row.id)
      fillSysForm(detail)
    } else {
      const detail = await fetchGetCertificateTypeDictDetail(row.id)
      fillCertificateForm(detail)
    }

    dialogVisible.value = true
  }

  const handleDetail = async (row: MixedDictRow) => {
    dialogMode.value = 'detail'
    currentId.value = row.id
    dialogTitle.value = activeMode.value === 'sys' ? '通用字典详情' : '证件类型详情'

    if (row.kind === 'sys') {
      const detail = await fetchGetSysDictDetail(row.id)
      fillSysForm(detail)
    } else {
      const detail = await fetchGetCertificateTypeDictDetail(row.id)
      fillCertificateForm(detail)
    }

    dialogVisible.value = true
  }

  const handleDelete = (row: MixedDictRow) => {
    const displayName = row.kind === 'sys' ? `${row.dictType} / ${row.dictKey}` : row.typeName

    ElMessageBox.confirm(`确定要删除字典“${displayName}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      if (row.kind === 'sys') {
        await fetchDeleteSysDict(row.id)
      } else {
        await fetchDeleteCertificateTypeDict(row.id)
      }

      if (pagination.current > 1 && tableData.value.length === 1) {
        pagination.current -= 1
      }

      fetchData()
    })
  }

  const buildSysPayload = (): Api.SystemManage.SysDictSubmitParams => ({
    dictType: sysFormData.dictType || '',
    dictKey: sysFormData.dictKey || '',
    dictValue: sysFormData.dictValue || '',
    sortOrder: Number(sysFormData.sortOrder || 0),
    parentId: Number(sysFormData.parentId || 0),
    color: sysFormData.color?.trim() || null,
    tagType: sysFormData.tagType || null,
    status: Number(sysFormData.status ?? 1) as 0 | 1,
    remark: sysFormData.remark?.trim() || null
  })

  const buildCertificatePayload = (): Api.SystemManage.CertificateTypeDictSubmitParams => ({
    typeName: certificateFormData.typeName || '',
    targetType: (certificateFormData.targetType || 'person') as CertificateItem['targetType'],
    category: (certificateFormData.category || 'certificate') as CertificateItem['category'],
    formTemplate: certificateFormTemplateText.value.trim()
      ? JSON.parse(certificateFormTemplateText.value)
      : null,
    icon: certificateFormData.icon?.trim() || null,
    sortOrder: Number(certificateFormData.sortOrder || 0),
    status: Number(certificateFormData.status ?? 1) as 0 | 1,
    remark: certificateFormData.remark?.trim() || null
  })

  const handleSubmit = async () => {
    const formRef = activeMode.value === 'sys' ? sysFormRef.value : certificateFormRef.value
    if (!formRef) return

    const valid = await formRef.validate().catch(() => false)
    if (!valid) return

    submitting.value = true

    try {
      if (activeMode.value === 'sys') {
        const payload = buildSysPayload()

        if (dialogMode.value === 'add') {
          await fetchAddSysDict(payload)
        } else if (dialogMode.value === 'edit' && currentId.value != null) {
          await fetchEditSysDict(currentId.value, payload)
        }
      } else {
        const payload = buildCertificatePayload()

        if (dialogMode.value === 'add') {
          await fetchAddCertificateTypeDict(payload)
        } else if (dialogMode.value === 'edit' && currentId.value != null) {
          await fetchEditCertificateTypeDict(currentId.value, payload)
        }
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
