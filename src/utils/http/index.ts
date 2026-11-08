/**
 * HTTP 请求封装模块
 * 基于 Axios 封装的 HTTP 请求工具，提供统一的请求/响应处理
 *
 * ## 主要功能
 *
 * - 请求/响应拦截器（自动添加 Token、统一错误处理）
 * - 401 未授权自动登出（带防抖机制）
 * - 请求失败自动重试（可配置）
 * - 统一的成功/错误消息提示
 * - 支持 GET/POST/PUT/DELETE 等常用方法
 *
 * @module utils/http
 * @author Art Design Pro Team
 */

import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { useUserStore } from '@/store/modules/user'
import { ApiStatus } from './status'
import { HttpError, handleError, showError, showSuccess } from './error'
import { $t } from '@/locales'
import { BaseResponse } from '@/types'

/** 请求配置常量 */
const REQUEST_TIMEOUT = 15000
const LOGOUT_DELAY = 500
const UNAUTHORIZED_DEBOUNCE_TIME = 3000

/** 默认重试次数，仅对幂等请求生效 */
const DEFAULT_RETRY_COUNT = 2
/** 重试基础间隔（毫秒），按已重试次数线性退避 */
const DEFAULT_RETRY_DELAY = 1000
/** 允许自动重试的请求方法（幂等，重复执行不会产生副作用） */
const RETRYABLE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'DELETE']
/** 允许自动重试的 HTTP 状态码（临时性故障，稍后重试可能成功） */
const RETRYABLE_STATUS_CODES: number[] = [
  ApiStatus.requestTimeout,
  ApiStatus.tooManyRequests,
  ApiStatus.internalServerError,
  ApiStatus.badGateway,
  ApiStatus.serviceUnavailable,
  ApiStatus.gatewayTimeout
]

/** 401防抖状态 */
let isUnauthorizedErrorShown = false
let unauthorizedTimer: NodeJS.Timeout | null = null

/** 扩展 AxiosRequestConfig */
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
  /** 重试次数，设为 0 可关闭重试；不设置时对幂等请求使用默认值 */
  retryCount?: number
  /** 重试间隔（毫秒），不设置时使用默认值 */
  retryDelay?: number
  /** 内部标记：重试链路中抑制错误提示，避免每次尝试都弹一次 */
  suppressErrorMessage?: boolean
}

const { VITE_API_URL, VITE_WITH_CREDENTIALS } = import.meta.env

/** Axios实例 */
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  baseURL: VITE_API_URL,
  withCredentials: VITE_WITH_CREDENTIALS === 'true',
  validateStatus: (status) => status >= 200 && status < 300,
  transformResponse: [
    (data, headers) => {
      const contentType = headers['content-type']
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

/** 请求拦截器 */
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const { accessToken } = useUserStore()
    if (accessToken) request.headers.set('Authorization', accessToken)

    if (request.data && !(request.data instanceof FormData) && !request.headers['Content-Type']) {
      request.headers.set('Content-Type', 'application/json')
      request.data = JSON.stringify(request.data)
    }

    return request
  },
  (error) => {
    showError(createHttpError($t('httpMsg.requestConfigError'), ApiStatus.error))
    return Promise.reject(error)
  }
)

/** 响应拦截器 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<BaseResponse>) => {
    const { code, msg } = response.data
    if (code === ApiStatus.success) return response
    if (code === ApiStatus.unauthorized) handleUnauthorizedError(msg)
    throw createHttpError(msg || $t('httpMsg.requestFailed'), code)
  },
  (error) => {
    if (error.response?.status === ApiStatus.unauthorized) handleUnauthorizedError()
    return Promise.reject(handleError(error))
  }
)

/** 统一创建HttpError */
function createHttpError(message: string, code: number) {
  return new HttpError(message, code)
}

/** 处理401错误（带防抖） */
function handleUnauthorizedError(message?: string): never {
  const error = createHttpError(message || $t('httpMsg.unauthorized'), ApiStatus.unauthorized)

  if (!isUnauthorizedErrorShown) {
    isUnauthorizedErrorShown = true
    logOut()

    unauthorizedTimer = setTimeout(resetUnauthorizedError, UNAUTHORIZED_DEBOUNCE_TIME)

    showError(error, true)
    throw error
  }

  throw error
}

/** 重置401防抖状态 */
function resetUnauthorizedError() {
  isUnauthorizedErrorShown = false
  if (unauthorizedTimer) clearTimeout(unauthorizedTimer)
  unauthorizedTimer = null
}

/** 退出登录函数 */
function logOut() {
  setTimeout(() => {
    useUserStore().logOut()
  }, LOGOUT_DELAY)
}

/** 解析本次请求的重试次数 */
function resolveRetryCount(config: ExtendedAxiosRequestConfig): number {
  if (typeof config.retryCount === 'number') {
    return Math.max(0, config.retryCount)
  }
  const method = (config.method || 'GET').toUpperCase()
  return RETRYABLE_METHODS.includes(method) ? DEFAULT_RETRY_COUNT : 0
}

/** 是否需要重试 */
function shouldRetry(
  error: unknown,
  config: ExtendedAxiosRequestConfig,
  retriesLeft: number
): boolean {
  if (retriesLeft <= 0) return false

  // 只有由 HTTP 状态码产生的错误才值得重试：
  // 业务码错误（如参数校验失败、无权限）重试多少次结果都一样
  if (!(error instanceof HttpError) || error.status === undefined) return false
  if (!RETRYABLE_STATUS_CODES.includes(error.status)) return false

  const method = (config.method || 'GET').toUpperCase()
  return RETRYABLE_METHODS.includes(method)
}

/** 请求重试逻辑 */
async function retryRequest<T>(
  config: ExtendedAxiosRequestConfig,
  retries: number = resolveRetryCount(config),
  attempt: number = 0
): Promise<T> {
  // 存在重试机会时抑制链路内的错误提示，最终失败后再统一提示一次
  const willRetry = retries > 0 && resolveRetryCount(config) > 0
  const requestConfig: ExtendedAxiosRequestConfig = willRetry
    ? { ...config, suppressErrorMessage: true }
    : config

  try {
    return await request<T>(requestConfig)
  } catch (error) {
    if (shouldRetry(error, requestConfig, retries)) {
      const delayMs = (config.retryDelay ?? DEFAULT_RETRY_DELAY) * (attempt + 1)
      await delay(delayMs)
      return retryRequest<T>(config, retries - 1, attempt + 1)
    }

    // 重试链路已耗尽或不可重试，补一次错误提示
    if (willRetry && error instanceof HttpError && error.code !== ApiStatus.unauthorized) {
      showError(error, config.showErrorMessage !== false)
    }

    throw error
  }
}

/** 延迟函数 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 请求函数 */
async function request<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
  // POST | PUT 参数自动填充
  if (
    ['POST', 'PUT'].includes(config.method?.toUpperCase() || '') &&
    config.params &&
    !config.data
  ) {
    config.data = config.params
    config.params = undefined
  }

  try {
    const res = await axiosInstance.request<BaseResponse<T>>(config)

    // 显示成功消息
    if (config.showSuccessMessage && res.data.msg) {
      showSuccess(res.data.msg)
    }

    return res.data.data as T
  } catch (error) {
    if (error instanceof HttpError && error.code !== ApiStatus.unauthorized) {
      const showMsg = config.showErrorMessage !== false && config.suppressErrorMessage !== true
      showError(error, showMsg)
    }
    return Promise.reject(error)
  }
}

/** API方法集合 */
const api = {
  get<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'GET' })
  },
  post<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'POST' })
  },
  put<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'PUT' })
  },
  del<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'DELETE' })
  },
  request<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>(config)
  }
}

export default api
