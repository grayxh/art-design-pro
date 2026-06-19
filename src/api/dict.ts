import request from '@/utils/http'

export function fetchGetDictTypeList(params?: Api.SystemManage.DictTypeSearchParams) {
  return request.get<Api.SystemManage.DictTypeList>({
    url: '/api/dict/type/list',
    params
  })
}

export function fetchGetDictTypeDetail(id: number) {
  return request.get<Api.SystemManage.DictTypeItem>({
    url: `/api/dict/type/${id}`
  })
}

export function fetchAddDictType(params: Api.SystemManage.DictTypeSubmitParams) {
  return request.post<void>({
    url: '/api/dict/type/add',
    params,
    showSuccessMessage: true
  })
}

export function fetchEditDictType(id: number, params: Api.SystemManage.DictTypeSubmitParams) {
  return request.put<void>({
    url: `/api/dict/type/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteDictType(id: number) {
  return request.del<void>({
    url: `/api/dict/type/${id}`,
    showSuccessMessage: true
  })
}

export function fetchGetDictList(params: Api.SystemManage.DictItemSearchParams) {
  return request.get<Api.SystemManage.DictItemList>({
    url: '/api/dict/list',
    params
  })
}

export function fetchGetDictDetail(id: number) {
  return request.get<Api.SystemManage.DictItemItem>({
    url: `/api/dict/${id}`
  })
}

export function fetchAddDict(params: Api.SystemManage.DictItemSubmitParams) {
  return request.post<void>({
    url: '/api/dict/add',
    params,
    showSuccessMessage: true
  })
}

export function fetchEditDict(id: number, params: Api.SystemManage.DictItemSubmitParams) {
  return request.put<void>({
    url: `/api/dict/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteDict(id: number) {
  return request.del<void>({
    url: `/api/dict/${id}`,
    showSuccessMessage: true
  })
}

export function fetchGetSysDictList(params: Api.SystemManage.SysDictSearchParams) {
  return request.get<Api.SystemManage.SysDictList>({
    url: '/api/dict/sys/list',
    params
  })
}

export function fetchAddSysDict(params: Api.SystemManage.SysDictSubmitParams) {
  return request.post<void>({
    url: '/api/dict/sys/add',
    params,
    showSuccessMessage: true
  })
}

export function fetchEditSysDict(id: number, params: Api.SystemManage.SysDictSubmitParams) {
  return request.put<void>({
    url: `/api/dict/sys/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteSysDict(id: number) {
  return request.del<void>({
    url: `/api/dict/sys/${id}`,
    showSuccessMessage: true
  })
}

export function fetchGetSysDictDetail(id: number) {
  return request.get<Api.SystemManage.SysDictItem>({
    url: `/api/dict/sys/${id}`
  })
}

export function fetchGetCertificateTypeList(params?: { targetType?: string; status?: number }) {
  return request.get<Api.SystemManage.DictTypeItem[]>({
    url: '/api/certificate/type/list',
    params
  })
}

export function fetchGetDictItemsByTypeCode(typeCode: string) {
  return request.get<Api.SystemManage.DictItemItem[]>({
    url: `/api/dict/type/code/${typeCode}`
  })
}
