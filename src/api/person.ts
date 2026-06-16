import request from '@/utils/http'

export function fetchGetPersonList(params: Api.SystemManage.PersonSearchParams) {
  return request.get<Api.SystemManage.PersonList>({
    url: '/api/person/list',
    params
  })
}

export function fetchGetPersonDetail(id: number) {
  return request.get<Api.SystemManage.PersonListItem>({
    url: `/api/person/${id}`
  })
}

export function fetchAddPerson(params: Api.SystemManage.PersonSubmitParams) {
  return request.post<void>({
    url: '/api/person/add',
    params,
    showSuccessMessage: true
  })
}

export function fetchEditPerson(id: number, params: Api.SystemManage.PersonSubmitParams) {
  return request.put<void>({
    url: `/api/person/${id}`,
    params,
    showSuccessMessage: true
  })
}

export function fetchDeletePerson(id: number) {
  return request.del<void>({
    url: `/api/person/${id}`,
    showSuccessMessage: true
  })
}
