<template>
  <div class="dict-page art-full-height">
    <ElCard class="art-card-xs mb-4">
      <h3 class="m-0 text-base font-semibold">字典管理</h3>
      <p class="mt-2 text-sm leading-6 text-g-700">
        采用 <code>dict_type + dict_item</code> 左右布局管理，类型支持配置动态表单模板。
      </p>
    </ElCard>

    <div class="box-border flex gap-4 h-[calc(100%-104px)] max-md:block max-md:h-auto max-md:gap-0">
      <!-- 左侧：字典类型 -->
      <div class="flex-shrink-0 w-72 h-full max-md:w-full max-md:h-auto max-md:mb-4">
        <ElCard class="tree-card art-card-xs flex flex-col h-full mt-0">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <b>字典类型</b>
              <ElButton type="primary" size="small" @click="handleAddType" v-ripple>
                <ElIcon><Plus /></ElIcon>
                新增类型
              </ElButton>
            </div>
          </template>

          <div class="mb-3">
            <ElInput
              v-model="dictTypeKeyword"
              placeholder="搜索类型名称/编码"
              clearable
              @input="filterDictTypes"
            />
          </div>

          <ElScrollbar class="flex-1 min-h-0 pr-1">
            <div
              v-for="item in filteredDictTypes"
              :key="item.id"
              class="mb-1.5 rounded-lg border border-solid px-2.5 py-2 transition-all cursor-pointer"
              :class="
                currentTypeId === item.id
                  ? 'border-theme bg-theme/6 shadow-sm'
                  : 'border-g-300 bg-white hover:border-theme/50 hover:bg-g-100/50'
              "
              @click="handleTypeSelect(item)"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold">{{ item.typeName }}</div>
                  <div class="mt-0.5 truncate text-xs text-g-600">{{ item.typeCode }}</div>
                </div>
                <ElTag :type="item.status === 1 ? 'success' : 'info'" effect="light" size="small">
                  {{ item.status === 1 ? '启用' : '禁用' }}
                </ElTag>
              </div>
              <div class="mt-1.5 flex items-center justify-between text-xs text-g-600">
                <span>{{ item.itemCount ?? 0 }} 项 · 排序 {{ item.sortOrder }}</span>
                <div class="flex items-center gap-1">
                  <ElButton link type="primary" size="small" @click.stop="handleEditType(item)"
                    >编辑</ElButton
                  >
                  <ElButton link type="danger" size="small" @click.stop="handleDeleteType(item)"
                    >删除</ElButton
                  >
                </div>
              </div>
            </div>
          </ElScrollbar>
        </ElCard>
      </div>

      <!-- 右侧：字典项 -->
      <div class="flex flex-col flex-grow min-w-0">
        <ArtSearchBar
          v-model="dictItemSearchForm"
          :items="dictItemSearchItems"
          :span="8"
          :is-expand="true"
          :show-expand="false"
          @search="handleDictItemSearch"
          @reset="handleDictItemReset"
        />

        <ElCard class="flex flex-col flex-1 min-h-0 art-table-card">
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-base font-semibold">
                  {{ currentTypeInfo?.typeName || '请选择左侧字典类型' }}
                </div>
                <div class="mt-1 text-xs text-g-600">
                  {{ currentTypeInfo?.typeCode || '未选择字典类型' }}
                </div>
              </div>
              <ElButton
                type="primary"
                :disabled="!currentTypeId"
                @click="handleAddDictItem"
                v-ripple
              >
                <ElIcon><Plus /></ElIcon>
                新增字典项
              </ElButton>
            </div>
          </template>

          <ArtTableHeader
            v-model:columns="dictItemColumnChecks"
            :loading="loading"
            @refresh="fetchDictItems"
            layout="refresh,size,fullscreen,columns,settings"
          />

          <ArtTable
            :loading="loading"
            :data="dictItems"
            :columns="dictItemColumns"
            :pagination="dictItemPagination"
            @pagination:size-change="handleDictItemSizeChange"
            @pagination:current-change="handleDictItemCurrentChange"
          >
            <template #dictValue="{ row }">
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

            <template #color="{ row }">
              <div class="flex items-center gap-2">
                <span
                  v-if="row.color"
                  class="inline-block h-3 w-3 rounded-full border border-solid border-g-300"
                  :style="{ backgroundColor: row.color }"
                ></span>
                <span>{{ row.color || '-' }}</span>
              </div>
            </template>

            <template #tagType="{ row }">
              <span>{{ row.tagType || '-' }}</span>
            </template>

            <template #status="{ row }">
              <ElTag :type="row.status === 1 ? 'success' : 'info'" effect="light">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </ElTag>
            </template>

            <template #operation="{ row }">
              <div class="flex">
                <ArtButtonTable type="edit" @click="handleEditDictItem(row)" />
                <ArtButtonTable type="view" @click="handleDetailDictItem(row)" />
                <ArtButtonTable type="delete" @click="handleDeleteDictItem(row)" />
              </div>
            </template>
          </ArtTable>
        </ElCard>
      </div>
    </div>

    <!-- 字典类型弹窗 -->
    <ElDialog
      v-model="typeDialogVisible"
      :title="typeDialogMode === 'add' ? '新增字典类型' : '编辑字典类型'"
      width="780px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElScrollbar max-height="65vh">
        <ElForm
          ref="typeFormRef"
          :model="typeFormData"
          :rules="typeFormRules"
          label-width="100px"
          class="pr-4"
        >
          <ElRow :gutter="16">
            <ElCol :span="12">
              <ElFormItem label="类型名称" prop="typeName">
                <ElInput v-model="typeFormData.typeName" placeholder="请输入类型名称" clearable />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="类型编码" prop="typeCode">
                <ElInput
                  v-model="typeFormData.typeCode"
                  placeholder="例如 gender / nation"
                  clearable
                  :disabled="typeDialogMode === 'edit'"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>

          <ElFormItem label="排序" prop="sortOrder">
            <ElInputNumber
              v-model="typeFormData.sortOrder"
              :min="0"
              class="w-full"
              controls-position="right"
            />
          </ElFormItem>

          <ElFormItem label="状态" prop="status">
            <ElRadioGroup v-model="typeFormData.status">
              <ElRadio :value="1">启用</ElRadio>
              <ElRadio :value="0">禁用</ElRadio>
            </ElRadioGroup>
          </ElFormItem>

          <!-- 表单模板编辑器 -->
          <ElDivider content-position="left">表单模板（可选）</ElDivider>

          <div
            v-for="(field, fIndex) in templateFields"
            :key="field._key"
            class="mb-4 rounded-lg border border-solid border-g-200 p-4"
          >
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium text-g-700">字段 {{ fIndex + 1 }}</span>
              <ElButton
                type="danger"
                :icon="Minus"
                circle
                plain
                size="small"
                @click="removeTemplateField(fIndex)"
              />
            </div>

            <ElRow :gutter="12">
              <ElCol :span="8">
                <ElFormItem label="标签" class="mb-2">
                  <ElInput v-model="field.label" placeholder="如：姓名" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="字段名" class="mb-2">
                  <ElInput v-model="field.name" placeholder="如：name" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="类型" class="mb-2">
                  <ElSelect v-model="field.type" class="w-full">
                    <ElOption label="文本" value="text" />
                    <ElOption label="下拉选择" value="select" />
                    <ElOption label="日期" value="date" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElRow :gutter="12">
              <ElCol :span="8">
                <ElFormItem label="占位符" class="mb-2">
                  <ElInput v-model="field.placeholder" placeholder="输入提示" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="4">
                <ElFormItem label="必填" class="mb-2">
                  <ElSwitch v-model="field.required" />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <!-- select 类型的选项管理 -->
            <template v-if="field.type === 'select'">
              <ElDivider class="my-2" />
              <div class="mb-2 text-xs font-medium text-g-600">下拉选项</div>
              <div
                v-for="(opt, oIndex) in field.options"
                :key="oIndex"
                class="mb-2 flex items-center gap-2"
              >
                <ElInput v-model="opt.label" placeholder="显示文本" style="width: 140px" />
                <ElInput v-model="opt.value" placeholder="值" style="width: 140px" />
                <ElButton
                  type="danger"
                  :icon="Minus"
                  circle
                  plain
                  size="small"
                  @click="field.options.splice(oIndex, 1)"
                />
              </div>
              <ElButton
                type="primary"
                link
                size="small"
                @click="field.options.push({ label: '', value: '' })"
              >
                <ElIcon class="mr-1"><Plus /></ElIcon>
                添加选项
              </ElButton>
            </template>
          </div>

          <ElButton type="primary" link @click="addTemplateField">
            <ElIcon class="mr-1"><Plus /></ElIcon>
            添加字段
          </ElButton>

          <ElFormItem label="备注" prop="remark" class="mt-4">
            <ElInput
              v-model="typeFormData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
            />
          </ElFormItem>
        </ElForm>
      </ElScrollbar>
      <template #footer>
        <ElButton @click="typeDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmitType">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 字典项弹窗 -->
    <ElDialog
      v-model="dictItemDialogVisible"
      :title="dictItemDialogTitle"
      width="780px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElScrollbar max-height="65vh">
        <ElForm
          ref="dictItemFormRef"
          :model="dictItemFormData"
          :rules="dictItemFormRules"
          label-width="100px"
          class="pr-4"
        >
          <ElFormItem label="所属类型">
            <ElInput :model-value="currentTypeInfo?.typeName || '-'" disabled />
          </ElFormItem>
          <ElFormItem label="字典键" prop="dictKey">
            <ElInput
              v-model="dictItemFormData.dictKey"
              placeholder="请输入字典键"
              clearable
              :disabled="dictItemDialogMode !== 'add'"
            />
          </ElFormItem>
          <ElFormItem label="字典值" prop="dictValue">
            <ElInput
              v-model="dictItemFormData.dictValue"
              placeholder="请输入字典值"
              clearable
              :disabled="dictItemDialogMode === 'detail'"
            />
          </ElFormItem>
          <ElFormItem label="父级ID" prop="parentId">
            <ElInputNumber
              v-model="dictItemFormData.parentId"
              :min="0"
              class="w-full"
              controls-position="right"
              :disabled="dictItemDialogMode === 'detail'"
            />
          </ElFormItem>
          <ElFormItem label="排序" prop="sortOrder">
            <ElInputNumber
              v-model="dictItemFormData.sortOrder"
              :min="0"
              class="w-full"
              controls-position="right"
              :disabled="dictItemDialogMode === 'detail'"
            />
          </ElFormItem>
          <ElFormItem label="颜色" prop="color">
            <ElInput
              v-model="dictItemFormData.color"
              placeholder="例如 #409EFF"
              clearable
              :disabled="dictItemDialogMode === 'detail'"
            />
          </ElFormItem>
          <ElFormItem label="标签类型" prop="tagType">
            <ElSelect
              v-model="dictItemFormData.tagType"
              placeholder="请选择标签类型"
              class="w-full"
              clearable
              :disabled="dictItemDialogMode === 'detail'"
            >
              <ElOption label="Primary" value="primary" />
              <ElOption label="Success" value="success" />
              <ElOption label="Warning" value="warning" />
              <ElOption label="Danger" value="danger" />
              <ElOption label="Info" value="info" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="状态" prop="status">
            <ElRadioGroup
              v-model="dictItemFormData.status"
              :disabled="dictItemDialogMode === 'detail'"
            >
              <ElRadio :value="1">启用</ElRadio>
              <ElRadio :value="0">禁用</ElRadio>
            </ElRadioGroup>
          </ElFormItem>

          <!-- 字典项表单模板 -->
          <ElDivider content-position="left">表单模板（可选）</ElDivider>
          <div
            v-for="(field, fIndex) in dictItemTemplateFields"
            :key="field._key"
            class="mb-4 rounded-lg border border-solid border-g-200 p-4"
          >
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium text-g-700">字段 {{ fIndex + 1 }}</span>
              <ElButton
                v-if="dictItemDialogMode !== 'detail'"
                type="danger"
                :icon="Minus"
                circle
                plain
                size="small"
                @click="removeDictItemTemplateField(fIndex)"
              />
            </div>
            <ElRow :gutter="12">
              <ElCol :span="8">
                <ElFormItem label="标签" class="mb-2">
                  <ElInput
                    v-model="field.label"
                    placeholder="如：证件编号"
                    :disabled="dictItemDialogMode === 'detail'"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="字段名" class="mb-2">
                  <ElInput
                    v-model="field.name"
                    placeholder="如：cert_no"
                    :disabled="dictItemDialogMode === 'detail'"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="类型" class="mb-2">
                  <ElSelect
                    v-model="field.type"
                    class="w-full"
                    :disabled="dictItemDialogMode === 'detail'"
                  >
                    <ElOption label="文本" value="text" />
                    <ElOption label="下拉选择" value="select" />
                    <ElOption label="日期" value="date" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="12">
              <ElCol :span="8">
                <ElFormItem label="占位符" class="mb-2">
                  <ElInput
                    v-model="field.placeholder"
                    placeholder="输入提示"
                    :disabled="dictItemDialogMode === 'detail'"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="4">
                <ElFormItem label="必填" class="mb-2">
                  <ElSwitch v-model="field.required" :disabled="dictItemDialogMode === 'detail'" />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <template v-if="field.type === 'select'">
              <ElDivider class="my-2" />
              <div class="mb-2 text-xs font-medium text-g-600">下拉选项</div>
              <div
                v-for="(opt, oIndex) in field.options"
                :key="oIndex"
                class="mb-2 flex items-center gap-2"
              >
                <ElInput
                  v-model="opt.label"
                  placeholder="显示文本"
                  style="width: 140px"
                  :disabled="dictItemDialogMode === 'detail'"
                />
                <ElInput
                  v-model="opt.value"
                  placeholder="值"
                  style="width: 140px"
                  :disabled="dictItemDialogMode === 'detail'"
                />
                <ElButton
                  v-if="dictItemDialogMode !== 'detail'"
                  type="danger"
                  :icon="Minus"
                  circle
                  plain
                  size="small"
                  @click="field.options.splice(oIndex, 1)"
                />
              </div>
              <ElButton
                v-if="dictItemDialogMode !== 'detail'"
                type="primary"
                link
                size="small"
                @click="field.options.push({ label: '', value: '' })"
              >
                <ElIcon class="mr-1"><Plus /></ElIcon>
                添加选项
              </ElButton>
            </template>
          </div>
          <ElButton
            v-if="dictItemDialogMode !== 'detail'"
            type="primary"
            link
            @click="addDictItemTemplateField"
          >
            <ElIcon class="mr-1"><Plus /></ElIcon>
            添加字段
          </ElButton>

          <ElFormItem label="备注" prop="remark" class="mt-4">
            <ElInput
              v-model="dictItemFormData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
              :disabled="dictItemDialogMode === 'detail'"
            />
          </ElFormItem>
        </ElForm>
      </ElScrollbar>
      <template #footer>
        <ElButton @click="dictItemDialogVisible = false">
          {{ dictItemDialogMode === 'detail' ? '关闭' : '取消' }}
        </ElButton>
        <ElButton
          v-if="dictItemDialogMode !== 'detail'"
          type="primary"
          :loading="submitting"
          @click="handleSubmitDictItem"
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
  import { Plus, Minus } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import {
    fetchAddDict,
    fetchAddDictType,
    fetchDeleteDict,
    fetchDeleteDictType,
    fetchEditDict,
    fetchEditDictType,
    fetchGetDictDetail,
    fetchGetDictList,
    fetchGetDictTypeDetail,
    fetchGetDictTypeList
  } from '@/api/dict'

  defineOptions({ name: 'SubpackageDict' })

  type FormDialogMode = 'add' | 'edit' | 'detail'
  type DictTypeItem = Api.SystemManage.DictTypeItem
  type DictItemItem = Api.SystemManage.DictItemItem
  type TemplateFieldDef = NonNullable<NonNullable<DictTypeItem['formTemplate']>['fields']>[number]

  // ---- 表单模板字段编辑器 ----

  interface TemplateFieldRow extends TemplateFieldDef {
    _key: string
    options: Array<{ label: string; value: string }>
  }

  let tplKeySeq = 0
  const templateFields = ref<TemplateFieldRow[]>([])

  function createTemplateFieldRow(init?: Partial<TemplateFieldRow>): TemplateFieldRow {
    return {
      _key: `tpl_${++tplKeySeq}`,
      label: init?.label ?? '',
      name: init?.name ?? '',
      type: init?.type ?? 'text',
      required: init?.required ?? false,
      placeholder: init?.placeholder ?? '',
      options: init?.options ? [...init.options.map((o) => ({ ...o }))] : []
    }
  }

  const addTemplateField = () => {
    templateFields.value.push(createTemplateFieldRow())
  }

  const removeTemplateField = (index: number) => {
    templateFields.value.splice(index, 1)
  }

  /** 编辑时：JSON → 可视化行 */
  const parseTemplateToFields = (formTemplate: DictTypeItem['formTemplate']) => {
    if (!formTemplate?.fields?.length) {
      templateFields.value = []
      return
    }
    templateFields.value = formTemplate.fields.map((f) =>
      createTemplateFieldRow({
        label: f.label,
        name: f.name,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        options: f.options
      })
    )
  }

  /** 提交时：可视化行 → JSON */
  const buildFormTemplate = (): DictTypeItem['formTemplate'] => {
    const validFields = templateFields.value.filter((f) => f.label.trim() && f.name.trim())
    if (validFields.length === 0) return null

    return {
      fields: validFields.map((f) => {
        const field: TemplateFieldDef = {
          label: f.label.trim(),
          name: f.name.trim(),
          type: f.type
        }
        if (f.required) field.required = true
        if (f.placeholder?.trim()) field.placeholder = f.placeholder.trim()
        if (f.type === 'select' && f.options.length > 0) {
          field.options = f.options.filter((o) => o.label.trim() && o.value.trim())
        }
        return field
      })
    }
  }

  const addDictItemTemplateField = () => {
    dictItemTemplateFields.value.push(createTemplateFieldRow())
  }

  const removeDictItemTemplateField = (index: number) => {
    dictItemTemplateFields.value.splice(index, 1)
  }

  const parseDictItemTemplateToFields = (formTemplate: DictItemItem['formTemplate']) => {
    if (!formTemplate?.fields?.length) {
      dictItemTemplateFields.value = []
      return
    }
    dictItemTemplateFields.value = formTemplate.fields.map((f) =>
      createTemplateFieldRow({
        label: f.label,
        name: f.name,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        options: f.options
      })
    )
  }

  const buildDictItemFormTemplate = (): DictItemItem['formTemplate'] => {
    const validFields = dictItemTemplateFields.value.filter((f) => f.label.trim() && f.name.trim())
    if (validFields.length === 0) return null

    return {
      fields: validFields.map((f) => {
        const field: TemplateFieldDef = {
          label: f.label.trim(),
          name: f.name.trim(),
          type: f.type
        }
        if (f.required) field.required = true
        if (f.placeholder?.trim()) field.placeholder = f.placeholder.trim()
        if (f.type === 'select' && f.options.length > 0) {
          field.options = f.options.filter((o) => o.label.trim() && o.value.trim())
        }
        return field
      })
    }
  }

  // ---- 通用状态 ----

  const loading = ref(false)
  const submitting = ref(false)

  const dictTypes = ref<DictTypeItem[]>([])
  const filteredDictTypes = ref<DictTypeItem[]>([])
  const dictTypeKeyword = ref('')
  const currentTypeId = ref<number | null>(null)
  const currentTypeInfo = computed(
    () => dictTypes.value.find((item) => item.id === currentTypeId.value) || null
  )

  const dictItems = ref<DictItemItem[]>([])
  const dictItemPagination = reactive({ current: 1, size: 10, total: 0 })

  const typeDialogVisible = ref(false)
  const typeDialogMode = ref<'add' | 'edit'>('add')
  const currentTypeEditId = ref<number | null>(null)
  const typeFormRef = ref<FormInstance>()
  const typeFormData = reactive({
    typeCode: '',
    typeName: '',
    sortOrder: 0,
    status: 1 as 0 | 1,
    remark: null as string | null
  })

  const dictItemDialogVisible = ref(false)
  const dictItemDialogMode = ref<FormDialogMode>('add')
  const currentDictItemId = ref<number | null>(null)
  const dictItemFormRef = ref<FormInstance>()
  const dictItemTemplateFields = ref<TemplateFieldRow[]>([])
  const dictItemFormData = reactive<Api.SystemManage.DictItemSubmitParams>({
    typeId: 0,
    dictKey: '',
    dictValue: '',
    sortOrder: 0,
    parentId: 0,
    color: null,
    tagType: null,
    formTemplate: null,
    status: 1,
    remark: null
  })

  const dictItemSearchForm = ref({
    dictKey: undefined as string | undefined,
    dictValue: undefined as string | undefined,
    status: undefined as 0 | 1 | undefined
  })

  const dictItemSearchItems: SearchFormItem[] = [
    { key: 'dictKey', label: '字典键', type: 'input', span: 8, placeholder: '请输入字典键' },
    { key: 'dictValue', label: '字典值', type: 'input', span: 8, placeholder: '请输入字典值' },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 8,
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 }
      ],
      placeholder: '请选择状态'
    }
  ]

  const typeFormRules: FormRules = {
    typeName: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
    typeCode: [{ required: true, message: '请输入类型编码', trigger: 'blur' }]
  }

  const dictItemFormRules: FormRules = {
    dictKey: [{ required: true, message: '请输入字典键', trigger: 'blur' }],
    dictValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const { columns: dictItemColumns, columnChecks: dictItemColumnChecks } =
    useTableColumns<DictItemItem>(
      () =>
        [
          { type: 'index', label: '序号', width: 70 },
          { prop: 'dictKey', label: '字典键', minWidth: 140 },
          { prop: 'dictValue', label: '字典值', minWidth: 180, useSlot: true },
          { prop: 'parentId', label: '父级ID', width: 90 },
          { prop: 'sortOrder', label: '排序', width: 90 },
          { prop: 'color', label: '颜色', minWidth: 120, useSlot: true },
          { prop: 'tagType', label: '标签类型', width: 110, useSlot: true },
          { prop: 'status', label: '状态', width: 90, useSlot: true },
          { prop: 'remark', label: '备注', minWidth: 180, showOverflowTooltip: true },
          { prop: 'operation', label: '操作', width: 150, fixed: 'right', useSlot: true }
        ] as ColumnOption<DictItemItem>[]
    )

  const dictItemDialogTitle = computed(() => {
    if (dictItemDialogMode.value === 'add') return '新增字典项'
    if (dictItemDialogMode.value === 'edit') return '编辑字典项'
    return '字典项详情'
  })

  // ---- 字典类型 ----

  const filterDictTypes = () => {
    const keyword = dictTypeKeyword.value.trim().toLowerCase()
    if (!keyword) {
      filteredDictTypes.value = [...dictTypes.value]
      return
    }
    filteredDictTypes.value = dictTypes.value.filter(
      (item) =>
        item.typeName.toLowerCase().includes(keyword) ||
        item.typeCode.toLowerCase().includes(keyword)
    )
  }

  const fetchDictTypes = async () => {
    const list = await fetchGetDictTypeList()
    dictTypes.value = list || []
    filterDictTypes()

    if (!currentTypeId.value && dictTypes.value.length > 0) {
      currentTypeId.value = dictTypes.value[0].id
    }
    if (
      currentTypeId.value &&
      !dictTypes.value.some((item) => item.id === currentTypeId.value) &&
      dictTypes.value.length > 0
    ) {
      currentTypeId.value = dictTypes.value[0].id
    }
  }

  const handleTypeSelect = (item: DictTypeItem) => {
    currentTypeId.value = item.id
    dictItemPagination.current = 1
    fetchDictItems()
  }

  const resetTypeForm = () => {
    Object.assign(typeFormData, {
      typeCode: '',
      typeName: '',
      sortOrder: 0,
      status: 1,
      remark: null
    })
    templateFields.value = []
  }

  const handleAddType = () => {
    typeDialogMode.value = 'add'
    currentTypeEditId.value = null
    resetTypeForm()
    typeDialogVisible.value = true
  }

  const handleEditType = async (item: DictTypeItem) => {
    typeDialogMode.value = 'edit'
    currentTypeEditId.value = item.id
    const detail = await fetchGetDictTypeDetail(item.id)
    Object.assign(typeFormData, {
      typeCode: detail.typeCode,
      typeName: detail.typeName,
      sortOrder: detail.sortOrder,
      status: detail.status,
      remark: detail.remark
    })
    parseTemplateToFields(detail.formTemplate)
    typeDialogVisible.value = true
  }

  const handleDeleteType = (item: DictTypeItem) => {
    ElMessageBox.confirm(`确定要删除字典类型"${item.typeName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchDeleteDictType(item.id)
      if (currentTypeId.value === item.id) {
        currentTypeId.value = null
      }
      await fetchDictTypes()
      await fetchDictItems()
    })
  }

  const handleSubmitType = async () => {
    if (!typeFormRef.value) return
    const valid = await typeFormRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      const payload: Api.SystemManage.DictTypeSubmitParams = {
        typeCode: typeFormData.typeCode,
        typeName: typeFormData.typeName,
        formTemplate: buildFormTemplate(),
        sortOrder: typeFormData.sortOrder,
        status: typeFormData.status,
        remark: typeFormData.remark
      }

      if (typeDialogMode.value === 'add') {
        await fetchAddDictType(payload)
      } else if (currentTypeEditId.value != null) {
        await fetchEditDictType(currentTypeEditId.value, payload)
      }
      typeDialogVisible.value = false
      await fetchDictTypes()
    } finally {
      submitting.value = false
    }
  }

  // ---- 字典项 ----

  const fetchDictItems = async () => {
    if (!currentTypeId.value) {
      dictItems.value = []
      dictItemPagination.total = 0
      return
    }

    loading.value = true
    try {
      const data = await fetchGetDictList({
        current: dictItemPagination.current,
        size: dictItemPagination.size,
        typeId: currentTypeId.value,
        dictKey: dictItemSearchForm.value.dictKey?.trim(),
        dictValue: dictItemSearchForm.value.dictValue?.trim(),
        status: dictItemSearchForm.value.status
      })

      dictItems.value = data.records || []
      dictItemPagination.total = data.total || 0
      dictItemPagination.current = data.current || dictItemPagination.current
      dictItemPagination.size = data.size || dictItemPagination.size
    } finally {
      loading.value = false
    }
  }

  const handleDictItemSearch = () => {
    dictItemPagination.current = 1
    fetchDictItems()
  }

  const handleDictItemReset = () => {
    dictItemSearchForm.value = { dictKey: undefined, dictValue: undefined, status: undefined }
    dictItemPagination.current = 1
    fetchDictItems()
  }

  const handleDictItemSizeChange = (size: number) => {
    dictItemPagination.size = size
    dictItemPagination.current = 1
    fetchDictItems()
  }

  const handleDictItemCurrentChange = (current: number) => {
    dictItemPagination.current = current
    fetchDictItems()
  }

  const resetDictItemForm = () => {
    Object.assign(dictItemFormData, {
      typeId: currentTypeId.value || 0,
      dictKey: '',
      dictValue: '',
      sortOrder: 0,
      parentId: 0,
      color: null,
      tagType: null,
      formTemplate: null,
      status: 1,
      remark: null
    })
    dictItemTemplateFields.value = []
  }

  const handleAddDictItem = () => {
    if (!currentTypeId.value) return
    dictItemDialogMode.value = 'add'
    currentDictItemId.value = null
    resetDictItemForm()
    dictItemDialogVisible.value = true
  }

  const handleEditDictItem = async (row: DictItemItem) => {
    dictItemDialogMode.value = 'edit'
    currentDictItemId.value = row.id
    const detail = await fetchGetDictDetail(row.id)
    Object.assign(dictItemFormData, {
      typeId: detail.typeId,
      dictKey: detail.dictKey,
      dictValue: detail.dictValue,
      sortOrder: detail.sortOrder,
      parentId: detail.parentId,
      color: detail.color,
      tagType: detail.tagType,
      formTemplate: detail.formTemplate,
      status: detail.status,
      remark: detail.remark
    })
    parseDictItemTemplateToFields(detail.formTemplate)
    dictItemDialogVisible.value = true
  }

  const handleDetailDictItem = async (row: DictItemItem) => {
    dictItemDialogMode.value = 'detail'
    currentDictItemId.value = row.id
    const detail = await fetchGetDictDetail(row.id)
    Object.assign(dictItemFormData, {
      typeId: detail.typeId,
      dictKey: detail.dictKey,
      dictValue: detail.dictValue,
      sortOrder: detail.sortOrder,
      parentId: detail.parentId,
      color: detail.color,
      tagType: detail.tagType,
      formTemplate: detail.formTemplate,
      status: detail.status,
      remark: detail.remark
    })
    parseDictItemTemplateToFields(detail.formTemplate)
    dictItemDialogVisible.value = true
  }

  const handleDeleteDictItem = (row: DictItemItem) => {
    ElMessageBox.confirm(`确定要删除字典项"${row.dictValue}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchDeleteDict(row.id)
      await fetchDictItems()
      await fetchDictTypes()
    })
  }

  const handleSubmitDictItem = async () => {
    if (!dictItemFormRef.value) return
    const valid = await dictItemFormRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      dictItemFormData.formTemplate = buildDictItemFormTemplate()

      if (dictItemDialogMode.value === 'add') {
        await fetchAddDict(dictItemFormData)
      } else if (currentDictItemId.value != null) {
        await fetchEditDict(currentDictItemId.value, dictItemFormData)
      }

      dictItemDialogVisible.value = false
      await fetchDictItems()
      await fetchDictTypes()
    } finally {
      submitting.value = false
    }
  }

  onMounted(async () => {
    await fetchDictTypes()
    await fetchDictItems()
  })
</script>

<style scoped>
  .tree-card :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 12px;
  }
</style>
