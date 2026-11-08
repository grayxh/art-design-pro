/**
 * 证件证书表单逻辑
 *
 * 企业（company）与人员（personnel）两个管理页的「证件证书」部分完全同构：
 * - 证件类型来自字典（dict item），并按字典模板动态生成表单字段
 * - 附件统一走文件上传接口
 * - 表单态与提交态之间需要一层 normalize
 *
 * 这里把重复的实现收敛成一份 composable，页面只需声明自己的字典编码。
 *
 * @module views/subpackage/composables/useCertificateForm
 */

import { ref } from 'vue'
import type { FormItemRule, UploadFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { fetchGetDictItemsByTypeCode } from '@/api/dict'
import { fetchUploadFile } from '@/api/file'

/** 证件类型选项（来源为字典项） */
export type CertificateTypeOption = Api.SystemManage.DictItemItem

/** 字典模板中定义的动态字段 */
export type CertificateTemplateField = NonNullable<
  NonNullable<CertificateTypeOption['formTemplate']>['fields']
>[number]

/** 已上传附件 */
export type UploadedFileItem = Pick<
  Api.SystemManage.FileListItem,
  'id' | 'name' | 'path' | 'contentType' | 'ext' | 'size'
>

/** 表单态证件，附带模板字段、附件列表等运行时状态 */
export interface CertificateFormItem extends Api.SystemManage.PersonCertificateSubmitItem {
  _key: string
  status: 0 | 1 | 2
  remark: string | null
  templateFields: CertificateTemplateField[]
  fileList: UploadedFileItem[]
  uploading: boolean
}

/** createCertificateFormItem 的入参 */
export type CertificateFormInit = Partial<Api.SystemManage.PersonCertificateSubmitItem> & {
  status?: 0 | 1 | 2
  remark?: string | null
}

export interface UseCertificateFormOptions {
  /** 证件类型字典编码，如 company_documents / personal_documents */
  typeCode: string
  /** 附件上传时携带的业务类型 */
  uploadBusinessType: string
  /** 动态字段校验失败提示中的证件名称，默认「证件证书」 */
  certificateLabel?: string
}

export function useCertificateForm(options: UseCertificateFormOptions) {
  const { typeCode, uploadBusinessType, certificateLabel = '证件证书' } = options

  /** 证件类型选项 */
  const certificateTypeOptions = ref<CertificateTypeOption[]>([])
  /** 证件类型加载状态 */
  const certificateTypeLoading = ref(false)
  /** 证件表单列表 */
  const certificateForms = ref<CertificateFormItem[]>([])

  let keySeed = 0

  /** 创建一条空的证件表单 */
  const createCertificateFormItem = (init?: CertificateFormInit): CertificateFormItem => ({
    _key: `certificate_${++keySeed}`,
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

  /** 仅有 fileId 时占位展示的附件列表 */
  const createUploadedFileList = (fileIds: number[] = []): UploadedFileItem[] =>
    fileIds.map((id) => ({
      id,
      name: `文件ID: ${id}`,
      path: '',
      contentType: null,
      ext: null,
      size: 0
    }))

  /** 接口返回的附件列表 → 表单态附件列表 */
  const normalizeCertificateFileList = (
    certificate: Api.SystemManage.PersonCertificateSubmitItem
  ): UploadedFileItem[] => {
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
    formTemplate: CertificateTypeOption['formTemplate']
  ): CertificateTemplateField[] =>
    formTemplate?.fields?.map((field) => ({ ...field, options: field.options || [] })) || []

  /**
   * 应用字典模板：重建动态字段定义，并保留仍存在于新模板中的旧值
   */
  const applyCertificateTemplate = (
    certificate: CertificateFormItem,
    formTemplate: CertificateTypeOption['formTemplate']
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

  const normalizeCertificateForms = (
    certificates: Api.SystemManage.PersonCertificateSubmitItem[] = []
  ): CertificateFormItem[] => {
    if (!certificates.length) return [createCertificateFormItem()]

    return certificates.map((item) => {
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
  }

  /** 动态字段的校验规则 */
  const buildDynamicFieldRules = (field: CertificateTemplateField): FormItemRule[] => {
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

  /** 文件大小格式化 */
  const formatFileSize = (size?: number | null) => {
    if (size == null) return '-'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  const handleAddCertificate = () => {
    certificateForms.value.push(createCertificateFormItem())
  }

  const handleRemoveCertificate = (index: number) => {
    certificateForms.value.splice(index, 1)
  }

  /** 切换证件类型时重建动态字段 */
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

  const handleUploadFileChange = async (index: number, uploadFile: UploadFile) => {
    const rawFile = uploadFile.raw
    const certificate = certificateForms.value[index]
    if (!rawFile || !certificate) return

    certificate.uploading = true

    try {
      const uploaded = await fetchUploadFile(rawFile, uploadBusinessType, '')
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

  /** 动态字段必填校验（不走 ElForm，按模板逐项检查） */
  const validateCertificateDynamicFields = () => {
    for (const certificate of certificateForms.value) {
      for (const field of certificate.templateFields) {
        if (!field.required) continue

        const value = certificate.dynamicFields?.[field.name]
        if (value == null || value === '') {
          ElMessage.error(
            `${certificate.certificateTypeName || certificateLabel}的${field.label}不能为空`
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
      certificateTypeOptions.value = await fetchGetDictItemsByTypeCode(typeCode)
    } finally {
      certificateTypeLoading.value = false
    }
  }

  return {
    certificateTypeOptions,
    certificateTypeLoading,
    certificateForms,
    createCertificateFormItem,
    normalizeCertificateForms,
    buildDynamicFieldRules,
    getDynamicFieldValue,
    setDynamicFieldValue,
    formatFileSize,
    handleAddCertificate,
    handleRemoveCertificate,
    handleCertificateTypeChange,
    handleUploadFileChange,
    handleRemoveUploadedFile,
    validateCertificateDynamicFields,
    fetchCertificateTypes
  }
}
