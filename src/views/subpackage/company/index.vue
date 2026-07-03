<template>
  <div class="company-page art-full-height">
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
              新增企业
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
        <template #admissionStatus="{ row }">
          <ElTag :type="getAdmissionStatusMeta(row.admissionStatus).type" effect="light">
            {{ getAdmissionStatusMeta(row.admissionStatus).label }}
          </ElTag>
        </template>

        <template #legalPerson="{ row }">
          <ElTooltip :content="getLegalPersonContactTip(row)" placement="top">
            <span>{{ getLegalPersonDisplay(row) }}</span>
          </ElTooltip>
        </template>

        <template #contactPhone="{ row }">
          <span>{{ getPhoneDisplay(row) }}</span>
        </template>

        <template #email="{ row }">
          <span>{{ getEmailDisplay(row) }}</span>
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
      width="1280px"
      :class="['company-dialog', { 'company-dialog-view': isViewMode }]"
      :close-on-click-modal="false"
      :show-close="!submitting"
      destroy-on-close
    >
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="88px"
        :hide-required-asterisk="isViewMode"
      >
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <ElRow :gutter="10">
            <ElCol :span="8">
              <ElFormItem label="企业名称" prop="name">
                <ElInput
                  v-model="formData.name"
                  placeholder="请输入企业名称"
                  clearable
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="企业简称" prop="shortName">
                <ElInput
                  v-model="formData.shortName"
                  placeholder="请输入企业简称"
                  clearable
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="10">
              <ElFormItem label="统一信用代码" prop="creditCode">
                <ElInput
                  v-model="formData.creditCode"
                  placeholder="请输入统一社会信用代码"
                  clearable
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="纳税人规模">
                <ElSelect
                  v-model="formData.taxpayerScale"
                  placeholder="请选择纳税人规模"
                  class="w-full"
                  clearable
                  :disabled="isViewMode"
                >
                  <ElOption
                    v-for="item in taxpayerScaleOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="准入号">
                <ElInput
                  v-model="formData.admissionCode"
                  placeholder="请输入准入号"
                  clearable
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="准入状态">
                <ElSelect
                  v-model="formData.admissionStatus"
                  placeholder="请选择准入状态"
                  class="w-full"
                  clearable
                  :disabled="isViewMode"
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
            <ElCol :span="6">
              <ElFormItem label="注册资本">
                <ElInput
                  v-model="formData.registeredCapital"
                  placeholder="请输入注册资本"
                  clearable
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="成立日期">
                <ElDatePicker
                  v-model="formData.establishDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="请选择成立日期"
                  class="w-full"
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="经营状态">
                <ElInput
                  v-model="formData.status"
                  placeholder="请输入经营状态"
                  clearable
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="注册地址">
                <ElInput
                  v-model="formData.registeredAddress"
                  placeholder="请输入注册地址"
                  clearable
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="办公地址">
                <ElInput
                  v-model="formData.officeAddress"
                  placeholder="请输入办公地址"
                  clearable
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="经营范围">
                <ElInput
                  v-model="formData.businessScope"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入经营范围"
                  :disabled="isViewMode"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="备注">
                <ElInput
                  v-model="formData.remark"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入备注"
                  :disabled="isViewMode"
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
                  <ElSelect
                    v-model="contact.contactType"
                    placeholder="请选择类型"
                    class="w-full"
                    :disabled="isViewMode"
                  >
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
                  <ElInput
                    v-model="contact.contactValue"
                    placeholder="请输入联系方式"
                    clearable
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="3">
                <ElFormItem class="compact-form-item" label="主要">
                  <ElSwitch
                    :model-value="contact.primary === 1"
                    :disabled="isViewMode"
                    @change="(value) => handlePrimaryContactChange(index, Boolean(value))"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="4">
                <ElFormItem class="compact-form-item" label="状态">
                  <ElSelect v-model="contact.status" class="w-full" :disabled="isViewMode">
                    <ElOption label="有效" :value="1" />
                    <ElOption label="无效" :value="0" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="4">
                <ElFormItem class="compact-form-item" label="备注">
                  <ElInput
                    v-model="contact.remark"
                    placeholder="请输入备注"
                    clearable
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="2" class="contact-action-col">
                <ElButton
                  v-if="index > 0 && !isViewMode"
                  type="danger"
                  link
                  @click="handleRemoveContact(index)"
                >
                  删除
                </ElButton>
              </ElCol>
            </ElRow>
          </div>
          <ElButton
            v-if="!isViewMode"
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
          <div class="section-title">收款账户</div>
          <div
            v-for="(receiptAccount, index) in receiptAccountForms"
            :key="receiptAccount._key"
            class="dynamic-card"
          >
            <div class="dynamic-card-header">
              <div class="dynamic-card-index">账户 {{ index + 1 }}</div>
              <ElButton
                v-if="index > 0 && !isViewMode"
                type="danger"
                link
                @click="handleRemoveReceiptAccount(index)"
              >
                删除
              </ElButton>
            </div>
            <ElRow :gutter="10">
              <ElCol :span="6">
                <ElFormItem
                  class="compact-form-item"
                  label="户名"
                  :prop="`receiptAccounts.${index}.accountName`"
                  :rules="[{ required: true, message: '请输入收款户名', trigger: 'blur' }]"
                >
                  <ElInput
                    v-model="receiptAccount.accountName"
                    placeholder="请输入收款户名"
                    clearable
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem
                  class="compact-form-item"
                  label="开户行"
                  :prop="`receiptAccounts.${index}.bankName`"
                  :rules="[{ required: true, message: '请输入开户银行', trigger: 'blur' }]"
                >
                  <ElInput
                    v-model="receiptAccount.bankName"
                    placeholder="请输入开户银行"
                    clearable
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem
                  class="compact-form-item"
                  label="账号"
                  :prop="`receiptAccounts.${index}.accountNo`"
                  :rules="[{ required: true, message: '请输入收款账号', trigger: 'blur' }]"
                >
                  <ElInput
                    v-model="receiptAccount.accountNo"
                    placeholder="请输入收款账号"
                    clearable
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="3">
                <ElFormItem class="compact-form-item" label="默认">
                  <ElSwitch
                    :model-value="receiptAccount.primary === 1"
                    :disabled="isViewMode"
                    @change="(value) => handlePrimaryReceiptAccountChange(index, Boolean(value))"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="3">
                <ElFormItem class="compact-form-item" label="状态">
                  <ElSelect v-model="receiptAccount.status" class="w-full" :disabled="isViewMode">
                    <ElOption label="启用" :value="1" />
                    <ElOption label="停用" :value="0" />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem class="compact-form-item" label="开户支行">
                  <ElInput
                    v-model="receiptAccount.bankBranchName"
                    placeholder="请输入开户支行"
                    clearable
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem class="compact-form-item" label="联行号">
                  <ElInput
                    v-model="receiptAccount.unionBankNo"
                    placeholder="请输入联行号"
                    clearable
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem class="compact-form-item" label="备注">
                  <ElInput
                    v-model="receiptAccount.remark"
                    placeholder="请输入备注"
                    clearable
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>
          <ElButton
            v-if="!isViewMode"
            type="primary"
            plain
            size="small"
            class="section-add-btn"
            @click="handleAddReceiptAccount"
          >
            <ElIcon>
              <Plus />
            </ElIcon>
            增加收款账户
          </ElButton>
        </div>

        <div class="form-section">
          <div class="section-title">证件证书</div>
          <div
            v-for="(certificate, index) in certificateForms"
            :key="certificate._key"
            class="dynamic-card"
          >
            <div class="dynamic-card-header">
              <div class="dynamic-card-index">证件 {{ index + 1 }}</div>
              <ElButton
                v-if="index > 0 && !isViewMode"
                type="danger"
                link
                @click="handleRemoveCertificate(index)"
              >
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
                  <ElInput
                    v-if="isViewMode"
                    :model-value="certificate.certificateTypeName || '-'"
                    disabled
                  />
                  <ElSelect
                    v-else
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
              <ElCol :span="8">
                <ElFormItem label="证书编号">
                  <ElInput
                    v-model="certificate.certNumber"
                    placeholder="请输入证书编号"
                    clearable
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="5">
                <ElFormItem label="状态">
                  <ElSelect v-model="certificate.status" class="w-full" :disabled="isViewMode">
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
                    :disabled="isViewMode"
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
                    :disabled="isViewMode"
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
                    :disabled="isViewMode"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="备注">
                  <ElInput
                    v-model="certificate.remark"
                    placeholder="请输入备注"
                    clearable
                    :disabled="isViewMode"
                  />
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
                    :disabled="isViewMode"
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
                    :disabled="isViewMode"
                    @input="(value) => setDynamicFieldValue(certificate, field.name, value)"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <div v-else class="compact-empty">当前证件类型未配置动态字段</div>

            <div class="sub-section-title">附件上传</div>
            <div class="upload-area upload-area-inline">
              <ElUpload
                v-if="!isViewMode"
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
                    v-if="!isViewMode"
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
            v-if="!isViewMode"
            type="primary"
            plain
            size="small"
            class="section-add-btn"
            @click="handleAddCertificate"
          >
            <ElIcon>
              <Plus />
            </ElIcon>
            增加证件证书
          </ElButton>
        </div>
      </ElForm>

      <template #footer>
        <ElButton @click="dialogVisible = false">{{ isViewMode ? '关闭' : '取消' }}</ElButton>
        <ElButton v-if="!isViewMode" type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </ElButton>
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
    fetchAddCompany,
    fetchDeleteCompany,
    fetchEditCompany,
    fetchGetCompanyDetail,
    fetchGetCompanyList
  } from '@/api/company'

  defineOptions({ name: 'SubpackageCompany' })

  type CompanyItem = Api.SystemManage.CompanyListItem
  type CompanySubmitParams = Api.SystemManage.CompanySubmitParams
  type CompanyContactItem = Api.SystemManage.CompanyContactItem
  type CompanyContactSubmitItem = Api.SystemManage.CompanyContactSubmitItem
  type CompanyCertificateSubmitItem = Api.SystemManage.CompanyCertificateSubmitItem
  type CompanyReceiptAccountItem = Api.SystemManage.CompanyReceiptAccountItem
  type CompanyReceiptAccountSubmitItem = Api.SystemManage.CompanyReceiptAccountSubmitItem
  type DictItemItem = Api.SystemManage.DictItemItem
  type TemplateFieldDef = NonNullable<NonNullable<DictItemItem['formTemplate']>['fields']>[number]

  type CompanyDetailResponse = CompanyItem & {
    contacts?: CompanyContactItem[]
    certificates?: CompanyCertificateSubmitItem[]
    receiptAccounts?: CompanyReceiptAccountItem[]
  }

  type UploadedFileItem = Pick<
    Api.SystemManage.FileListItem,
    'id' | 'name' | 'path' | 'contentType' | 'ext' | 'size'
  >

  interface ContactFormItem extends CompanyContactSubmitItem {
    _key: string
  }

  interface ReceiptAccountFormItem extends CompanyReceiptAccountSubmitItem {
    _key: string
  }

  interface CertificateFormItem extends CompanyCertificateSubmitItem {
    _key: string
    status: 0 | 1 | 2
    remark: string | null
    templateFields: TemplateFieldDef[]
    fileList: UploadedFileItem[]
    uploading: boolean
  }

  type DialogMode = 'add' | 'edit' | 'view'

  const admissionStatusOptions = [
    { label: '已准入', value: 'enabled' as const },
    { label: '待准入', value: 'pending' as const },
    { label: '已停用', value: 'disabled' as const }
  ]

  const taxpayerScaleOptions = ['一般纳税人', '小规模纳税人']

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
  const dialogTitle = ref('新增企业')
  const dialogMode = ref<DialogMode>('add')
  const currentEditId = ref<number | null>(null)
  const formRef = ref<FormInstance>()
  const tableData = ref<CompanyItem[]>([])
  const certificateTypeOptions = ref<DictItemItem[]>([])

  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const searchForm = ref<{ name?: string }>({
    name: undefined
  })

  const searchItems: SearchFormItem[] = [
    {
      key: 'name',
      label: '企业名称',
      type: 'input',
      span: 8,
      placeholder: '请输入企业名称'
    }
  ]

  const formData = reactive<CompanySubmitParams>({
    name: '',
    shortName: '',
    creditCode: null,
    taxpayerScale: null,
    admissionCode: null,
    admissionStatus: 'pending',
    registeredCapital: null,
    establishDate: null,
    status: null,
    businessScope: null,
    registeredAddress: null,
    officeAddress: null,
    remark: null,
    contacts: [],
    certificates: [],
    receiptAccounts: []
  })

  const contactForms = ref<ContactFormItem[]>([])
  const receiptAccountForms = ref<ReceiptAccountFormItem[]>([])
  const certificateForms = ref<CertificateFormItem[]>([])

  const formRules: FormRules = {
    name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
    shortName: [{ required: true, message: '请输入企业简称', trigger: 'blur' }]
  }

  const isViewMode = computed(() => dialogMode.value === 'view')

  watch(
    () => formData.name,
    (value, oldValue) => {
      const firstAccount = receiptAccountForms.value[0]
      if (!firstAccount) return
      if (
        !firstAccount.id &&
        (!firstAccount.accountName ||
          firstAccount.accountName.trim() === '' ||
          firstAccount.accountName === (oldValue ?? ''))
      ) {
        firstAccount.accountName = value?.trim() || ''
      }
    }
  )

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
    receiptAccountForms,
    () => {
      formData.receiptAccounts = receiptAccountForms.value.map((item) => ({
        id: item.id,
        accountName: item.accountName.trim(),
        bankName: item.bankName.trim(),
        bankBranchName: item.bankBranchName?.trim() || null,
        accountNo: item.accountNo.trim(),
        unionBankNo: item.unionBankNo?.trim() || null,
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
        fileIds: [...item.fileIds],
        status: item.status,
        remark: item.remark?.trim() || null
      }))
    },
    { deep: true }
  )

  const getAdmissionStatusMeta = (status: CompanyItem['admissionStatus']) => {
    if (status === 'enabled') {
      return { label: '已准入', type: 'success' as const }
    }
    if (status === 'pending') {
      return { label: '待准入', type: 'warning' as const }
    }
    if (status === 'disabled') {
      return { label: '已停用', type: 'danger' as const }
    }
    return { label: '-', type: 'info' as const }
  }

  const getPrimaryContactByType = (contacts: CompanyContactItem[] = [], contactType: string) => {
    const primaryContact = contacts.find(
      (item) => item.contactType === contactType && item.primary === 1 && item.contactValue
    )
    if (primaryContact) return primaryContact.contactValue

    const firstContact = contacts.find(
      (item) => item.contactType === contactType && item.contactValue
    )
    return firstContact?.contactValue || null
  }

  const getPhoneDisplay = (row: CompanyItem) => {
    if (row.contactPhone) return row.contactPhone
    return getPrimaryContactByType(row.contacts || [], 'phone') || '-'
  }

  const getEmailDisplay = (row: CompanyItem) =>
    row.email || getPrimaryContactByType(row.contacts || [], 'mail') || '-'

  const getLegalPersonDisplay = (row: CompanyItem) => row.legalPerson || row.contactPerson || '-'

  const getLegalPersonContactTip = (row: CompanyItem) => {
    const phone = getPrimaryContactByType(row.contacts || [], 'phone')
    const mail = getPrimaryContactByType(row.contacts || [], 'mail')
    const parts = [phone ? `?????${phone}` : '', mail ? `?????${mail}` : ''].filter(Boolean)
    return parts.length ? parts.join(' / ') : '?????????'
  }

  const { columns, columnChecks } = useTableColumns<CompanyItem>(
    () =>
      [
        { type: 'index', label: '序号', width: 64, align: 'center', headerAlign: 'center' },
        {
          prop: 'name',
          label: '企业名称',
          minWidth: 180,
          align: 'center',
          headerAlign: 'center',
          showOverflowTooltip: true
        },
        {
          prop: 'shortName',
          label: '简称',
          width: 120,
          align: 'center',
          headerAlign: 'center',
          formatter: (row) => row.shortName || '-'
        },
        {
          prop: 'creditCode',
          label: '统一信用代码',
          width: 190,
          align: 'center',
          headerAlign: 'center',
          showOverflowTooltip: true,
          formatter: (row) => row.creditCode || '-'
        },
        {
          prop: 'taxpayerScale',
          label: '纳税人规模',
          width: 126,
          align: 'center',
          headerAlign: 'center',
          formatter: (row) => row.taxpayerScale || '-'
        },
        {
          prop: 'admissionCode',
          label: '准入号',
          width: 126,
          align: 'center',
          headerAlign: 'center',
          formatter: (row) => row.admissionCode || '-'
        },
        {
          prop: 'admissionStatus',
          label: '准入状态',
          width: 104,
          align: 'center',
          headerAlign: 'center',
          useSlot: true
        },
        {
          prop: 'contactPerson',
          label: '联系人',
          width: 100,
          align: 'center',
          headerAlign: 'center',
          useSlot: true
        },
        {
          prop: 'contactPhone',
          label: '联系电话',
          width: 136,
          align: 'center',
          headerAlign: 'center',
          useSlot: true
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
      ] as ColumnOption<CompanyItem>[]
  )

  const createContactFormItem = (init?: Partial<CompanyContactSubmitItem>): ContactFormItem => ({
    _key: `contact_${++dynamicKeySeed}`,
    id: init?.id,
    contactType: init?.contactType || 'phone',
    contactValue: init?.contactValue || '',
    primary: init?.primary ?? 0,
    status: init?.status ?? 1,
    remark: init?.remark ?? null
  })

  const createReceiptAccountFormItem = (
    init?: Partial<CompanyReceiptAccountSubmitItem>
  ): ReceiptAccountFormItem => ({
    _key: `receipt_account_${++dynamicKeySeed}`,
    id: init?.id,
    accountName: init?.accountName || formData.name || '',
    bankName: init?.bankName || '',
    bankBranchName: init?.bankBranchName || null,
    accountNo: init?.accountNo || '',
    unionBankNo: init?.unionBankNo || null,
    primary: init?.primary ?? 0,
    status: init?.status ?? 1,
    remark: init?.remark ?? null
  })

  const createCertificateFormItem = (
    init?: Partial<CompanyCertificateSubmitItem> & { status?: 0 | 1 | 2; remark?: string | null }
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
    currentEditId.value = null
    Object.assign(formData, {
      name: '',
      shortName: '',
      creditCode: null,
      taxpayerScale: null,
      admissionCode: null,
      admissionStatus: 'pending',
      registeredCapital: null,
      establishDate: null,
      status: null,
      businessScope: null,
      registeredAddress: null,
      officeAddress: null,
      remark: null,
      contacts: [],
      certificates: [],
      receiptAccounts: []
    })

    contactForms.value = [createContactFormItem({ contactType: 'phone', primary: 1 })]
    receiptAccountForms.value = [createReceiptAccountFormItem({ primary: 1, status: 1 })]
    certificateForms.value = [createCertificateFormItem()]
  }

  const normalizeContactForms = (contacts: CompanyContactItem[] = []) => {
    if (!contacts.length) {
      return [createContactFormItem({ contactType: 'phone', primary: 1 })]
    }

    return contacts.map((item) =>
      createContactFormItem({
        id: item.id,
        contactType: item.contactType,
        contactValue: item.contactValue,
        primary: item.primary ?? 0,
        status: item.status ?? 1,
        remark: item.remark ?? null
      })
    )
  }

  const normalizeReceiptAccountForms = (receiptAccounts: CompanyReceiptAccountItem[] = []) => {
    if (!receiptAccounts.length) {
      return [createReceiptAccountFormItem({ primary: 1, status: 1 })]
    }

    return receiptAccounts.map((item) =>
      createReceiptAccountFormItem({
        id: item.id,
        accountName: item.accountName,
        bankName: item.bankName,
        bankBranchName: item.bankBranchName ?? null,
        accountNo: item.accountNo,
        unionBankNo: item.unionBankNo ?? null,
        primary: item.primary ?? 0,
        status: item.status ?? 1,
        remark: item.remark ?? null
      })
    )
  }

  const createUploadedFileList = (fileIds: number[] = []) =>
    fileIds.map((id) => ({
      id,
      name: `文件ID: ${id}`,
      path: '',
      contentType: null,
      ext: null,
      size: 0
    })) as UploadedFileItem[]

  const normalizeCertificateFileList = (certificate: CompanyCertificateSubmitItem) => {
    if (certificate.files?.length) {
      return certificate.files.map((item) => ({
        id: item.id,
        name: item.name,
        path: item.path,
        contentType: item.contentType,
        ext: item.ext,
        size: item.size
      }))
    }

    return createUploadedFileList(certificate.fileIds || [])
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

  const normalizeCertificateForms = (certificates: CompanyCertificateSubmitItem[] = []) =>
    certificates.length
      ? certificates.map((item) => {
          const normalizedFileIds = item.files?.length
            ? item.files.map((file) => file.id)
            : item.fileIds || []

          const certificate = createCertificateFormItem({
            id: item.id,
            certificateTypeId: item.certificateType?.id || item.certificateTypeId,
            certificateTypeName: item.certificateType?.dictValue || item.certificateTypeName,
            certNumber: item.certNumber,
            issueDate: item.issueDate,
            expiryDate: item.expiryDate,
            issuingAuthority: item.issuingAuthority,
            dynamicFields: item.dynamicFields,
            fileIds: normalizedFileIds,
            status: item.status ?? 1,
            remark: item.remark ?? null
          })

          certificate.fileList = normalizeCertificateFileList(item)

          const templateSource =
            item.certificateType ||
            certificateTypeOptions.value.find(
              (option) => option.id === certificate.certificateTypeId
            ) ||
            null
          applyCertificateTemplate(certificate, templateSource?.formTemplate || null)
          return certificate
        })
      : [createCertificateFormItem()]

  const populateFormByDetail = (detail: CompanyDetailResponse) => {
    currentEditId.value = detail.id
    Object.assign(formData, {
      name: detail.name || '',
      shortName: detail.shortName || '',
      creditCode: detail.creditCode || null,
      taxpayerScale: detail.taxpayerScale || null,
      admissionCode: detail.admissionCode || null,
      admissionStatus: detail.admissionStatus || 'pending',
      registeredCapital: detail.registeredCapital || null,
      establishDate: detail.establishDate || null,
      status: detail.status || null,
      businessScope: detail.businessScope || null,
      registeredAddress: detail.registeredAddress || null,
      officeAddress: detail.officeAddress || null,
      remark: detail.remark || null,
      contacts: [],
      certificates: [],
      receiptAccounts: []
    })

    contactForms.value = normalizeContactForms(detail.contacts || [])
    receiptAccountForms.value = normalizeReceiptAccountForms(detail.receiptAccounts || [])
    certificateForms.value = normalizeCertificateForms(detail.certificates || [])
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

  const handleAddReceiptAccount = () => {
    receiptAccountForms.value.push(
      createReceiptAccountFormItem({ accountName: formData.name || '' })
    )
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

  const handlePrimaryReceiptAccountChange = (index: number, value: boolean) => {
    const current = receiptAccountForms.value[index]
    if (!current) return

    if (!value) {
      current.primary = 0
      return
    }

    receiptAccountForms.value.forEach((item, itemIndex) => {
      item.primary = itemIndex === index ? 1 : 0
    })
  }

  const handleRemoveReceiptAccount = (index: number) => {
    const removedAccount = receiptAccountForms.value[index]
    receiptAccountForms.value.splice(index, 1)

    if (!removedAccount) return

    if (
      receiptAccountForms.value.length &&
      !receiptAccountForms.value.some((item) => item.primary === 1)
    ) {
      receiptAccountForms.value[0].primary = 1
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
      const uploaded = await fetchUploadFile(rawFile, 'company_documents', '')
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

  const validateCertificateDynamicFields = () => {
    for (const certificate of certificateForms.value) {
      for (const field of certificate.templateFields) {
        if (!field.required) continue

        const value = certificate.dynamicFields?.[field.name]
        if (value == null || value === '') {
          ElMessage.error(
            `${certificate.certificateTypeName || '证件证书'}的${field.label}不能为空`
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
      certificateTypeOptions.value = await fetchGetDictItemsByTypeCode('company_documents')
    } finally {
      certificateTypeLoading.value = false
    }
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

  const handleAdd = async () => {
    dialogTitle.value = '新增企业'
    dialogMode.value = 'add'
    resetFormData()
    if (!certificateTypeOptions.value.length) {
      await fetchCertificateTypes()
    }
    dialogVisible.value = true
  }

  const handleEdit = async (row: CompanyItem) => {
    dialogTitle.value = '编辑企业'
    dialogMode.value = 'edit'
    resetFormData()
    if (!certificateTypeOptions.value.length) {
      await fetchCertificateTypes()
    }
    const detail = (await fetchGetCompanyDetail(row.id)) as CompanyDetailResponse
    populateFormByDetail(detail)
    dialogVisible.value = true
  }

  const handleDetail = async (row: CompanyItem) => {
    dialogTitle.value = '查看企业'
    dialogMode.value = 'view'
    resetFormData()
    if (!certificateTypeOptions.value.length) {
      await fetchCertificateTypes()
    }
    const detail = (await fetchGetCompanyDetail(row.id)) as CompanyDetailResponse
    populateFormByDetail(detail)
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

  const createSubmitPayload = (): CompanySubmitParams => {
    return {
      name: formData.name.trim(),
      shortName: formData.shortName.trim(),
      creditCode: formData.creditCode?.trim() || null,
      taxpayerScale: formData.taxpayerScale?.trim() || null,
      admissionCode: formData.admissionCode?.trim() || null,
      admissionStatus: formData.admissionStatus || null,
      registeredCapital: formData.registeredCapital?.trim() || null,
      establishDate: formData.establishDate || null,
      status: formData.status?.trim() || null,
      businessScope: formData.businessScope?.trim() || null,
      registeredAddress: formData.registeredAddress?.trim() || null,
      officeAddress: formData.officeAddress?.trim() || null,
      remark: formData.remark?.trim() || null,
      contacts: formData.contacts.map((item) => ({
        id: item.id,
        contactType: item.contactType,
        contactValue: item.contactValue,
        primary: item.primary,
        status: item.status,
        remark: item.remark
      })),
      certificates: formData.certificates.map((item) => ({
        id: item.id,
        certificateTypeId: item.certificateTypeId,
        certificateTypeName: item.certificateTypeName,
        certNumber: item.certNumber,
        issueDate: item.issueDate,
        expiryDate: item.expiryDate,
        issuingAuthority: item.issuingAuthority,
        dynamicFields: item.dynamicFields,
        fileIds: item.fileIds,
        status: item.status,
        remark: item.remark
      })),
      receiptAccounts: formData.receiptAccounts.map((item) => ({
        id: item.id,
        accountName: item.accountName,
        bankName: item.bankName,
        bankBranchName: item.bankBranchName,
        accountNo: item.accountNo,
        unionBankNo: item.unionBankNo,
        primary: item.primary,
        status: item.status,
        remark: item.remark
      }))
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    if (!validateCertificateDynamicFields()) return

    submitting.value = true

    try {
      const payload = createSubmitPayload()

      if (dialogMode.value === 'edit' && currentEditId.value != null) {
        await fetchEditCompany(currentEditId.value, payload)
      } else {
        await fetchAddCompany(payload)
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

<style lang="scss" scoped>
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

  .compact-empty {
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

  :deep(.company-dialog .el-dialog__header) {
    padding-bottom: 8px;
  }

  :deep(.company-dialog .el-dialog__body) {
    padding-top: 10px;
    padding-bottom: 12px;
  }

  :deep(.company-dialog .el-form-item) {
    margin-bottom: 10px;
  }

  :deep(.company-dialog .compact-form-item .el-form-item__label) {
    white-space: nowrap;
  }

  :deep(.company-dialog .el-dialog__footer) {
    padding-top: 10px;
  }

  :deep(.company-dialog .el-input__wrapper),
  :deep(.company-dialog .el-select__wrapper),
  :deep(.company-dialog .el-date-editor.el-input) {
    min-height: 36px;
  }

  :deep(.company-dialog textarea.el-textarea__inner) {
    min-height: 64px !important;
  }

  :deep(.company-dialog-view .el-input.is-disabled .el-input__wrapper),
  :deep(.company-dialog-view .el-textarea.is-disabled .el-textarea__inner),
  :deep(.company-dialog-view .el-select .el-select__wrapper.is-disabled),
  :deep(.company-dialog-view .el-date-editor.is-disabled),
  :deep(.company-dialog-view .el-date-editor.is-disabled .el-input__wrapper) {
    color: var(--art-gray-900);
    cursor: default;
    background: var(--el-fill-color-lighter);
    border-color: var(--el-border-color-lighter);
    box-shadow: none;
    opacity: 1;
  }

  :deep(.company-dialog-view .el-input.is-disabled input),
  :deep(.company-dialog-view .el-textarea.is-disabled textarea),
  :deep(.company-dialog-view .el-select .el-select__wrapper.is-disabled .el-select__selected-item),
  :deep(.company-dialog-view .el-date-editor.is-disabled input) {
    color: var(--art-gray-900);
    -webkit-text-fill-color: var(--art-gray-900);
  }

  :deep(.company-dialog-view .el-input.is-disabled .el-input__suffix),
  :deep(.company-dialog-view .el-select .el-select__wrapper.is-disabled .el-select__caret),
  :deep(.company-dialog-view .el-date-editor.is-disabled .el-input__prefix) {
    color: var(--art-gray-500);
  }

  :deep(.company-dialog-view .el-switch.is-disabled) {
    opacity: 1;
  }

  :deep(.company-dialog-view .el-switch.is-disabled .el-switch__core) {
    cursor: default;
  }
</style>
