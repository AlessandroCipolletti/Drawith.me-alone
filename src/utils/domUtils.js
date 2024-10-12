const Handlebars = require('handlebars')

import Params from 'main/Params'
import { round } from 'utils/mathUtils'
import { iterateFn, delay, noop } from 'utils/jsUtils'
import { fadeInElements, fadeOutElements } from 'utils/animationsUtils'


const refs = {
  overlaySpinner: null,
  popupContainer: null,
}
const state = {
  popupIsOpen: false,
}

// const spinnerImgUrl = require('static/img/spinner.svg')
const spinnerImgUrl = require('static/img/pencil-spinner.gif')

const initDomUtils = () => {
  refs.overlaySpinner = addSpinnerOverlayTo(Params.pagesContainer)
  refs.popupContainer = createDom('drawith__popup-container', 'popup')
}

export const addSpinnerOverlayTo = (element, displayNone = true, onSpinnerClick = noop) => {
  if (!(element instanceof HTMLElement)) {return false}

  onSpinnerClick = onSpinnerClick || preventDefault
  const overlay = createDom('drawith__overlay-spinner')
  if (displayNone) {
    overlay.classList.add('displayNone')
  }
  const spinner = document.createElement('img')
  spinner.classList.add('drawith__overlay-spinner-image')
  spinner.src = spinnerImgUrl
  overlay.appendChild(spinner)
  overlay.addEventListener(Params.eventStart, onSpinnerClick)
  element.appendChild(overlay)

  return overlay
}

export const removeSpinnerOverlayFrom = (element) => {
  element.querySelector('.drawith__overlay-spinner')?.remove()
}

export const preventDefaultTouchOnEls = function() {
  const elements = Array.from(arguments).filter(e => e instanceof HTMLElement)
  elements.forEach(e => e.addEventListener(Params.eventStart, preventDefault))
}
export const preventDefault = (e) => {
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }
}

export const preventMoveDefaultIfNeeded = (e) => {
  let target = e.target
  let startY = 0, scrollStartedFromTop = false
  let hasVerticalScroll = false, hasHorizontalScroll = false

  while (target !== Params.mainContainer) {
    if (target.classList.contains('scrollable')) {
      hasVerticalScroll = target.scrollHeight > target.clientHeight
      hasHorizontalScroll = target.scrollWidth > target.clientWidth
      break
    }
    target = target.parentNode
  }

  if (hasVerticalScroll) {
    if (target.scrollTop === 0) {
      startY = getEventCoordY(e, 0)
      scrollStartedFromTop = true
      target.scrollTop === 1
    } else if (target.scrollTop === (target.scrollHeight - target.clientHeight)) {
      target.scrollTop = (target.scrollHeight - target.clientHeight) - 1
    }
  } else if (hasHorizontalScroll) {
    if (target.scrollLeft === 0) {
      target.scrollLeft = 1
    } else if (target.scrollLeft === (target.scrollWidth = target.clientWidth)) {
      target.scrollLeft = (target.scrollWidth = target.clientWidth) - 1
    }
  }

  const onTouchMove = (e) => {
    if (!hasVerticalScroll && !hasHorizontalScroll) {
      preventDefault(e)
      if (document.activeElement) {
        if (
          document.activeElement.tagName.toLowerCase() === 'input' &&
          (document.activeElement.type.toLowerCase() === 'text' || document.activeElement.type.toLowerCase() === 'password')
        ) {
          document.activeElement.blur()
        }
      }
    } else if (hasVerticalScroll && scrollStartedFromTop) {
      const moveY = getEventCoordY(e, 0)
      if (moveY > startY) {
        preventDefault(e)
      }
    }
  }
  const onTouchEnd = (e) => {
    Params.pagesContainer.removeEventListener(Params.eventMove, onTouchMove)
    Params.pagesContainer.removeEventListener(Params.eventEnd, onTouchEnd)
  }
  Params.pagesContainer.addEventListener(Params.eventMove, onTouchMove)
  Params.pagesContainer.addEventListener(Params.eventEnd, onTouchEnd, true)
}

export const preventAllDefault = (el) => {
  el.addEventListener(Params.eventStart, preventDefault)
  el.addEventListener(Params.eventMove, preventDefault)
  el.addEventListener(Params.eventEnd, preventDefault)
}

const enableEl = (el) => {
  el.classList.add('enabled')
  el.classList.remove('disabled')
}

const disableEl = (el) => {
  el.classList.add('disabled')
  el.classList.remove('enabled')
}

export const enableElements = (els) => {
  iterateFn(els, enableEl)
}

export const disableElements = (els) => {
  iterateFn(els, disableEl)
}

export function createDom() {
  const dom = document.createElement('div')
  for (const i in arguments) {
    dom.classList.add(arguments[i])
  }
  return dom
}

export const setSpinner = async(loading, duration = 0) => {
  duration = parseInt(duration)
  if (loading) {
    await fadeInElements(refs.overlaySpinner)
    if (duration) {
      await delay(duration)
      await fadeOutElements(refs.overlaySpinner)
    }
  } else {
    await fadeOutElements(refs.overlaySpinner)
  }
}

export const getEventCoordX = (e, offset = 0) => {// e = event || touches
  if (e instanceof Array) {
    return round((e[0].clientX - (offset || 0)), 1)
  } else if (e.touches && e.touches[0]) {
    return round((e.touches[0].clientX - (offset || 0)), 1)
  } else if (e.changedTouches && e.changedTouches[0]) {
    return round((e.changedTouches[e.changedTouches.length - 1].clientX - (offset || 0)), 1)
  } else {
    return round(((e.clientX >= 0 ? e.clientX : e.pageX) - (offset || 0)), 1)
  }
}

export const getEventCoordY = (e, offset = 0) => { // e = event || touches
  if (e instanceof Array) {
    return round((e[0].clientY - (offset || 0)), 1)
  } else if (e.touches && e.touches[0]) {
    return round((e.touches[0].clientY - (offset || 0)), 1)
  } else if (e.changedTouches && e.changedTouches[0]) {
    return round((e.changedTouches[e.changedTouches.length - 1].clientY - (offset || 0)), 1)
  } else {
    return round(((e.clientY >= 0 ? e.clientY : e.pageY) - (offset || 0)), 1)
  }
}

const attachEvents = (el, events) => {
  const eventsNames = Object.keys(events)
  for (const eventName of eventsNames) {
    el.addEventListener(eventName, events[eventName])
  }
}

export const attachDomEvents = (els, events) => {
  iterateFn(els, attachEvents, [events])
}

export const getDomRect = (dom, offsetX = 0, offsetY = 0) => {
  const rect = JSON.parse(JSON.stringify(dom.getBoundingClientRect()))
  rect.left = rect.x = (rect.left - offsetX)
  rect.right = (rect.right - offsetX)
  rect.top = rect.y = (rect.top - offsetY)
  rect.bottom = (rect.bottom - offsetY)
  rect.centerX = round(rect.left + (rect.width / 2), 1)
  rect.centerY = round(rect.top + (rect.height / 2), 1)
  return rect
}

export const nodeIsPartOf = (node, container) => {
  let result = false
  let currentNode = node
  while (!result && currentNode.tagName.toUpperCase() !== 'BODY') {
    result = (currentNode === container)
    currentNode = currentNode.parentNode
  }
  return result
}

// export const filterTouchesByTargets = (e, targets = []) => {
//   if (targets && !(targets instanceof(Array))) {
//     targets = [targets]
//   }
//   targets = targets.filter(t => t instanceof HTMLElement)
//
//   let events = (e.touches || [e])
//
//   if (targets.length) {
//     events = Array.prototype.filter.call(events, (e) => targets.includes(e.target))
//   }
//
//   events = events.map(deepCopyEventObject)
//
//   return events
// }

export const redrawDomElement = (el) => {
  if (el instanceof HTMLElement) {
    const initialScrollTop = el.scrollTop
    const initialScrollLeft = el.scrollLeft
    el.parentNode.appendChild(el)
    el.scrollTop = initialScrollTop
    el.scrollLeft = initialScrollLeft
  }
}

export const filterTouchesByTargets = (e, targets) => {
  const events = e.touches || [e]
  if (!targets || targets.length === 0) {
    return Array.from(events)
  } else if (targets && !(targets instanceof(Array))) {
    targets = [targets]
  }
  return Array.prototype.filter.call(events, ev => targets.includes(ev.target))
}

const handleClosePopup = (e) => {
  if (e.target === refs.popupContainer) {
    closePopup()
  }
}

export const openPopup = (popup, force = false, autoClose = false) => {
  if (state.popupIsOpen) {
    if (force) {
      closePopup()
    } else {
      return
    }
  }

  if (autoClose) {
    refs.popupContainer.addEventListener(Params.eventStart, handleClosePopup)
  }
  refs.popupContainer.appendChild(popup)
  Params.pagesContainer.appendChild(refs.popupContainer)
  state.popupIsOpen = true
}

export const closePopup = () => {
  if (state.popupIsOpen) {
    Params.pagesContainer.removeChild(refs.popupContainer)
    refs.popupContainer.removeEventListener(Params.eventStart, handleClosePopup)
    refs.popupContainer.innerHTML = ''
    state.popupIsOpen = false
  }
}

export const appendChilds = (container, childs) => Array.prototype.forEach.call(childs, Node.prototype.appendChild.bind(container))

const filterChildNodes = (e) => e.nodeName !== '#text'

export const loadTemplate = async(templatePath, props = {}, container = false) => {
  let tpl = await fetch(templatePath)
  tpl = await tpl.text()
  tpl = Handlebars.compile(tpl)
  const garbage = document.createElement('div')
  garbage.insertAdjacentHTML('beforeend', tpl(props))
  tpl = Array.prototype.filter.call(garbage.childNodes, filterChildNodes)
  garbage.innerHTML = ''

  if (container) {
    appendChilds(container, tpl)
  }

  if (tpl.length === 1) {
    return tpl[0]
  }
  return tpl
}

export default initDomUtils
