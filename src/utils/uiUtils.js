const isEqual = require('lodash.isequal')

import Params from 'main/Params'
import { getEventCoordX, getEventCoordY, preventDefault, redrawDomElement, getDomRect } from 'utils/domUtils'
import { fadeInElements, fadeOutElements, cancelElementAnimationIfExists } from 'utils/animationsUtils'
import { getDistanceBetweenTwoPoints, round, getMiddlePointCoords, convertAngleDegToRad, getPointProjectionOnLine, getAngleDegBetweenTwoPoints } from 'utils/mathUtils'
import { debounceThrottle, callCallbackIfDataChanged } from 'utils/jsUtils'
import { animateElement } from 'utils/animationsUtils'
import { timing } from 'main/Theme'


const divPreventEvents = document.createElement('div')
divPreventEvents.classList.add('drawith__overlay-dragNdrop')
// const dragAndDropPlaceholder = document.createElement('div')
// dragAndDropPlaceholder.classList.add('drawith__dragNdrop-placeholder')


/*
  if returnRelativeDiff === true  : it returns the difference between every mouseMove and the original mouseDown.
      So it goes negative if you drag to the left, and positive to the right.
  if returnRelativeDiff === false : it return the value corresponding at che current mouse event coordinates.
      So it's always a number between 0 and valueMax.
*/
export const addHorizontalDragSliderHandler = (element, container, onChange, valueMax, valueMin, returnRelativeDiff = false, decimals = 4, waitingTime = 0) => {
  let dragEnabled = true
  let lastValue = false
  let dragged = false
  let valueAtTouchStart = 0
  let coordAtTouchStart = 0
  let containerLeft = 0
  let containerWidth = 0
  let deltaValue = valueMax - valueMin

  const enable = () => dragEnabled = true
  const getValueFromCoord = (coord) => round((coord * deltaValue / containerWidth) + valueMin, decimals)

  const update = (newValue) => {
    dragEnabled = (waitingTime === 0)
    if (newValue !== lastValue) {
      lastValue = newValue
      onChange(newValue, true, dragged)
    }
    dragEnabled === false && setTimeout(enable, waitingTime)
  }
  const onTouchStart = (e) => {
    preventDefault(e)
    dragged = false
    document.addEventListener(Params.eventMove, onTouchMove)
    document.addEventListener(Params.eventEnd, onTouchEnd)
    const containerRect = container.getBoundingClientRect()
    containerLeft = round(containerRect.left, 0)
    containerWidth = round(containerRect.width, 0)
    if (returnRelativeDiff) {
      coordAtTouchStart = getEventCoordX(e)
      valueAtTouchStart = getValueFromCoord(getDomRect(element).centerX - containerLeft)
    } else {
      valueAtTouchStart = coordAtTouchStart = 0
    }
    _touchMove(getEventCoordX(e))
  }
  const _touchMove = (coordX) => {
    let newValue
    if (returnRelativeDiff) {
      newValue = getValueFromCoord(coordX - coordAtTouchStart)
      newValue = Math.max(newValue, valueMin - valueAtTouchStart)
      newValue = Math.min(newValue, valueMax - valueAtTouchStart)
    } else {
      newValue = getValueFromCoord(coordX - containerLeft)
      newValue = Math.max(newValue, valueMin)
      newValue = Math.min(newValue, valueMax)
    }
    update(newValue)
  }
  const onTouchMove = (e) => {
    preventDefault(e)
    if (dragEnabled) {
      _touchMove(getEventCoordX(e))
      dragged = true
    }
  }
  const onTouchEnd = () => {
    onChange(lastValue, false, dragged)
    document.removeEventListener(Params.eventMove, onTouchMove)
    document.removeEventListener(Params.eventEnd, onTouchEnd)
  }

  element.addEventListener(Params.eventStart, onTouchStart)
  container.addEventListener(Params.eventStart, onTouchStart)
}

export const addVerticalDragSliderHandler = (element, container, onChange, valueMax, valueMin, returnRelativeDiff = false, decimals = 4, waitingTime = 0) => {
  let dragEnabled = true
  let lastValue = false
  let dragged = false
  let valueAtTouchStart = 0
  let coordAtTouchStart = 0
  let containerTop = 0
  let containerHeight = 0
  let deltaValue = valueMax - valueMin

  const enable = () => dragEnabled = true
  const getValueFromCoord = (coord) => round(valueMax - (coord * deltaValue / containerHeight) + valueMin, decimals)

  const update = (newValue) => {
    dragEnabled = (waitingTime === 0)
    if (newValue !== lastValue) {
      lastValue = newValue
      onChange(newValue, true, dragged)
    }
    dragEnabled === false && setTimeout(enable, waitingTime)
  }
  const onTouchStart = (e) => {
    preventDefault(e)
    dragged = false
    document.addEventListener(Params.eventMove, onTouchMove)
    document.addEventListener(Params.eventEnd, onTouchEnd)
    const containerRect = container.getBoundingClientRect()
    containerTop = round(containerRect.top, 0)
    containerHeight = round(containerRect.height, 0)
    if (returnRelativeDiff) {
      coordAtTouchStart = getEventCoordY(e)
      valueAtTouchStart = getValueFromCoord(getEventCoordY(e) - containerTop)
    } else {
      valueAtTouchStart = coordAtTouchStart = 0
    }
    _touchMove(getEventCoordY(e))
  }
  const _touchMove = (coordY) => {
    let newValue
    if (returnRelativeDiff) {
      newValue = getValueFromCoord(coordY - coordAtTouchStart)
      newValue = Math.max(newValue, valueMin - valueAtTouchStart)
      newValue = Math.min(newValue, valueMax - valueAtTouchStart)
    } else {
      newValue = getValueFromCoord(coordY - containerTop)
      newValue = Math.max(newValue, valueMin)
      newValue = Math.min(newValue, valueMax)
    }
    update(newValue)
  }
  const onTouchMove = (e) => {
    preventDefault(e)
    if (dragEnabled) {
      _touchMove(getEventCoordY(e))
      dragged = true
    }
  }
  const onTouchEnd = () => {
    onChange(lastValue, false, dragged)
    document.removeEventListener(Params.eventMove, onTouchMove)
    document.removeEventListener(Params.eventEnd, onTouchEnd)
  }

  element.addEventListener(Params.eventStart, onTouchStart)
  container.addEventListener(Params.eventStart, onTouchStart)
}


const LONG_PRESS_DURATION = 300
export const addListScrollClickAndPressHandlers = (listElement, onClick, onLongPress, minPxToScrollBase = 20) => {
  let touchStartX = -1
  let touchStartY = -1
  let contentMaxScrollY = -1, contentMaxScrollX = -1
  let longPressTimeout = false
  let isLongPressed = false
  let isBugged = false
  let startedFromTop = false
  let minPxToScroll

  const doLongPress = (e) => {
    isLongPressed = true
    clearTimeout(longPressTimeout)
    onEventEnd()
    onLongPress(e)
  }

  const onEventEnd = () => {
    touchStartX = touchStartY = -1
    isBugged = isLongPressed = startedFromTop = false
    listElement.removeEventListener('scroll', fixDragIosBug)
    listElement.removeEventListener(Params.eventMove, onTouchMove)
    listElement.removeEventListener(Params.eventEnd, onTouchEnd)
    clearTimeout(longPressTimeout)
  }

  const fixScrollIosBug = () => {
    startedFromTop = (listElement.scrollTop === 0)
    if (listElement.scrollTop === 0) {
      listElement.scrollTop = 1
    } else if (listElement.scrollTop === contentMaxScrollY) {
      listElement.scrollTop = contentMaxScrollY - 1
    }
    if (listElement.scrollLeft === 0) {
      listElement.scrollLeft = 1
    } else if (listElement.scrollLeft === contentMaxScrollX) {
      listElement.scrollLeft = contentMaxScrollX - 1
    }
  }
  const fixDragIosBug = (e) => {
    e.stopPropagation()
    if (isLongPressed) {
      preventDefault(e)
    }
  }

  const onTouchStart = async(e) => {
    e.stopPropagation()
    if ((e.touches && e.touches.length > 1)) {
      e.preventDefault()
      return
    }
    isLongPressed = false
    minPxToScroll = minPxToScrollBase * Params.pxScale

    touchStartX = getEventCoordX(e, 0)
    touchStartY = getEventCoordY(e, 0)
    longPressTimeout = setTimeout(() => {
      preventDefault(e)
      doLongPress(e)
    }, LONG_PRESS_DURATION)

    contentMaxScrollY = listElement.scrollHeight - listElement.clientHeight
    contentMaxScrollX = listElement.scrollWidth - listElement.clientWidth
    if (contentMaxScrollY === 0 && contentMaxScrollX === 0) {
      preventDefault(e)
    } else {
      fixScrollIosBug(false)
    }

    listElement.addEventListener('scroll', fixDragIosBug)
    listElement.addEventListener(Params.eventMove, onTouchMove)
    listElement.addEventListener(Params.eventEnd, onTouchEnd)
  }

  const onTouchMove = (e) => {
    if (isLongPressed) {
      e.preventDefault()
    }
    e.stopPropagation()
    const touchMoveX = getEventCoordX(e, 0)
    const touchMoveY = getEventCoordY(e, 0)
    const touchDistance = getDistanceBetweenTwoPoints(touchStartX, touchStartY, touchMoveX, touchMoveY)

    if (isBugged || (startedFromTop && touchMoveY > touchStartY)) {
      // console.log('BUG')
      isBugged = true
      preventDefault(e)
    }
    if ((Math.abs(touchDistance) > minPxToScroll) || (e.touches && e.touches.length > 1)) {
      clearTimeout(longPressTimeout)
    }
  }

  const onTouchEnd = (e) => {
    preventDefault(e)
    if (!isLongPressed && (!e.touches || e.touches.length === 0)) {
      const touchEndX = getEventCoordX(e, 0)
      const touchEndY = getEventCoordY(e, 0)
      const touchDistance = getDistanceBetweenTwoPoints(touchStartX, touchStartY, touchEndX, touchEndY)
      if (Math.abs(touchDistance) < minPxToScroll) {
        onClick(e)
      }
    }
    onEventEnd()
  }

  listElement.addEventListener(Params.eventStart, onTouchStart)
}



export const addListHorizontalScrollClickAndPressHandlers = (listElement, onClick, onLongPress, minPxToScrollBase = 20) => {
  let touchStartX = -1, touchStartY = -1
  let contentMaxScrollX = -1
  let longPressTimeout = false
  let isLongPressed = false
  let minPxToScroll

  const doLongPress = (e) => {
    isLongPressed = true
    clearTimeout(longPressTimeout)
    onEventEnd()
    onLongPress(e)
  }

  const onEventEnd = () => {
    touchStartX = touchStartY = -1
    isLongPressed  = false
    listElement.removeEventListener('scroll', fixDragIosBug)
    listElement.removeEventListener(Params.eventMove, onTouchMove)
    listElement.removeEventListener(Params.eventEnd, onTouchEnd)
    clearTimeout(longPressTimeout)
  }

  const fixScrollIosBug = () => {
    if (listElement.scrollLeft === 0) {
      listElement.scrollLeft = 1
    } else if (listElement.scrollLeft === contentMaxScrollX) {
      listElement.scrollLeft = contentMaxScrollX - 1
    }
  }
  const fixDragIosBug = (e) => {
    e.stopPropagation()
    if (isLongPressed) {
      preventDefault(e)
    }
  }

  const onTouchStart = async(e) => {
    e.stopPropagation()
    if ((e.touches && e.touches.length > 1)) {
      e.preventDefault()
      return
    }
    isLongPressed = false
    minPxToScroll = minPxToScrollBase * Params.pxScale

    touchStartX = getEventCoordX(e, 0)
    touchStartY = getEventCoordY(e, 0)
    longPressTimeout = setTimeout(() => {
      preventDefault(e)
      doLongPress(e)
    }, LONG_PRESS_DURATION)

    contentMaxScrollX = listElement.scrollWidth - listElement.clientWidth
    if (contentMaxScrollX === 0) {
      preventDefault(e)
    } else {
      fixScrollIosBug()
    }

    listElement.addEventListener('scroll', fixDragIosBug)
    listElement.addEventListener(Params.eventMove, onTouchMove)
    listElement.addEventListener(Params.eventEnd, onTouchEnd)
  }

  const onTouchMove = (e) => {
    if (isLongPressed) {
      e.preventDefault()
    }
    e.stopPropagation()
    const touchMoveX = getEventCoordX(e, 0)
    const touchMoveY = getEventCoordY(e, 0)
    const touchDistance = getDistanceBetweenTwoPoints(touchStartX, touchStartY, touchMoveX, touchMoveY)

    if ((Math.abs(touchDistance) > minPxToScroll) || (e.touches && e.touches.length > 1)) {
      clearTimeout(longPressTimeout)
    }
  }

  const onTouchEnd = (e) => {
    preventDefault(e)
    if (!isLongPressed && (!e.touches || e.touches.length === 0)) {
      const touchEndX = getEventCoordX(e, 0)
      const touchEndY = getEventCoordY(e, 0)
      const touchDistance = getDistanceBetweenTwoPoints(touchStartX, touchStartY, touchEndX, touchEndY)
      if (Math.abs(touchDistance) < minPxToScroll) {
        onClick(e)
      }
    }
    onEventEnd()
  }

  listElement.addEventListener(Params.eventStart, onTouchStart)
}




const MARGE_TO_START_SCROLLING = 100
const DELTA_SCROLL = 25
export const handleElementsListDragAndDrop = (() => {
  let moveEventX = 0, moveEventY = 0, listMaxScrollTop = 0, listMaxScrollLeft = 0, finalNewIndex = false, animationScale = 1
  let scrollIntervall = false, listHasVerticalScroll = false, listHasHorizontalScroll = false, directionVertical = false, needToFix = true
  let element = null, draggedElement = null, listRect = null, listElementsRects = null, list = null, onChange = null
  const preventDefaultSimple = (e) => e.preventDefault()

  const getListElementsRects = (list) => {
    listElementsRects = [].map.call(list.children, (el) => {
      const rect = el.getBoundingClientRect()
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      }
    })
    if (directionVertical) {
      listElementsRects.sort((a, b) => a.top > b.top ? +1 : -1)
      updateVerticalDrop()
    } else {
      listElementsRects.sort((a, b) => a.left > b.left ? +1 : -1)
      updateHorizontalDrop()
    }
  }

  const updateElementsRects = (deltaX, deltaY) => {
    listElementsRects.forEach((rect) => {
      rect.top += deltaY
      rect.bottom += deltaY
      rect.left += deltaX
      rect.right += deltaX
    })
  }

  const initDragAndDropDom = (selectedElement, startEventX, startEventY) => {
    animationScale = Params.isPhone ? 1.7 : 1.2
    const draggedElement = selectedElement.cloneNode(true)
    if (draggedElement.querySelector('canvas')) {
      const newCanvas = draggedElement.querySelector('canvas')
      const oldCanvas = selectedElement.querySelector('canvas')
      newCanvas.width = oldCanvas.width
      newCanvas.height = oldCanvas.height
      newCanvas.getContext('2d').drawImage(oldCanvas, 0, 0)
    }
    draggedElement.classList.add('displayNone', 'drawith__dragNdrop-element-dragging')
    moveEventX = startEventX
    moveEventY = startEventY
    draggedElement.style.cssText = `
      ${draggedElement.style.cssText}
      top: ${startEventY}px;
      left: ${startEventX}px;
      transform: translate3d(-50%, -50%, 0px) scale(${animationScale}) rotate(0deg);
    `
    Params.pagesContainer.appendChild(draggedElement)
    fadeInElements(draggedElement, {
      duration: 200,
      maxFadeIn: 0.7,
    })

    animateElement(draggedElement, 'bouncing', [
      { transform: `translate3d(-50%, -50%, 0px) scale(${animationScale}) rotate(+5deg)`, offset: 0 },
      { transform: `translate3d(-50%, -50%, 0px) scale(${animationScale}) rotate(-5deg)`, offset: 1 },
    ], 300, {
      iterations: Infinity,
      direction: 'alternate',
      easing: 'ease-in-out',
    })

    if (!Params.isDesktop) {
      Params.pagesContainer.appendChild(divPreventEvents)
      divPreventEvents.addEventListener(Params.eventStart, preventDefault)
    }

    return draggedElement
  }

  const removeDragAndDropDom = async(draggedElement) => {
    if (!Params.isDesktop) {
      divPreventEvents.remove()
      divPreventEvents.removeEventListener(Params.eventStart, preventDefault)
    }
    cancelElementAnimationIfExists(draggedElement, 'bouncing')

    animateElement(draggedElement, 'drop', [
      {
        top: `${moveEventY}px`,
        left: `${moveEventX}px`,
        transform: `translate3d(-50%, -50%, 0px) scale(${animationScale})`,
        offset: 0,
      },
      {
        top: `${(listElementsRects[finalNewIndex].top + listElementsRects[finalNewIndex].bottom) / 2}px`,
        left: `${(listElementsRects[finalNewIndex].left + listElementsRects[finalNewIndex].right) / 2}px`,
        transform: 'translate3d(-50%, -50%, 0px) scale(1)',
        offset: 1,
      },
    ], 300, {
      easing: 'ease-in-out',
    })

    await fadeOutElements(draggedElement, {
      duration: 300,
      maxFadeIn: 0.7,
    })
    cancelElementAnimationIfExists(draggedElement, 'drop')
    draggedElement.remove()
    if (draggedElement.querySelector('canvas')) {
      draggedElement.querySelector('canvas').width = 0
    }
    draggedElement = null
  }

  const updateVerticalDrop = debounceThrottle(() => {
    if (listElementsRects?.length) {
      let currentIndex = 0, res = false
      if (moveEventY < listElementsRects[0].top) {
        res = 0
      } else if (moveEventY > listElementsRects[listElementsRects.length - 1].bottom) {
        res = listElementsRects.length - 1
      } else {
        while (res === false && currentIndex < listElementsRects.length) {
          if (moveEventY < listElementsRects[currentIndex].bottom && moveEventY > listElementsRects[currentIndex].top) {
            res = currentIndex
          }
          currentIndex++
        }
      }
      if (res !== false) {
        finalNewIndex = res
        onChange(element, finalNewIndex, true)
      }
    }
  }, 150)

  const updateHorizontalDrop = debounceThrottle(() => {
    if (listElementsRects?.length) {
      let currentIndex = 0, res = false
      if (moveEventX < listElementsRects[0].left) {
        res = 0
      } else if (moveEventX > listElementsRects[listElementsRects.length - 1].right) {
        res = listElementsRects.length - 1
      } else {
        while (res === false && currentIndex < listElementsRects.length) {
          if (moveEventX < listElementsRects[currentIndex].right && moveEventX > listElementsRects[currentIndex].left) {
            res = currentIndex
          }
          currentIndex++
        }
      }
      if (res !== false) {
        finalNewIndex = res
        onChange(element, finalNewIndex, true)
      }
    }
  }, 150)

  const fixListDimension = () => {
    if (needToFix) {
      redrawDomElement(list) // small fix to force list redraw, to fix list.scrollHeight list.scrollLeft
      needToFix = false
    }
  }

  const scrollListUp = () => {
    fixListDimension()
    if (list.scrollTop === 0 || moveEventY > listRect.top + MARGE_TO_START_SCROLLING) {
      clearInterval(scrollIntervall)
      scrollIntervall = false
    } else {
      const delta = round(Math.min(DELTA_SCROLL, list.scrollTop), 0)
      list.scrollTop = round(list.scrollTop - delta, 0)
      updateElementsRects(0, delta)
      updateVerticalDrop()
    }
  }

  const scrollListDown = () => {
    fixListDimension()
    if (list.scrollTop === listMaxScrollTop || moveEventY < listRect.bottom - MARGE_TO_START_SCROLLING) {
      clearInterval(scrollIntervall)
      scrollIntervall = false
    } else {
      const delta = round(Math.min(DELTA_SCROLL, listMaxScrollTop - list.scrollTop), 0)
      list.scrollTop = round(list.scrollTop + delta, 0)
      updateElementsRects(0, -delta)
      updateVerticalDrop()
    }
  }

  const scrollListLeft = () => {
    fixListDimension()
    if (list.scrollLeft === 0 || moveEventX > listRect.left + MARGE_TO_START_SCROLLING) {
      clearInterval(scrollIntervall)
      scrollIntervall = false
    } else {
      const delta = round(Math.min(DELTA_SCROLL, list.scrollLeft), 0)
      list.scrollLeft = round(list.scrollLeft - delta, 0)
      updateElementsRects(delta, 0)
      updateHorizontalDrop()
    }
  }

  const scrollListRight = () => {
    fixListDimension()
    if (list.scrollLeft === listMaxScrollLeft || moveEventX < listRect.right - MARGE_TO_START_SCROLLING) {
      clearInterval(scrollIntervall)
      scrollIntervall = false
    } else {
      const delta = round(Math.min(DELTA_SCROLL, listMaxScrollLeft - list.scrollLeft), 0)
      list.scrollLeft = round(list.scrollLeft + delta, 0)
      updateElementsRects(-delta, 0)
      updateHorizontalDrop()
    }
  }

  const onDragMove = (e) => {
    preventDefault(e)
    if (e.target !== divPreventEvents) {
      moveEventX = getEventCoordX(e)
      moveEventY = getEventCoordY(e)
      draggedElement.style.left = `${moveEventX}px`
      draggedElement.style.top = `${moveEventY}px`

      if (directionVertical) {
        if (!scrollIntervall) {
          updateVerticalDrop()
          if (listHasVerticalScroll) {
            if (list.scrollTop > 0 && moveEventY < listRect.top + MARGE_TO_START_SCROLLING) {
              scrollIntervall = setInterval(scrollListUp, 20)
            } else if (list.scrollTop < listMaxScrollTop && moveEventY > listRect.bottom - MARGE_TO_START_SCROLLING) {
              scrollIntervall = setInterval(scrollListDown, 20)
            }
          }
        }
      } else {
        if (!scrollIntervall) {
          updateHorizontalDrop()
          if (listHasHorizontalScroll) {
            if (list.scrollLeft > 0 && moveEventX < listRect.left + MARGE_TO_START_SCROLLING) {
              scrollIntervall = setInterval(scrollListLeft, 20)
            } else if (list.scrollLeft < listMaxScrollLeft && moveEventX > listRect.right - MARGE_TO_START_SCROLLING) {
              scrollIntervall = setInterval(scrollListRight, 20)
            }
          }
        }
      }
    }
  }

  const onDragEnd = async(e) => {
    preventDefault(e)
    if (e.target !== divPreventEvents) {
      clearInterval(scrollIntervall)
      removeDragAndDropDom(draggedElement)
      scrollIntervall = false
      onChange(element, finalNewIndex, false)
      document.removeEventListener(Params.eventMove, onDragMove)
      document.removeEventListener(Params.eventEnd, onDragEnd)
      element.removeEventListener(Params.eventMove, preventDefaultSimple)
      list.style.overflow = 'scroll'
      element = listElementsRects = onChange = listRect = list = null
    }
  }

  return (e, listElement, selectedElement, saveDrag, direction = 'vertical') => {
    preventDefault(e)
    list = listElement
    element = selectedElement
    directionVertical = (direction === 'vertical')
    listRect = list.getBoundingClientRect()
    draggedElement = initDragAndDropDom(selectedElement, getEventCoordX(e), getEventCoordY(e))
    listHasVerticalScroll = (list.scrollHeight > list.clientHeight)
    listHasHorizontalScroll = (list.scrollWidth > list.clientWidth)
    listMaxScrollTop = list.scrollHeight - list.clientHeight
    listMaxScrollLeft = list.scrollWidth - list.clientWidth

    onChange = callCallbackIfDataChanged(saveDrag)
    needToFix = true
    getListElementsRects(list)

    list.style.overflow = 'hidden'
    element.addEventListener(Params.eventMove, preventDefaultSimple)
    document.addEventListener(Params.eventMove, onDragMove)
    document.addEventListener(Params.eventEnd, onDragEnd)
  }
})()


const DEFAULT_MOVE_WAITING_TIME = 0 // ms
const LAYER_CONTENT_MIN_SIZE = 50 // px
export const addResizeBulletsHandlers = (
  TL, TR, BR, BL,
  T, R, B, L, RT,
  getCurrentState, getDotCoords, getTouchCoords,
  onStart, onChange, onEnd,
  waitingTime = DEFAULT_MOVE_WAITING_TIME
) => {
  let dragEnabled = true
  let initialState, lastState
  let initialRotation, onTouchMove
  let startDotX, startDotY
  let oppositeX, oppositeY
  let touchStartX, touchStartY
  let contentCenterX, contentCenterY
  let resizeAngleCosFraction, resizeAngleSinFraction

  const handleResizeStart = (e, point, oppositePoint, selectedResize) => {
    preventDefault(e)
    onStart()
    initialState = getCurrentState()
    const [touchX, touchY] = getTouchCoords(e)
    const initRadians = convertAngleDegToRad(initialState.r)
    resizeAngleCosFraction = Math.cos(initRadians)
    resizeAngleSinFraction = Math.sin(initRadians);
    [startDotX, startDotY] = getDotCoords(point);
    [oppositeX, oppositeY] = getDotCoords(oppositePoint);
    [touchStartX, touchStartY] = getPointProjectionOnLine(startDotX, startDotY, oppositeX, oppositeY, touchX, touchY)
    if (touchStartX === false || touchStartY === false) {
      touchStartX = touchX
      touchStartY = touchY
    }
    onTouchMove = selectedResize
    document.addEventListener(Params.eventMove, onTouchMove)
    document.addEventListener(Params.eventEnd, onTouchEnd)
  }
  const handleResizeChange = (left, top, xResize, yResize, ratioResize, e) => {
    preventDefault(e)
    if (!dragEnabled) {
      return
    }
    let [touchX, touchY] = getTouchCoords(e)

    if (ratioResize) {
      [touchX, touchY] = getPointProjectionOnLine(startDotX, startDotY, oppositeX, oppositeY, touchX, touchY)
      if (touchX === false || touchY === false) {
        return
      }
    }

    const wDiff = (touchX - touchStartX)
    const hDiff = (touchY - touchStartY)
    const rotatedWDiff = resizeAngleCosFraction * wDiff + resizeAngleSinFraction * hDiff
    const rotatedHDiff = resizeAngleCosFraction * hDiff - resizeAngleSinFraction * wDiff
    let newW = initialState.w, newH = initialState.h, newX = initialState.x, newY = initialState.y

    if (xResize) {
      if (left) {
        newW = initialState.w - rotatedWDiff
      } else {
        newW = initialState.w + rotatedWDiff
      }
      newX += 0.5 * rotatedWDiff * resizeAngleCosFraction
      newY += 0.5 * rotatedWDiff * resizeAngleSinFraction
    }

    if (yResize) {
      if (top) {
        newH = initialState.h - rotatedHDiff
      } else {
        newH = initialState.h + rotatedHDiff
      }
      newX -= 0.5 * rotatedHDiff * resizeAngleSinFraction
      newY += 0.5 * rotatedHDiff * resizeAngleCosFraction
    }

    update({ x: newX, y: newY, w: newW, h: newH }, left, top, xResize && !left, yResize && !top, false)
  }

  const handleRotationStart = (e) => {
    preventDefault(e)
    onStart()
    initialState = getCurrentState()
    const [tlX, tlY] = getDotCoords(TL)
    const [brX, brY] = getDotCoords(BR);
    [contentCenterX, contentCenterY] = getMiddlePointCoords(tlX, tlY, brX, brY)
    const [touchX, touchY] = getTouchCoords(e)
    initialRotation = getAngleDegBetweenTwoPoints(contentCenterX, contentCenterY, touchX, touchY)
    onTouchMove = handleRotationChange
    document.addEventListener(Params.eventMove, onTouchMove)
    document.addEventListener(Params.eventEnd, onTouchEnd)
  }
  const handleRotationChange = (e) => {
    preventDefault(e)
    if (!dragEnabled) {
      return
    }
    const [touchX, touchY] = getTouchCoords(e)
    const deltaRotation = initialRotation - getAngleDegBetweenTwoPoints(contentCenterX, contentCenterY, touchX, touchY)
    update({ r: round(initialState.r - deltaRotation, 2) }, false, false, false, false, true)
  }

  const onTouchEnd = (e) => {
    preventDefault(e)
    onEnd(lastState || false)
    document.removeEventListener(Params.eventMove, onTouchMove)
    document.removeEventListener(Params.eventEnd, onTouchEnd)
    initialState = lastState = initialRotation = onTouchMove = startDotX = startDotY = oppositeX = oppositeY = touchStartX = touchStartY = contentCenterX = contentCenterY = resizeAngleCosFraction = resizeAngleSinFraction = undefined
    dragEnabled = true
  }

  const enable = () => dragEnabled = true
  const update = (updatedStateKeys, left, top, right, bottom, rotation) => {
    const newState = {
      ...initialState,
      ...updatedStateKeys,
    }
    if (newState.w < LAYER_CONTENT_MIN_SIZE || newState.h < LAYER_CONTENT_MIN_SIZE) {
      return
    }

    newState.x = round(newState.x, 1)
    newState.y = round(newState.y, 1)
    newState.w = round(newState.w, 1)
    newState.h = round(newState.h, 1)
    newState.r = round(newState.r, 1)
    dragEnabled = (waitingTime === 0)
    if (!isEqual(newState, lastState)) {
      lastState = newState
      onChange(newState, left, top, right, bottom, rotation)
    }
    dragEnabled === false && setTimeout(enable, waitingTime)
  }

  const handleResizeChangeR = handleResizeChange.bind({}, false, false, true, false, false)
  const handleResizeChangeL = handleResizeChange.bind({}, true, false, true, false, false)
  const handleResizeChangeT = handleResizeChange.bind({}, false, true, false, true, false)
  const handleResizeChangeB = handleResizeChange.bind({}, false, false, false, true, false)
  const handleResizeChangeTL = handleResizeChange.bind({}, true, true, true, true, true)
  const handleResizeChangeTR = handleResizeChange.bind({}, false, true, true, true, true)
  const handleResizeChangeBR = handleResizeChange.bind({}, false, false, true, true, true)
  const handleResizeChangeBL = handleResizeChange.bind({}, true, false, true, true, true)
  R.addEventListener(Params.eventStart, e => handleResizeStart(e, R, L, handleResizeChangeR))
  L.addEventListener(Params.eventStart, e => handleResizeStart(e, L, R, handleResizeChangeL))
  T.addEventListener(Params.eventStart, e => handleResizeStart(e, T, B, handleResizeChangeT))
  B.addEventListener(Params.eventStart, e => handleResizeStart(e, B, T, handleResizeChangeB))
  TL.addEventListener(Params.eventStart, e => handleResizeStart(e, TL, BR, handleResizeChangeTL))
  TR.addEventListener(Params.eventStart, e => handleResizeStart(e, TR, BL, handleResizeChangeTR))
  BR.addEventListener(Params.eventStart, e => handleResizeStart(e, BR, TL, handleResizeChangeBR))
  BL.addEventListener(Params.eventStart, e => handleResizeStart(e, BL, TR, handleResizeChangeBL))
  RT.addEventListener(Params.eventStart, handleRotationStart)
}


export const deselectAllTabs = (container) => {
  [...container.querySelectorAll('.selected')].forEach((item) => {
    item.classList.remove('selected')
  })
}

export const selectOneTab = (container, tabName) => {
  [...container.querySelectorAll(`div[data-tab-id="${tabName}"]`)].forEach((item) => {
    item.classList.add('selected')
    item.scrollTop = 1
  })
}


const animationDuration = parseFloat(`0.${parseInt(timing.SLIDE_TRANSITION)}`)
export const animateCheckbox = (el) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttributeNS(null, 'viewBox', '0 0 100 100')
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  el.parentNode.appendChild(svg)

  el.addEventListener('change', (e) => {
    if (el.checked) {
      fillCheckbox(el)
    } else {
      resetCheckbox(el)
    }
  })
}
const fillCheckbox = (el) => {
  const paths = []
  const svg = el.parentNode.querySelector('svg')
  const pathDef = ['M16.667,62.167c3.109,5.55,7.217,10.591,10.926,15.75 c2.614,3.636,5.149,7.519,8.161,10.853c-0.046-0.051,1.959,2.414,2.692,2.343c0.895-0.088,6.958-8.511,6.014-7.3 c5.997-7.695,11.68-15.463,16.931-23.696c6.393-10.025,12.235-20.373,18.104-30.707C82.004,24.988,84.802,20.601,87,16']
  const animDef = { speed: animationDuration, easing: 'ease-in-out' }
  paths.push(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
  for (var i = 0, len = paths.length; i < len; ++i) {
    const path = paths[i]
    svg.appendChild(path)
    path.setAttributeNS(null, 'd', pathDef[i])
    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length} ${length}`
    if (i === 0) {
      path.style.strokeDashoffset = Math.floor(length) - 1
    } else {
      path.style.strokeDashoffset = length
    }
    path.getBoundingClientRect()
    path.style.transition = `stroke-dashoffset ${animDef.speed}s ${animDef.easing} ${i * animDef.speed}s`
    path.style.strokeDashoffset = '0'
  }
}
const resetCheckbox = (el) => {
  Array.prototype.slice.call(el.parentNode.querySelectorAll('svg > path')).forEach(el => el.remove())
}
