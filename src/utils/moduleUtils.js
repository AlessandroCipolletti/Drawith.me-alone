import Params from 'main/Params'
import { round } from 'utils/mathUtils'

const rotationHandlers = []


export const mergeObject = (state, props) => {
  for (const key in props) {
    if (typeof state[key] !== 'undefined') {
      state[key] = props[key]
    }
  }
}

export const handleGlobalResize = (event = false) => {
  Params.set('width', round((window?.visualViewport?.width || window.innerWidth), 0))
  Params.set('height', round((window?.visualViewport?.height || window.innerHeight), 0))

  removeGlobalStatus('drawith__LANDSCAPE')
  removeGlobalStatus('drawith__PORTRAIT')
  addGlobalStatus(window.innerWidth > window.innerHeight ? 'drawith__LANDSCAPE' : 'drawith__PORTRAIT')
  document.documentElement.style.setProperty('--100vw', `${Params.width}px`)
  document.documentElement.style.setProperty('--100vh', `${Params.height}px`)

  if (event) { // to prevent this from main.init() first call
    for (const i in rotationHandlers) {
      rotationHandlers[i](event)
    }
  }
}

export const addRotationHandler = (handler) => {
  rotationHandlers.push(handler)
}

export const removeRotationHandler = (handler) => {
  if (rotationHandlers.includes(handler)) {
    rotationHandlers.splice(rotationHandlers.indexOf(handler), 1)
  }
}

export const removeGlobalStatus = (status) => {
  document.body.classList.remove(status)
  // Params.mainContainer.classList.remove(status)
}

export const addGlobalStatus = (status) => {
  document.body.classList.add(status)
  // Params.mainContainer.classList.add(status)
}

export const toggleGlobalStatus = (status, add) => {
  if (typeof add === 'undefined') {
    if (appHasGlobalStatus(status)) {
      removeGlobalStatus(status)
    } else {
      addGlobalStatus(status)
    }
  } else if (add) {
    addGlobalStatus(status)
  } else {
    removeGlobalStatus(status)
  }
}

export const registerEventForNextRefresh = (event) => {
  const events = JSON.parse(window.sessionStorage.getItem('eventsOnRefresh') || '[]')
  events.push({
    event,
    time: Date.now(),
  })
  window.sessionStorage.setItem('eventsOnRefresh', JSON.stringify(events))
}

export const cleanEventsForNextRefresh = () => {
  let events = JSON.parse(window.sessionStorage.getItem('eventsOnRefresh') || '[]')
  const now = Date.now()
  events = events.filter(e => now - e.time < 60 * 1000)
  window.sessionStorage.setItem('eventsOnRefresh', JSON.stringify(events))
}

export const hasEventForNextRefresh = (event) => {
  let events = JSON.parse(window.sessionStorage.getItem('eventsOnRefresh') || '[]')
  const result = events.some(e => e.event === event)
  events = events.filter(e => e.event !== event)
  window.sessionStorage.setItem('eventsOnRefresh', JSON.stringify(events))
  return result
}

export const getRealScreenWidth = () => {
  if (Params.isDesktop) {
    return Math.trunc(screen.width * Params.pixelRatio)
  } else {
    // return screen.height * Params.pixelRatio
    if (window.innerWidth > window.innerHeight) {
      return Math.trunc(screen.height * Params.pixelRatio)
    } else {
      return Math.trunc(screen.width * Params.pixelRatio)
    }
  }
}

export const getRealScreenHeight = () => {
  if (Params.isDesktop) {
    return Math.trunc(screen.height * Params.pixelRatio)
  } else {
    // return screen.height * Params.pixelRatio
    if (window.innerHeight > window.innerWidth) {
      return Math.trunc(screen.height * Params.pixelRatio)
    } else {
      return Math.trunc(screen.width * Params.pixelRatio)
    }
  }
}

export const appHasGlobalStatus = (status) => Params.pagesContainer.classList.contains(status)

const removeEl = (el) => {
  if (el instanceof HTMLElement) {
    if (el.tagName.toLowerCase() === 'canvas') {
      el.width = 0
      el.height = 0
    }
    el.remove()
  } else if (el instanceof CanvasRenderingContext2D) {
    if (el.toolImageShape) {
      removeEl(el.toolImageShape.canvas)
      el.toolImageShape.canvas = null
      el.toolImageShape.context = null
    }
  }
}

export const cleanRefs = (refs) => {
  Object.values(refs).forEach(ref => {
    if (ref instanceof HTMLElement) {
      removeEl(ref)
      ref = null
    } else if (ref && typeof ref === 'object') {
      Object.values(ref).forEach(el => {
        removeEl(el)
        el = null
      })
      ref = {}
    } else if (Array.isArray(ref)) {
      ref.forEach(el => {
        removeEl(el)
        el = null
      })
      ref = []
    }
  })
}
