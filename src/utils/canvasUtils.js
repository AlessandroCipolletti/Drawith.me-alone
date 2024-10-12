import { v4 as uuidv4 } from 'uuid'
import { getRandomNumber, round, quadraticBezierValue, distanceBetweenTwoPointsGreaterThan, getPerc } from './mathUtils'
import { colorStringToRgb, compareRgbColorsWithinTollerance } from './colorsUtils'
import { deepCopy, waitWorkerMessage } from './jsUtils'

import {
  TOOL_FRAME_CIRCLE,
  TOOL_FRAME_PARTICLES_RECT,
  TOOL_FRAME_PARTICLES_CIRCLE,
  TOOL_FRAME_SPRAY_CIRCLE,
  TOOL_FRAME_IMAGE,
} from 'pages/Editor/constants'
const MATH = Math
const PI = MATH.PI

const config = {
  bucketColorsHistorySize: 150,
  bucketColorsToleranceWithTransparency: 24,
  bucketColorsToleranceWithoutTransparency: 4,
}
let state
const initialState = {
  bucketColorsHistory: [],
}

// for particles shape tools
const particlesLists = {}
// for bucket


const initParticlesListFor = (size) => {
  particlesLists[size] = {
    numbers: [],
    length: 0,
  }
  for (let i = 1; i <= size; i++) {
    for (let j = 0, l = size + (10 * i) ; j < l; j++) {
      particlesLists[size].numbers.push(i)
    }
  }
  particlesLists[size].length = particlesLists[size].numbers.length
}

/*
const drawRoundRect = (destinationContext, x, y, alpha, size, rotation, color, radius = { tr: 5, br: 5, bl: 5, tl: 5 }) => {
  const width = size
  const height = size
  let right = x + (width / 2)
  let bottom = y + (height / 2)
  let left = x - (width / 2)
  let top = y - (height / 2)
  destinationContext.beginPath()

  if (rotation) {
    destinationContext.translate(x, y)
    destinationContext.rotate(rotation)
    left -= x
    right -= x
    top -= y
    bottom -= y
  }

  destinationContext.globalAlpha = alpha
  destinationContext.fillStyle = color
  destinationContext.moveTo(left + radius.tl, top)
  destinationContext.lineTo(right - radius.tr, top)
  destinationContext.quadraticCurveTo(right, top, right, top + radius.tr)
  destinationContext.lineTo(right, top + height - radius.br)
  destinationContext.quadraticCurveTo(right, bottom, right - radius.br, bottom)
  destinationContext.lineTo(left + radius.bl, bottom)
  destinationContext.quadraticCurveTo(left, bottom, left, bottom - radius.bl)
  destinationContext.lineTo(left, top + radius.tl)
  destinationContext.quadraticCurveTo(left, top, left + radius.tl, top)
  destinationContext.fill()

  if (rotation) {
    destinationContext.rotate(-rotation)
    destinationContext.translate(-x, -y)
  }
  destinationContext.closePath()
}
*/

const drawCircle = (destinationContext, x, y, alpha, size, rotation, color, blur = 0) => {
  destinationContext.beginPath()
  destinationContext.fillStyle = color
  destinationContext.globalAlpha = alpha
  destinationContext.lineJoin = 'round'
  destinationContext.lineCap = 'round'
  destinationContext.lastDrawCoordX = x
  destinationContext.lastDrawCoordY = y

  if (blur) {
    destinationContext.shadowColor = color
    destinationContext.shadowBlur = blur
  } else {
    destinationContext.shadowColor = ''
    destinationContext.shadowBlur = 0
  }

  destinationContext.arc(x, y, size / 2, 0, 2 * PI, true)
  destinationContext.fill()
}

const drawParticlesSprayCircle = (destinationContext, x, y, alpha, size, rotation, color) => {
  destinationContext.lastDrawCoordX = x
  destinationContext.lastDrawCoordY = y
  size = round(size)
  destinationContext.fillStyle = color
  if (!particlesLists[size]) {
    initParticlesListFor(size)
  }
  const sizeList = particlesLists[size].numbers
  const sizeListL = particlesLists[size].length
  let angle = 0, radius = 0, variability = 2

  for (let i = 0, l = size * 4; i < l; i++) {
    angle = getRandomNumber(2 * PI, true)
    radius = sizeList[getRandomNumber(sizeListL)] + 2
    destinationContext.globalAlpha = Math.max(alpha * (1 - radius / size), 0)
    destinationContext.fillRect(
      round(x + radius * MATH.cos(angle), 1),
      round(y + radius * MATH.sin(angle), 1),
      getRandomNumber(variability) + 1,
      getRandomNumber(variability) + 1
    )
  }
}

const drawParticlesCircle = (destinationContext, x, y, alpha, size, rotation, color) => {
  destinationContext.lastDrawCoordX = x
  destinationContext.lastDrawCoordY = y
  size = round(size)
  destinationContext.globalAlpha = alpha
  destinationContext.fillStyle = color
  let angle = 0, radius = 0, width = 0
  for (let i = 0, l = size * size; i < l; i++) {
    angle = getRandomNumber(2 * PI, true)
    radius = getRandomNumber(size) + 1
    width = getRandomNumber(2) + 1
    destinationContext.fillRect(
      round(x + radius * MATH.cos(angle), 1),
      round(y + radius * MATH.sin(angle), 1),
      width,
      (width === 2 ? 1 : getRandomNumber(2) + 1)
    )
  }
}

const drawParticlesRect = (destinationContext, x, y, alpha, size, rotation, color) => {
  destinationContext.lastDrawCoordX = x
  destinationContext.lastDrawCoordY = y
  size = round(size)
  destinationContext.globalAlpha = alpha
  destinationContext.fillStyle = color
  const s2 = size / 2
  for (let i = 0, l = size * (size + 1); i < l; i++) {
    destinationContext.fillRect(
      round(x + getRandomNumber(size) - s2, 1),
      round(y + getRandomNumber(size) - s2, 1),
      1,
      1
    )
  }
}

export const drawCurvedFunctionLine = (destinationContext, stepData, tool) => {
  const deltaAlpha = stepData.alpha - stepData.oldAlpha
  const deltaSize = stepData.size - stepData.oldSize
  const deltaRotation = stepData.rotation - stepData.oldRotation

  let i = 0
  let drewSomething = false
  while (i <= stepData.stepLength) {
    const t = getPerc(i, stepData.stepLength) / 100
    const frameX = round(quadraticBezierValue(t, stepData.oldMidX, stepData.oldX, stepData.midX), 1)
    const frameY = round(quadraticBezierValue(t, stepData.oldMidY, stepData.oldY, stepData.midY), 1)
    const frameSize = round(stepData.oldSize + deltaSize * t, 1)
    const pxDistanceBetweenFrames = round(Math.max(tool.minPxDistanceBetweenFrames, frameSize * tool.sizeToFramesRatio), 1)
    if (distanceBetweenTwoPointsGreaterThan(destinationContext.lastDrawCoordX, destinationContext.lastDrawCoordY, frameX, frameY, pxDistanceBetweenFrames)) {
      // const frameAlpha = round(stepData.oldAlpha + deltaAlpha * t, 4)
      // const frameRotation = stepData.oldRotation + deltaRotation * t
      // toolShapesDrawFns[tool.frameType](destinationContext, frameX, frameY, frameAlpha, frameSize, frameRotation, tool.color)
      toolShapesDrawFns[tool.frameType](destinationContext, frameX, frameY, round(stepData.oldAlpha + deltaAlpha * t, 4), frameSize, (stepData.oldRotation + deltaRotation * t), tool.color)
      destinationContext.lastDrawCoordX = frameX
      destinationContext.lastDrawCoordY = frameY
      drewSomething = true
    }
    i += 0.5
  }

  return drewSomething
}

export const fillCanvasWithImage = (destinationContext, image, x = 0, y = 0, w, h, rotation) => {
  destinationContext.clearRect(0, 0, destinationContext.canvas.width, destinationContext.canvas.height)
  destinationContext.globalAlpha = 1
  destinationContext.globalCompositeOperation = 'source-over'

  if (rotation) {
    destinationContext.translate(x + w / 2, y + h / 2)
    destinationContext.rotate(rotation)
    destinationContext.drawImage(image, -w/2, -h/2, w, h)
    destinationContext.rotate(-rotation)
    destinationContext.translate(-x - w / 2, -y - h / 2)
  } else {
    if (w && h) {
      destinationContext.drawImage(image, x, y, w, h)
    } else {
      destinationContext.drawImage(image, x, y)
    }
  }
}

export const fillCanvasBackground = (destinationContext, tileImg) => {
  const pattern = destinationContext.createPattern(tileImg, 'repeat')
  destinationContext.clearRect(0, 0, destinationContext.canvas.width, destinationContext.canvas.height)
  destinationContext.globalAlpha = 1
  destinationContext.globalCompositeOperation = 'source-over'
  destinationContext.fillStyle = pattern
  destinationContext.fillRect(0, 0, destinationContext.canvas.width, destinationContext.canvas.height)
}

export const drawCanvasImageContain = (destinationContext, image, alpha = 1) => {
  destinationContext.clearRect(0, 0, destinationContext.canvas.width, destinationContext.canvas.height)
  destinationContext.globalAlpha = alpha
  destinationContext.globalCompositeOperation = 'source-over'
  const ratio = Math.min(destinationContext.canvas.width / image.width, destinationContext.canvas.height / image.height)
  destinationContext.drawImage(image, 0, 0, image.width * ratio, image.height * ratio)
}

const drawCanvasImage = (destinationContext, x, y, alpha, size, rotation) => {
  const image = destinationContext.toolImageShape.canvas
  destinationContext.lastDrawCoordX = x
  destinationContext.lastDrawCoordY = y
  destinationContext.globalAlpha = alpha
  if (rotation) {
    destinationContext.translate(x, y)
    destinationContext.rotate(rotation)
    destinationContext.drawImage(image, -size / 2, -size / 2, size, size)
    destinationContext.rotate(-rotation)
    destinationContext.translate(-x, -y)
  } else {
    destinationContext.drawImage(image, MATH.round(x - size / 2), MATH.round(y - size / 2), size, size)
  }
}

export const setImageShapeIfNeeded = (destinationContext, image, imageName, color) => {
  if (
    destinationContext.toolImageShape.frameImageName !== imageName ||
    destinationContext.toolImageShape.color !== color
  ) {
    destinationContext.toolImageShape.frameImageName = imageName
    destinationContext.toolImageShape.color = color
    destinationContext.toolImageShape.canvas.width = image.width
    destinationContext.toolImageShape.canvas.height = image.height
    destinationContext.toolImageShape.context.fillStyle = color
    destinationContext.toolImageShape.context.globalCompositeOperation = 'source-over'
    destinationContext.toolImageShape.context.fillRect(0, 0, image.width, image.height)
    destinationContext.toolImageShape.context.globalCompositeOperation = 'destination-in'
    destinationContext.toolImageShape.context.drawImage(image, 0, 0, image.width, image.height)
  }
}

const multipleStepsFns = {
  start: (context, stepData, tool) => {
    context.globalCompositeOperation = tool.globalCompositeOperation
    tool.frameType && toolShapesDrawFns[tool.frameType](context, stepData.x, stepData.y, stepData.alpha, stepData.size, stepData.rotation, tool.color)
  },
  move: (context, stepData, tool) => {
    context.globalCompositeOperation = tool.globalCompositeOperation
    tool.frameType && drawCurvedFunctionLine(context, stepData, tool)
  },
  end: (context, stepData, tool) => {
    context.globalCompositeOperation = tool.globalCompositeOperation
    tool.frameType && drawCurvedFunctionLine(context, stepData, tool)
  },
}
export const drawMultipleSteps = (destinationContext, steps, tool) => {
  if (tool.frameImageName) {
    setImageShapeIfNeeded(destinationContext, tool.frameImageFile, tool.frameImageName, tool.color)
  }

  destinationContext.clearRect(0, 0, destinationContext.canvas.width, destinationContext.canvas.height)
  destinationContext.globalAlpha = 1
  destinationContext.globalCompositeOperation = 'source-over'

  // if tool = eraser, must start with something to delete
  if (tool.globalCompositeOperation !== 'source-over') {
    destinationContext.fillStyle = tool.color || 'black'
    destinationContext.fillRect(0, 0, destinationContext.canvas.width, destinationContext.canvas.height)
  }

  steps.forEach(step => multipleStepsFns[step.type](destinationContext, step, tool))
}

// qui la faccenda si fa un po' complicata...
// FillWithBucket si divide in due praticamente.
// Se non deve fare nessun riempimento di colore, ritorna false in modo sincrono.
// Atrimenti ritorna una promise che riempira il foglio in modo asincrono.
// Questo permette a "useBucket" di sapere subito se il bucket è andato a buon fine o no,
// e può allo stesso tempo attaccare qualcosa col .then() senza dover aspettare con un await.
const bucketWorker = new Worker(
  new URL('./workers/bucket.js', import.meta.url),
  { type: 'module' }
)
export const fillWithBucket = (destinationContext, x, y, fillColor, canvasWidth, canvasHeight) => {
  let image = destinationContext.getImageData(0, 0, canvasWidth, canvasHeight)

  const i = (MATH.floor(x) + MATH.floor(y) * canvasWidth) * 4
  const linePxWidth = canvasWidth * 4

  const targetColor = {
    r: image.data[i + 0],
    g: image.data[i + 1],
    b: image.data[i + 2],
    a: image.data[i + 3],
  }
  const tolerance = targetColor.a < 255 && targetColor.r + targetColor.g + targetColor.b > 0 ? config.bucketColorsToleranceWithTransparency : config.bucketColorsToleranceWithoutTransparency
  fillColor = colorStringToRgb(fillColor)
  fillColor.a = round(fillColor.a * 255, 0)

  // se target e fill sono uguali, non faccio niente
  if (image.data[i + 3] > 0 && compareRgbColorsWithinTollerance(targetColor, fillColor, tolerance)) {
    image = undefined
    return false
  }

  // se target color ha trasparenza, riempio con la stessa trasparenza
  fillColor.a = targetColor.a === 0 ? 255 : 0
  const boundariesWeekMode = getBucketBoundariesWeakMode(targetColor, fillColor)

  const id = uuidv4()
  bucketWorker.postMessage({ id, bucketData: image.data, i, linePxWidth, targetColor, fillColor, boundariesWeekMode, tolerance })
  return waitWorkerMessage(bucketWorker, id).then(({ bucketData }) => {
    destinationContext.putImageData(new ImageData(bucketData, image.width, image.height), 0, 0)
    image = undefined
  })
}

const bucketColorsHistoryContains = (color, history) => {
  return !!history.find(c => !(Math.abs(c.r - color.r) > 1 || Math.abs(c.g - color.g) > 1 || Math.abs(c.b - color.b) > 1))
}

const getBucketBoundariesWeakMode = (targetColor, fillColor) => {
  if (targetColor.a === 0) {
    // if (!bucketColorsHistoryContains(fill, state.bucketColorsHistory)) {
    //   state.bucketColorsHistory.push(fill)
    //   state.bucketColorsHistory.splice(0, state.bucketColorsHistory.length - config.bucketColorsHistorySize)
    // }
    return true
  }
  let target = { ...targetColor }
  let fill = { ...fillColor }
  delete target.a
  delete fill.a
  const boundariesWeekMode = (!bucketColorsHistoryContains(target, state.bucketColorsHistory))
  if (!bucketColorsHistoryContains(fill, state.bucketColorsHistory)) {
    state.bucketColorsHistory.push(fill)
    state.bucketColorsHistory.splice(0, state.bucketColorsHistory.length - config.bucketColorsHistorySize)
  }
  return boundariesWeekMode
}

export const getCanvasColorAtPx = (destinationContext, x, y, canvasWidth, canvasHeight) => {
  const canvasData = destinationContext.getImageData(0, 0, canvasWidth, canvasHeight)
  const pxIndex = (MATH.floor(x) + MATH.floor(y) * canvasWidth) * 4
  const targetColor = {
    r: canvasData.data[pxIndex + 0],
    g: canvasData.data[pxIndex + 1],
    b: canvasData.data[pxIndex + 2],
    a: canvasData.data[pxIndex + 3],
  }
  return targetColor
}

export const cleanBucketHistory = () => {
  state.bucketColorsHistory = []
}

export const fillCompletely = (destinationContext, color, canvasWidth, canvasHeight) => {
  destinationContext.fillStyle = color
  destinationContext.globalAlpha = 1
  destinationContext.globalCompositeOperation = 'source-over'
  destinationContext.fillRect(0, 0, canvasWidth, canvasHeight)
}

export const canvasIsColoredEvenly = (destinationContext, canvasWidth, canvasHeight) => {
  let data = destinationContext.getImageData(0, 0, canvasWidth, canvasHeight).data
  let ok = true
  let i = data.length
  const r = data[0], g = data[1], b = data[2], a = data[3]

  while (i--) {
    if (!(data[i] === a && data[--i] === b && data[--i] === g && data[--i] === r)) {
      ok = false
      break
    }
  }

  // ok = data.every((e, i, arr) => e === arr[i % 4])
  data = undefined
  return ok
}

export const getNewContextForCanvas = (canvas) => {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.lastDrawCoordX = -1
  context.lastDrawCoordY = -1
  const shapeImageCanvas = new OffscreenCanvas(300, 300)
  const shapeImageContext = shapeImageCanvas.getContext('2d', { willReadFrequently: true })
  context.toolImageShape = {
    frameImageName: '',
    color: '',
    canvas: shapeImageCanvas,
    context: shapeImageContext,
  }
  return context
}

export const init = () => {
  state = deepCopy(initialState)
}

export const remove = () => {
  state = {}
}

export const toolShapesDrawFns = {
  [TOOL_FRAME_CIRCLE]: drawCircle,
  [TOOL_FRAME_PARTICLES_RECT]: drawParticlesRect,
  [TOOL_FRAME_PARTICLES_CIRCLE]: drawParticlesCircle,
  [TOOL_FRAME_SPRAY_CIRCLE]: drawParticlesSprayCircle,
  [TOOL_FRAME_IMAGE]: drawCanvasImage,
}
