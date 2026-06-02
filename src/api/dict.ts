import request from '@/utils/http'

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

export function fetchGetCertificateTypeDictList(
  params: Api.SystemManage.CertificateTypeDictSearchParams
) {
  return request.get<Api.SystemManage.CertificateTypeDictList>({
    url: '/api/dict/certificate-type/list',
    params
  })
}

export function fetchAddCertificateTypeDict(
  params: Api.SystemManage.CertificateTypeDictSubmitParams
) {
  return request.post<void>({
    url: '/api/dict/certificate-type/add',
    params,
    showSuccessMessage: true
  })
}

export function fetchEditCertificateTypeDict(
  id: number,
  params: Api.SystemManage.CertificateTypeDictSubmitParams
) {
  return request.put<void>({
    url: `/api/dict/certificate-type/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteCertificateTypeDict(id: number) {
  return request.del<void>({
    url: `/api/dict/certificate-type/${id}`,
    showSuccessMessage: true
  })
}

export function fetchGetCertificateTypeDictDetail(id: number) {
  return request.get<Api.SystemManage.CertificateTypeDictItem>({
    url: `/api/dict/certificate-type/${id}`
  })
}
