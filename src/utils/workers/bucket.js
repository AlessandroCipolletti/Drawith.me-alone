let bucketDataLength, pixelsQueue, leftIndex, rightIndex, marginRight, marginLeft
const MATH = Math

const pixelCompare = (i, targetColor, bucketData, bucketDataLength, tolerance) => {
  if (i < 0 || i >= bucketDataLength) {return false} //out of bounds
  return (
    (targetColor.a > 0 || MATH.abs(targetColor.a - bucketData[i + 3]) <= tolerance) &&
    MATH.abs(targetColor.r - bucketData[i]) <= tolerance &&
    MATH.abs(targetColor.g - bucketData[i + 1]) <= tolerance &&
    MATH.abs(targetColor.b - bucketData[i + 2]) <= tolerance
  )
}

const pixelCompareAndSet = (i, targetColor, fillColor, bucketData, bucketDataLength, tolerance, boundariesWeekMode) => {
  const res = pixelCompare(i, targetColor, bucketData, bucketDataLength, tolerance)
  if (res || boundariesWeekMode) {
    //fill the color
    bucketData[i + 0] = fillColor.r
    bucketData[i + 1] = fillColor.g
    bucketData[i + 2] = fillColor.b
    bucketData[i + 3] = fillColor.a || bucketData[i + 3]
  }
  return res
}

self.addEventListener('message', (event) => {
  let { id, bucketData, i,  fillColor, linePxWidth, targetColor, boundariesWeekMode, tolerance } = event.data

  bucketDataLength = bucketData.length
  pixelsQueue = []

  pixelsQueue.push(i)
  while (pixelsQueue.length) {
    i = pixelsQueue.pop()
    if (pixelCompareAndSet(i, targetColor, fillColor, bucketData, bucketDataLength, tolerance, boundariesWeekMode)) {
      leftIndex = rightIndex = i
      marginLeft = parseInt(i / linePxWidth) * linePxWidth  //left bound
      marginRight = marginLeft + linePxWidth  //right bound
      // go left until edge hit
      while (marginLeft < rightIndex && marginLeft < (rightIndex -= 4) && pixelCompareAndSet(rightIndex, targetColor, fillColor, bucketData, bucketDataLength, tolerance, boundariesWeekMode)) { } // eslint-disable-line 
      // go right until edge hit
      while (marginRight > leftIndex && marginRight > (leftIndex += 4) && pixelCompareAndSet(leftIndex, targetColor, fillColor, bucketData, bucketDataLength, tolerance, boundariesWeekMode)) { }  // eslint-disable-line
      for (let j = rightIndex; j < leftIndex; j += 4) {
        if (j - linePxWidth >= 0               && (pixelCompare(j - linePxWidth, targetColor, bucketData, bucketDataLength, tolerance) || boundariesWeekMode)) {pixelsQueue.push(j - linePxWidth)} //queue y-1
        if (j + linePxWidth < bucketDataLength && (pixelCompare(j + linePxWidth, targetColor, bucketData, bucketDataLength, tolerance) || boundariesWeekMode)) {pixelsQueue.push(j + linePxWidth)} //queue y+1
      }
    }
  }

  pixelsQueue = undefined
  self.postMessage({ id, bucketData })
})
