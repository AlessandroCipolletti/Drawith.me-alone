import { v4 as uuidv4 } from 'uuid'
import { waitWorkerMessage, postWorkerCommand } from 'utils/jsUtils'
import { round, valuesAreSimilar } from 'utils/mathUtils'

const MAX_THUMBNAIL_SIZE = 400


let tempImage
// const tempCanvas = document.createElement('canvas')
const tempCanvas = new OffscreenCanvas(100, 100)
const tempContext = tempCanvas.getContext('2d')

export const resizeImage = (image, maxSize = MAX_THUMBNAIL_SIZE) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const imgRatio = (image.naturalWidth || image.width) / (image.naturalHeight || image.height)
  if (imgRatio > 1) {
    canvas.width = maxSize
    canvas.height = maxSize / imgRatio
  } else {
    canvas.height = maxSize
    canvas.width = maxSize * imgRatio
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

export const resizeBase64AndGetBase64 = (base64, maxSize = MAX_THUMBNAIL_SIZE) => {
  return new Promise((resolve, reject) => {
    tempImage.onload = () => {
      tempImage.onload = undefined
      resolve(resizeImageAndGetBase64(tempImage, maxSize))
    }
    tempImage.src = base64
  })
}

export const resizeImageAndGetBlob = (image, maxSize = MAX_THUMBNAIL_SIZE) => {
  return new Promise((resolve, reject) => {
    const canvas = resizeImage(image, maxSize)
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob))
    })
  })
}

export const resizeImageAndGetBase64 = (image, maxSize = MAX_THUMBNAIL_SIZE) => {
  const canvas = resizeImage(image, maxSize)
  return canvas.toDataURL('image/png')
}

const coordsWorker = new Worker(
  new URL('./workers/canvasContentCoords.js', import.meta.url),
  { type: 'module' }
)
export const findImageContentCoords = async(dom, pxPrecision = 1, alphaTollerance = 0.01) => {
  alphaTollerance = round(255 * alphaTollerance, 0)
  pxPrecision = round(pxPrecision, 1)

  if (dom.tagName?.toLowerCase() !== 'canvas' && !(dom instanceof OffscreenCanvas)) {
    dom = imgToCanvas(dom, true)
  }

  const width = dom.width
  const height = dom.height
  const data = dom.context.getImageData(0, 0, width, height).data

  const id = uuidv4()
  coordsWorker.postMessage({ id, data, width, height, pxPrecision, alphaTollerance })
  const res = await waitWorkerMessage(coordsWorker, id)
  delete res.id
  return res
}

export const cropImage = (image, x, y, width, height) => {
  const canvas = new OffscreenCanvas(300, 300)
  if (Number.isFinite(width) && Number.isFinite(height)) {
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(image, x, y, width, height, 0, 0, width, height)
  }
  return canvas
}

export const flipImage = (image, horizontally = true) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height

  if (horizontally) {
    context.scale(-1, 1)
    context.drawImage(image, canvas.width * -1, 0, canvas.width, canvas.height)
  } else {
    context.scale(1, -1)
    context.drawImage(image, 0, canvas.height * -1, canvas.width, canvas.height)
  }

  return canvas
}

export const base64ImageToBlobByCanvas = (base64) => {
  return new Promise((resolve, reject) => {
    tempImage.onload = async () => {
      tempCanvas.width = tempImage.naturalWidth
      tempCanvas.height = tempImage.naturalHeight
      tempContext.drawImage(tempImage, 0, 0)
      tempCanvas.toBlob((blob) => {
        tempImage.onload = undefined
        resolve([blob, URL.createObjectURL(blob), tempImage])
      })
    }
    tempImage.src = base64
  })
}

export const getCanvasBlobAsync = (canvas) => {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob()
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(resolve)
  })
}

export const imgToCanvas = (img, prepareContext = false) => {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  canvas.getContext('2d').drawImage(img, 0, 0)
  if (prepareContext) {
    canvas.context = canvas.getContext('2d', { willReadFrequently: true })
  }
  return canvas
}

export const getImgBase64Async = async(dom) => {
  if (!(dom instanceof HTMLCanvasElement) && !(dom instanceof OffscreenCanvas)) {
    dom = imgToCanvas(dom, true)
  }
  return blobToBase64Async(await getCanvasBlobAsync(dom))
}

export const getImgBase64OffThread = async(bitmap) => {
  const worker = new Worker(
    new URL('./workers/imgToBase64Worker.js', import.meta.url),
    { type: 'module' }
  )

  const id = uuidv4()
  worker.postMessage({ id, bitmap })
  const res = await waitWorkerMessage(worker, id)
  delete res.id
  worker.terminate()

  return res.base64
}

export const getCanvasBase64Async = async(canvas) => blobToBase64Async(await getCanvasBlobAsync(canvas))

export const duplicateCanvas = (sourceCanvas, offscreen = false) => {
  let canvas
  if (offscreen) {
    canvas = new OffscreenCanvas(sourceCanvas.width, sourceCanvas.height)
  } else {
    canvas = document.createElement('canvas')
    canvas.width = sourceCanvas.width
    canvas.height = sourceCanvas.height
  }
  const context = canvas.getContext('2d')
  context.drawImage(sourceCanvas, 0, 0)
  return canvas
}

export const mergeImages = (images) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = canvas.height = 0
  for (const [img, opacity = 1] of images) {
    if ((img.naturalWidth || img.width) > 1) {
      if (!canvas.width) {
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
      }
      context.globalAlpha = opacity
      context.drawImage(img, 0, 0)
    }
  }
  context.globalAlpha = 1
  return canvas
}

export const blobToBase64Async = (blob) => {
  return new Promise((resolve) => {
    let reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result)
      reader = reader.onload = undefined
    }
    reader.readAsDataURL(blob)
  })
}

export const getCanvasFromBase64 = async (base64) => {
  const img = await fetchImgOffThread(base64)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  context.drawImage(img, 0, 0)
  return canvas
}

export const fetchImgOffThread = async(url) => {
  const worker = new Worker(
    new URL('./workers/fetchImgWorker.js', import.meta.url),
    { type: 'module' }
  )

  const { blob } = await postWorkerCommand(worker, { url })
  worker.terminate()

  const blobUrl = URL.createObjectURL(blob)
  const img = await getImageFromUrl(blobUrl)
  URL.revokeObjectURL(blobUrl)

  return img
}

export const getImageFromUrl = async(url) => {
  const img = new Image()
  img.crossOrigin = 'Anonymous'
  await setImageSrcSync(img, url)
  return img
}

export const setImageSrcSync = (img, src) => {
  return new Promise((resolve, reject) => {
    img.onload = () => {
      img.onerror = img.onload = undefined
      resolve(true)
    }
    img.onerror = () => {
      img.onerror = img.onload = undefined
      resolve(false)
    }
    img.src = src
  })
}

export const checkImageUrlValidity = async(url) => {
  let res = false
  if (url && typeof url === 'string' && navigator.onLine) {
    try {
      await setImageSrcSync(new Image(), url)
      res = true
    } catch (e) {
      res = false
    }
  }
  return res
}

export const addImageWhiteBgAndGetBase64 = (img) => {
  tempCanvas.width = img.naturalWidth || img.width
  tempCanvas.height = img.naturalHeight || img.height
  tempContext.fillStyle = '#FFFFFF'
  tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
  tempContext.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
  return tempCanvas.toDataURL('image/png')
}

export const cropImageWithMargin = (image, l, t, r, b, margin = 0.1) => {
  const imageWidth = (image.naturalWidth || image.width)
  const imageHeight = (image.naturalHeight || image.height)
  let w = round(r - l, 0)
  let h = round(b - t, 0)
  const x = round(Math.max(l - w * (margin / 2), 0), 0)
  const y = round(Math.max(t - h * (margin / 2), 0), 0)
  w = round(Math.min(w * (1 + margin), imageWidth - x), 0)
  h = round(Math.min(h * (1 + margin), imageHeight - y), 0)
  return [cropImage(image, x, y, w, h), x, y, w, h]
}

export const imageHasUniformBackground = (image, tollerance = 3) => {
  tempCanvas.width = image.naturalWidth || image.width
  tempCanvas.height = image.naturalHeight || image.height
  tempContext.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height)
  const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data

  const pxTL = {
    r: imageData[0],
    g: imageData[1],
    b: imageData[2],
    a: imageData[3],
  }
  const pxTR = {
    r: imageData[((tempCanvas.width - 1) * 4) + 0],
    g: imageData[((tempCanvas.width - 1) * 4) + 1],
    b: imageData[((tempCanvas.width - 1) * 4) + 2],
    a: imageData[((tempCanvas.width - 1) * 4) + 3],
  }
  const pxBL = {
    r: imageData[((tempCanvas.width * (tempCanvas.height - 1)) * 4) + 0],
    g: imageData[((tempCanvas.width * (tempCanvas.height - 1)) * 4) + 1],
    b: imageData[((tempCanvas.width * (tempCanvas.height - 1)) * 4) + 2],
    a: imageData[((tempCanvas.width * (tempCanvas.height - 1)) * 4) + 3],
  }
  const pxBR = {
    r: imageData[imageData.length - 4],
    g: imageData[imageData.length - 3],
    b: imageData[imageData.length - 2],
    a: imageData[imageData.length - 1],
  }

  return (
    valuesAreSimilar([pxTL.r, pxTR.r, pxBL.r, pxBR.r], tollerance) &&
    valuesAreSimilar([pxTL.g, pxTR.g, pxBL.g, pxBR.g], tollerance) &&
    valuesAreSimilar([pxTL.b, pxTR.b, pxBL.b, pxBR.b], tollerance) &&
    valuesAreSimilar([pxTL.a, pxTR.a, pxBL.a, pxBR.a], tollerance)
  )
}

export const imageHasTransparentBackground = (image) => {
  tempCanvas.width = image.naturalWidth || image.width
  tempCanvas.height = image.naturalHeight || image.height
  tempContext.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height)
  const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data

  const pxTLa = imageData[3]
  const pxTRa = imageData[((tempCanvas.width - 1) * 4) + 3]
  const pxBLa = imageData[((tempCanvas.width * (tempCanvas.height - 1)) * 4) + 3]
  const pxBRa = imageData[imageData.length - 1]

  return pxTLa === 0 && pxTRa === 0 && pxBLa === 0 && pxBRa === 0
}

export const addImageWithOutlineAndGetBase64 = (image, color) => {
  tempCanvas.width = image.naturalWidth || image.width
  tempCanvas.height = image.naturalHeight || image.height

  const offets = [-1,-1, 0,-1, 1,-1, -1,0, 1,0, -1,1, 0,1, 1,1]
  const thickness = Math.max(tempCanvas.width, tempCanvas.height) * 0.0015

  for (let i = 0; i < offets.length; i += 2) {
    tempContext.drawImage(image, offets[i] * thickness, offets[i+1] * thickness)
  }

  // fill with color
  tempContext.globalCompositeOperation = 'source-in'
  tempContext.fillStyle = color
  tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

  // draw original image in normal mode
  tempContext.globalCompositeOperation = 'source-over'
  tempContext.drawImage(image, 0, 0)

  return tempCanvas.toDataURL('image/png')
}

// const getUrlToBlob = (url) => {
//   return new Promise(async(resolve) => {
//     const response = await fetch(url)
//     resolve(await response.blob())
//   })
// }

// // const base64 = formdata.get('base64')
// // const block = base64.split(";")
// // const contentType = block[0].split(":")[1]
// // const realData = block[1].split(",")[1]
// // const blob = base64ImageToBlob(realData, contentType)
// export const base64ImageToBlob = (b64Data, contentType = '', sliceSize = 512) => {
//   const byteCharacters = atob(b64Data)
//   const byteArrays = []
//   for (var offset = 0, l1 = byteCharacters.length; offset < l1; offset += sliceSize) {
//     const slice = byteCharacters.slice(offset, offset + sliceSize)
//     const byteNumbers = new Array(slice.length)
//     for (let i = 0, l2 = slice.length; i < l2; i++) {
//       byteNumbers[i] = slice.charCodeAt(i)
//     }
//     const byteArray = new Uint8Array(byteNumbers)
//     byteArrays.push(byteArray)
//   }
//   return new Blob(byteArrays, { type: contentType })
// }

export const init = () => {
  tempImage = new Image()
  tempImage.crossOrigin = 'Anonymous'
}
