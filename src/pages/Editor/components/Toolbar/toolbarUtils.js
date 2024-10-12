import Params from 'main/Params'
import { getEventCoordX, preventDefault } from 'utils/domUtils'
import { round, getNumberInBetween } from 'utils/mathUtils'
import { spacing } from 'main/Theme'

import { TOUCH_TYPE_STYLUS } from 'main/constants'


const MIX_PX_TO_DRAG = 5
export const cursorButtonTouchStart = (currentValue, startCoordX, onDrag, onTap, waitingTime = 0) => {
  let dragEnabled = true
  let dragged = false
  let lastValue = false
  const minPxToDrag = MIX_PX_TO_DRAG / Params.viewportScale
  const sliderWidth = 22 * spacing.ONE_REM
  const minDelta = 1 - currentValue
  const maxDelta = 100 - currentValue
  const getValueFromCoord = (coord) => round((coord * 99 / sliderWidth) + 1, 0)

  const enable = () => dragEnabled = true
  const update = (newValue) => {
    dragEnabled = (waitingTime === 0)
    if (newValue !== lastValue) {
      lastValue = newValue
      onDrag(newValue, true)
    }
    dragEnabled === false && setTimeout(enable, waitingTime)
  }
  const onTouchMove = (e) => {
    preventDefault(e)
    const moveCoordX = getEventCoordX(e)
    const deltaCoordX = moveCoordX - startCoordX
    if (dragged || Math.abs(deltaCoordX) >= minPxToDrag) {
      dragged = true
      let deltaValue = getValueFromCoord(deltaCoordX)
      deltaValue = getNumberInBetween(deltaValue, maxDelta, minDelta, 0)
      update(currentValue + deltaValue)
    }
  }
  const onTouchEnd = (e) => {
    preventDefault(e)
    if (!dragged) {
      onTap(e)
    } else {
      onDrag(lastValue, false)
    }
    document.removeEventListener(Params.eventMove, onTouchMove)
    document.removeEventListener(Params.eventEnd, onTouchEnd)
  }

  document.addEventListener(Params.eventMove, onTouchMove)
  document.addEventListener(Params.eventEnd, onTouchEnd)
}

export const getToolPreviewTouchEvents = (canvasSize) => {
  const events = [{
    touches: [{
      clientX: round(canvasSize * 0.1, 1),
      clientY: round(canvasSize * 0.5, 1),
    }],
    type: Params.eventStart,
    touchType: TOUCH_TYPE_STYLUS,
    force: 0.1,
    azimuthAngle: Math.PI * 2,
    altitudeAngle: Math.PI / 2,
  }, {
    touches: [{
      clientX: round(canvasSize * 0.106, 1),
      clientY: round(canvasSize * 0.279, 1),
    }],
    type: Params.eventMove,
    touchType: TOUCH_TYPE_STYLUS,
    force: 0.1,
    azimuthAngle: Math.PI * 2,
    altitudeAngle: Math.PI / 2.5,
  }, {
    touches: [{
      clientX: round(canvasSize * 0.356, 1),
      clientY: round(canvasSize * 0.859, 1),
    }],
    type: Params.eventMove,
    touchType: TOUCH_TYPE_STYLUS,
    force: Params.isDesktop ? 0.1 : 0.125,
    azimuthAngle: Math.PI * 2,
    altitudeAngle: Math.PI / 3,
  }, {
    touches: [{
      clientX: round(canvasSize * 0.326, 1),
      clientY: round(canvasSize * 0.129, 1),
    }],
    type: Params.eventMove,
    touchType: TOUCH_TYPE_STYLUS,
    force: Params.isDesktop ? 0.1 : 0.15,
    azimuthAngle: Math.PI * 2,
    altitudeAngle: Math.PI / 4,
  }, {
    touches: [{
      clientX: round(canvasSize * 0.836, 1),
      clientY: round(canvasSize * 0.676, 1),
    }],
    type: Params.eventMove,
    touchType: TOUCH_TYPE_STYLUS,
    force: Params.isDesktop ? 0.1 : 0.175,
    azimuthAngle: Math.PI * 2,
    altitudeAngle: Math.PI / 5,
  }, {
    touches: [{
      clientX: round(canvasSize * 0.9, 1),
      clientY: round(canvasSize * 0.5, 1),
    }],
    type: Params.eventMove,
    touchType: TOUCH_TYPE_STYLUS,
    force: Params.isDesktop ? 0.1 : 0.2,
    azimuthAngle: Math.PI * 2,
    altitudeAngle: Math.PI / 6,
  }, {
    touches: [{
      clientX: round(canvasSize * 0.9, 1),
      clientY: round(canvasSize * 0.5, 1),
    }],
    type: Params.eventEnd,
    touchType: TOUCH_TYPE_STYLUS,
    force: Params.isDesktop ? 0.1 : 0.225,
    azimuthAngle: Math.PI * 2,
    altitudeAngle: Math.PI / 7,
  }]

  return events
}
