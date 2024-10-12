const tplRuler = require ('./ruler.tpl')
import './ruler.css'

import Params from 'main/Params'
import * as Tools from 'pages/Editor/components/Tools'
import { round, degToFirstQuadrant, getScopeCoefficientBetweenTwoPoints, getDistanceBetweenTwoPoints, getAngleRadBetweenTwoPoints, getAngleDegBetweenTwoPoints, roundAngleForSteps } from 'utils/mathUtils'
import { preventDefault, filterTouchesByTargets, getEventCoordX, getEventCoordY, loadTemplate } from 'utils/domUtils'
import { fadeInElements, fadeOutElements } from 'utils/animationsUtils'
import { cleanRefs, addRotationHandler } from 'utils/moduleUtils'
import { deepCopy } from 'utils/jsUtils'
import { spacing } from 'main/Theme'

let onStart, onMove, onEnd
const config = {
  colorsPickerHeight: 45,
  rulerMinOffset: 50,
  rulerWidth: 2.5,     // ruler.width = config.rulerWidth * Math.max(Params.width, Params.height)
  rulerHeight: 0,
  rulerRotationStep: 3,
  rulerRotationInterval: 45,
  rulerMarginToDraw: 40,
}
let state = {}
const initialState = {
  isVisible: false,
  draggable: true,
  translated: false,
  touchDown: false,
  isNearSide: false,
  dragged: false,
  dragMode: 'drag',
  rulerTransformOrigin: '',
  containerOffset: {
    left: 0,
    right: 0,
  },
  rulerWidth: 0,
  currentCoefficientM: 0,
  sideRulerOriginX: 0,
  sideRulerOriginY: 0,
  dragCurrentX: 0,
  dragCurrentY: 0,
  startCenterX: 0,
  startCenterY: 0,
  currentRotation: 0,
  dragStartX: 0,
  dragStartY: 0,
  dragLastX: 0,
  dragLastY: 0,
  startOriginX: 0,
  startOriginY: 0,
  startAngle: 0,
  gestureOriginX: 0,
  gestureOriginY: 0,
  currentCenterX: 0,
  currentCenterY: 0,
  buttonsTouchStartTime: 0,
}
const refs = {
  ruler: null,
  rulerOrigin: null,
  rulerBottom: null,
  rulerLevel: null,
  rulerCenter: null,
  rulerStart: null,
  rulerLevelValue: null,
  rulerGestureOne: null,
  rulerGestureTwo: null,
  perpendicularButton: null,
  specularButton: null,
}

const rotationToLabel = (deg) => Math.trunc(degToFirstQuadrant(deg))

export const show = () => {
  fadeInElements(refs.ruler)
  state.isVisible = true
}

export const hide = () => {
  fadeOutElements(refs.ruler)
  state.isVisible = false
}

export const lock = () => state.draggable = false

export const unlock = () => state.draggable = true

export const checkCoordNearRuler = (x, y, inside = false) => {
  if (state.isVisible) {
    const centerCoord = refs.rulerCenter.getBoundingClientRect()
    const startCoord = refs.rulerStart.getBoundingClientRect()
    state.currentCoefficientM = round(getScopeCoefficientBetweenTwoPoints(startCoord.left, startCoord.top, centerCoord.left, centerCoord.top), 4)
    const rulerOriginCoord = refs.rulerOrigin.getBoundingClientRect()
    const rulerBottomCoord = refs.rulerBottom.getBoundingClientRect()
    if (getDistanceBetweenTwoPoints(x, y, rulerOriginCoord.left, rulerOriginCoord.top) < getDistanceBetweenTwoPoints(x, y, rulerBottomCoord.left, rulerBottomCoord.top)) {
      state.sideRulerOriginX = round(rulerOriginCoord.left)
      state.sideRulerOriginY = -round(rulerOriginCoord.top)
    } else {
      state.sideRulerOriginX = round(rulerBottomCoord.left)
      state.sideRulerOriginY = -round(rulerBottomCoord.top)
    }
    /*
    // explanation
    const angle = getAngleRadBetweenTwoPoints(x, y, centerCoord.left, centerCoord.top) - getAngleRadBetweenTwoPoints(startCoord.left, startCoord.top, centerCoord.left, centerCoord.top)
    const sec = getDistanceBetweenTwoPoints(x, y, centerCoord.left, centerCoord.top)
    const tan = Math.abs(round(sec * Math.sin(angle)))
    const getDistanceBetweenTwoPoints = tan - config.rulerHeight / 2
    const near = Math.abs(getDistanceBetweenTwoPoints) <= config.rulerMarginToDraw
    */
    if (inside) {
      return Math.abs(Math.abs(round(getDistanceBetweenTwoPoints(x, y, centerCoord.left, centerCoord.top) * Math.sin(getAngleRadBetweenTwoPoints(x, y, centerCoord.left, centerCoord.top) - getAngleRadBetweenTwoPoints(startCoord.left, startCoord.top, centerCoord.left, centerCoord.top)))) - config.rulerHeight / 2) <= config.rulerMarginToDraw / 2
    } else {
      return Math.abs(Math.abs(round(getDistanceBetweenTwoPoints(x, y, centerCoord.left, centerCoord.top) * Math.sin(getAngleRadBetweenTwoPoints(x, y, centerCoord.left, centerCoord.top) - getAngleRadBetweenTwoPoints(startCoord.left, startCoord.top, centerCoord.left, centerCoord.top)))) - config.rulerHeight / 2) <= config.rulerMarginToDraw
    }
  }
  return false
}

export const getCoordsNearRuler = (() => {
  let m, xo, yo, x, y
  return (xp, yp, offsetX, offsetY) => {
    offsetX = (offsetX || 0)
    offsetY = (offsetY || 0)
    xp += offsetX
    yp += offsetY
    yp *= -1
    m = state.currentCoefficientM
    xo = state.sideRulerOriginX
    yo = state.sideRulerOriginY
    if (m === 0) {
      x = xp
      y = -yo
    } else if (isFinite(m)) {
      x = round((m * xo - yo + yp + xp / m) / (1 / m + m), 1)
      y = -round(m * x - m * xo + yo, 1)
    } else {
      x = xo
      y = -yp
    }
    return [round(x - offsetX, 1), round(y - offsetY, 1)]
  }
})()

const toggleDragMode = () => {
  if (state.dragMode === 'drag') {
    state.dragMode = 'rotate'
    refs.rulerLevel.classList.add('editor__tool-ruler-level-selected')
    refs.rulerLevel.classList.remove('editor__tool-ruler-level')
    const rulerOriginCoord = refs.rulerCenter.getBoundingClientRect()
    state.dragCurrentX = round(rulerOriginCoord.left - state.startCenterX, 1)
    state.dragCurrentY = round(rulerOriginCoord.top - state.startCenterY, 1)
    state.rulerTransformOrigin = ''
    refs.ruler.style.transformOrigin = '50% 50%'
    refs.ruler.style.transform = `translate3d(${state.dragCurrentX}px, ${state.dragCurrentY}px, 0px) rotateZ(${state.currentRotation}deg)`
  } else {
    state.dragMode = 'drag'
    refs.rulerLevel.classList.add('editor__tool-ruler-level')
    refs.rulerLevel.classList.remove('editor__tool-ruler-level-selected')
  }
}

const rotate = (perpendicular) => {
  if (perpendicular) {
    state.currentRotation = roundAngleForSteps((state.currentRotation + 90) % 360, config.rulerRotationStep, config.rulerRotationInterval)
  } else {
    if (state.currentRotation % 90 === 0) {
      return
    }
    state.currentRotation = roundAngleForSteps(180 - state.currentRotation, config.rulerRotationStep, config.rulerRotationInterval)
  }
  const rulerOriginCoord = refs.rulerCenter.getBoundingClientRect()
  state.dragCurrentX = round(rulerOriginCoord.left - state.startCenterX, 1)
  state.dragCurrentY = round(rulerOriginCoord.top - state.startCenterY, 1)
  state.rulerTransformOrigin = ''
  refs.ruler.style.transformOrigin = '50% 50%'
  refs.rulerLevel.style.transform = `rotateZ(${-state.currentRotation}deg)`
  refs.rulerLevelValue.innerHTML = `${rotationToLabel(state.currentRotation)}&#186;`
  refs.ruler.style.transform = `translate3d(${state.dragCurrentX}px, ${state.dragCurrentY}px, 0px) rotateZ(${state.currentRotation}deg)`
  state.dragLastX = state.dragCurrentX
  state.dragLastY = state.dragCurrentY
  state.dragStartX = state.dragStartY = state.gestureOriginX = state.gestureOriginY = -1
  state.startAngle = 0
}

const onTouchStart = (e) => {
  preventDefault(e)
  const touches = filterTouchesByTargets(e, [refs.ruler, refs.rulerLevelValue, refs.perpendicularButton, refs.specularButton])
  if (state.isNearSide === true || state.draggable === false || touches.length > 2 || touches.length === 0) {
    state.touchDown = false
    return
  }
  document.addEventListener(Params.eventMove, onTouchMove)
  document.addEventListener(Params.eventEnd, onTouchEnd)
  state.touchDown = true

  if (state.startOriginX === 0) {
    const rulerOriginCoord = refs.rulerOrigin.getBoundingClientRect()
    state.startOriginX = round(rulerOriginCoord.left, 1)
    state.startOriginY = round(rulerOriginCoord.top, 1)
    state.startCenterX = state.startOriginX + state.rulerWidth / 2
    state.startCenterY = state.startOriginY + config.rulerHeight / 2
  }
  if (touches.length === 1) {
    let cursorX = getEventCoordX(touches, 0)
    let cursorY = getEventCoordY(touches, 0)
    if (checkCoordNearRuler(cursorX, cursorY, true)) { // start drawing line
      state.isNearSide = true
      lock();
      [cursorX, cursorY] = getCoordsNearRuler(cursorX, cursorY)
      onStart(touches[0], cursorX, cursorY)
    } else if (state.dragMode === 'drag') { // initiate drag ruler
      state.dragStartX = cursorX
      state.dragStartY = cursorY
    } else { // initiate rotate ruler
      const rulerCenterCoord = refs.rulerCenter.getBoundingClientRect()
      state.currentCenterX = rulerCenterCoord.left
      state.currentCenterY = rulerCenterCoord.top
      state.dragCurrentX = round(rulerCenterCoord.left - state.startCenterX, 1)
      state.dragCurrentY = round(rulerCenterCoord.top - state.startCenterY, 1)
      state.startAngle = round(getAngleDegBetweenTwoPoints(rulerCenterCoord.left, rulerCenterCoord.top, cursorX, cursorY), 2) - state.currentRotation
    }
  } else { // initiate drag ruler with two fingers gesture
    const rulerOriginCoord = refs.rulerOrigin.getBoundingClientRect()
    state.translated = true
    state.dragLastX = state.dragCurrentX
    state.dragLastY = state.dragCurrentY
    refs.rulerGestureOne.style.left = `${round(touches[0].clientX, 1)}px`
    refs.rulerGestureOne.style.top = `${round(touches[0].clientY, 1)}px`
    refs.rulerGestureOne.style.transformOrigin = `${round(rulerOriginCoord.left - touches[0].clientX, 1)}px ${round(rulerOriginCoord.top - touches[0].clientY, 1)}px`
    refs.rulerGestureTwo.style.left = `${round(touches[1].clientX, 1)}px`
    refs.rulerGestureTwo.style.top = `${round(touches[1].clientY, 1)}px`
    refs.rulerGestureTwo.style.transformOrigin = `${round(rulerOriginCoord.left - touches[1].clientX, 1)}px ${round(rulerOriginCoord.top - touches[1].clientY, 1)}px`
    refs.rulerGestureOne.style.transform = refs.rulerGestureTwo.style.transform = `translate3d(${round(state.startOriginX - rulerOriginCoord.left, 1)}px, ${round(state.startOriginY - rulerOriginCoord.top, 1)}px, 0px) rotateZ(${(-state.currentRotation)}deg)`
    const gestureOneCoord = refs.rulerGestureOne.getBoundingClientRect()
    const gestureTwoCoord = refs.rulerGestureTwo.getBoundingClientRect()
    state.gestureOriginX = (gestureOneCoord.left + gestureTwoCoord.left) / 2
    state.gestureOriginY = (gestureOneCoord.top + gestureTwoCoord.top) / 2
    state.startAngle = round(getAngleDegBetweenTwoPoints(gestureOneCoord.left, gestureOneCoord.top, gestureTwoCoord.left, gestureTwoCoord.top), 2)
    state.rulerTransformOrigin = `${round(state.gestureOriginX - state.startOriginX, 1)}px ${round(state.gestureOriginY - state.startOriginY, 1)}px`
    refs.rulerGestureOne.style.cssText = refs.rulerGestureTwo.style.cssText = ''
  }
}

const onTouchMove = (e) => {
  preventDefault(e)
  const touches = filterTouchesByTargets(e, [refs.ruler, refs.rulerLevelValue, refs.perpendicularButton, refs.specularButton])
  if (touches.length > 2 || state.touchDown === false || touches.length === 0) {
    state.touchDown = false
    return
  }
  let cursorX = 0, cursorY = 0
  if (state.isNearSide) { // continues drawing line
    [cursorX, cursorY] = getCoordsNearRuler(getEventCoordX(touches, 0), getEventCoordY(touches, 0))
    onMove(touches[0], cursorX, cursorY)
  } else if (state.draggable) {
    if (touches.length === 1) {
      cursorX = getEventCoordX(touches, 0)
      cursorY = getEventCoordY(touches, 0)
      if (state.dragStartX === -1) {
        state.dragStartX = cursorX
        state.dragStartY = cursorY
      }
      if (state.dragMode === 'drag' || touches[0].target === refs.rulerLevelValue) { // continues drag ruler
        cursorX = round(state.dragLastX + cursorX - state.dragStartX, 1)
        cursorY = round(state.dragLastY + cursorY - state.dragStartY, 1)
        if (touches[0].target !== refs.ruler && getDistanceBetweenTwoPoints(cursorX, cursorY, state.dragLastX, state.dragLastY) < 10) {
          return
        }
        state.dragged = true
        state.dragCurrentX = cursorX
        state.dragCurrentY = cursorY
      } else { // continues rotate ruler
        if (state.translated) {
          const rulerCenterCoord = refs.rulerCenter.getBoundingClientRect()
          state.currentCenterX = rulerCenterCoord.left
          state.currentCenterY = rulerCenterCoord.top
          state.dragCurrentX = round(rulerCenterCoord.left - state.startCenterX, 1)
          state.dragCurrentY = round(rulerCenterCoord.top - state.startCenterY, 1)
          state.startAngle = round(getAngleDegBetweenTwoPoints(rulerCenterCoord.left, rulerCenterCoord.top, cursorX, cursorY), 2) - state.currentRotation
        }
        state.rulerTransformOrigin = ''
        refs.ruler.style.transformOrigin = '50% 50%'
        state.currentRotation = roundAngleForSteps(round((getAngleDegBetweenTwoPoints(state.currentCenterX, state.currentCenterY, cursorX, cursorY) - state.startAngle), 2), config.rulerRotationStep, config.rulerRotationInterval)
        refs.rulerLevel.style.transform = `rotateZ(${-state.currentRotation}deg)`
        refs.rulerLevelValue.innerHTML = `${rotationToLabel(state.currentRotation)}&#186;`

      }
    } else { // continues drag ruler with two fingers gesture
      state.dragged = true
      state.dragCurrentX = round((touches[0].clientX +  touches[1].clientX) / 2 - state.gestureOriginX, 1)
      state.dragCurrentY = round((touches[0].clientY +  touches[1].clientY) / 2 - state.gestureOriginY, 1)
      state.currentRotation = roundAngleForSteps(round((getAngleDegBetweenTwoPoints(touches[0].clientX, touches[0].clientY, touches[1].clientX, touches[1].clientY) - state.startAngle), 2), config.rulerRotationStep, config.rulerRotationInterval)
      refs.rulerLevel.style.transform = `rotateZ(${-state.currentRotation}deg)`
      refs.rulerLevelValue.innerHTML = `${rotationToLabel(state.currentRotation)}&#186;`
      state.dragStartX = state.dragStartY = -1
      refs.ruler.style.transformOrigin = state.rulerTransformOrigin
    }
    refs.ruler.style.transform = `translate3d(${state.dragCurrentX}px, ${state.dragCurrentY}px, 0px) rotateZ(${state.currentRotation}deg)`
  }
}

const onTouchEnd = (e) => {
  preventDefault(e)
  const touches = filterTouchesByTargets(e, [refs.ruler, refs.rulerLevelValue, refs.perpendicularButton, refs.specularButton])
  if (!e.touches || touches.length === 0) {
    document.removeEventListener(Params.eventMove, onTouchMove)
    document.removeEventListener(Params.eventEnd, onTouchEnd)
    state.touchDown = false
  }
  if (state.touchDown === false) {
    state.translated = state.dragged = false
    if (state.isNearSide) { // end drawing line
      unlock()
      state.isNearSide = false
      if (Params.supportTouch === false) {
        onEnd(getEventCoordX(touches, state.containerOffset.left), getEventCoordY(touches, state.containerOffset.left))
      } else {
        onEnd()
      }
    } else if (state.draggable === true) { // end all types of drag
      const centerCoord = refs.rulerCenter.getBoundingClientRect()
      let deltaX = 0, deltaY = 0
      const currentRotationRad = state.currentRotation / 180 * Math.PI
      const outTop = spacing.HEADER_HEIGHT + config.rulerMinOffset - centerCoord.top
      const outBottom = centerCoord.top - (Params.height - config.rulerMinOffset - config.colorsPickerHeight)
      const outLeft = state.containerOffset.left + config.rulerMinOffset - centerCoord.left
      const outRight = centerCoord.left - (Params.width - state.containerOffset.right - config.rulerMinOffset)
      const maxDeltaX = Params.width - centerCoord.left - config.rulerMinOffset - state.containerOffset.right
      const minDeltaX = -centerCoord.left + state.containerOffset.left + config.rulerMinOffset
      const maxDeltaY = Params.height - centerCoord.top - config.rulerMinOffset - config.colorsPickerHeight
      const minDeltaY = -centerCoord.top + spacing.HEADER_HEIGHT + config.rulerMinOffset
      const sidesOut = [outTop, outBottom, outLeft, outRight].sort((a, b) => a - b).filter((a) => a > 0)

      if (sidesOut.length > 0) {
        let i = 0
        let side = sidesOut[i]
        while (side) {
          if (side === outTop) {
            deltaY = outTop
            deltaX = deltaY * Math.cos(currentRotationRad) / Math.sin(currentRotationRad)
          } else if (side === outBottom) {
            deltaY = -outBottom
            deltaX = deltaY * Math.cos(currentRotationRad) / Math.sin(currentRotationRad)
          } else if (side === outLeft) {
            deltaX = outLeft
            deltaY = deltaX * Math.sin(currentRotationRad) / Math.cos(currentRotationRad)
          } else {
            deltaX = -outRight
            deltaY = deltaX * Math.sin(currentRotationRad) / Math.cos(currentRotationRad)
          }
          i++
          if (sidesOut.length > i && (deltaX > maxDeltaX || deltaX < minDeltaX || deltaY > maxDeltaY || deltaY < minDeltaY)) {
            side = sidesOut[i]
          } else {
            side = false
          }
        }
        deltaX = Math.min(deltaX, maxDeltaX)
        deltaX = Math.max(deltaX, minDeltaX)
        deltaY = Math.min(deltaY, maxDeltaY)
        deltaY = Math.max(deltaY, minDeltaY)
        state.dragCurrentX += deltaX
        state.dragCurrentY += deltaY
        refs.ruler.style.transform = `translate3d(${state.dragCurrentX}px, ${state.dragCurrentY}px, 0px) rotateZ(${state.currentRotation}deg)`
      }
    }
  }
  state.dragLastX = state.dragCurrentX
  state.dragLastY = state.dragCurrentY
  state.dragStartX = state.dragStartY = state.gestureOriginX = state.gestureOriginY = -1
  state.startAngle = 0
}

const onButtonsTouchStart = (e) => {
  if (!e.touches || e.touches.length === 1) {
    state.buttonsTouchStartTime = Date.now()
  }
}

const onButtonsTouchEnd = (e) => {
  if (state.buttonsTouchStartTime + 200 > Date.now() && state.dragged === false && (!e.touches || e.touches.length === 0)) {
    preventDefault(e)
    state.buttonsTouchStartTime = 0
    state.touchDown = false
    const target = (e.target || e.touches[0].target)
    if (target === refs.rulerLevelValue) {
      toggleDragMode()
    } else if (target === refs.perpendicularButton) {
      rotate(true)
    } else if (target === refs.specularButton) {
      rotate(false)
    }
  }
}

const initRulerDimensionAndPosition = () => {
  state.rulerWidth = (config.rulerWidth * Math.max(Params.width, Params.height))
  refs.ruler.style.width = `${state.rulerWidth}px`
  refs.ruler.style.marginLeft = `${-state.rulerWidth / 2}px`
  // refs.ruler.style.marginTop = `${-config.rulerHeight / 2}px`
  state.touchDown = false
  state.startOriginX = state.startOriginY = 0
  state.dragCurrentX = state.dragCurrentY = state.currentRotation = state.dragLastX = state.dragLastY = state.startAngle = 0
  state.dragStartX = state.dragStartY = state.gestureOriginX = state.gestureOriginY = -1
  refs.ruler.style.transform = `translate3d(${state.dragCurrentX}px, ${state.dragCurrentY}px, 0px) rotateZ(${state.currentRotation}deg)`
  refs.rulerLevel.style.transform = `rotateZ(${-state.currentRotation}deg)`
  refs.rulerLevelValue.innerHTML = `${rotationToLabel(state.currentRotation)}&#186;`
}

const onRotate = (e) => {
  initRulerDimensionAndPosition()
  if (state.isVisible) {
    Tools.clickButton('ruler')
  }
}

const initDom = async(moduleContainer) => {
  let dom = await loadTemplate(tplRuler, {}, moduleContainer)
  refs.ruler = dom[0]
  refs.rulerOrigin = refs.ruler.querySelector('.editor__tool-ruler-origin')
  refs.rulerCenter = refs.ruler.querySelector('.editor__tool-ruler-center')
  refs.rulerStart = refs.ruler.querySelector('.editor__tool-ruler-start')
  refs.rulerBottom = refs.ruler.querySelector('.editor__tool-ruler-bottom')
  refs.rulerLevel = refs.ruler.querySelector('.editor__tool-ruler-level')
  refs.rulerLevelValue = refs.ruler.querySelector('.editor__tool-ruler-level-value')
  refs.perpendicularButton = refs.ruler.querySelector('.editor__tool-ruler-perpendicular')
  refs.specularButton = refs.ruler.querySelector('.editor__tool-ruler-specular')
  refs.rulerGestureOne = dom[1]
  refs.rulerGestureTwo = dom[2]

  initRulerDimensionAndPosition()

  state.containerOffset = {
    left: spacing.EDITOR_TOOLS_WIDTH,
    right: 0,
  }
  config.rulerHeight = spacing.RULER_HEIGHT

  refs.ruler.addEventListener(Params.eventStart, onTouchStart)
  if (Params.isMobile) {
    refs.rulerLevelValue.addEventListener(Params.eventStart, onButtonsTouchStart)
    refs.rulerLevelValue.addEventListener(Params.eventEnd, onButtonsTouchEnd)
  } else {
    toggleDragMode()
  }
  refs.perpendicularButton.addEventListener(Params.eventStart, onButtonsTouchStart)
  refs.perpendicularButton.addEventListener(Params.eventEnd, onButtonsTouchEnd)
  refs.specularButton.addEventListener(Params.eventStart, onButtonsTouchStart)
  refs.specularButton.addEventListener(Params.eventEnd, onButtonsTouchEnd)
  if (Params.isMobile) {
    refs.ruler.addEventListener('gesturestart', preventDefault, true)
    refs.ruler.addEventListener('gesturechange', preventDefault, true)
    refs.ruler.addEventListener('gestureend', preventDefault, true)
  }
  addRotationHandler(onRotate)
  dom = undefined
}

export const init = async(moduleContainer, events) => {
  onStart = events.touchStart
  onMove = events.touchMove
  onEnd = events.touchEnd
  state = deepCopy(initialState)
  config.rulerMinOffset /= Params.viewportScale
  config.rulerMarginToDraw /= Params.viewportScale
  await initDom(moduleContainer)
}

export const remove = () => {
  onStart = onMove = onEnd = undefined
  state = {}
  cleanRefs(refs)
}
