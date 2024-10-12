
/*
export const drawCircleLine = (destinationContext, size, color, alpha, fromX, fromY, toX, toY) => {
  destinationContext.beginPath()
  destinationContext.lineWidth = size
  destinationContext.strokeStyle = color
  destinationContext.lineJoin = 'round'
  destinationContext.lineCap = 'round'
  destinationContext.globalAlpha = alpha
  destinationContext.moveTo(fromX, fromY)
  destinationContext.lineTo(toX, toY)
  destinationContext.stroke()
}

export const drawSquare = (destinationContext, x, y, alpha, size, rotation, color) => {
  const halfSize = size / 2
  destinationContext.globalAlpha = alpha
  destinationContext.fillStyle = color
  if (rotation % 90) {
    destinationContext.translate(x, y)
    destinationContext.rotate(rotation)
    destinationContext.fillRect(-halfSize, -halfSize, size, size)
    destinationContext.rotate(-rotation)
    destinationContext.translate(-x, -y)
  } else {
    destinationContext.fillRect(x - halfSize, y - halfSize, size, size)
  }
}

export const drawBlurredCircle = (destinationContext, x, y, alpha, size, color, rotation) => {
  // too slow to be used
  const gradient = destinationContext.createRadialGradient(x, y, 0, x, y, size)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'transparent')
  destinationContext.globalAlpha = alpha
  destinationContext.arc(x, y, size, 0, 2 * MATH.PI)
  destinationContext.fillStyle = gradient
  destinationContext.fill()
}

export const drawCurvedCircleLine = (destinationContext, size, color, alpha, fromX, fromY, midX, midY, toX, toY) => {
  destinationContext.beginPath()
  destinationContext.lineWidth = size
  destinationContext.strokeStyle = color
  destinationContext.lineJoin = 'round'
  destinationContext.lineCap = 'round'
  destinationContext.globalAlpha = alpha
  destinationContext.moveTo(fromX, fromY)
  destinationContext.quadraticCurveTo(midX, midY, toX, toY)
  destinationContext.stroke()
}
/*

/*
export const drawCurvedImageLineOLD = (() => {
  let lastX = -1, lastY = -1
  return (destinationContext, alpha, oldAlpha, size, oldSize, fromX, fromY, midX, midY, toX, toY, curveLength, image, rotation) => {
    const frames = round(curveLength / 2, 2)
    const frameLength = (curveLength / frames) || size
    const deltaT = round(1 / frames, 3)
    alpha = alpha - oldAlpha
    size = size - oldSize
    stepContext.clearRect(0, 0, stepCanvas.width, stepCanvas.height)
    for (let t = 0; t <= 1; t = t + deltaT) {
      const x = round(quadraticBezierValue(t, fromX, midX, toX), 1)
      const y = round(quadraticBezierValue(t, fromY, midY, toY), 1)
      const newPointDistance = getDistanceBetweenTwoPoints(lastX, lastY, x, y, 4)
      if (frames > 1 && newPointDistance < 0.8 * frameLength) {
        continue
      }
      if (t > 0 && newPointDistance > 1.6 * frameLength) {
        const [nx, ny] = getMiddlePointCoords(lastX, lastY, x, y, 1)
        drawCanvasImage(stepContext, nx, ny, round(oldAlpha + alpha * t, 4), round(oldSize + size * t, 1), image, rotation)
      }
      lastX = x
      lastY = y
      drawCanvasImage(stepContext, x, y, round(oldAlpha + alpha * t, 4), round(oldSize + size * t, 1), image, rotation)
    }
    destinationContext.globalAlpha = 1
    destinationContext.drawImage(stepCanvas, 0, 0)
  }
})()
export const drawCurvedFunctionLineOLD = (() => {
  let lastX = -1, lastY = -1
  return (destinationContext, framesFrequencyBySize, alwaysDrawAtMove, alpha, oldAlpha, size, oldSize, fromX, fromY, midX, midY, toX, toY, curveLength, drawingFn, color) => {
    const avgSize = (size + oldSize) / 2
    const frames = round(Math.max(curveLength / Math.max(avgSize / framesFrequencyBySize, 1), 0.1), 2)
    const frameLength = (curveLength / frames) || avgSize
    const deltaT = round(1 / frames, 6)
    alpha = alpha - oldAlpha
    size = size - oldSize
    stepContext.clearRect(0, 0, stepCanvas.width, stepCanvas.height)
    for (let t = 0; t <= 1; t = t + deltaT) {
      const x = round(quadraticBezierValue(t, fromX, midX, toX), 1)
      const y = round(quadraticBezierValue(t, fromY, midY, toY), 1)
      const newPointDistance = getDistanceBetweenTwoPoints(lastX, lastY, x, y, 4)
      if (frames > 1 && newPointDistance < 0.8 * frameLength) {
        continue
      }
      if (t > 0 && newPointDistance > 1.6 * frameLength) {
        const [nx, ny] = getMiddlePointCoords(lastX, lastY, x, y, 1)
        drawingFn(stepContext, nx, ny, round(oldAlpha + alpha * t, 4), round(oldSize + size * t, 1), color)
      }
      lastX = x
      lastY = y
      drawingFn(stepContext, x, y, round(oldAlpha + alpha * t, 4), round(oldSize + size * t, 1), color)
    }
    destinationContext.globalAlpha = 1
    destinationContext.drawImage(stepCanvas, 0, 0)
  }
})()
export const drawExampleLines1 = (destinationContext, color) => {
  let x1 = 100
  let y1 = 1400
  let x2 = 2000
  let y2 = 100
  let x3 = 2200
  let y3 = 1400
  let oldSize = 50
  let newSize = 100
  let oldAlpha = 0.1
  let newAlpha = 0.9
  let framesXSize = 1.025
  let L = getQuadraticBezierLength(x1, y1, x2, y2, x3, y3)
  destinationContext.globalAlpha = 1

  drawCurvedFunctionLine(stepContext, framesXSize, false, newAlpha, oldAlpha, newSize, oldSize, x1, y1, x2, y2, x3, y3, L, drawCircle, color)
  destinationContext.drawImage(stepCanvas, 0, 0)
  drawCurvedFunctionLineOLD(stepContext, framesXSize, false, newAlpha, oldAlpha, newSize, oldSize, x1, y1 - 400, x2, y2 - 400, x3, y3 - 400, L, drawCircle, color)
  destinationContext.drawImage(stepCanvas, 0, 0)
}
export const drawExampleLines2 = (destinationContext, color) => {
  let framesXSize = 1.025
  let oldSize = 0
  let newSize = 10
  let oldAlpha = 0.2
  let newAlpha = 0.3
  let y1 = 400
  let y3 = 400
  let x1, x2, x3, y2, L

  for (let i = 0; i < 6; i++) {
    x1 = 100 + (i * 400)
    x2 = 300 + (i * 400)
    x3 = 500 + (i * 400)
    y2 = (i % 2 ? -200 : 1000)
    oldSize += 10
    newSize += 10
    oldAlpha += 0.1
    newAlpha += 0.1
    L = getQuadraticBezierLength(x1, y1, x2, y2, x3, y3)
    destinationContext.globalAlpha = 1

    drawCurvedFunctionLineOLD(stepContext, framesXSize, false, newAlpha, oldAlpha, newSize, oldSize, x1, y1, x2, y2, x3, y3, L, drawCircle, color)
    destinationContext.drawImage(stepCanvas, 0, 0)
    drawCurvedFunctionLine(stepContext, framesXSize, false, newAlpha, oldAlpha, newSize, oldSize, x1, y1 + 800, x2, y2 + 800, x3, y3 + 800, L, drawCircle, color)
    destinationContext.drawImage(stepCanvas, 0, 0)
  }
}
export const drawExampleLines3 = (destinationContext, color) => {
  const points = [
    { x: 100,  y: 300,  a: 0.1, s: 10 },
  ]
  destinationContext.globalAlpha = 1
  let framesXSize = 1
  const l = 25
  for (let i = 0; i < l; i++) {
    points.push({
      x: 100 + (i * 100) + getRandomNumber(100),
      y: 50 + getRandomNumber(700),
      a: points[0].a + (i / l) * (0.7 - points[0].a),
      s: points[0].s + getRandomNumber(25),
    })
  }

  let oldMidX = points[0].x
  let oldMidY = points[0].y
  let oldX = points[0].x
  let oldY = points[0].y
  let oldSize = points[0].s
  let oldAlpha = points[0].a
  for (let i = 0; i < points.length; i++) {
    const x = points[i].x
    const y = points[i].y
    const midX = (x + oldX) / 2
    const midY = (y + oldY) / 2

    const L = getQuadraticBezierLength(oldMidX, oldMidY, oldX, oldY, midX, midY) || getDistanceBetweenTwoPoints(oldMidX, oldMidY, midX, midY)
    drawCurvedFunctionLineOLD(stepContext, framesXSize, false, points[i].a, oldAlpha, points[i].s, oldSize, oldMidX, oldMidY, oldX, oldY, midX, midY, L, drawCircle, color)
    destinationContext.drawImage(stepCanvas, 0, 0)
    drawCurvedFunctionLine(stepContext, framesXSize, false, points[i].a, oldAlpha, points[i].s, oldSize, oldMidX, oldMidY + 700, oldX, oldY + 700, midX, midY + 700, L, drawCircle, color)
    destinationContext.drawImage(stepCanvas, 0, 0)

    oldMidX = midX
    oldMidY = midY
    oldX = points[i].x
    oldY = points[i].y
    oldSize = points[i].s
    oldAlpha = points[i].a
  }
}
*/
