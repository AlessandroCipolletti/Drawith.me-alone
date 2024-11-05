const tplApp = require('./main.tpl')
import './main.css'
import { debounce } from 'debounce'

import Params from 'main/Params'
import * as Theme from './Theme'
import initPolyfills from './polyfills'
import { round } from 'utils/mathUtils'
import * as Messages from 'modules/Messages'
import { initLocalDb } from 'utils/localDbUtils'
import { delay, securizeAsyncFn } from 'utils/jsUtils'
import { init as initImageUtils } from 'utils/imageUtils'
import { init as initHeader, menuButtonAnimations } from 'components/Header'
import initDomUtils, { loadTemplate, preventDefault, setSpinner, preventMoveDefaultIfNeeded } from 'utils/domUtils'
import { openPageNotSupported, isSupportedOs, openPageFolder, openPageAboutUs, openCurrentUrlPage } from 'modules/Router'
import { getRealScreenWidth, getRealScreenHeight, cleanEventsForNextRefresh, mergeObject, handleGlobalResize, addGlobalStatus, removeGlobalStatus } from 'utils/moduleUtils'


const AppState = {
  NAME: 'Drawith.Me',
  VERSION: '2.6.0',
  DEBUG: true,
}
const state = {
  menuIsOpen: false,
}
const refs = {
  mainContainer: null,
  pagesContainer: null,
}
const labels = {
  folderPageLabel: 'My drawings',
  aboutUs: 'About Drawith.Me',
  genericError: 'Generic Error',
  preventRefresh: 'Changes may not be saved',
}

export const addPreventPageRefresh = () => {
  window.onbeforeunload = () => {
    return labels.preventRefresh
  }
}

export const removePreventPageRefresh = () => {
  window.onbeforeunload = undefined
}

const attachRotationHandler = () => {
  // To give support to multitask on iPad we need to handle both resize and rotation events.
  // But whan the iPad is rotated, both events are fired.
  // This small code takes care of this to call handleGlobalResize just one time.
  const handleRotation = debounce((event) => {
    handleGlobalResize(event)
  }, 200)

  if ('onorientationchange' in window) {
    let handledByRotation = false
    const resetRotation = () => handledByRotation = false

    window.addEventListener('resize', (e) => {
      if (!handledByRotation) {
        handleRotation(e)
      }
    })
    window.addEventListener('orientationchange', (e) => {
      handleRotation(e)
      handledByRotation = true
      setTimeout(resetRotation, 16)
    })
  } else {
    window.addEventListener('resize', handleRotation, false)
  }
}

export const openMainMenu = (e) => {
  if (e) {
    preventDefault(e)
  }
  state.menuIsOpen = true
  addGlobalStatus('drawith__MENU-OPEN')
  refs.pagesContainer.addEventListener(Params.eventStart, closeMainMenu)
  menuButtonAnimations.open()
}

export const closeMainMenu = (e) => {
  if (e) {
    preventDefault(e)
  }
  state.menuIsOpen = false
  removeGlobalStatus('drawith__MENU-OPEN')
  refs.pagesContainer.removeEventListener(Params.eventStart, closeMainMenu)
  menuButtonAnimations.close()
}

export const toggleMainMenu = (e) => {
  preventDefault(e)
  if (state.menuIsOpen) {
    closeMainMenu()
  } else {
    openMainMenu()
  }
}

const initTheme = () => {
  Theme.init()
  for (const i in Theme.spacing) {
    const varName = i.toLowerCase().replace(/_/g, '-')
    const varValue = typeof Theme.spacing[i] === 'number' ? `${Theme.spacing[i]}px` : Theme.spacing[i]
    document.documentElement.style.setProperty(`--${varName}`, varValue)
  }
  document.querySelector('html').style.fontSize = 'var(--one-rem)'
  document.documentElement.style.setProperty('--viewport-scale', Params.viewportScale)

  for (const i in Theme.timing) {
    const varName = i.toLowerCase().replaceAll('_', '-')
    const varValue = Theme.timing[i]
    document.documentElement.style.setProperty(`--${varName}`, varValue)
  }

  for (const i in Theme.palette) {
    if (Array.isArray(Theme.palette[i])) {
      for (const j in Theme.palette[i]) {
        const varName = `palette-${i}-${j}`
        const varValue = Theme.palette[i][j]
        document.documentElement.style.setProperty(`--${varName}`, varValue)
      }
    } else {
      const varName = `palette-${i}`
      const varValue = Theme.palette[i]
      document.documentElement.style.setProperty(`--${varName}`, varValue)
    }
  }
}

const addEnviromentGlobalStatus = () => {
  if (Params.isMobile) {
    addGlobalStatus('drawith__MOBILE')
    if (Params.isPhone) {
      addGlobalStatus('drawith__PHONE')
    } else if (Params.isTablet) {
      addGlobalStatus('drawith__TABLET')
    }
  } else {
    addGlobalStatus('drawith__DESKTOP')
  }
  if (Params.ios) {
    addGlobalStatus('drawith__IOS')
    if (Params.ipad) {
      addGlobalStatus('drawith__IPAD')
    } else {
      addGlobalStatus('drawith__IPHONE')
    }
  } else if (Params.android) {
    addGlobalStatus('drawith__ANDROID')
  }
}

const setViewport = async() => {
  const currentTag = document.getElementById('metaViewport')
  if (currentTag) {
    currentTag.parentNode.removeChild(currentTag)
  }

  const attributes = []
  attributes.push('initial-scale=' + Params.viewportScale)
  attributes.push('minimum-scale=' + Params.viewportScale)
  attributes.push('maximum-scale=' + Params.viewportScale)
  attributes.push('user-scalable=no')
  attributes.push('viewport-fit=cover')
  attributes.push('shrink-to-fit=no')

  const viewport = document.createElement('meta')
  viewport.setAttribute('name', 'viewport')
  viewport.setAttribute('id', 'metaViewport')
  viewport.setAttribute('content', attributes.join(', '))

  document.head.appendChild(viewport)
  await delay(16)
}

export const getRealScreenMaxSize = () => Math.max(getRealScreenWidth(), getRealScreenHeight())

const getRealPxScale = () => {
  const w = getRealScreenWidth()
  return round(w / window.innerWidth, 2)
}

const initViewportTryPixelPerfect = async() => {
  Params.set('viewportScale', 1 / Params.pixelRatio)
  await setViewport()

  Params.set('pxScale', getRealPxScale())
  // console.log('pxScale', Params.pxScale, 'innerWidth', window.innerWidth, 'getRealScreenWidth', getRealScreenWidth())

  if (Params.pxScale / Params.pixelRatio !== Params.viewportScale) {
    console.log('BUG', Params.pxScale, Params.pxScale / Params.pixelRatio, Params.viewportScale)
    Params.set('viewportScale', 1)
    Params.set('pxScale', Params.pixelRatio)
    await setViewport()
  }

  Params.set('width', round((window?.visualViewport?.width || window.innerWidth), 0))
  Params.set('height', round((window?.visualViewport?.height || window.innerHeight), 0))

  console.log('pxScale', Params.pxScale, 'pixelRatio', Params.pixelRatio, 'viewportScale', Params.viewportScale, 'innerWidth', window.innerWidth, 'getRealScreenWidth', getRealScreenWidth(), 'getRealScreenHeight', getRealScreenHeight())
}

const openFolder = (e) => {
  preventDefault(e)
  closeMainMenu()
  openPageFolder()
}

const openAboutUs = (e) => {
  preventDefault(e)
  closeMainMenu()
  openPageAboutUs()
}

const initDom = async() => {
  refs.mainContainer = await loadTemplate(tplApp, {
    labels,
  })
  refs.pagesContainer = refs.mainContainer.querySelector('.drawith__pages-container')
  refs.mainContainer.querySelector('.drawith__menu-pages-placeholder').addEventListener(Params.eventStart, preventDefault)
  refs.mainContainer.querySelector('.drawith__menu-item-folder').addEventListener(Params.eventStart, openFolder)
  refs.mainContainer.querySelector('.drawith__menu-item-about').addEventListener(Params.eventStart, openAboutUs)
  refs.mainContainer.querySelector('.drawith__menu-pages-clear').addEventListener(Params.eventStart, preventDefault)

  if (Params.ipad) {
    refs.pagesContainer.addEventListener(Params.eventStart, (e) => {
      preventMoveDefaultIfNeeded(e)
    }, false)
  }

  document.body.appendChild(refs.mainContainer)
  Params.set('mainContainer', refs.mainContainer)
  Params.set('pagesContainer', refs.pagesContainer)
  attachRotationHandler()
}

const init = securizeAsyncFn(async(props = {}) => {
  mergeObject(AppState, props)
  cleanEventsForNextRefresh()
  initPolyfills()
  Params.init(AppState)
  await initViewportTryPixelPerfect()
  initTheme()
  await initDom()
  await initHeader()
  handleGlobalResize()

  if (await isSupportedOs()) {
    setSpinner(true)
    await Messages.init()
    window.Messages = Messages
    const dbInit = await initLocalDb()
    if (dbInit) {
      initDomUtils()
      initImageUtils()
      addEnviromentGlobalStatus()
      openCurrentUrlPage()
    } else {
      openPageNotSupported()
    }
  } else {
    openPageNotSupported()
  }
}, labels.genericError, 'main.init', false)

document.onreadystatechange = async() => {
  if (document.readyState === 'complete') {
    await init()
  }
}
