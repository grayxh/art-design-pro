import request from '@/utils/http'

export function fetchGetCompanyList(params: Api.SystemManage.CompanySearchParams) {
  return request.get<Api.SystemManage.CompanyList>({
    url: '/api/company/list',
    params
  })
}

export function fetchAddCompany(params: Api.SystemManage.CompanySubmitParams) {
  return request.post<void>({
    url: '/api/company/add',
    params,
    showSuccessMessage: true
  })
}

export function fetchEditCompany(id: number, params: Api.SystemManage.CompanySubmitParams) {
  return request.put<void>({
    url: `/api/company/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeleteCompany(id: number) {
  return request.del<void>({
    url: `/api/company/${id}`,
    showSuccessMessage: true
  })
}
