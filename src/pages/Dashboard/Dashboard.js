// const tplDashboard = require('./dashboard.tpl')
// import './dashboard.css'
//
// import Params from 'main/Params'
// import * as Socket from 'modules/Socket'
// import * as Editor from 'pages/Editor'
//
// import * as Tooltip from './components/Tooltip'
// import * as Gps from './modules/GPS'
// import * as Cache from './modules/Cache'
//
// // import {  addRotationHandler } from 'utils/moduleUtils'
// import { round, getNumberInBetween } from 'utils/mathUtils'
// import { loadTemplate, getEventCoordX, getEventCoordY, disableElements, enableElements } from 'utils/domUtils'
// import { fadeInElements, fadeOutElements } from 'utils/animationsUtils'
// import { orderArrayStringUp, arrayOrderStringDown } from 'utils/jsUtils'
//
// import { spacing } from 'main/Theme'
// import { DASHBOARD_EVENTS } from 'modules/Socket/constants'
//
// const config = {
//   maxDeltaDragYgps: 10, // km
//   clickMargin: 6,
//   tooltipSide: 'right',
//   maxScale: 1,
//   minScale: 0.1,
//   decimalsForPrecision: 0,
//   deltaDragBeforeFill: 500, // TODO maybe check pixel ratio?
// }
// const state = {
//   currentCoords: {
//     x: 0,
//     y: 0,
//     z: 1,
//   },
//   currentCursor: {
//     x: 0,
//     y: 0,
//   },
//   touchStart: {
//     x: 0,
//     y: 0,
//   },
//   deltaDragSinceLastFill: {
//     x: 0,
//     y: 0,
//     z: 0,
//   },
//   visibleCoords: {
//     minX: 0, // TODO to initiate
//     maxX: 0,
//     minY: 0,
//     maxY: 0,
//     deltaX: 0,
//     deltaY: 0,
//   },
//   svgOffset: {},
//   currentScale: 1,
//   currentGpsMapScale: 0,
//   idsImagesOnDashboard: [],
//   idsImagesOnScreen: [],
//   socketCallsInProgress: 0,
//   cacheNeedsUpdate: false,
//   touchDown: false,
//   draggable: true,
// }
// const refs = {
//   imageGroup: {},
//   svg: null,
//   zoomRect: null,
//   zoomLabel: null,
//   showEditorButton: null,
//   spinner: null,
//   canvasForClick: null,
//   contextForClick: null,
//   imageForClick: null,
// }
//
// export const open = () => {
//   // addRotationHandler(onRotate)
//   Socket.addListener(DASHBOARD_EVENTS, onSocketMessage)
//   config.maxDeltaDragYgps = config.maxDeltaDragYgps * 1000 * 1000 * config.px4mm // from km to px
//   config.clickMargin = config.clickMargin / Params.viewportScale
//   Gps.init(config)
//   refs.imageGroup.updateMatrix = () => {
//     const matrix = refs.imageGroup.matrix
//     refs.imageGroup.tag.setAttribute('transform', `matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},${round(matrix.e, 4)},${round(matrix.f, 4)})`)
//   }
//   await initDom()
//   setDashboardSpinner(state.socketCallsInProgress > 0)
//   fadeInElements([refs.zoomLabel, refs.zoomRect, refs.showEditorButton])
// }
//
// const close = () => {
//   setDashboardSpinner(false)
//   fadeOutElements([refs.zoomLabel, refs.zoomRect, refs.showEditorButton])
// }
//
// const updateMatrixForGesture = (x, y, scale, rotation) => {
//   console.log('gesture', x, y, scale, rotation)
//   state.touchDown = false
//   state.currentCursor.x = state.currentCursor.y = 0
//   scale = getNumberInBetween(scale * state.currentScale, config.maxScale, config.minScale)
//   x = x - refs.imageGroup.pxx
//   y = y - refs.imageGroup.pxy
//   refs.imageGroup.matrix.a = refs.imageGroup.matrix.d = scale
//   refs.imageGroup.matrix.e = x - scale * x // qui invece di x e y rispetto allo schermo devo passare x e y rispetto all'origine dell'svg
//   refs.imageGroup.matrix.f = y - scale * y
//   refs.imageGroup.updateMatrix()
//   updateGroupOrigin()
//   updateDeltaVisibleCoords(scale)
//   updateCurrentCoords(x, y)
//
//   if (scale < config.maxScale) {
//     disableElements(refs.showEditorButton)
//   } else {
//     enableElements(refs.showEditorButton)
//   }
//   /*
//   const newp = refs.svg.createSVGPoint()
//   newp.x = _gestureX
//   newp.y = _gestureY
//   newp = newp.matrixTransform(refs.imageGroup.tag.getScreenCTM().inverse())
//   newp.x = round(newp.x)
//   newp.y = round(newp.y)
//   */
// }
//
// const isOnScreen = (img) => (img.pxr > 0 && img.pxx < Params.width && img.pxb > 0 && img.pxy < Params.height)
//
// const isOnDashboard = (img) => (img.r > state.visibleCoords.minX && img.b < state.visibleCoords.maxY && img.x < state.visibleCoords.maxX && img.y > state.visibleCoords.minY)
//
// const setDashboardSpinner = (loading) => {
//   if (loading) {
//     fadeInElements(refs.spinner)
//   } else {
//     fadeOutElements(refs.spinner)
//   }
// }
//
// export const getCoords = () => ({
//   x: round(state.currentCoords.x),
//   y: round(state.currentCoords.y),
//   z: round(state.currentCoords.z),
// })
//
// export const go2Gps = () => {
//   Gps.currentGps2px(false, go2XYZ)
// }
//
// const removeDraw = (id, del = false) => {
//   console.log('rimuovo:' + id)
//   if (del) {
//     Cache.del(id)
//   }
//   state.idsImagesOnDashboard.splice(state.idsImagesOnDashboard.indexOf(id), 1)
//   const oldDraw = document.getElementById(id)
//   if (oldDraw) {
//     refs.imageGroup.tag.removeChild(oldDraw)
//   }
// }
//
// const findDrawingsInCache = () => {
//   const ids = Cache.ids().filter((i) => state.idsImagesOnDashboard.indexOf(i) <= 0)
//   ids.forEach((id) => {
//     const draw = Cache.get(id)
//     if (isOnDashboard(draw)) {
//       appendDraw(draw)
//     }
//   })
// }
//
// const updateCurrentCoords = (x, y, z = false) => {
//   state.currentCoords.x = x
//   state.currentCoords.y = y
//   z && (state.currentCoords.z = z)
//   state.visibleCoords.minX = x - state.visibleCoords.deltaX
//   state.visibleCoords.maxX = x + state.visibleCoords.deltaX
//   state.visibleCoords.minY = y - state.visibleCoords.deltaY
//   state.visibleCoords.maxY = y + state.visibleCoords.deltaY
// }
//
// const getVisibleArea = () => ({
//   minX: state.visibleCoords.minX,
//   maxX: state.visibleCoords.maxX,
//   minY: state.visibleCoords.minY,
//   maxY: state.visibleCoords.maxY,
//   x: state.currentCoords.x,
//   y: state.currentCoords.y,
// })
//
// const selectDrawAtPx = (x, y) => {
//   if (state.cacheNeedsUpdate) {
//     updateCache()
//   }
//   state.idsImagesOnScreen.sort(orderArrayStringUp)
//   let draw, selectedDraw = false
//   for (let i = 0, l = state.idsImagesOnScreen.length; i < l; i++) {
//     draw = Cache.get(state.idsImagesOnScreen[i])
//     if (draw.pxx < x && draw.pxr > x && draw.pxy < y && draw.pxb > y) {
//       if (!selectedDraw) {
//         selectedDraw = draw
//       }
//       refs.contextForClick.clearRect(0, 0, refs.canvasForClick.width, refs.canvasForClick.height)
//       refs.canvasForClick.width = draw.pxw
//       refs.canvasForClick.height = draw.pxh
//       refs.imageForClick.src = draw.data.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
//       refs.contextForClick.drawImage(refs.imageForClick, 0, 0, draw.pxw, draw.pxh)
//       // TODO test con context.isPointInPath()
//       if (refs.contextForClick.getImageData(x - draw.pxx, y - draw.pxy, 1, 1).data[3] > 0) {
//         selectedDraw = draw
//         break
//       }
//     }
//   }
//
//   if (selectedDraw) {
//     Tooltip.show(selectedDraw)
//   }
//
//   refs.contextForClick.clearRect(0, 0, refs.canvasForClick.width, refs.canvasForClick.height)
//   refs.canvasForClick.width = refs.canvasForClick.height = 0
//   selectedDraw = undefined
//   refs.imageForClick = new Image()
// }
//
// const openEditor = () => {
//   if (refs.showEditorButton.classList.contains('disabled') === false) {
//     hide()
//     Editor.show()
//   }
// }
//
// const updateGroupOrigin = () => {
//   const groupRect = refs.imageGroup.origin.getBoundingClientRect()
//   refs.imageGroup.pxx = round(groupRect.left, config.decimalsForPrecision)
//   refs.imageGroup.pxy = round(groupRect.top - spacing.HEADER_HEIGHT, config.decimalsForPrecision)
// }
//
// const go2XYZ = (x, y, z) => {
//   z = z || 1 // TODO valore zoom default
//   if (state.currentGpsMapScale === 0 || Math.abs(y - state.currentCoords.y) > config.maxDeltaDragYgps) {
//     state.currentGpsMapScale = Gps.pxy2scale(y)
//   }
//   initDomGroup()
//   updateCurrentCoords(x, y, z)
//   Cache.reset()
//   state.idsImagesOnDashboard = []
//   updateDashboardDrawings()
// }
//
// const updateDeltaVisibleCoords = (z) => {
//   z = z || refs.imageGroup.matrix.a
//   state.visibleCoords.deltaX = Params.width / z * state.currentGpsMapScale
//   state.visibleCoords.deltaY = Params.height / z * state.currentGpsMapScale
// }
//
// const initDomGroup = () => {
//   if (refs.imageGroup.tag) {
//     refs.svg.removeChild(refs.imageGroup.tag)
//     refs.imageGroup.origin = refs.imageGroup.tag = null
//     refs.imageGroup.pxx = refs.imageGroup.pxy = 0
//     refs.imageGroup.matrix = null
//   }
//   const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
//   const origin = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
//   origin.setAttributeNS(null, 'x', 0)
//   origin.setAttributeNS(null, 'y', 0)
//   origin.setAttributeNS(null, 'height', '10')
//   origin.setAttributeNS(null, 'width', '10')
//   origin.setAttributeNS(null, 'fill', 'black')
//   g.appendChild(origin)
//   refs.svg.appendChild(g)
//   refs.imageGroup.tag = g
//   refs.imageGroup.origin = origin
//   refs.imageGroup.matrix = refs.imageGroup.tag.getCTM()
//   updateDeltaVisibleCoords()
//   updateGroupOrigin()
// }
//
// const callSocketFor = (area, notIds) => {
//   state.socketCallsInProgress++
//   setDashboardSpinner(true)
//   console.log('Calls socket for', area, notIds)
//   Socket.emit(DASHBOARD_EVENTS, {
//     'area': area,
//     'ids': notIds,
//   })
// }
//
// const updateCache = () => {
//   state.idsImagesOnScreen = []
//   Cache.ids().forEach((id) => {
//     const img = Cache.get(id)
//     const rect = img.data.getBoundingClientRect()
//     img.pxx = round(rect.left - state.svgOffset.left, config.decimalsForPrecision)
//     img.pxy = round(rect.top - state.svgOffset.top, config.decimalsForPrecision)
//     img.pxw = round(rect.width, config.decimalsForPrecision)
//     img.pxh = round(rect.height, config.decimalsForPrecision)
//     img.pxr = img.pxx + img.pxw
//     img.pxb = img.pxy + img.pxh
//     img.onDashboard = isOnDashboard(img)
//     img.onScreen = isOnScreen(img)
//     if (state.idsImagesOnDashboard.indexOf(img.id) >= 0 && !img.onDashboard) {
//       removeDraw(img.id, false)
//     }
//     if (img.onScreen) {
//       state.idsImagesOnScreen.push(img.id)
//     }
//     Cache.set(img.id, img)
//   })
//   state.cacheNeedsUpdate = false
// }
//
// const updateDashboardDrawings = () => {
//   state.deltaDragSinceLastFill.x = state.deltaDragSinceLastFill.y = state.deltaDragSinceLastFill.z = 0
//   updateCache()
//   findDrawingsInCache()
//   callSocketFor(getVisibleArea(), Cache.ids())
// }
//
// const appendDraw = (draw) => {
//   if (!draw || !draw.id || state.idsImagesOnDashboard.indexOf(draw.id) >= 0) return false
//   console.log(['aggiungo', draw])
//   state.idsImagesOnDashboard.push(draw.id)
//   state.idsImagesOnDashboard = state.idsImagesOnDashboard.sort(arrayOrderStringDown)
//   var index = state.idsImagesOnDashboard.indexOf(draw.id) + 1
//   if (index < state.idsImagesOnDashboard.length) {
//     refs.imageGroup.tag.insertBefore(draw.data, document.getElementById(state.idsImagesOnDashboard[index]))
//   } else {
//     refs.imageGroup.tag.appendChild(draw.data)
//   }
//   draw.onDashboard = true
//   Cache.add(draw.id, draw)
// }
//
// export const addDraw = (draw, replace = false) => {
//   if (!draw || !draw.id) return false
//   const drawExist = Cache.exist(draw.id)
//   const z = refs.imageGroup.matrix.a
//   if (!drawExist || replace) {
//     if (drawExist) {
//       removeDraw(draw.id, true)
//     }
//     let newDraw = document.createElementNS('http://www.w3.org/2000/svg', 'image')
//     newDraw.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', draw.base64)
//     newDraw.setAttribute('x', round(((draw.x - state.currentCoords.x) * z + Params.width / 2 - refs.imageGroup.pxx) / z, config.decimalsForPrecision))
//     newDraw.setAttribute('y', round(((state.currentCoords.y - draw.y) * z + Params.height / 2 - refs.imageGroup.pxy) / z, config.decimalsForPrecision))
//     newDraw.setAttribute('width', draw.w)
//     newDraw.setAttribute('height', draw.h)
//     newDraw.id = draw.id
//     draw.base64 = undefined
//     delete draw.minX
//     delete draw.minY
//     delete draw.maxX
//     delete draw.maxY
//     delete draw.coordX
//     delete draw.coordY
//     delete draw.base64
//     draw.data = newDraw
//     appendDraw(draw)
//     newDraw = draw = undefined
//   }
//   state.cacheNeedsUpdate = true
//   return true
// }
//
// const onSocketMessage = (data) => {
//   if (['end', 'none', 'error'].indexOf(data) >= 0) {
//     state.socketCallsInProgress--
//     if (state.socketCallsInProgress === 0) {
//       setDashboardSpinner(false)
//     }
//   } else {
//     const draws = JSON.parse(data)
//     draws.forEach((draw) => {
//       if (!Cache.exist(draw.id)) {
//         addDraw(draw)
//       }
//     })
//   }
//   data = undefined
// }
//
// const drag = (dx, dy, forceLoad) => {
//   if (dx === 0 && dy === 0) return
//   //console.log("drag", dx, dy)
//   const scale = refs.imageGroup.matrix.a
//   const deltaCoordX = round(dx / scale, config.decimalsForPrecision)
//   const deltaCoordY = round(dy / scale, config.decimalsForPrecision)
//   const newCoordX = round(state.currentCoords.x - deltaCoordX, config.decimalsForPrecision)
//   const newCoordY = round(state.currentCoords.y + deltaCoordY, config.decimalsForPrecision)
//   state.deltaDragSinceLastFill.x += dx
//   state.deltaDragSinceLastFill.y += dy
//
//   refs.imageGroup.matrix = refs.imageGroup.matrix.translate(deltaCoordX, deltaCoordY)
//   refs.imageGroup.updateMatrix()
//   updateCurrentCoords(newCoordX, newCoordY, scale)
//   updateGroupOrigin()
//
//   if (forceLoad || Math.abs(state.deltaDragSinceLastFill.x) > config.deltaDragBeforeFill || Math.abs(state.deltaDragSinceLastFill.y) > config.deltaDragBeforeFill) {
//     updateDashboardDrawings()
//   } else {
//     state.cacheNeedsUpdate = true
//   }
// }
//
// const dragOnMove = (dx, dy, cursorX, cursorY) => {
//   drag(dx, dy, false)
//   state.currentCursor.x = cursorX
//   state.currentCursor.y = cursorY
//   state.draggable = true
// }
//
// const onTouchStart = (e) => {
//   e.preventDefault()
//   if ((!e.button) && (!e.touches || e.touches.length === 1) && state.touchDown === false) {
//     state.touchDown = true
//     refs.svg.classList.add('dashboard__dragging')
//     state.currentCursor.x = state.touchStart.x = getEventCoordX(e)
//     state.currentCursor.y = state.touchStart.y = getEventCoordY(e, spacing.HEADER_HEIGHT)
//     refs.imageGroup.matrix = refs.imageGroup.tag.getCTM()
//   }
// }
//
// const onTouchMove = (e) => {
//   e.preventDefault()
//   if ((!e.touches || e.touches.length === 1) && state.touchDown && state.draggable) {
//     state.draggable = false
//     const cursorX = getEventCoordX(e)
//     const cursorY = getEventCoordY(e, spacing.HEADER_HEIGHT)
//     const dx = cursorX - state.currentCursor.x
//     const dy = cursorY - state.currentCursor.y
//     requestAnimationFrame(dragOnMove.bind({}, dx, dy, cursorX, cursorY))
//   }
// }
//
// const onTouchEnd = (e) => {
//   e.preventDefault()
//   if ((!e.button) && (!e.touches || e.touches.length === 0) && state.touchDown) {
//     const cursorX = getEventCoordX(e)
//     const cursorY = getEventCoordY(e, spacing.HEADER_HEIGHT)
//     if (Math.abs(state.touchStart.x - cursorX) < config.clickMargin && Math.abs(state.touchStart.y - cursorY) < config.clickMargin) {
//       selectDrawAtPx(cursorX, cursorY)
//     }
//     state.currentCursor.x = state.currentCursor.y = 0
//     state.touchDown = false
//     refs.svg.classList.remove('dashboard__dragging')
//   }
// }
//
// // const onGestureStart = (e) => {
// //   e.preventDefault()
// //   updateMatrixForGesture(getEventCoordX(e), getEventCoordY(e), e.scale, e.rotation)
// // }
// //
// // const onGestureChange = (e) => {
// //   e.preventDefault()
// //   updateMatrixForGesture(getEventCoordX(e), getEventCoordY(e), e.scale, e.rotation)
// // }
// //
// // const onGestureEnd = (e) => {
// //   e.preventDefault()
// //   updateMatrixForGesture(getEventCoordX(e), getEventCoordY(e), e.scale, e.rotation)
// //   state.currentScale = refs.imageGroup.matrix.a
// // }
//
// // const onRotate =  (e) => {
// //   // do some stuff
// // }
//
// const initDom = async() => {
//   refs.container = await loadTemplate(tplDashboard, {
//     marginTop: spacing.HEADER_HEIGHT,
//     labelToDraw: 'Disegna',
//     zoomRectBorderRadius: 8 / Params.viewportScale,
//     zoomRectCoord: -8 / Params.viewportScale,
//     zoomRectWidth: 60 / Params.viewportScale,
//     zoomRectHeight: 50 / Params.viewportScale,
//     zoomLabelX: 10 / Params.viewportScale,
//     zoomLabelY: 25 / Params.viewportScale,
//   }, Params.pagesContainer)
//
//   refs.svg = refs.container.querySelector('svg')
//   refs.zoomRect = refs.container.querySelector('.dashboard__zoom-label-rect')
//   refs.zoomLabel = refs.container.querySelector('.dashboard__zoom-label')
//   refs.showEditorButton = refs.container.querySelector('.dashboard__showeditor')
//   refs.spinner = refs.container.querySelector('.dashboard__spinner')
//   refs.canvasForClick = document.createElement('canvas')
//   refs.contextForClick = refs.canvasForClick.getContext('2d')
//   refs.imageForClick = new Image()
//
//   refs.showEditorButton.addEventListener(Params.eventStart, openEditor)
//   refs.svg.addEventListener(Params.eventStart, onTouchStart, true)
//   refs.svg.addEventListener(Params.eventMove, onTouchMove, true)
//   refs.svg.addEventListener(Params.eventEnd, onTouchEnd, true)
//   // if (Params.supportGesture) {
//   //   refs.svg.addEventListener('gesturestart', onGestureStart, true)
//   //   refs.svg.addEventListener('gesturechange', onGestureChange, true)
//   //   refs.svg.addEventListener('gestureend', onGestureEnd, true)
//   // }
//
//   state.svgOffset = refs.svg.getBoundingClientRect()
//   // onRotate()
//   go2XYZ(0, 0, 0)
//   Tooltip.init(config, refs.container)
// }
//
