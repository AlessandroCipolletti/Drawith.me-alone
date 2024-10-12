import { osVersion, isAndroid, isWearable, isSmartTV, browserVersion, isIOS, isIE, isConsole, isWinPhone, isOpera, browserName } from 'mobile-device-detect'

import { config as supportedVersions } from 'pages/NotSupported/config'
import * as Folder from 'pages/Folder'
// import * as Dashboard from 'pages/Dashboard'
import * as Editor from 'pages/Editor'
import * as Info from 'pages/Info'
import * as NotSupported from 'pages/NotSupported'
import * as Coworking from 'modules/Coworking'
import { testDeviceSupported } from 'utils/jsUtils'

const ROUTES = {
  'editor': Editor,
  'folder': Folder,
  // 'dashboard': Dashboard,
  'coworking': Coworking,
  'notsupported': NotSupported,
  'info': Info,
}

const config = {
  defaultPage: 'folder',
}
const state = {
  currentPage: '',
  currentPath: '',
}

export const getCurrentPage = () => state.currentPage

export const openPageNotSupported = () => {
  goToPage('/notsupported')
}

export const openPageEditor = () => {
  goToPage('/editor')
}

export const openPageFolder = () => {
  goToPage('/folder')
}

export const openPageAboutUs = () => {
  goToPage('/info/aboutUs')
}

const decryptInitialPathUrl = (path, search) => {
  const queryParams = new URLSearchParams(search)
  let url = path

  // some urls can be shortened for better sharing.
  // example: app.drawith.me/E/abc123  ==>  Editor Coworking with room id 'abc123'

  // Editor Coworking
  // url = url.replace('/E/', '/coworking/requestSession/') // old
  if (queryParams.get('S')) {
    url = `${url}/coworking/requestSession/${queryParams.get('S')}`.replace('//', '/')
  }

  // Editor to folder
  if (url.endsWith('/editor') || url.endsWith('/editor/')) {
    url = url.replace('/editor', '/folder')
  }

  if (url.includes('/notSupported') || url.includes('/notsupported')) {
    url = '/folder'
  }

  return url
}

export const isSupportedOs = async() => {
  return (
    (!isIOS || (isIOS && browserVersion > supportedVersions.ios.minVersion)) &&
    (!isAndroid || (isAndroid && browserName.toLowerCase().includes('chrome') && parseInt(osVersion) >= supportedVersions.android.minVersion && parseInt(browserVersion) >= supportedVersions.android.minBrowserVersion)) &&
    (!isIE) &&
    (!isSmartTV) &&
    (!isWearable) &&
    (!isConsole) &&
    (!isWinPhone) &&
    (!isOpera) &&
    await testDeviceSupported()
  )
}

export const goToPage = async(path, force = false) => {
  let [page, method, ...params] = path.split('/').filter(e => e !== '')

  page = page || config.defaultPage
  page = page.toLowerCase()
  let module = ROUTES[page]
  if (!module) {
    // default page
    page = config.defaultPage
    module = ROUTES[config.defaultPage]
    method = false
    params = []
  }

  params = params.map(p => {
    try {
      return JSON.parse(p)
    } catch (e) {
      return p
    }
  })

  console.log('goToPage: ', { page, method, params, path })

  if (state.currentPage !== page || force) {
    // 1. if there is a page change, and we had already a page opened, we close it
    if (state.currentPage && ROUTES[state.currentPage].close) {
      await ROUTES[state.currentPage].close()
    }

    // 2. then we open the new one
    if (method === 'open') {
      await module.open(...params)
    } else if (module.open) {
      await module.open()
    }
  }

  // let methodPath = ''
  // 3. if there is a method in the url, now we can call it
  if (method && method !== 'open' && module[method]) {
    module[method](...params)
    // methodPath = `/${method}`
  }

  // history.pushState({}, '', `/${page}${methodPath}${document.location.search}`)

  state.currentPage = page
  state.currentPath = path
}

export const openCurrentUrlPage = () => {
  const ROOT_URL = '/workspace/drawithme'
  const currentPath = document.location.pathname.toLowerCase().replace(ROOT_URL, '')
  const nextPage = decryptInitialPathUrl(currentPath, document.location.search)
  goToPage(nextPage, nextPage !== `/${config.defaultPage}`)
}
