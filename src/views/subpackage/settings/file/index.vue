<template>
  <div class="file-page art-full-height">
    <ElCard class="art-card-xs mb-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 class="m-0 text-base font-semibold">文件管理</h3>
          <p class="mt-2 text-sm leading-6 text-g-700">
            统一管理上传文件、缩略图、OCR 信息和存储元数据。顶部的“仅看正式文件”开关默认开启，
            开启时会带上 <code>thumbnail=0</code>，关闭时则不过滤缩略图标记。
          </p>
        </div>
        <ElSpace wrap>
          <ElTag type="primary" effect="light">统一文件表</ElTag>
          <ElTag type="success" effect="light">缩略图筛选</ElTag>
        </ElSpace>
      </div>
    </ElCard>

    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="6"
      :is-expand="true"
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
      />

      <ArtTable
        :loading="loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #thumbnailPreview="{ row }">
          <div class="flex items-center gap-3">
            <ElImage
              v-if="getPreviewUrl(row)"
              :src="getPreviewUrl(row)!"
              fit="cover"
              preview-teleported
              :preview-src-list="[getPreviewUrl(row)!]"
              class="h-12 w-12 overflow-hidden rounded-lg border border-solid border-g-300"
            />
            <span v-else class="text-sm text-g-600">暂无预览</span>
          </div>
        </template>

        <template #storageType="{ row }">
          <ElTag type="primary" effect="light">{{ row.storageType }}</ElTag>
        </template>

        <template #size="{ row }">
          <span>{{ formatFileSize(row.size) }}</span>
        </template>

        <template #thumbnail="{ row }">
          <ElTag :type="row.thumbnail === 1 ? 'warning' : 'info'" effect="light">
            {{ row.thumbnail === 1 ? '是' : '否' }}
          </ElTag>
        </template>

        <template #ocrStatus="{ row }">
          <ElTag :type="ocrStatusMap[row.ocrStatus]?.type ?? 'info'" effect="light">
            {{ ocrStatusMap[row.ocrStatus]?.label ?? row.ocrStatus }}
          </ElTag>
        </template>

        <template #status="{ row }">
          <ElTag :type="row.status === 1 ? 'success' : 'info'" effect="light">
            {{ row.status === 1 ? '有效' : '无效' }}
          </ElTag>
        </template>

        <template #operation="{ row }">
          <div class="flex">
            <ArtButtonTable type="view" @click="handleDetail(row)" />
            <ArtButtonTable type="delete" @click="handleDelete(row)" />
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <ElDialog
      v-model="detailVisible"
      title="文件详情"
      width="820px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <div class="rounded-xl border border-solid border-g-300 bg-g-100/40 p-4">
          <ElImage
            v-if="getDetailPreviewUrl(currentFile)"
            :src="getDetailPreviewUrl(currentFile)!"
            fit="contain"
            preview-teleported
            :preview-src-list="[getDetailPreviewUrl(currentFile)!]"
            class="h-48 w-full overflow-hidden rounded-lg bg-white"
          />
          <div v-else class="flex h-48 items-center justify-center rounded-lg bg-white text-g-600">
            暂无预览
          </div>
        </div>

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="文件名">{{ currentFile.name || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="存储类型">{{
            currentFile.storageType || '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="路径">
            <span class="break-all">{{ currentFile.path || '-' }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="桶名称">{{
            currentFile.bucketName || '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="文件大小">{{
            formatFileSize(currentFile.size)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="扩展名">{{ currentFile.ext || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="MIME 类型">
            <span class="break-all">{{ currentFile.contentType || '-' }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="MD5">
            <span class="break-all">{{ currentFile.md5 || '-' }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="来源">{{ currentFile.source || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用途">{{ currentFile.purpose || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="是否缩略图">
            {{ currentFile.thumbnail === 1 ? '是' : '否' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="OCR 状态">
            {{ getOcrStatusMeta(currentFile.ocrStatus).label }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">{{
            currentFile.status === 1 ? '有效' : '无效'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">{{
            currentFile.createdAt || '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="备注" :span="2">{{
            currentFile.remark || '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="OCR 文本" :span="2">
            <div class="max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
              {{ currentFile.ocrText || '-' }}
            </div>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <template #footer>
        <ElButton @click="detailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FunctionalComponent } from 'vue'
  import { h } from 'vue'
  import { ElSwitch } from 'element-plus'
  import type { ColumnOption } from '@/types/component'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { fetchDeleteFile, fetchGetFileDetail, fetchGetFileList } from '@/api/file'

  defineOptions({ name: 'SubpackageFile' })

  type FileItem = Api.SystemManage.FileListItem
  type FileSearchForm = {
    name?: string
    storageType?: string
    source?: string
    purpose?: string
    status?: 0 | 1
    onlyFormal: boolean
  }

  const loading = ref(false)
  const detailVisible = ref(false)
  const tableData = ref<FileItem[]>([])
  const currentFile = ref<Partial<FileItem>>({})

  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  const searchForm = ref<FileSearchForm>({
    name: undefined,
    storageType: undefined,
    source: undefined,
    purpose: undefined,
    status: undefined,
    onlyFormal: true
  })

  const ocrStatusMap: Record<
    number,
    { label: string; type: 'info' | 'warning' | 'success' | 'danger' }
  > = {
    0: { label: '未识别', type: 'info' },
    1: { label: '识别中', type: 'warning' },
    2: { label: '已完成', type: 'success' },
    3: { label: '失败', type: 'danger' }
  }

  const getOcrStatusMeta = (status: number | null | undefined) => {
    if (status == null) {
      return { label: '-', type: 'info' as const }
    }

    return ocrStatusMap[status] || { label: String(status), type: 'info' as const }
  }

  const FormalFileSwitch: FunctionalComponent = () =>
    h(
      ElSwitch,
      {
        modelValue: searchForm.value.onlyFormal,
        'onUpdate:modelValue': (value: string | number | boolean) => {
          searchForm.value.onlyFormal = Boolean(value)
          handleFormalOnlyChange()
        },
        activeText: '开启',
        inactiveText: '关闭'
      },
      {}
    )

  const searchItems = computed<SearchFormItem[]>(() => [
    {
      key: 'name',
      label: '文件名',
      type: 'input',
      span: 6,
      placeholder: '请输入文件名'
    },
    {
      key: 'storageType',
      label: '存储类型',
      type: 'select',
      span: 6,
      options: [
        { label: 'MinIO', value: 'minio' },
        { label: '本地', value: 'local' },
        { label: '阿里云', value: 'aliyun' },
        { label: '腾讯云', value: 'tencent' }
      ],
      placeholder: '请选择存储类型'
    },
    {
      key: 'source',
      label: '来源',
      type: 'input',
      span: 6,
      placeholder: '请输入来源'
    },
    {
      key: 'purpose',
      label: '用途',
      type: 'input',
      span: 6,
      placeholder: '请输入用途'
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 6,
      options: [
        { label: '有效', value: 1 },
        { label: '无效', value: 0 }
      ],
      placeholder: '请选择状态'
    },
    {
      key: 'onlyFormalToggle',
      label: '仅看正式文件',
      span: 6,
      render: FormalFileSwitch
    }
  ])

  const { columns, columnChecks } = useTableColumns<FileItem>(
    () =>
      [
        { type: 'index', label: '序号', width: 70 },
        {
          prop: 'thumbnailPreview',
          label: '缩略图',
          width: 110,
          useSlot: true
        },
        {
          prop: 'name',
          label: '文件名',
          minWidth: 180,
          showOverflowTooltip: true
        },
        {
          prop: 'storageType',
          label: '存储类型',
          width: 110,
          useSlot: true
        },
        {
          prop: 'path',
          label: '路径',
          minWidth: 220,
          showOverflowTooltip: true
        },
        {
          prop: 'bucketName',
          label: '桶名称',
          minWidth: 120,
          showOverflowTooltip: true
        },
        {
          prop: 'size',
          label: '大小',
          width: 110,
          useSlot: true
        },
        {
          prop: 'contentType',
          label: 'MIME',
          minWidth: 150,
          showOverflowTooltip: true
        },
        {
          prop: 'source',
          label: '来源',
          minWidth: 110,
          showOverflowTooltip: true
        },
        {
          prop: 'purpose',
          label: '用途',
          minWidth: 140,
          showOverflowTooltip: true
        },
        {
          prop: 'thumbnail',
          label: '缩略图文件',
          width: 110,
          useSlot: true
        },
        {
          prop: 'ocrStatus',
          label: 'OCR 状态',
          width: 100,
          useSlot: true
        },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          useSlot: true
        },
        {
          prop: 'operation',
          label: '操作',
          width: 110,
          fixed: 'right',
          useSlot: true
        }
      ] as ColumnOption<FileItem>[]
  )

  const formatFileSize = (size?: number | null) => {
    if (!size && size !== 0) return '-'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  const getPreviewUrl = (row: Partial<FileItem>) =>
    row.previewUrl || row.thumbnailFile?.previewUrl || null

  const getDetailPreviewUrl = (row: Partial<FileItem>) => getPreviewUrl(row)

  const fetchData = async () => {
    loading.value = true

    try {
      const data = await fetchGetFileList({
        current: pagination.current,
        size: pagination.size,
        name: searchForm.value.name?.trim(),
        storageType: searchForm.value.storageType,
        source: searchForm.value.source?.trim(),
        purpose: searchForm.value.purpose?.trim(),
        status: searchForm.value.status,
        thumbnail: searchForm.value.onlyFormal ? 0 : undefined
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
    searchForm.value = {
      name: undefined,
      storageType: undefined,
      source: undefined,
      purpose: undefined,
      status: undefined,
      onlyFormal: true
    }
    pagination.current = 1
    fetchData()
  }

  const handleFormalOnlyChange = () => {
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

  const handleDetail = async (row: FileItem) => {
    const detail = await fetchGetFileDetail(row.id)
    currentFile.value = detail
    detailVisible.value = true
  }

  const handleDelete = (row: FileItem) => {
    ElMessageBox.confirm(`确定要删除文件“${row.name}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchDeleteFile(row.id)

      if (pagination.current > 1 && tableData.value.length === 1) {
        pagination.current -= 1
      }

      fetchData()
    })
  }

  onMounted(() => {
    fetchData()
  })
</script>
