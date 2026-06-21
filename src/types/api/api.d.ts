/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * ## 主要功能
 *
 * - 通用类型（分页参数、响应结构等）
 * - 认证类型（登录、用户信息等）
 * - 系统管理类型（用户、角色等）
 * - 全局命名空间声明
 *
 * ## 使用场景
 *
 * - API 请求参数类型约束
 * - API 响应数据类型定义
 * - 接口文档类型同步
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { userName: 'admin', password: '123456' }
 * const response: Api.Auth.UserInfo = await fetchUserInfo()
 * ```
 *
 * @module types/api/api
 * @author Art Design Pro Team
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      userName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
    }

    /** 用户信息 */
    interface UserInfo {
      buttons: string[]
      roles: string[]
      userId: number
      userName: string
      email: string
      avatar?: string
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams
    >

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams & {
          startTime: string | null
          endTime: string | null
        }
    >

    /** 企业列表 */
    type CompanyList = Api.Common.PaginatedResponse<CompanyListItem>

    /** 企业列表项 */
    interface CompanyListItem {
      id: number
      name: string
      shortName: string
      creditCode: string
      taxpayerScale: string
      admissionCode: string
      admissionStatus: 'enabled' | 'pending' | 'disabled'
      contactPerson: string
      contactPhone: string
    }

    /** 企业搜索参数 */
    type CompanySearchParams = Partial<
      Pick<CompanyListItem, 'name'> & Api.Common.CommonSearchParams
    >

    /** 企业提交参数 */
    type CompanySubmitParams = Omit<CompanyListItem, 'id'>

    /** 人员列表 */
    type PersonList = Api.Common.PaginatedResponse<PersonListItem>

    /** 人员联系方式 */
    interface PersonContactItem {
      id: number
      contactType: string
      contactValue: string
      primary?: 0 | 1
      status?: 0 | 1
      remark?: string | null
    }

    /** 人员提交联系方式 */
    interface PersonContactSubmitItem {
      id?: number
      contactType: string
      contactValue: string
      primary?: 0 | 1
      status?: 0 | 1
      remark?: string | null
    }

    /** 人员提交证件 */
    interface PersonCertificateSubmitItem {
      id?: number
      certificateTypeId: number
      certificateTypeName: string
      certNumber: string | null
      issueDate: string | null
      expiryDate: string | null
      issuingAuthority: string | null
      dynamicFields: Record<string, any> | null
      fileIds: number[]
      status?: 0 | 1 | 2
      remark?: string | null
      certificateType?: DictItemItem | null
      files?: FileListItem[]
    }

    /** 人员列表项 */
    interface PersonListItem {
      id: number
      name: string
      idNumber: string | null
      gender: '男' | '女' | null
      nation: string | null
      birthDate: string | null
      address: string | null
      remark: string | null
      contacts: PersonContactItem[]
    }

    /** 人员搜索参数 */
    type PersonSearchParams = Partial<
      Pick<PersonListItem, 'name' | 'idNumber' | 'gender'> &
        Api.Common.CommonSearchParams & {
          phone: string
          email: string
        }
    >

    /** 人员提交参数 */
    interface PersonSubmitParams {
      name: string
      idNumber: string | null
      gender: '男' | '女' | null
      nation: string | null
      birthDate: string | null
      address: string | null
      remark: string | null
      contacts: PersonContactSubmitItem[]
      certificates: PersonCertificateSubmitItem[]
    }

    /** 文件列表 */
    type FileList = Api.Common.PaginatedResponse<FileListItem>

    /** 文件列表项 */
    interface FileListItem {
      id: number
      thumbnailId: number | null
      storageType: string
      path: string
      bucketName: string | null
      name: string
      size: number
      md5: string
      contentType: string | null
      ext: string | null
      source: string | null
      purpose: string | null
      thumbnail: 0 | 1
      ocrText: string | null
      ocrStatus: 0 | 1 | 2 | 3
      status: 0 | 1
      remark: string | null
      createdBy?: number | null
      createdAt?: string
      updatedBy?: number | null
      updatedAt?: string
      previewUrl?: string | null
      thumbnailFile?: {
        id: number
        path: string
        name: string
        previewUrl?: string | null
      } | null
    }

    /** 文件搜索参数 */
    type FileSearchParams = Partial<
      Pick<FileListItem, 'name' | 'storageType' | 'source' | 'purpose' | 'status' | 'thumbnail'> &
        Api.Common.CommonSearchParams
    >

    /** 绯荤粺绠€鍗曞瓧鍏稿垪琛?*/
    type SysDictList = Api.Common.PaginatedResponse<SysDictItem>

    /** 绯荤粺绠€鍗曞瓧鍏搁」 */
    interface SysDictItem {
      id: number
      dictType: string
      dictKey: string
      dictValue: string
      sortOrder: number
      parentId: number
      color: string | null
      tagType: 'success' | 'warning' | 'danger' | 'info' | 'primary' | null
      status: 0 | 1
      remark: string | null
      createdBy?: number | null
      createdAt?: string
      updatedBy?: number | null
      updatedAt?: string
    }

    /** 绯荤粺绠€鍗曞瓧鍏告悳绱㈠弬鏁?*/
    type SysDictSearchParams = Partial<
      Pick<SysDictItem, 'dictType' | 'dictKey' | 'dictValue' | 'status'> &
        Api.Common.CommonSearchParams
    >

    /** 绯荤粺绠€鍗曞瓧鍏告彁浜ゅ弬鏁?*/
    type SysDictSubmitParams = Omit<
      SysDictItem,
      'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'
    >

    type DictTypeList = DictTypeItem[]

    interface DictTypeItem {
      id: number
      typeCode: string
      typeName: string
      formTemplate: {
        fields?: Array<{
          label: string
          name: string
          type: string
          required?: boolean
          placeholder?: string
          options?: Array<{
            label: string
            value: string
          }>
        }>
      } | null
      sortOrder: number
      status: 0 | 1
      remark: string | null
      itemCount?: number
      createdBy?: number | null
      createdAt?: string
      updatedBy?: number | null
      updatedAt?: string
    }

    type DictTypeSearchParams = Partial<Pick<DictTypeItem, 'typeCode' | 'typeName' | 'status'>>

    type DictTypeSubmitParams = Omit<
      DictTypeItem,
      'id' | 'itemCount' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'
    >

    type DictItemList = Api.Common.PaginatedResponse<DictItemItem>

    interface DictItemItem {
      id: number
      typeId: number
      typeCode?: string
      typeName?: string
      dictKey: string
      dictValue: string
      sortOrder: number
      parentId: number
      color: string | null
      tagType: 'success' | 'warning' | 'danger' | 'info' | 'primary' | null
      formTemplate: {
        fields?: Array<{
          label: string
          name: string
          type: string
          required?: boolean
          placeholder?: string
          options?: Array<{
            label: string
            value: string
          }>
        }>
      } | null
      status: 0 | 1
      remark: string | null
      createdBy?: number | null
      createdAt?: string
      updatedBy?: number | null
      updatedAt?: string
    }

    type DictItemSearchParams = Partial<
      Pick<DictItemItem, 'typeId' | 'dictKey' | 'dictValue' | 'status'> &
        Api.Common.CommonSearchParams
    >

    type DictItemSubmitParams = Omit<
      DictItemItem,
      'id' | 'typeCode' | 'typeName' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'
    >
  }
}
