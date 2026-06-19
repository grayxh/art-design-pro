<template>
  <div class="personnel-page art-full-height">
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="8"
      :show-expand="false"
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
              新增人员
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        row-key="id"
        :loading="loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #gender="{ row }">
          <ElTag :type="getGenderMeta(row.gender).type" effect="light">
            {{ getGenderMeta(row.gender).label }}
          </ElTag>
        </template>

        <template #age="{ row }">
          <span>{{ getDisplayAge(row) }}</span>
        </template>

        <template #phone="{ row }">
          <span>{{ getPhoneDisplay(row.contacts) }}</span>
        </template>

        <template #address="{ row }">
          <div class="table-address-cell">{{ row.address || '-' }}</div>
        </template>

        <template #operation="{ row }">
          <div class="table-operation-cell">
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
      width="1200px"
      class="personnel-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="78px">
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <ElRow :gutter="10">
            <ElCol :span="7">
              <ElFormItem label="姓名" prop="name">
                <ElInput v-model="formData.name" placeholder="请输入姓名" clearable />
              </ElFormItem>
            </ElCol>
            <ElCol :span="4">
              <ElFormItem label="性别" prop="gender">
                <ElSelect v-model="formGender" placeholder="请选择性别" class="w-full" clearable>
                  <ElOption
                    v-for="item in genderOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="3">
              <ElFormItem label="年龄">
                <ElInput :model-value="displayFormAge" disabled />
              </ElFormItem>
            </ElCol>
            <ElCol :span="5">
              <ElFormItem label="出生日期" prop="birthDate">
                <ElDatePicker
                  v-model="formData.birthDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="请选择出生日期"
                  class="w-full"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="5">
              <ElFormItem label="民族" prop="nation">
                <ElSelect
                  v-model="formData.nation"
                  placeholder="请选择民族"
                  class="w-full"
                  filterable
                  clearable
                >
                  <ElOption v-for="item in nationOptions" :key="item" :label="item" :value="item" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="9">
              <ElFormItem label="身份证号" prop="idNumber">
                <ElInput
                  v-model="formData.idNumber"
                  placeholder="请输入身份证号"
                  clearable
                  @blur="handleIdNumberBlur"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="10">
              <ElFormItem label="住址" prop="address">
                <ElInput v-model="formData.address" placeholder="请输入住址" clearable />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="备注" prop="remark">
                <ElInput
                  v-model="formData.remark"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入备注"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>

        <div class="form-section">
          <div class="section-title">联系方式</div>
          <div v-for="(contact, index) in contactForms" :key="contact._key" class="dynamic-card">
            <ElRow :gutter="10">
              <ElCol :span="4">
                <ElFormItem
                  class="compact-form-item"
                  label="类型"
                  :prop="`contacts.${index}.contactType`"
                  :rules="[{ required: true, message: '请选择联系方式类型', trigger: 'change' }]"
                >
                  <ElSelect v-model="contact.contactType" placeholder="请选择类型" class="w-full">
                    <ElOption
                      v-for="item in contactTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="7">
                <ElFormItem
                  class="compact-form-item"
                  label="联系方式"
                  :prop="`contacts.${index}.contactValue`"
                  :rules="[{ required: true, message: '请输入联系方式', trigger: 'blur' }]"
                >
                  <ElInput v-model="contact.contactValue" placeholder="请输入联系方式" clearable />
                </ElFormItem>
              </ElCol>
              <ElCol :span="3">
                <ElFormItem class="compact-form-item" label="主要">
                  <ElSwitch
                    :model-value="contact.primary === 1"
                    @change="(value) => handlePrimaryContactChange(index, Boolean(value))"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="4">
                <ElFormItem class="compact-form-item" label="状态">
                  <ElSelect v-model="contact.status" class="w-full">
                    <ElOption label="有效" :value="1" />
                    <ElOption label="无效" :value="0" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="4">
                <ElFormItem class="compact-form-item" label="备注">
                  <ElInput v-model="contact.remark" placeholder="请输入备注" clearable />
                </ElFormItem>
              </ElCol>
              <ElCol :span="2" class="contact-action-col">
                <ElButton v-if="index > 0" type="danger" link @click="handleRemoveContact(index)">
                  删除
                </ElButton>
              </ElCol>
            </ElRow>
          </div>
          <ElButton
            type="primary"
            plain
            size="small"
            class="section-add-btn"
            @click="handleAddContact"
          >
            <ElIcon>
              <Plus />
            </ElIcon>
            增加联系方式
          </ElButton>
        </div>

        <div class="form-section">
          <div class="section-title section-title-inline">
            <span>工作信息</span>
            <span class="section-title-tip">后续完善</span>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">证书证件</div>
          <div
            v-for="(certificate, index) in certificateForms"
            :key="certificate._key"
            class="dynamic-card"
          >
            <div class="dynamic-card-header">
              <div class="dynamic-card-index">证件 {{ index + 1 }}</div>
              <ElButton v-if="index > 0" type="danger" link @click="handleRemoveCertificate(index)">
                删除
              </ElButton>
            </div>
            <ElRow :gutter="10">
              <ElCol :span="7">
                <ElFormItem
                  label="类型"
                  :prop="`certificates.${index}.certificateTypeId`"
                  :rules="[{ required: true, message: '请选择证件类型', trigger: 'change' }]"
                >
                  <ElSelect
                    :model-value="certificate.certificateTypeId || undefined"
                    placeholder="请选择证件类型"
                    class="w-full"
                    filterable
                    clearable
                    :loading="certificateTypeLoading"
                    @change="(value) => handleCertificateTypeChange(index, value)"
                  >
                    <ElOption
                      v-for="item in certificateTypeOptions"
                      :key="item.id"
                      :label="item.dictValue"
                      :value="item.id"
                    />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="证件名称">
                  <ElInput :model-value="certificate.certificateTypeName || '-'" disabled />
                </ElFormItem>
              </ElCol>
              <ElCol :span="7">
                <ElFormItem label="证书编号">
                  <ElInput
                    v-model="certificate.certNumber"
                    placeholder="请输入证书编号"
                    clearable
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="4">
                <ElFormItem label="状态">
                  <ElSelect v-model="certificate.status" class="w-full">
                    <ElOption label="有效" :value="1" />
                    <ElOption label="无效" :value="0" />
                    <ElOption label="已过期" :value="2" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="发证机关">
                  <ElInput
                    v-model="certificate.issuingAuthority"
                    placeholder="请输入发证机关"
                    clearable
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="5">
                <ElFormItem label="发证日期">
                  <ElDatePicker
                    v-model="certificate.issueDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="请选择发证日期"
                    class="w-full"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="5">
                <ElFormItem label="失效日期">
                  <ElDatePicker
                    v-model="certificate.expiryDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="请选择失效日期"
                    class="w-full"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="备注">
                  <ElInput v-model="certificate.remark" placeholder="请输入备注" clearable />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <div class="sub-section-title">动态字段</div>
            <ElRow v-if="certificate.templateFields.length" :gutter="10">
              <ElCol v-for="field in certificate.templateFields" :key="field.name" :span="6">
                <ElFormItem
                  :label="field.label"
                  :prop="`certificateDynamic.${certificate._key}.${field.name}`"
                  :rules="buildDynamicFieldRules(field)"
                >
                  <ElSelect
                    v-if="field.type === 'select'"
                    :model-value="getDynamicFieldValue(certificate, field.name)"
                    :placeholder="field.placeholder || `请选择${field.label}`"
                    class="w-full"
                    clearable
                    @change="(value) => setDynamicFieldValue(certificate, field.name, value)"
                  >
                    <ElOption
                      v-for="option in field.options || []"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                  <ElInput
                    v-else
                    :model-value="getDynamicFieldValue(certificate, field.name)"
                    :placeholder="field.placeholder || `请输入${field.label}`"
                    clearable
                    @input="(value) => setDynamicFieldValue(certificate, field.name, value)"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <div v-else class="compact-empty">当前证件类型未配置动态字段</div>

            <div class="sub-section-title">附件上传</div>
            <div class="upload-area upload-area-inline">
              <ElUpload
                multiple
                :auto-upload="false"
                :show-file-list="false"
                :on-change="(uploadFile) => handleUploadFileChange(index, uploadFile)"
              >
                <ElButton type="primary" plain :loading="certificate.uploading">
                  上传文件
                </ElButton>
              </ElUpload>

              <div v-if="certificate.fileList.length" class="uploaded-file-list">
                <div
                  v-for="fileItem in certificate.fileList"
                  :key="fileItem.id"
                  class="uploaded-file-item"
                >
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-g-900">{{ fileItem.name }}</div>
                    <div class="mt-1 text-xs text-g-500">
                      {{ formatFileSize(fileItem.size) }}
                      <span v-if="fileItem.ext"> · {{ fileItem.ext }}</span>
                    </div>
                  </div>
                  <ElButton
                    type="danger"
                    link
                    @click="handleRemoveUploadedFile(index, fileItem.id)"
                  >
                    删除
                  </ElButton>
                </div>
              </div>
              <div v-else class="compact-empty compact-empty-inline">暂无已上传文件</div>
            </div>
          </div>
          <ElButton
            type="primary"
            plain
            size="small"
            class="section-add-btn"
            @click="handleAddCertificate"
          >
            <ElIcon>
              <Plus />
            </ElIcon>
            增加证书证件
          </ElButton>
        </div>
      </ElForm>

      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { UploadFile } from 'element-plus'
  import type { FormInstance, FormItemRule, FormRules } from 'element-plus'
  import type { ColumnOption } from '@/types/component'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import { Plus } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { fetchGetDictItemsByTypeCode } from '@/api/dict'
  import { fetchUploadFile } from '@/api/file'
  import {
    fetchAddPerson,
    fetchDeletePerson,
    fetchGetPersonDetail,
    fetchGetPersonList
  } from '@/api/person'

  defineOptions({ name: 'SubpackagePersonnel' })

  type PersonItem = Api.SystemManage.PersonListItem & { age?: number | null }
  type PersonSubmitParams = Api.SystemManage.PersonSubmitParams
  type PersonContactItem = Api.SystemManage.PersonContactItem
  type PersonContactSubmitItem = Api.SystemManage.PersonContactSubmitItem
  type PersonCertificateSubmitItem = Api.SystemManage.PersonCertificateSubmitItem
  type DictItemItem = Api.SystemManage.DictItemItem
  type GenderValue = Exclude<PersonItem['gender'], null>
  type TemplateFieldDef = NonNullable<NonNullable<DictItemItem['formTemplate']>['fields']>[number]

  type PersonDetailResponse = PersonItem & {
    certificates?: Array<
      PersonCertificateSubmitItem & {
        status?: 0 | 1 | 2
        remark?: string | null
      }
    >
  }

  type UploadedFileItem = Pick<
    Api.SystemManage.FileListItem,
    'id' | 'name' | 'path' | 'contentType' | 'ext' | 'size'
  >

  interface ContactFormItem extends PersonContactSubmitItem {
    _key: string
  }

  interface CertificateFormItem extends PersonCertificateSubmitItem {
    _key: string
    status: 0 | 1 | 2
    remark: string | null
    templateFields: TemplateFieldDef[]
    fileList: UploadedFileItem[]
    uploading: boolean
  }

  const nationOptions = [
    '汉族',
    '蒙古族',
    '回族',
    '藏族',
    '维吾尔族',
    '苗族',
    '彝族',
    '壮族',
    '布依族',
    '朝鲜族',
    '满族',
    '侗族',
    '瑶族',
    '白族',
    '土家族',
    '哈尼族',
    '哈萨克族',
    '傣族',
    '黎族',
    '傈僳族',
    '佤族',
    '畲族',
    '高山族',
    '拉祜族',
    '水族',
    '东乡族',
    '纳西族',
    '景颇族',
    '柯尔克孜族',
    '土族',
    '达斡尔族',
    '仫佬族',
    '羌族',
    '布朗族',
    '撒拉族',
    '毛南族',
    '仡佬族',
    '锡伯族',
    '阿昌族',
    '普米族',
    '塔吉克族',
    '怒族',
    '乌孜别克族',
    '俄罗斯族',
    '鄂温克族',
    '德昂族',
    '保安族',
    '裕固族',
    '京族',
    '塔塔尔族',
    '独龙族',
    '鄂伦春族',
    '赫哲族',
    '门巴族',
    '珞巴族',
    '基诺族',
    '其他'
  ]

  const contactTypeOptions = [
    { label: '电话', value: 'phone' },
    { label: '邮箱', value: 'mail' },
    { label: '微信', value: 'wechat' },
    { label: 'QQ', value: 'qq' },
    { label: '其他', value: 'other' }
  ]

  let dynamicKeySeed = 0

  const loading = ref(false)
  const submitting = ref(false)
  const certificateTypeLoading = ref(false)
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增人员')
  const formRef = ref<FormInstance>()
  const tableData = ref<PersonItem[]>([])
  const rawCertificates = ref<PersonDetailResponse['certificates']>([])
  const certificateTypeOptions = ref<DictItemItem[]>([])

  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const searchForm = ref<{
    name?: string
    idNumber?: string
    phone?: string
  }>({
    name: undefined,
    idNumber: undefined,
    phone: undefined
  })

  const searchItems: SearchFormItem[] = [
    {
      key: 'name',
      label: '姓名',
      type: 'input',
      span: 8,
      placeholder: '请输入姓名'
    },
    {
      key: 'idNumber',
      label: '身份证号',
      type: 'input',
      span: 8,
      placeholder: '请输入身份证号'
    },
    {
      key: 'phone',
      label: '电话',
      type: 'input',
      span: 8,
      placeholder: '请输入电话'
    }
  ]

  const genderOptions = [
    { label: '男', value: '男' as GenderValue },
    { label: '女', value: '女' as GenderValue }
  ]

  const formData = reactive<PersonSubmitParams>({
    name: '',
    idNumber: null,
    gender: null,
    nation: null,
    birthDate: null,
    address: null,
    remark: null,
    contacts: [],
    certificates: []
  })

  const contactForms = ref<ContactFormItem[]>([])
  const certificateForms = ref<CertificateFormItem[]>([])

  const formRules: FormRules = {
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    idNumber: [
      {
        validator: (_rule, value, callback) => {
          if (!value) {
            callback()
            return
          }

          const result = validateChineseIdCard(value)
          if (!result.valid) {
            callback(new Error(result.message))
            return
          }

          callback()
        },
        trigger: 'blur'
      }
    ]
  }

  const formGender = computed({
    get: () => formData.gender ?? undefined,
    set: (value) => {
      formData.gender = (value ?? null) as PersonItem['gender']
    }
  })

  const displayFormAge = computed(() => {
    const age = getAgeFromBirthDate(formData.birthDate) ?? getAgeFromIdCard(formData.idNumber)
    return age == null ? '-' : String(age)
  })

  watch(
    contactForms,
    () => {
      formData.contacts = contactForms.value.map((item) => ({
        id: item.id,
        contactType: item.contactType,
        contactValue: item.contactValue.trim(),
        primary: item.primary ?? 0,
        status: item.status ?? 1,
        remark: item.remark?.trim() || null
      }))
    },
    { deep: true }
  )

  watch(
    certificateForms,
    () => {
      formData.certificates = certificateForms.value.map((item) => ({
        id: item.id,
        certificateTypeId: item.certificateTypeId,
        certificateTypeName: item.certificateTypeName,
        certNumber: item.certNumber?.trim() || null,
        issueDate: item.issueDate || null,
        expiryDate: item.expiryDate || null,
        issuingAuthority: item.issuingAuthority?.trim() || null,
        dynamicFields:
          item.dynamicFields && Object.keys(item.dynamicFields).length > 0
            ? item.dynamicFields
            : null,
        fileIds: [...item.fileIds]
      }))
    },
    { deep: true }
  )

  const getGenderMeta = (gender: PersonItem['gender']) => {
    if (gender === ('男' as PersonItem['gender'])) {
      return { label: '男', type: 'primary' as const }
    }

    if (gender === ('女' as PersonItem['gender'])) {
      return { label: '女', type: 'success' as const }
    }

    return { label: '-', type: 'info' as const }
  }

  const getDisplayAge = (row: PersonItem) => {
    if (typeof row.age === 'number') return row.age

    const age = getAgeFromBirthDate(row.birthDate) ?? getAgeFromIdCard(row.idNumber)
    return age == null ? '-' : age
  }

  const getPhoneDisplay = (contacts: PersonContactItem[] = []) => {
    if (!contacts.length) return '-'

    const primaryPhone = contacts.find(
      (item) =>
        (item as PersonContactSubmitItem).primary === 1 &&
        item.contactType === 'phone' &&
        item.contactValue
    )
    if (primaryPhone) return primaryPhone.contactValue

    const firstPhone = contacts.find((item) => item.contactType === 'phone' && item.contactValue)
    return firstPhone?.contactValue || '-'
  }

  const { columns, columnChecks } = useTableColumns<PersonItem>(
    () =>
      [
        { type: 'index', label: '序号', width: 64, align: 'center', headerAlign: 'center' },
        { prop: 'name', label: '姓名', width: 100, align: 'center', headerAlign: 'center' },
        {
          prop: 'gender',
          label: '性别',
          width: 78,
          align: 'center',
          headerAlign: 'center',
          useSlot: true
        },
        {
          prop: 'age',
          label: '年龄',
          width: 72,
          align: 'center',
          headerAlign: 'center',
          useSlot: true
        },
        {
          prop: 'birthDate',
          label: '出生日期',
          width: 116,
          align: 'center',
          headerAlign: 'center',
          formatter: (row) => row.birthDate || '-'
        },
        {
          prop: 'nation',
          label: '民族',
          width: 88,
          align: 'center',
          headerAlign: 'center',
          formatter: (row) => row.nation || '-'
        },
        {
          prop: 'idNumber',
          label: '身份证号',
          width: 184,
          align: 'center',
          headerAlign: 'center',
          showOverflowTooltip: true,
          formatter: (row) => row.idNumber || '-'
        },
        {
          prop: 'phone',
          label: '电话',
          width: 132,
          align: 'center',
          headerAlign: 'center',
          useSlot: true
        },
        {
          prop: 'address',
          label: '住址',
          minWidth: 180,
          align: 'left',
          headerAlign: 'center',
          showOverflowTooltip: true,
          useSlot: true
        },
        {
          prop: 'remark',
          label: '备注',
          minWidth: 140,
          align: 'center',
          headerAlign: 'center',
          showOverflowTooltip: true,
          formatter: (row) => row.remark || '-'
        },
        {
          prop: 'operation',
          label: '操作',
          width: 134,
          align: 'center',
          headerAlign: 'center',
          fixed: 'right',
          useSlot: true
        }
      ] as ColumnOption<PersonItem>[]
  )

  const createContactFormItem = (init?: Partial<PersonContactSubmitItem>): ContactFormItem => ({
    _key: `contact_${++dynamicKeySeed}`,
    contactType: init?.contactType || 'phone',
    contactValue: init?.contactValue || '',
    primary: init?.primary ?? 0,
    status: init?.status ?? 1,
    remark: init?.remark ?? null,
    id: init?.id
  })

  const createCertificateFormItem = (
    init?: Partial<PersonCertificateSubmitItem> & { status?: 0 | 1 | 2; remark?: string | null }
  ): CertificateFormItem => ({
    _key: `certificate_${++dynamicKeySeed}`,
    id: init?.id,
    certificateTypeId: init?.certificateTypeId || 0,
    certificateTypeName: init?.certificateTypeName || '',
    certNumber: init?.certNumber || null,
    issueDate: init?.issueDate || null,
    expiryDate: init?.expiryDate || null,
    issuingAuthority: init?.issuingAuthority || null,
    dynamicFields: init?.dynamicFields ? { ...init.dynamicFields } : null,
    fileIds: init?.fileIds ? [...init.fileIds] : [],
    status: init?.status ?? 1,
    remark: init?.remark ?? null,
    templateFields: [],
    fileList: [],
    uploading: false
  })

  const resetFormData = () => {
    Object.assign(formData, {
      name: '',
      idNumber: null,
      gender: null,
      nation: null,
      birthDate: null,
      address: null,
      remark: null,
      contacts: [],
      certificates: []
    })

    contactForms.value = [createContactFormItem({ contactType: 'phone', primary: 1 })]
    certificateForms.value = [createCertificateFormItem()]
    rawCertificates.value = []
  }

  const normalizeTemplateFields = (
    formTemplate: DictItemItem['formTemplate']
  ): TemplateFieldDef[] =>
    formTemplate?.fields?.map((field) => ({ ...field, options: field.options || [] })) || []

  const applyCertificateTemplate = (
    certificate: CertificateFormItem,
    formTemplate: DictItemItem['formTemplate']
  ) => {
    const fields = normalizeTemplateFields(formTemplate)
    const currentValues = certificate.dynamicFields || {}
    const nextDynamicFields = fields.reduce<Record<string, any>>((accumulator, field) => {
      if (currentValues[field.name] != null && currentValues[field.name] !== '') {
        accumulator[field.name] = currentValues[field.name]
      }
      return accumulator
    }, {})

    certificate.templateFields = fields
    certificate.dynamicFields = Object.keys(nextDynamicFields).length ? nextDynamicFields : null
  }

  const buildDynamicFieldRules = (field: TemplateFieldDef): FormItemRule[] => {
    if (!field.required) return []

    return [
      {
        required: true,
        message: `${field.type === 'select' ? '请选择' : '请输入'}${field.label}`,
        trigger: field.type === 'select' ? 'change' : 'blur'
      }
    ]
  }

  const getDynamicFieldValue = (certificate: CertificateFormItem, fieldName: string) =>
    certificate.dynamicFields?.[fieldName] ?? undefined

  const setDynamicFieldValue = (
    certificate: CertificateFormItem,
    fieldName: string,
    value: string | number | undefined
  ) => {
    const nextFields = { ...(certificate.dynamicFields || {}) }

    if (value == null || value === '') {
      delete nextFields[fieldName]
    } else {
      nextFields[fieldName] = value
    }

    certificate.dynamicFields = Object.keys(nextFields).length ? nextFields : null
  }

  const getAgeFromBirthDate = (birthDate?: string | null) => {
    if (!birthDate) return null

    const birth = new Date(birthDate)
    if (Number.isNaN(birth.getTime())) return null

    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    const dayDiff = today.getDate() - birth.getDate()

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1
    }

    return age >= 0 ? age : null
  }

  const getAgeFromIdCard = (idNumber?: string | null) => {
    const birthday = parseBirthDateFromIdCard(idNumber)
    return getAgeFromBirthDate(birthday)
  }

  const parseBirthDateFromIdCard = (idNumber?: string | null) => {
    if (!idNumber || idNumber.length !== 18) return null

    const year = idNumber.slice(6, 10)
    const month = idNumber.slice(10, 12)
    const day = idNumber.slice(12, 14)
    const birthDate = `${year}-${month}-${day}`

    const date = new Date(birthDate)
    if (Number.isNaN(date.getTime())) return null

    return birthDate
  }

  const parseGenderFromIdCard = (idNumber?: string | null): PersonItem['gender'] => {
    if (!idNumber || idNumber.length !== 18) return null
    const genderCode = Number(idNumber.charAt(16))
    if (Number.isNaN(genderCode)) return null
    return genderCode % 2 === 1 ? '男' : '女'
  }

  const validateChineseIdCard = (idNumber?: string | null) => {
    if (!idNumber) {
      return { valid: true, message: '' }
    }

    const normalized = idNumber.trim().toUpperCase()
    if (!/^\d{17}[\dX]$/.test(normalized)) {
      return { valid: false, message: '身份证号格式不正确' }
    }

    const birthDate = parseBirthDateFromIdCard(normalized)
    if (!birthDate) {
      return { valid: false, message: '身份证号中的出生日期无效' }
    }

    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    const sum = normalized
      .slice(0, 17)
      .split('')
      .reduce((total, current, index) => total + Number(current) * weights[index], 0)

    if (checkCodes[sum % 11] !== normalized.charAt(17)) {
      return { valid: false, message: '身份证号校验位不正确' }
    }

    return { valid: true, message: '' }
  }

  const handlePrimaryContactChange = (index: number, value: boolean) => {
    const current = contactForms.value[index]
    if (!current) return

    if (!value) {
      current.primary = 0
      return
    }

    const currentType = current.contactType
    contactForms.value.forEach((item, itemIndex) => {
      if (item.contactType === currentType) {
        item.primary = itemIndex === index ? 1 : 0
      }
    })
  }

  const handleAddContact = () => {
    contactForms.value.push(createContactFormItem())
  }

  const handleRemoveContact = (index: number) => {
    const removedContact = contactForms.value[index]
    contactForms.value.splice(index, 1)

    if (!removedContact) return

    const sameTypeContacts = contactForms.value.filter(
      (item) => item.contactType === removedContact.contactType
    )
    if (sameTypeContacts.length && !sameTypeContacts.some((item) => item.primary === 1)) {
      sameTypeContacts[0].primary = 1
    }
  }

  const handleAddCertificate = () => {
    certificateForms.value.push(createCertificateFormItem())
  }

  const handleRemoveCertificate = (index: number) => {
    certificateForms.value.splice(index, 1)
  }

  const handleCertificateTypeChange = (index: number, value?: number) => {
    const certificate = certificateForms.value[index]
    if (!certificate) return

    if (!value) {
      certificate.certificateTypeId = 0
      certificate.certificateTypeName = ''
      certificate.templateFields = []
      certificate.dynamicFields = null
      return
    }

    const matched = certificateTypeOptions.value.find((item) => item.id === value)
    certificate.certificateTypeId = value
    certificate.certificateTypeName = matched?.dictValue || ''
    applyCertificateTemplate(certificate, matched?.formTemplate || null)
  }

  const formatFileSize = (size?: number | null) => {
    if (size == null) return '-'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  const handleUploadFileChange = async (index: number, uploadFile: UploadFile) => {
    const rawFile = uploadFile.raw
    const certificate = certificateForms.value[index]
    if (!rawFile || !certificate) return

    certificate.uploading = true

    try {
      const uploaded = await fetchUploadFile(rawFile, 'personal_documents', '')
      if (!certificate.fileIds.includes(uploaded.id)) {
        certificate.fileIds.push(uploaded.id)
      }
      certificate.fileList.push({
        id: uploaded.id,
        name: uploaded.name,
        path: uploaded.path,
        contentType: uploaded.contentType,
        ext: uploaded.ext,
        size: uploaded.size
      })
    } finally {
      certificate.uploading = false
    }
  }

  const handleRemoveUploadedFile = (index: number, fileId: number) => {
    const certificate = certificateForms.value[index]
    if (!certificate) return

    certificate.fileIds = certificate.fileIds.filter((id) => id !== fileId)
    certificate.fileList = certificate.fileList.filter((item) => item.id !== fileId)
  }

  const handleIdNumberBlur = () => {
    if (!formData.idNumber) return

    const result = validateChineseIdCard(formData.idNumber)
    if (!result.valid) return

    if (!formData.birthDate) {
      formData.birthDate = parseBirthDateFromIdCard(formData.idNumber)
    }

    if (!formData.gender) {
      formData.gender = parseGenderFromIdCard(formData.idNumber)
    }
  }

  const validateCertificateDynamicFields = () => {
    for (const certificate of certificateForms.value) {
      for (const field of certificate.templateFields) {
        if (!field.required) continue

        const value = certificate.dynamicFields?.[field.name]
        if (value == null || value === '') {
          ElMessage.error(
            `${certificate.certificateTypeName || '证书证件'}的${field.label}不能为空`
          )
          return false
        }
      }
    }

    return true
  }

  const fetchCertificateTypes = async () => {
    certificateTypeLoading.value = true

    try {
      certificateTypeOptions.value = await fetchGetDictItemsByTypeCode('personal_documents')
    } finally {
      certificateTypeLoading.value = false
    }
  }

  const fetchData = async () => {
    loading.value = true

    try {
      const data = await fetchGetPersonList({
        current: pagination.current,
        size: pagination.size,
        name: searchForm.value.name?.trim(),
        idNumber: searchForm.value.idNumber?.trim(),
        phone: searchForm.value.phone?.trim()
      } as Api.SystemManage.PersonSearchParams)

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
    searchForm.value = {
      name: undefined,
      idNumber: undefined,
      phone: undefined
    }
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

  const handleAdd = async () => {
    dialogTitle.value = '新增人员'
    resetFormData()
    if (!certificateTypeOptions.value.length) {
      await fetchCertificateTypes()
    }
    dialogVisible.value = true
  }

  const handleEdit = async (row: PersonItem) => {
    const detail = (await fetchGetPersonDetail(row.id)) as PersonDetailResponse
    rawCertificates.value = detail.certificates || []
    ElMessage.info(`编辑人员功能后续补充完整表单，当前人员：${detail.name}`)
  }

  const handleDetail = async (row: PersonItem) => {
    const detail = await fetchGetPersonDetail(row.id)
    ElMessage.info(`查看人员：${detail.name}`)
  }

  const handleDelete = (row: PersonItem) => {
    ElMessageBox.confirm(`确定要删除人员“${row.name}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchDeletePerson(row.id)

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
    if (!validateCertificateDynamicFields()) return

    submitting.value = true

    try {
      await fetchAddPerson({
        ...formData,
        contacts: formData.contacts.map((item) => ({
          contactType: item.contactType,
          contactValue: item.contactValue,
          primary: item.primary,
          status: item.status,
          remark: item.remark
        })),
        certificates: formData.certificates.map((item) => ({
          certificateTypeId: item.certificateTypeId,
          certificateTypeName: item.certificateTypeName,
          certNumber: item.certNumber,
          issueDate: item.issueDate,
          expiryDate: item.expiryDate,
          issuingAuthority: item.issuingAuthority,
          dynamicFields: item.dynamicFields,
          fileIds: item.fileIds
        }))
      })

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

<style lang="scss" scoped>
  .table-address-cell {
    text-align: left;
  }

  .table-operation-cell {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .form-section {
    margin-bottom: 14px;
  }

  .section-title {
    margin-bottom: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .section-title-inline {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .section-title-tip {
    font-size: 12px;
    font-weight: 400;
    color: var(--art-gray-500);
  }

  .dynamic-card {
    padding: 12px 12px 8px;
    margin-bottom: 10px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
  }

  .dynamic-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .dynamic-card-index {
    font-size: 13px;
    font-weight: 600;
    color: var(--art-gray-700);
  }

  .sub-section-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--art-gray-800);
  }

  .upload-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .upload-area-inline {
    align-items: flex-start;
  }

  .uploaded-file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .uploaded-file-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 8px 10px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .compact-empty,
  .section-placeholder {
    padding: 4px 0 2px;
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .compact-empty-inline {
    min-height: 24px;
  }

  .section-add-btn {
    margin-top: 0;
  }

  .contact-action-col {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.personnel-dialog .el-dialog__header) {
    padding-bottom: 8px;
  }

  :deep(.personnel-dialog .el-dialog__body) {
    padding-top: 10px;
    padding-bottom: 12px;
  }

  :deep(.personnel-dialog .el-form-item) {
    margin-bottom: 10px;
  }

  :deep(.personnel-dialog .compact-form-item .el-form-item__label) {
    white-space: nowrap;
  }

  :deep(.personnel-dialog .el-dialog__footer) {
    padding-top: 10px;
  }

  :deep(.personnel-dialog .el-input__wrapper),
  :deep(.personnel-dialog .el-select__wrapper),
  :deep(.personnel-dialog .el-date-editor.el-input) {
    min-height: 36px;
  }

  :deep(.personnel-dialog textarea.el-textarea__inner) {
    min-height: 64px !important;
  }
</style>
