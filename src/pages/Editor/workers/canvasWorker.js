import { toolShapesDrawFns, drawCurvedFunctionLine, getNewContextForCanvas } from 'utils/canvasUtils'
import { cropImageWithMargin, findImageContentCoords } from 'utils/imageUtils'


const canvas = new OffscreenCanvas(300, 300)
const context = getNewContextForCanvas(canvas)
canvas.context = context

const coordsAreInsideLayer = (x, y, w, h) => (x > 0 && y > 0 && x <= w && y <= h)


self.addEventListener('message', async (event) => {
  const { type, stepData, tool, width, height, workerActionId } = event.data
  let hasDrewSomething = false

  canvas.width = width
  canvas.height = height

  // 1 - draw the step
  if (type === 'start') {
    toolShapesDrawFns[tool.frameType](context, stepData.x, stepData.y, stepData.alpha, stepData.size, stepData.rotation, tool.color)
    hasDrewSomething = true
  } else if (type === 'move' || type === 'end') {
    hasDrewSomething = drawCurvedFunctionLine(context, stepData, tool)
  }

  // 2 - export the smallest possible bitmap
  const { minX, maxX, minY, maxY } = await findImageContentCoords(canvas)
  let [bitmap, x, y, w, h] = cropImageWithMargin(canvas, minX, minY, maxX, maxY, 0)
  bitmap = await createImageBitmap(bitmap)

  hasDrewSomething = hasDrewSomething && (
    coordsAreInsideLayer(stepData.x - tool.size / 2, stepData.y - tool.size / 2, width, height) ||
    coordsAreInsideLayer(stepData.x - tool.size / 2, stepData.y + tool.size / 2, width, height) ||
    coordsAreInsideLayer(stepData.x + tool.size / 2, stepData.y + tool.size / 2, width, height) ||
    coordsAreInsideLayer(stepData.x + tool.size / 2, stepData.y - tool.size / 2, width, height)
  )

  self.postMessage({ workerActionId, bitmap, x, y, hasDrewSomething }, [bitmap])
})
