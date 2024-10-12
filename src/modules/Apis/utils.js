import Params from 'main/Params'

const HTTP_STATUS_CODE_NOT_AUTHENTICATED = 401


export const formatApiParamsToString = (params) => {
  let result = ''
  if (Array.isArray(params)) {
    result = `/${params.join('/')}`
  } else if (typeof params === 'object' && Object.keys(params).length) {
    result = '?' + Object.keys(params)
      .map((key) => {
        if (Array.isArray(params[key])) {
          return params[key].map((item) =>`${key}=${item}`).join('&')
        }
        return `${key}=${params[key]}`}
      ).join('&')
  }
  return result
}

const replaceStringParams = (string, params) => {
  const queryParams = {}

  for (const key in params) {
    if (string.includes('${' + key + '}')) {
      string = string.replace('${' + key + '}', params[key])
    } else {
      queryParams[key] = params[key]
    }
  }

  return `${string}${formatApiParamsToString(queryParams)}`
}

export const formatApiUrlWithParams = (url, params) => {
  url = `${Params.apisUrl}/api/${url}`
  if (url.includes('${') && typeof params === 'object') {
    return replaceStringParams(url, params)
  } else {
    return `${url}${formatApiParamsToString(params)}`
  }
}

export function checkAuthSucceeded(response) {
  if (response.status === HTTP_STATUS_CODE_NOT_AUTHENTICATED) {
    throw new Error('Authentification failed.')
  }
  return response
}
