<template>
  <div class="code-generator-page art-full-height">
    <div class="generator-layout">
      <ElCard class="art-table-card generator-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-title">代码生成</div>
              <div class="card-subtitle">配置表信息、选择通用选项并维护字段清单</div>
            </div>
            <ElSpace wrap>
              <ElButton @click="applyPreset('business')">
                <ElIcon><MagicStick /></ElIcon>
                通用业务表模板
              </ElButton>
              <ElButton @click="applyPreset('mapping')">
                <ElIcon><Grid /></ElIcon>
                中间表模板
              </ElButton>
              <ElButton @click="handleResetAll">
                <ElIcon><RefreshRight /></ElIcon>
                重置
              </ElButton>
              <ElButton type="primary" @click="handleGenerate">
                <ElIcon><View /></ElIcon>
                生成 SQL
              </ElButton>
            </ElSpace>
          </div>
        </template>

        <ElScrollbar class="generator-scroll">
          <div class="section-block basic-section">
            <div class="section-title">基础信息</div>
            <ElForm :model="generatorForm" label-width="70px" size="small" class="generator-form">
              <ElRow :gutter="10">
                <ElCol :span="6">
                  <ElFormItem label="表名">
                    <ElInput
                      v-model="generatorForm.tableName"
                      placeholder="如 person_contact"
                      clearable
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="表注释">
                    <ElInput
                      v-model="generatorForm.tableComment"
                      placeholder="如 人员联系方式表"
                      clearable
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="模块标识">
                    <ElInput
                      v-model="generatorForm.moduleName"
                      placeholder="如 personnel"
                      clearable
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="自增起始值">
                    <ElInputNumber
                      v-model="generatorForm.autoIncrementStart"
                      :min="1"
                      class="w-full"
                      controls-position="right"
                    />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </div>

          <div class="section-block">
            <div class="section-title">生成选项</div>
            <div class="option-grid">
              <div class="option-item">
                <div class="option-label">内置主键 ID</div>
                <ElSwitch v-model="generatorForm.includePrimaryId" size="small" />
              </div>
              <div class="option-item">
                <div class="option-label">ID 使用 UNSIGNED</div>
                <ElSwitch v-model="generatorForm.useUnsignedId" size="small" />
              </div>
              <div class="option-item">
                <div class="option-label">内置状态字段</div>
                <ElSwitch v-model="generatorForm.includeStatusField" size="small" />
              </div>
              <div class="option-item">
                <div class="option-label">内置备注字段</div>
                <ElSwitch v-model="generatorForm.includeRemarkField" size="small" />
              </div>
              <div class="option-item">
                <div class="option-label">内置审计字段</div>
                <ElSwitch v-model="generatorForm.includeAuditFields" size="small" />
              </div>
              <div class="option-item">
                <div class="option-label">内置逻辑删除字段</div>
                <ElSwitch v-model="generatorForm.includeDeletedField" size="small" />
              </div>
              <div class="option-item">
                <div class="option-label">附带 DROP 语句</div>
                <ElSwitch v-model="generatorForm.includeDropStatement" size="small" />
              </div>
              <div class="option-item">
                <div class="option-label">附带 AUTO_INCREMENT</div>
                <ElSwitch v-model="generatorForm.includeAutoIncrementStatement" size="small" />
              </div>
            </div>
          </div>

          <div class="section-block">
            <div class="section-title">字段设计</div>

            <ArtTableHeader
              v-model:columns="fieldColumnChecks"
              :loading="false"
              layout="columns,settings"
              @refresh="resetFieldColumns"
            >
              <template #left>
                <ElSpace wrap>
                  <ElButton type="primary" @click="handleAddField" v-ripple>
                    <ElIcon><Plus /></ElIcon>
                    新增字段
                  </ElButton>
                  <ElButton @click="handleAddCommonNameField('name', '名称')">快速加名称</ElButton>
                  <ElButton @click="handleAddCommonNameField('code', '编码', 'UNIQUE')">
                    快速加编码
                  </ElButton>
                </ElSpace>
              </template>
            </ArtTableHeader>

            <ArtTable row-key="_key" :data="fields" :columns="fieldColumns" size="small">
              <template #name="{ row }">
                <ElInput v-model="row.name" placeholder="字段名" clearable />
              </template>

              <template #type="{ row }">
                <ElSelect v-model="row.type" class="w-full" @change="handleFieldTypeChange(row)">
                  <ElOption
                    v-for="item in fieldTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </template>

              <template #length="{ row }">
                <ElInput
                  v-model="row.length"
                  :disabled="!getFieldMeta(row.type).supportLength"
                  :placeholder="getFieldMeta(row.type).lengthPlaceholder"
                  clearable
                />
              </template>

              <template #nullable="{ row }">
                <ElSwitch v-model="row.nullable" />
              </template>

              <template #defaultValue="{ row }">
                <ElInput v-model="row.defaultValue" placeholder="为空则自动推断" clearable />
              </template>

              <template #constraint="{ row }">
                <div class="constraint-cell">
                  <ElCheckbox v-model="row.primary">主键</ElCheckbox>
                  <ElCheckbox
                    v-model="row.autoIncrement"
                    :disabled="!getFieldMeta(row.type).allowAutoIncrement"
                  >
                    自增
                  </ElCheckbox>
                  <ElCheckbox
                    v-model="row.unsigned"
                    :disabled="!getFieldMeta(row.type).allowUnsigned"
                  >
                    无符号
                  </ElCheckbox>
                </div>
              </template>

              <template #indexType="{ row }">
                <ElSelect v-model="row.indexType" class="w-full">
                  <ElOption label="无" value="NONE" />
                  <ElOption label="普通索引" value="INDEX" />
                  <ElOption label="唯一索引" value="UNIQUE" />
                </ElSelect>
              </template>

              <template #comment="{ row }">
                <ElInput v-model="row.comment" placeholder="字段注释" clearable />
              </template>

              <template #operation="{ $index }">
                <div class="table-operation-cell">
                  <ArtButtonTable type="delete" @click="handleRemoveField($index)" />
                </div>
              </template>
            </ArtTable>
          </div>
        </ElScrollbar>
      </ElCard>
    </div>

    <ElDialog
      v-model="previewVisible"
      title="生成的 SQL"
      width="800px"
      top="5vh"
      :close-on-click-modal="false"
      class="preview-dialog"
    >
      <ElAlert
        v-for="warning in validationWarnings"
        :key="warning"
        :title="warning"
        type="warning"
        :closable="false"
        class="mb-3"
      />

      <ElTabs v-model="activePreviewTab">
        <ElTabPane label="建表 SQL" name="sql">
          <pre class="sql-preview"><code>{{ generatedSql }}</code></pre>
        </ElTabPane>
        <ElTabPane label="设计摘要" name="summary">
          <div class="summary-panel">
            <ElDescriptions :column="1" border>
              <ElDescriptionsItem label="模块标识">
                {{ generatorForm.moduleName || '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="表注释">
                {{ generatorForm.tableComment || '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="启用选项">
                <div class="summary-tags">
                  <ElTag v-for="item in enabledOptions" :key="item" effect="light">
                    {{ item }}
                  </ElTag>
                </div>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="后续扩展">
                当前先生成 SQL 页面，下一步很适合继续扩展 Jimmer 实体、Draft 保存参数和 CRUD
                接口骨架。
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>
        </ElTabPane>
      </ElTabs>

      <template #footer>
        <ElButton @click="handleCopySql">
          <ElIcon><DocumentCopy /></ElIcon>
          复制 SQL
        </ElButton>
        <ElButton type="primary" @click="handleDownloadSql">
          <ElIcon><Download /></ElIcon>
          下载 .sql
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import {
    View,
    Download,
    DocumentCopy,
    Grid,
    MagicStick,
    Plus,
    RefreshRight
  } from '@element-plus/icons-vue'
  import type { ColumnOption } from '@/types/component'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'

  defineOptions({ name: 'SubpackageCodeGenerator' })

  type SqlFieldType =
    | 'BIGINT'
    | 'INT'
    | 'TINYINT'
    | 'VARCHAR'
    | 'DECIMAL'
    | 'DATE'
    | 'DATETIME'
    | 'TEXT'
    | 'LONGTEXT'
    | 'JSON'

  type SqlIndexType = 'NONE' | 'INDEX' | 'UNIQUE'
  type GeneratorPreset = 'business' | 'mapping'

  interface FieldRow {
    _key: string
    name: string
    type: SqlFieldType
    length: string
    nullable: boolean
    defaultValue: string
    comment: string
    primary: boolean
    autoIncrement: boolean
    unsigned: boolean
    indexType: SqlIndexType
  }

  interface GeneratorFormState {
    tableName: string
    tableComment: string
    moduleName: string
    engine: string
    charset: string
    collation: string
    autoIncrementStart: number
    includePrimaryId: boolean
    useUnsignedId: boolean
    includeStatusField: boolean
    includeRemarkField: boolean
    includeAuditFields: boolean
    includeDeletedField: boolean
    includeDropStatement: boolean
    includeAutoIncrementStatement: boolean
  }

  const fieldTypeOptions: Array<{ label: string; value: SqlFieldType }> = [
    { label: 'BIGINT', value: 'BIGINT' },
    { label: 'INT', value: 'INT' },
    { label: 'TINYINT', value: 'TINYINT' },
    { label: 'VARCHAR', value: 'VARCHAR' },
    { label: 'DECIMAL', value: 'DECIMAL' },
    { label: 'DATE', value: 'DATE' },
    { label: 'DATETIME', value: 'DATETIME' },
    { label: 'TEXT', value: 'TEXT' },
    { label: 'LONGTEXT', value: 'LONGTEXT' },
    { label: 'JSON', value: 'JSON' }
  ]

  const previewVisible = ref(false)
  const activePreviewTab = ref<'sql' | 'summary'>('sql')

  const handleGenerate = () => {
    previewVisible.value = true
  }
  const fieldKeySeed = ref(0)

  const generatorForm = reactive<GeneratorFormState>({
    tableName: 'demo_entity',
    tableComment: '示例业务表',
    moduleName: 'demo',
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collation: 'utf8mb4_general_ci',
    autoIncrementStart: 100000000,
    includePrimaryId: true,
    useUnsignedId: true,
    includeStatusField: true,
    includeRemarkField: true,
    includeAuditFields: true,
    includeDeletedField: false,
    includeDropStatement: false,
    includeAutoIncrementStatement: true
  })

  const createFieldRow = (init?: Partial<FieldRow>): FieldRow => ({
    _key: `field_${++fieldKeySeed.value}`,
    name: init?.name || '',
    type: init?.type || 'VARCHAR',
    length: init?.length ?? '100',
    nullable: init?.nullable ?? true,
    defaultValue: init?.defaultValue ?? '',
    comment: init?.comment || '',
    primary: init?.primary ?? false,
    autoIncrement: init?.autoIncrement ?? false,
    unsigned: init?.unsigned ?? false,
    indexType: init?.indexType || 'NONE'
  })

  const fields = ref<FieldRow[]>([])

  const getFieldMeta = (type: SqlFieldType) => {
    const supportLength = ['VARCHAR', 'DECIMAL'].includes(type)
    const allowUnsigned = ['BIGINT', 'INT', 'TINYINT', 'DECIMAL'].includes(type)
    const allowAutoIncrement = ['BIGINT', 'INT'].includes(type)
    const lengthPlaceholder =
      type === 'DECIMAL' ? '如 18,2' : type === 'VARCHAR' ? '如 100' : '该类型无需长度'

    return {
      supportLength,
      allowUnsigned,
      allowAutoIncrement,
      lengthPlaceholder
    }
  }

  const {
    columns: fieldColumns,
    columnChecks: fieldColumnChecks,
    resetColumns: resetFieldColumns
  } = useTableColumns<FieldRow & ReturnType<typeof getFieldMeta>>(
    () =>
      [
        { type: 'index', label: '序号', width: 50 },
        { prop: 'name', label: '字段名', width: 120, useSlot: true },
        { prop: 'type', label: '类型', width: 110, useSlot: true },
        { prop: 'length', label: '长度/精度', width: 100, useSlot: true },
        { prop: 'nullable', label: '可空', width: 55, useSlot: true },
        { prop: 'defaultValue', label: '默认值', width: 120, useSlot: true },
        { prop: 'constraint', label: '约束', width: 170, useSlot: true },
        { prop: 'indexType', label: '索引', width: 100, useSlot: true },
        { prop: 'comment', label: '注释', width: 130, useSlot: true },
        { prop: 'operation', label: '操作', width: 60, fixed: 'right', useSlot: true }
      ] as ColumnOption<FieldRow & ReturnType<typeof getFieldMeta>>[]
  )

  watch(
    fields,
    (list) => {
      list.forEach((item) => {
        const meta = getFieldMeta(item.type)

        if (!meta.supportLength) {
          item.length = ''
        } else if (!item.length) {
          item.length = item.type === 'DECIMAL' ? '18,2' : '100'
        }

        if (!meta.allowUnsigned) {
          item.unsigned = false
        }

        if (!meta.allowAutoIncrement) {
          item.autoIncrement = false
        }
      })
    },
    { deep: true }
  )

  const pushBusinessFields = () => {
    fields.value = [
      createFieldRow({
        name: 'name',
        type: 'VARCHAR',
        length: '100',
        nullable: false,
        comment: '名称'
      }),
      createFieldRow({
        name: 'code',
        type: 'VARCHAR',
        length: '100',
        nullable: true,
        comment: '编码',
        indexType: 'UNIQUE'
      })
    ]
  }

  const applyPreset = (preset: GeneratorPreset) => {
    if (preset === 'mapping') {
      Object.assign(generatorForm, {
        tableName: 'demo_mapping',
        tableComment: '示例中间表',
        moduleName: 'mapping',
        includePrimaryId: false,
        includeStatusField: false,
        includeRemarkField: false,
        includeAuditFields: false,
        includeDeletedField: false,
        includeDropStatement: false,
        includeAutoIncrementStatement: false
      })

      fields.value = [
        createFieldRow({
          name: 'left_id',
          type: 'INT',
          nullable: false,
          comment: '左侧关联ID',
          primary: true,
          unsigned: true
        }),
        createFieldRow({
          name: 'right_id',
          type: 'INT',
          nullable: false,
          comment: '右侧关联ID',
          primary: true,
          unsigned: true
        })
      ]
      return
    }

    Object.assign(generatorForm, {
      tableName: 'demo_entity',
      tableComment: '示例业务表',
      moduleName: 'demo',
      includePrimaryId: true,
      includeStatusField: true,
      includeRemarkField: true,
      includeAuditFields: true,
      includeDeletedField: false,
      includeDropStatement: false,
      includeAutoIncrementStatement: true
    })
    pushBusinessFields()
  }

  const handleResetAll = () => {
    Object.assign(generatorForm, {
      tableName: 'demo_entity',
      tableComment: '示例业务表',
      moduleName: 'demo',
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      autoIncrementStart: 100000000,
      includePrimaryId: true,
      useUnsignedId: true,
      includeStatusField: true,
      includeRemarkField: true,
      includeAuditFields: true,
      includeDeletedField: false,
      includeDropStatement: false,
      includeAutoIncrementStatement: true
    })
    pushBusinessFields()
  }

  const handleAddField = () => {
    fields.value.push(createFieldRow())
  }

  const handleAddCommonNameField = (
    name: string,
    comment: string,
    indexType: SqlIndexType = 'NONE'
  ) => {
    fields.value.push(
      createFieldRow({
        name,
        type: 'VARCHAR',
        length: '100',
        nullable: name !== 'name',
        comment,
        indexType
      })
    )
  }

  const handleRemoveField = (index: number) => {
    fields.value.splice(index, 1)
  }

  const handleFieldTypeChange = (row: FieldRow) => {
    const meta = getFieldMeta(row.type)
    row.length = meta.supportLength ? (row.type === 'DECIMAL' ? '18,2' : '100') : ''
    if (!meta.allowAutoIncrement) {
      row.autoIncrement = false
    }
    if (!meta.allowUnsigned) {
      row.unsigned = false
    }
  }

  const escapeSqlComment = (value: string) => value.replace(/'/g, "''")
  const escapeSqlString = (value: string) => value.replace(/'/g, "''")

  const normalizedTableName = computed(() => generatorForm.tableName.trim())

  const runtimeFields = computed(() => {
    const result: FieldRow[] = []

    if (generatorForm.includePrimaryId) {
      result.push(
        createFieldRow({
          name: 'id',
          type: 'INT',
          nullable: false,
          comment: '主键',
          primary: true,
          autoIncrement: true,
          unsigned: generatorForm.useUnsignedId
        })
      )
    }

    result.push(...fields.value.map((item) => ({ ...item })))

    if (generatorForm.includeStatusField) {
      result.push(
        createFieldRow({
          name: 'status',
          type: 'TINYINT',
          nullable: true,
          defaultValue: '1',
          comment: '状态：0禁用 1启用',
          unsigned: true,
          indexType: 'INDEX'
        })
      )
    }

    if (generatorForm.includeDeletedField) {
      result.push(
        createFieldRow({
          name: 'deleted',
          type: 'TINYINT',
          nullable: true,
          defaultValue: '0',
          comment: '逻辑删除：0否 1是',
          unsigned: true
        })
      )
    }

    if (generatorForm.includeRemarkField) {
      result.push(
        createFieldRow({
          name: 'remark',
          type: 'VARCHAR',
          length: '200',
          nullable: true,
          comment: '备注'
        })
      )
    }

    if (generatorForm.includeAuditFields) {
      result.push(
        createFieldRow({
          name: 'created_by',
          type: 'INT',
          nullable: true,
          comment: '创建人ID',
          unsigned: true
        }),
        createFieldRow({
          name: 'created_at',
          type: 'DATETIME',
          nullable: true,
          defaultValue: 'CURRENT_TIMESTAMP',
          comment: '创建时间'
        }),
        createFieldRow({
          name: 'updated_by',
          type: 'INT',
          nullable: true,
          comment: '更新人ID',
          unsigned: true
        }),
        createFieldRow({
          name: 'updated_at',
          type: 'DATETIME',
          nullable: true,
          defaultValue: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          comment: '更新时间'
        })
      )
    }

    return result
  })

  const validationWarnings = computed(() => {
    const warnings: string[] = []

    if (!normalizedTableName.value) {
      warnings.push('请先填写表名，SQL 预览会以空表名占位。')
    }

    if (!fields.value.length) {
      warnings.push('当前还没有业务字段，建议至少补充一个实际字段。')
    }

    const names = runtimeFields.value.map((item) => item.name.trim()).filter(Boolean)
    const duplicateNames = names.filter((item, index) => names.indexOf(item) !== index)
    if (duplicateNames.length) {
      warnings.push(`存在重复字段名：${[...new Set(duplicateNames)].join('、')}`)
    }

    const primaryAutoIncrementCount = runtimeFields.value.filter(
      (item) => item.autoIncrement
    ).length
    if (primaryAutoIncrementCount > 1) {
      warnings.push('当前存在多个自增字段，MySQL 一般只建议保留一个自增列。')
    }

    if (generatorForm.includePrimaryId && fields.value.some((item) => item.primary)) {
      warnings.push(
        '你已开启内置 ID 主键，同时业务字段里还有主键勾选，请确认是否真的需要复合主键。'
      )
    }

    return warnings
  })

  const enabledOptions = computed(() => {
    const options: string[] = []
    if (generatorForm.includePrimaryId) options.push('内置主键ID')
    if (generatorForm.includeStatusField) options.push('状态字段')
    if (generatorForm.includeRemarkField) options.push('备注字段')
    if (generatorForm.includeAuditFields) options.push('审计字段')
    if (generatorForm.includeDeletedField) options.push('逻辑删除字段')
    if (generatorForm.includeDropStatement) options.push('DROP语句')
    if (generatorForm.includeAutoIncrementStatement) options.push('AUTO_INCREMENT设置')
    return options
  })

  const buildTypeSql = (field: FieldRow) => {
    const upperType = field.type.toUpperCase() as SqlFieldType
    const unsignedSql = field.unsigned && getFieldMeta(upperType).allowUnsigned ? ' UNSIGNED' : ''

    if (upperType === 'VARCHAR') {
      return `VARCHAR(${field.length || '100'})`
    }

    if (upperType === 'DECIMAL') {
      return `DECIMAL(${field.length || '18,2'})${unsignedSql}`
    }

    if (['INT', 'BIGINT', 'TINYINT'].includes(upperType)) {
      return `${upperType}${unsignedSql}`
    }

    return upperType
  }

  const formatDefaultClause = (field: FieldRow) => {
    const value = field.defaultValue.trim()
    if (!value) {
      return field.nullable ? ' DEFAULT NULL' : ''
    }

    if (
      field.type === 'DATETIME' &&
      value.toUpperCase() === 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    ) {
      return ' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    }

    if (value.toUpperCase() === 'NULL') {
      return ' DEFAULT NULL'
    }

    if (value.toUpperCase() === 'CURRENT_TIMESTAMP') {
      return ' DEFAULT CURRENT_TIMESTAMP'
    }

    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return ` DEFAULT ${value}`
    }

    return ` DEFAULT '${escapeSqlString(value)}'`
  }

  const buildColumnSql = (field: FieldRow) => {
    const nullableClause = field.nullable ? '' : ' NOT NULL'
    const defaultClause = formatDefaultClause(field)
    const autoIncrementClause = field.autoIncrement ? ' AUTO_INCREMENT' : ''
    const commentClause = field.comment ? ` COMMENT '${escapeSqlComment(field.comment)}'` : ''

    return `    \`${field.name}\` ${buildTypeSql(field)}${nullableClause}${defaultClause}${autoIncrementClause}${commentClause}`
  }

  const buildIndexSql = (tableName: string) => {
    const primaryFields = runtimeFields.value
      .filter((item) => item.primary)
      .map((item) => `\`${item.name}\``)
    const lines: string[] = []

    if (primaryFields.length) {
      lines.push(`    PRIMARY KEY (${primaryFields.join(', ')})`)
    }

    runtimeFields.value.forEach((field) => {
      if (!field.name.trim() || field.primary || field.indexType === 'NONE') return

      const safeName = field.name.trim()
      if (field.indexType === 'UNIQUE') {
        lines.push(`    UNIQUE KEY \`uk_${tableName}_${safeName}\` (\`${safeName}\`)`)
      }
      if (field.indexType === 'INDEX') {
        lines.push(`    KEY \`idx_${tableName}_${safeName}\` (\`${safeName}\`)`)
      }
    })

    return lines
  }

  const generatedSql = computed(() => {
    const tableName = normalizedTableName.value || 'your_table_name'
    const columns = runtimeFields.value
      .filter((item) => item.name.trim())
      .map((item) => buildColumnSql(item))
    const indexes = buildIndexSql(tableName)
    const tableComment = generatorForm.tableComment.trim() || '请补充表注释'
    const body = [...columns, ...indexes].join(',\n')

    const statements: string[] = []

    if (generatorForm.includeDropStatement) {
      statements.push(`DROP TABLE IF EXISTS \`${tableName}\`;`)
      statements.push('')
    }

    statements.push(
      `CREATE TABLE \`${tableName}\` (\n${body}\n) ENGINE=${generatorForm.engine} DEFAULT CHARSET=${generatorForm.charset} COLLATE=${generatorForm.collation} COMMENT='${escapeSqlComment(tableComment)}';`
    )

    if (generatorForm.includeAutoIncrementStatement && generatorForm.includePrimaryId) {
      statements.push('')
      statements.push(
        `ALTER TABLE \`${tableName}\` AUTO_INCREMENT = ${generatorForm.autoIncrementStart};`
      )
    }

    return statements.join('\n')
  })

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(generatedSql.value)
      ElMessage.success('SQL 已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败，请手动复制')
    }
  }

  const handleDownloadSql = () => {
    const tableName = normalizedTableName.value || 'generated_table'
    const blob = new Blob([generatedSql.value], { type: 'text/sql;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${tableName}.sql`
    link.click()
    URL.revokeObjectURL(url)
  }

  onMounted(() => {
    pushBusinessFields()
  })
</script>

<style scoped lang="scss">
  .generator-layout {
    height: 100%;
    min-height: 0;
  }

  .generator-card {
    height: 100%;
    min-height: 0;
  }

  .generator-scroll {
    height: calc(100% - 4px);
  }

  .card-header {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .card-subtitle {
    margin-top: 2px;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .section-block + .section-block {
    margin-top: 10px;
  }

  .basic-section {
    position: relative;
    padding: 10px 12px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .basic-section .section-title {
    padding-left: 10px;
    margin-bottom: 8px;
    border-left: 3px solid var(--el-color-primary);
  }

  .basic-section .generator-form .el-form-item {
    margin-bottom: 4px;
  }

  .generator-form .el-form-item__label {
    font-size: 12px;
  }

  .section-title {
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .generator-form .el-form-item {
    margin-bottom: 6px;
  }

  .option-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 20px;
  }

  .option-item {
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: 12px;
    color: var(--art-gray-800);
  }

  .option-label {
    font-size: 12px;
    color: var(--art-gray-800);
  }

  .constraint-cell {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
  }

  .constraint-cell .el-checkbox {
    margin-right: 0;
  }

  .constraint-cell .el-checkbox__label {
    font-size: 12px;
  }

  .table-operation-cell {
    display: flex;
    justify-content: center;
  }

  .code-generator-page .art-table :deep(.el-table__cell) {
    padding: 4px;
  }

  .code-generator-page .art-table :deep(.el-input__wrapper) {
    padding-right: 6px;
    padding-left: 6px;
  }

  .code-generator-page .art-table :deep(.el-select) {
    width: 100%;
  }

  .sql-preview {
    min-height: 240px;
    padding: 12px;
    margin: 0;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
    color: #d4d4d4;
    word-break: break-word;
    white-space: pre-wrap;
    background: #0f172a;
    border-radius: 12px;
  }

  .preview-dialog .sql-preview {
    min-height: 420px;
  }

  .summary-panel {
    padding-top: 4px;
    font-size: 13px;
  }

  .summary-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  @media (width <= 1280px) {
    .generator-layout {
      height: auto;
    }

    .generator-card {
      height: auto;
    }

    .preview-dialog .sql-preview {
      min-height: 240px;
    }
  }

  @media (width <= 900px) {
    .option-grid {
      gap: 4px 10px;
    }
  }
</style>
