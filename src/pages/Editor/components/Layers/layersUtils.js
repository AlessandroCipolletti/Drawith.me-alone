import { round } from 'utils/mathUtils'

/*
  Snapping coords for X drag and drop
  returns
    [
      [x coord to magnetise for box center, x coord where to show the vertical line (not mandatory)],
      [...],
    ]
*/
export const getMagnetismCoordXForLayer = (state, layerId = state.currentSelectedLayerId, hasRotation = false) => {
  const layer = state.layers[layerId]
  const layerWidth = layer.maxX - layer.minX
  const coords = [[round(state.canvases.width / 2, 1), state.canvases.width / 2]] // center X
  if (!hasRotation) {
    coords.push([round(layerWidth / 2, 1), false]) // page left side
    coords.push([round(state.canvases.width - layerWidth / 2, 1), false]) // page right side
    coords.push([round(state.canvases.width / 2 + layerWidth / 2, 1),  state.canvases.width / 2]) // element left side at the page center X
    coords.push([round(state.canvases.width / 2 - layerWidth / 2, 1),  state.canvases.width / 2]) // element right side at the page center X
  }

  // se in futuro vorrò dare una priorità particolare ai livelli da magnetizzare,
  // devo farlo qui, mettendo un ordine preciso all'array di layer
  Object.values(state.layers).forEach(l => {
    if (l.id !== layerId && Number.isFinite(l.minX) && l.active && l.opacity > 0) {
      const lCenterX = round((l.minX + l.maxX) / 2, 1)
      coords.push([lCenterX, lCenterX])
      if (!hasRotation) { // se il box ha una rotazione, allineo solo il centro
        if (l.minX > 1) {
          coords.push([round(l.minX + (layerWidth / 2), 1), l.minX]) // left with left
          coords.push([round(l.minX - (layerWidth / 2), 1), l.minX]) // right with left
        }
        if (l.maxX < state.canvases.width - 1) {
          coords.push([round(l.maxX + (layerWidth / 2), 1), l.maxX]) // left with right
          coords.push([round(l.maxX - (layerWidth / 2), 1), l.maxX]) // right with right
        }
      }
    }
  })

  return coords
}

/*
  Snapping coords for Y drag and drop
  returns
    [
      [y coord to magnetise for box center, y coord where to show the horizontal line (not mandatory)],
      [...],
    ]
*/
export const getMagnetismCoordYForLayer = (state, layerId = state.currentSelectedLayerId, hasRotation = false) => {
  const layer = state.layers[layerId]
  const layerHeight = layer.maxY - layer.minY
  const coords = [[round(state.canvases.height / 2, 1), state.canvases.height / 2]] // center Y
  if (!hasRotation) {
    coords.push([round(layerHeight / 2, 1), false]) // page top side
    coords.push([round(state.canvases.height - layerHeight / 2, 1), false]) // page bottom side
    coords.push([round(state.canvases.height / 2 + layerHeight / 2, 1),  state.canvases.height / 2]) // element top side at the page center Y
    coords.push([round(state.canvases.height / 2 - layerHeight / 2, 1),  state.canvases.height / 2]) // element bottom side at the page center Y
  }
  // se in futuro vorrò dare una priorità particolare ai livelli da magnetizzare,
  // devo farlo qui, mettendo un ordine preciso all'array di layer
  Object.values(state.layers).forEach(l => {
    if (l.id !== layerId && Number.isFinite(l.minY) && l.active && l.opacity > 0) {
      const lCenterY = round((l.minY + l.maxY) / 2, 1)
      coords.push([lCenterY, lCenterY])
      if (!hasRotation) { // se il box ha una rotazione, allineo solo il centro
        if (l.minY > 1) {
          coords.push([round(l.minY + (layerHeight / 2), 1), l.minY]) // top with top
          coords.push([round(l.minY - (layerHeight / 2), 1), l.minY]) // bottom with top
        }
        if (l.maxY < state.canvases.height - 1) {
          coords.push([round(l.maxY + (layerHeight / 2), 1), l.maxY]) // top with bottom
          coords.push([round(l.maxY - (layerHeight / 2), 1), l.maxY]) // bottom with bottom
        }
      }
    }
  })

  return coords
}


// Snapping coords for element left side during resize
export const getMagnetismCoordLeftForLayer = (state, layerId = state.currentSelectedLayerId) => {
  const coords = [
    [0, false], // page left side
    [round(state.canvases.width / 2, 1), state.canvases.width / 2], // page center X
  ]
  Object.values(state.layers).forEach(l => {
    if (l.id !== layerId && Number.isFinite(l.minX) && l.active && l.opacity > 0) {
      if (l.minX > 1) {
        coords.push([l.minX, l.minX])
      }
      if (l.maxX < state.canvases.width - 1) {
        coords.push([l.maxX + 1, l.maxX])
      }
    }
  })

  return coords
}

// Snapping coords for element right side during resize
export const getMagnetismCoordRightForLayer = (state, layerId = state.currentSelectedLayerId) => {
  const coords = [
    [state.canvases.width, false], // page right side
    [round(state.canvases.width / 2, 1), state.canvases.width / 2], // page center X
  ]
  Object.values(state.layers).forEach(l => {
    if (l.id !== layerId && Number.isFinite(l.minX) && l.active && l.opacity > 0) {
      if (l.minX > 1) {
        coords.push([l.minX - 1, l.minX])
      }
      if (l.maxX < state.canvases.width - 1) {
        coords.push([l.maxX, l.maxX])
      }
    }
  })

  return coords
}

// Snapping coords for element top side during resize
export const getMagnetismCoordTopForLayer = (state, layerId = state.currentSelectedLayerId) => {
  const coords = [
    [0, false], // page top side
    [round(state.canvases.height / 2, 1), state.canvases.height / 2], // page center Y
  ]
  Object.values(state.layers).forEach(l => {
    if (l.id !== layerId && Number.isFinite(l.minY) && l.active && l.opacity > 0) {
      if (l.minY > 1) {
        coords.push([l.minY, l.minY])
      }
      if (l.maxY < state.canvases.height - 1) {
        coords.push([l.maxY + 1, l.maxY])
      }
    }
  })

  return coords
}

// Snapping coords for element bottom side during resize
export const getMagnetismCoordBottomForLayer = (state, layerId = state.currentSelectedLayerId) => {
  const coords = [
    [state.canvases.height, false], // page bottom side
    [round(state.canvases.height / 2, 1), state.canvases.height / 2], // page center Y
  ]
  Object.values(state.layers).forEach(l => {
    if (l.id !== layerId && Number.isFinite(l.minY) && l.active && l.opacity > 0) {
      if (l.minY > 1) {
        coords.push([l.minY - 1, l.minY])
      }
      if (l.maxY < state.canvases.height - 1) {
        coords.push([l.maxY, l.maxY])
      }
    }
  })

  return coords
}


