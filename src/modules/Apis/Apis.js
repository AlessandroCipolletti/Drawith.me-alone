import apiConfig from './apiConfig'
import { formatApiUrlWithParams, checkAuthSucceeded } from './utils'
import * as Coworking from 'modules/Coworking'


const HTTP_STATUS_CODE_OK = 200
const HTTP_STATUS_CODE_CREATED = 201
const HTTP_STATUS_CODE_ACCEPTED = 202
const HTTP_STATUS_CODE_NO_CONTENT = 204


const callApi = ({ url, method, isPrivate, asFormData }, api) => {
  return async ({ params, body = {}, cached = false } = {}) => {
    const apiUrl = formatApiUrlWithParams(url, params)

    const options = {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }

    // if (cached) {
    //   options.headers['TODO header per la cache'] = true
    // }

    // options.headers['X-SessionId'] = `${User.getUserSessionId() || ''}`
    // options.headers['X-DeviceId'] = `${User.getDeviceId() || ''}`
    options.headers['X-SocketId'] = `${Coworking.getSocketId() || ''}`

    if (method !== 'GET') {
      if (asFormData) {
        options.headers['Content-Type'] = 'multipart/form-data'
        const formData = new FormData()
        Object.keys(body).forEach(key => {
          formData.append(key, body[key])
        })
        options.formData = formData
      } else {
        options.body = JSON.stringify(body)
      }
    }

    // if (isPrivate) {
    //   options.credentials = 'include'
    //   const token = await User.getAuthToken()
    //   if (!!token && token.length > 0) {
    //     options.headers.authorization = `Bearer ${token}`
    //   }
    // }


    let response
    try {
      response = await fetch(apiUrl, options)
      if (isPrivate) {
        response = checkAuthSucceeded(response)
      }
      if (response.status === HTTP_STATUS_CODE_NO_CONTENT) {
        return [{ result: true }, response]
      } else if ([HTTP_STATUS_CODE_OK, HTTP_STATUS_CODE_CREATED, HTTP_STATUS_CODE_ACCEPTED].includes(response.status)) {
        let res = await response.json()
        res = typeof res !== 'undefined' ? res : true
        if (typeof res === 'object' && res.result === false) {
          trackError(api, params, body)
        }
        return [res, response]
      } else {
        trackError(api, params, body)
        return [{ result: false }, response]
      }
    } catch (e) {
      let res
      if (response && !response.bodyUsed) {
        res = await response.json()
      }
      res = typeof res !== 'undefined' ? res : { result: false }
      trackError(api, params, body)
      return [res, response]
    }
  }
}

const trackError = (api, params, body) => {
  params = JSON.stringify(params || {})
  body = JSON.stringify(body || {}).substring(0, 1000)
  console.error(`API ${api} failed with parameters: ${params} and body: ${body}`)
}

const Apis = {}

for (const api in apiConfig) {
  Apis[api] = callApi(apiConfig[api], api)
}

export default Apis
