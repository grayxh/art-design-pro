import request from '@/utils/http'

export function fetchGetFileList(params: Api.SystemManage.FileSearchParams) {
  return request.get<Api.SystemManage.FileList>({
    url: '/api/file/list',
    params
  })
}

export function fetchGetFileDetail(id: number) {
  return request.get<Api.SystemManage.FileListItem>({
    url: `/api/file/${id}`
  })
}

export function fetchDeleteFile(id: number) {
  return request.del<void>({
    url: `/api/file/${id}`,
    showSuccessMessage: true
  })
}

export function fetchUploadFile(file: File, businessType = 'general', purpose = '') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('businessType', businessType)
  formData.append('purpose', purpose)

  return request.post<
    Pick<Api.SystemManage.FileListItem, 'id' | 'name' | 'path' | 'contentType' | 'ext' | 'size'>
  >({
    url: '/api/file/upload',
    data: formData,
    showSuccessMessage: true
  })
}
