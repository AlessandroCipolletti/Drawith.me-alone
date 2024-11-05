import Params from 'main/Params'

import { config, currentCanvasHasZoom } from 'pages/Editor'
import { round, getNumberInBetween, getOriginalCoordsFromScaleRotation, getDistanceBetweenThreePoints, getAngleRadBetweenTwoPoints, rotateCoords, convertAngleDegToRad } from 'utils/mathUtils'
import { addGlobalStatus, removeGlobalStatus } from 'utils/moduleUtils'
import { getEventCoordX, getEventCoordY } from 'utils/domUtils'
import * as Ruler from './components/Ruler'
import { spacing } from 'main/Theme'
import { TOUCH_TYPE_STYLUS } from 'main/constants'

const getTouchEventData = (touchEvent, lastStep, offsetX = 0, offsetY = 0) => {
  const data = {}

  data.type = touchEvent.type
  data.x = getEventCoordX(touchEvent, offsetX)
  data.y = getEventCoordY(touchEvent, offsetY)
  if (touchEvent.type === Params.eventStart) {
    data.midX = data.x
    data.midY = data.y
    data.stepLength = 0
    data.speedFactor = 0
  } else {
    data.midX = round((lastStep.x + data.x) / 2, 1)
    data.midY = round((lastStep.y + data.y) / 2, 1)
    data.stepLength = getDistanceBetweenThreePoints(
      lastStep.midX, lastStep.midY,
      lastStep.x, lastStep.y,
      data.midX, data.midY,
      1
    )
    if (touchEvent.type === Params.eventEnd) {
      data.speedFactor = lastStep.speedFactor / 2
    } else {
      data.speedFactor = Math.min(config.maxSpeedFactorLength, data.stepLength) / config.maxSpeedFactorLength
    }
  }

  if (touchEvent.touchType === TOUCH_TYPE_STYLUS) {
    if (touchEvent.force === config.initialForceTouchBugValue) {
      data.force = touchEvent.force / 4
    } else {
      data.force = Math.max(round((touchEvent.force - 0.1) * 1.11, 3), 0.001) // a force lower than 0.1 should be considered as 0, the user is just using the pencil normally
    }
  } else if (touchEvent.type === Params.eventStart) {
    data.force = config.defaultForceTouch
  } else if (touchEvent.type === Params.eventEnd) {
    data.force = config.initialForceTouchBugValue / 4
  }

  data.azimuthAngle = touchEvent.azimuthAngle || 0
  if (touchEvent.type === Params.eventStart) {
    data.pathRotation = 0
  } else {
    data.pathRotation = getAngleRadBetweenTwoPoints(lastStep.x, lastStep.y, data.x, data.y)
  }

  data.altitudeAngle = touchEvent.altitudeAngle || config.defaultAltitudeAngle
  data.altitudeFactor = getAltitudeFactorFromAngle(data.altitudeAngle, config.maxSupportedStylusAltitudeFactor)
  data.canHandleStylusRotation = data.canHandleStylusRotation && data.altitudeFactor > config.minAltitudeFactorToHandleRotation

  return data
}

export const getStepsDataFromTouchEvents = (touchEvents, tool, offsetX = 0, offsetY = 0) => {
  const lastStep = {}
  const stepsData = []

  for (const i in touchEvents) {
    const touchData = getTouchEventData(touchEvents[i], lastStep, offsetX, offsetY)
    const stepData = getStepData(tool, touchData, lastStep)
    stepsData.push(stepData)

    lastStep.x = stepData.x
    lastStep.y = stepData.y
    lastStep.midX = stepData.midX
    lastStep.midY = stepData.midY
    lastStep.size = stepData.size
    lastStep.alpha = stepData.alpha
    lastStep.rotation = stepData.rotation
    lastStep.speedFactor = stepData.speedFactor
  }

  return stepsData
}

export const updateLastStepData = (state, stepData) => {
  state.lastStep.x = stepData.x
  state.lastStep.y = stepData.y
  state.lastStep.midX = stepData.midX
  state.lastStep.midY = stepData.midY
  state.lastStep.size = stepData.size
  state.lastStep.alpha = stepData.alpha
  state.lastStep.rotation = stepData.rotation
}

export const updateCurrentTouchData = (state, touchEvent, eventType, x = false, y = false) => {
  const currentTouch = state.currentTouch
  currentTouch.type = eventType

  // init coords x and y
  if (x === false || y === false) {
    currentTouch.x = getEventCoordX(touchEvent, state.canvas.offset.left)
    currentTouch.y = getEventCoordY(touchEvent, state.canvas.offset.top)
    currentTouch.eventX = currentTouch.x + state.canvas.offset.left
    currentTouch.eventY = currentTouch.y + state.canvas.offset.top
    if (eventType === Params.eventStart) {
      currentTouch.isNearRuler = Ruler.checkCoordNearRuler(currentTouch.x + state.canvas.offset.left, currentTouch.y + state.canvas.offset.top)
    }
    if (currentTouch.isNearRuler) {
      [currentTouch.x, currentTouch.y] = Ruler.getCoordsNearRuler(currentTouch.x, currentTouch.y, state.canvas.offset.left, state.canvas.offset.top)
    }
    if (currentCanvasHasZoom()) {
      [currentTouch.x, currentTouch.y] = getOriginalCoordsFromScaleRotation(currentTouch.x, currentTouch.y, state.canvas.originCoordX, state.canvas.originCoordY, state.canvas.scale, state.canvas.rotation)
    }
  } else {
    currentTouch.x = x - state.canvas.offset.left
    currentTouch.y = y - state.canvas.offset.top
    currentTouch.eventX = currentTouch.x + state.canvas.offset.left
    currentTouch.eventY = currentTouch.y + state.canvas.offset.top
    if (currentCanvasHasZoom()) {
      [currentTouch.x, currentTouch.y] = getOriginalCoordsFromScaleRotation(currentTouch.x, currentTouch.y, state.canvas.originCoordX, state.canvas.originCoordY, state.canvas.scale, state.canvas.rotation)
    }
  }
  currentTouch.x = round(currentTouch.x * Params.pxScale, 1)
  currentTouch.y = round(currentTouch.y * Params.pxScale, 1)

  // midX and midY ==> middle points between this mouseMove and the last one
  // dragX dragY ==> eventX eventY difference since touchStart
  if (eventType === Params.eventStart) {
    currentTouch.startDragX = currentTouch.eventX
    currentTouch.startDragY = currentTouch.eventY
    currentTouch.dragX = 0
    currentTouch.dragY = 0
    currentTouch.midX = currentTouch.x
    currentTouch.midY = currentTouch.y
    currentTouch.stepLength = 0
    currentTouch.speedFactor = 0
  } else {
    currentTouch.dragX = round((currentTouch.eventX - currentTouch.startDragX) * Params.pxScale / state.canvas.scale, 1)
    currentTouch.dragY = round((currentTouch.eventY - currentTouch.startDragY) * Params.pxScale / state.canvas.scale, 1)
    if (currentCanvasHasZoom()) {
      [currentTouch.dragX, currentTouch.dragY] = rotateCoords(currentTouch.dragX, currentTouch.dragY, convertAngleDegToRad(state.canvas.rotation))
    }
    currentTouch.midX = round((state.lastStep.x + currentTouch.x) / 2, 1)
    currentTouch.midY = round((state.lastStep.y + currentTouch.y) / 2, 1)
    currentTouch.stepLength = getDistanceBetweenThreePoints(
      state.lastStep.midX, state.lastStep.midY,
      state.lastStep.x, state.lastStep.y,
      currentTouch.midX, currentTouch.midY,
      1
    )
    if (eventType === Params.eventEnd) {
      currentTouch.speedFactor = currentTouch.speedFactor / 2
    } else {
      currentTouch.speedFactor = Math.min(config.maxSpeedFactorLength, currentTouch.stepLength) / config.maxSpeedFactorLength
    }
  }

  // update pressure force
  if (touchEvent.touchType === TOUCH_TYPE_STYLUS) {
    if (touchEvent.force === config.initialForceTouchBugValue) {
      currentTouch.force = touchEvent.force / 4
    } else {
      currentTouch.force = Math.max(round((touchEvent.force - 0.1) * 1.11, 3), 0.001) // a force lower than 0.1 should be considered as 0, the user is just using the pencil normally
    }
  } else if (eventType === Params.eventStart) {
    currentTouch.force = config.defaultForceTouch
  } else if (eventType === Params.eventEnd) {
    currentTouch.force = config.initialForceTouchBugValue / 4
  }

  // update rotation angle
  currentTouch.azimuthAngle = touchEvent.azimuthAngle || currentTouch.azimuthAngle
  if (eventType === Params.eventStart) {
    currentTouch.pathRotation = 0
  } else {
    currentTouch.pathRotation = getAngleRadBetweenTwoPoints(state.lastStep.x, state.lastStep.y, currentTouch.x, currentTouch.y)
  }

  // update stylus angle
  if (touchEvent.touchType === TOUCH_TYPE_STYLUS) {
    currentTouch.altitudeAngle = touchEvent.altitudeAngle
    currentTouch.altitudeFactor = getAltitudeFactorFromAngle(currentTouch.altitudeAngle, config.maxSupportedStylusAltitudeFactor)
    currentTouch.canHandleStylusRotation = currentTouch.canHandleStylusRotation && currentTouch.altitudeFactor > config.minAltitudeFactorToHandleRotation
  }
}

export const getAltitudeFactorFromAngle = (angle, maxFactor) => getNumberInBetween(0, 1, (1 - angle / ((Math.PI) / 2)) / maxFactor)

export const getStepData = (toolProps, touchData, lastStep) => {
  let type, size, alpha, rotation
  if (touchData.type === Params.eventMove) {
    [type, size, alpha, rotation] = getStepMoveLineData(toolProps, touchData, lastStep)
  } else if (touchData.type === Params.eventStart) {
    [type, size, alpha, rotation] = getStepStartLineData(toolProps, touchData)
  } else {
    [type, size, alpha, rotation] = getStepEndLineData(toolProps, touchData, lastStep)
  }

  return {
    type,
    x: touchData.x,
    y: touchData.y,
    midX: touchData.midX,
    midY: touchData.midY,
    size,
    alpha,
    rotation,
    oldSize: lastStep.size,
    oldAlpha: lastStep.alpha,
    oldRotation: lastStep.rotation,
    oldMidX: lastStep.midX,
    oldMidY: lastStep.midY,
    oldX: lastStep.x,
    oldY: lastStep.y,
    stepLength: touchData.stepLength,
  }
}

export const getStepStartLineData = (toolProps, touchData) => {
  const size = getStepSize(toolProps, touchData)
  return [
    'start',
    size,
    getStepAlpha(toolProps, touchData, size),
    toolProps.handleStylusRotation ? touchData.azimuthAngle : 0,
  ]
}

export const getStepMoveLineData = (toolProps, touchData, lastStep) => {
  const size = getStepSize(toolProps, touchData)
  return [
    'move',
    size,
    getStepAlpha(toolProps, touchData, size),
    getStepRotation(toolProps, touchData, lastStep),
  ]
}

export const getStepEndLineData = (toolProps, touchData, lastStep) => {
  return [
    'end',
    getStepSize(toolProps, touchData),
    toolProps.minAlpha,
    getStepRotation(toolProps, touchData, lastStep),
  ]
}

const getStepSize = (toolProps, touchData) => {
  return Math.round(
    toolProps.size + // tool custom selected size
    (toolProps.size * toolProps.sizeForceFactor * touchData.force) + // size increased by force
    (toolProps.size * toolProps.sizeSpeedFactor * touchData.speedFactor) + // size increased by speed
    (toolProps.size * toolProps.sizeAltitudeFactor * touchData.altitudeFactor) // size increased by stylus altitudeAngle
  )
}

const getStepAlpha = (toolsProps, touchData, currentSize) => {
  let alpha = round(
    toolsProps.alpha + // tool custom selected alpha
    (touchData.force * toolsProps.alphaForceFactor) + // alpha increased by force
    (touchData.speedFactor * toolsProps.alphaSpeedFactor) + // alpha increased by speed
    (touchData.altitudeFactor * toolsProps.alphaAltitudeFactor) // alpha increased by stylus altitudeAngle
    , 3
  ) / (toolsProps.degradeAlphaBySize ? (currentSize / toolsProps.size) : 1)
  alpha = getNumberInBetween(toolsProps.minAlpha, alpha, toolsProps.maxAlpha)
  return alpha
}

const getStepRotation = (toolsProps, touchData, lastStep) => {
  let rotation = lastStep.rotation

  if (!touchData.isNearRuler) {
    if (touchData.type === TOUCH_TYPE_STYLUS) {
      rotation = 0
      if (toolsProps.handleStylusRotation) {
        if (touchData.canHandleStylusRotation) {
          rotation = touchData.azimuthAngle
        } else {
          rotation = lastStep.rotation
        }
      }
      if (toolsProps.handlePathRotation) {
        rotation += touchData.pathRotation
      }
    } else if (toolsProps.handlePathRotation) {
      rotation = -touchData.pathRotation
    }
  }

  let deltaRotation = rotation - lastStep.rotation
  if (Math.abs(deltaRotation) > 1) {
    deltaRotation += ((Math.PI * 2) * (deltaRotation > 0 ? -1 : 1))
    rotation = lastStep.rotation + deltaRotation
  }

  return round(rotation, 4)
}

export const shouldThisStepMoveAdaptLine = (state) => {
  let result = false
  const now = Date.now()
  state.pxDistanceSinceLastLineAdaptation += state.currentTouch.stepLength
  state.stepsSinceLastLineAdaptation++

  if (
    state.pxDistanceSinceLastLineAdaptation >= round(state.currentToolProps.pxToAdaptLine / state.canvas.scale, 1) && // need to adapt this step because of px distance since last adaptation
    (state.stepsSinceLastLineAdaptation >= state.currentToolProps.stepsToAdaptLine || // need to adapt this step because of the number of steps since last adaptation
    now - state.lastLineAdaptationTimestamp >= state.currentToolProps.msToAdaptLine) // need to adapt this step because of the time passed since last adaptation
  ) {
    result = true
    state.pxDistanceSinceLastLineAdaptation = 0
    state.stepsSinceLastLineAdaptation = 0
    state.lastLineAdaptationTimestamp = now
  }

  return result
}

export const updateEditorZoomGlobalState = (currentScale) => {
  document.documentElement.style.setProperty('--one-cm-size-by-scale', `${parseFloat(spacing.ONE_CM_SIZE) * currentScale}cm`) // set ruler background size css
  removeGlobalStatus('drawith__EDITOR-NO-ZOOM')
  removeGlobalStatus('drawith__EDITOR-ZOOM-IN')
  removeGlobalStatus('drawith__EDITOR-ZOOM-OUT')
  if (currentScale === 1) {
    addGlobalStatus('drawith__EDITOR-NO-ZOOM')
  } else if (currentScale > 1) {
    addGlobalStatus('drawith__EDITOR-ZOOM-IN')
  } else {
    addGlobalStatus('drawith__EDITOR-ZOOM-OUT')
  }
}

export const initCanvasOffset = (state) => {
  state.canvas = state.canvas || {}
  if (Params.isPhone) {
    state.canvas.offset = {
      left: spacing.EDITOR_PAGE_MARGIN,
      top: spacing.EDITOR_PAGE_MARGIN + spacing.HEADER_HEIGHT,
      right: spacing.EDITOR_PAGE_MARGIN + parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-right')),
      bottom: spacing.APP_MARGIN_BOTTOM,
    }
  } else {
    state.canvas.offset = {
      left: spacing.EDITOR_PAGE_MARGIN + spacing.EDITOR_TOOLS_WIDTH,
      top: spacing.EDITOR_PAGE_MARGIN + spacing.HEADER_HEIGHT,
      right: spacing.EDITOR_PAGE_MARGIN + spacing.EDITOR_TOOLS_WIDTH + parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-right')),
      bottom: spacing.EDITOR_PAGE_MARGIN + spacing.COLORPICKER_HEIGHT + spacing.APP_MARGIN_BOTTOM,
    }
  }
}

export const initState = (initialState) => {
  const state = JSON.parse(JSON.stringify(initialState))
  initCanvasOffset(state)
  return state
}

export const findValueWithMagnetism = (value, magnetimsValues = [], tollerance = Params.isTablet ? 15 : 10) => {
  for (let i = 0; i < magnetimsValues.length; i++) {
    if (Math.abs(value - magnetimsValues[i][0]) <= tollerance) {
      return [magnetimsValues[i][0], magnetimsValues[i][1], true]
    }
  }

  return [value, false, false]
}

export const applyRationResizeMagnetism = (resizeState, magnetismCoords, left, top, right, bottom) => {
  const ratio = resizeState.w / resizeState.h
  const draggedSides = {}
  let lineXCoord = 0, lineYCoord = 0

  if (left) {
    const dragValue = resizeState.x - resizeState.w / 2
    const [newValue, magnetismLineCoord, magnetised] = findValueWithMagnetism(dragValue, magnetismCoords.l)
    if (magnetised) {
      draggedSides.left = {
        dragValue,
        newValue,
        magnetismLineCoord,
        diff: newValue - dragValue,
      }
    }
  } else if (right) {
    const dragValue = resizeState.x + resizeState.w / 2
    const [newValue, magnetismLineCoord, magnetised] = findValueWithMagnetism(dragValue, magnetismCoords.r)
    if (magnetised) {
      draggedSides.right = {
        dragValue,
        newValue,
        magnetismLineCoord,
        diff: newValue - dragValue,
      }
    }
  }
  if (top) {
    const dragValue = resizeState.y - resizeState.h / 2
    const [newValue, magnetismLineCoord, magnetised] = findValueWithMagnetism(dragValue, magnetismCoords.t)
    if (magnetised) {
      draggedSides.top = {
        dragValue,
        newValue,
        magnetismLineCoord,
        diff: newValue - dragValue,
      }
    }
  } else if (bottom) {
    const dragValue = resizeState.y + resizeState.h / 2
    const [newValue, magnetismLineCoord, magnetised] = findValueWithMagnetism(dragValue, magnetismCoords.b)
    if (magnetised) {
      draggedSides.bottom = {
        dragValue,
        newValue,
        magnetismLineCoord,
        diff: newValue - dragValue,
      }
    }
  }

  if (Object.keys(draggedSides).length) {
    const maxDiff = Math.max(...Object.values(draggedSides).map(side => side.diff))
    const maxMagnetisedSide = Object.keys(draggedSides).find(key => draggedSides[key].diff === maxDiff)
    if (maxMagnetisedSide === 'left') {
      resizeState.x = round(resizeState.x + (draggedSides.left.diff / 2), 1)
      resizeState.w = round((resizeState.x - draggedSides.left.newValue) * 2, 1)
      lineXCoord = round(draggedSides.left.magnetismLineCoord, 0)
      if (top || bottom) {
        const newHeight = round(resizeState.w / ratio, 1)
        const heightDiff = newHeight - resizeState.h
        resizeState.h = newHeight
        if (top) {
          resizeState.y = round(resizeState.y - heightDiff / 2, 1)
        } else {
          resizeState.y = round(resizeState.y + heightDiff / 2, 1)
        }
      }
    } else if (maxMagnetisedSide === 'right') {
      resizeState.x = round(resizeState.x + (draggedSides.right.diff / 2), 1)
      resizeState.w = round((draggedSides.right.newValue - resizeState.x) * 2, 1)
      lineXCoord = round(draggedSides.right.magnetismLineCoord, 0)
      if (top || bottom) {
        const newHeight = round(resizeState.w / ratio, 1)
        const heightDiff = newHeight - resizeState.h
        resizeState.h = newHeight
        if (top) {
          resizeState.y = round(resizeState.y - heightDiff / 2, 1)
        } else {
          resizeState.y = round(resizeState.y + heightDiff / 2, 1)
        }
      }
    } else if (maxMagnetisedSide === 'top') {
      resizeState.y = round(resizeState.y + (draggedSides.top.diff / 2), 1)
      resizeState.h = round((resizeState.y - draggedSides.top.newValue) * 2, 1)
      lineYCoord = round(draggedSides.top.magnetismLineCoord, 0)
      if (left || right) {
        const newWidth = round(resizeState.h * ratio, 1)
        const widthDiff = newWidth - resizeState.w
        resizeState.w = newWidth
        if (left) {
          resizeState.x = round(resizeState.x - widthDiff / 2, 1)
        } else {
          resizeState.x = round(resizeState.x + widthDiff / 2, 1)
        }
      }
    } else if (maxMagnetisedSide === 'bottom') {
      resizeState.y = round(resizeState.y + (draggedSides.bottom.diff / 2), 1)
      resizeState.h = round((draggedSides.bottom.newValue - resizeState.y) * 2, 1)
      lineYCoord = round(draggedSides.bottom.magnetismLineCoord, 0)
      if (left || right) {
        const newWidth = round(resizeState.h * ratio, 1)
        const widthDiff = newWidth - resizeState.w
        resizeState.w = newWidth
        if (left) {
          resizeState.x = round(resizeState.x - widthDiff / 2, 1)
        } else {
          resizeState.x = round(resizeState.x + widthDiff / 2, 1)
        }
      }
    }
  }

  return [resizeState, lineXCoord, lineYCoord]
}
