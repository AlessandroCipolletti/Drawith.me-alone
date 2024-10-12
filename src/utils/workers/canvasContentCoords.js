
self.addEventListener('message', event => {
  const { id, data, width, height, pxPrecision, alphaTollerance } = event.data

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let x = 0; x < width; x += pxPrecision) {
    for (let y = 0; y < height; y += pxPrecision) {
      if (data[(((y * width) + x) * 4) + 3] > alphaTollerance) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x + 1)
        maxY = Math.max(maxY, y + 1)
      }
    }
  }

  // maxX++
  // maxY++

  self.postMessage({ id, minX, minY, maxX, maxY })
})
