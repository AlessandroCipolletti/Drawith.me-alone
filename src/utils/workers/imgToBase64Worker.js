

const imgToCanvas = (img) => {
  const canvas = new OffscreenCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height)
  canvas.getContext('2d').drawImage(img, 0, 0)
  return canvas
}

const getCanvasBlobAsync = (canvas) => {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob()
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(resolve)
  })
}

const blobToBase64Async = (blob) => {
  return new Promise((resolve) => {
    let reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result)
      reader = reader.onload = undefined
    }
    reader.readAsDataURL(blob)
  })
}


self.addEventListener('message', async (event) => {
  const { id, bitmap } = event.data

  const canvas = imgToCanvas(bitmap, false)

  const imgBlob = await getCanvasBlobAsync(canvas)

  const base64 = await blobToBase64Async(imgBlob)

  self.postMessage({ id, base64 })
})
