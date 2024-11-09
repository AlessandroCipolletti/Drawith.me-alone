import * as Folder from 'pages/Folder'
import * as Editor from 'pages/Editor'

const ROUTES = {
  'editor': Editor,
  'folder': Folder,
}

const config = {
  defaultPage: 'folder',
}
const state = {
  currentPage: '',
  currentPath: '',
}

export const getCurrentPage = () => state.currentPage


export const openPageEditor = () => {
  goToPage('/editor')
}

export const openPageFolder = () => {
  goToPage('/folder')
}

const decryptInitialPathUrl = (path, search) => {
  let url = path

  // Editor to folder
  if (url.endsWith('/editor') || url.endsWith('/editor/')) {
    url = url.replace('/editor', '/folder')
  }

  if (url.includes('/notSupported') || url.includes('/notsupported')) {
    url = '/folder'
  }

  return url
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
