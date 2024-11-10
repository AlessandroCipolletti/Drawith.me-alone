const tplToolbar = require ('./toolbar.tpl')
import './toolbar.css'

import Params from 'main/Params'
import * as Editor from 'pages/Editor'
import * as Tools from 'pages/Editor/components/Tools'
import * as Layers from 'pages/Editor/components/Layers'
import { cleanRefs } from 'utils/moduleUtils'
import { deepCopy } from 'utils/jsUtils'
import { preventDefault, loadTemplate, getEventCoordX, createDom } from 'utils/domUtils'
import { addHorizontalDragSliderHandler } from 'utils/uiUtils'
import { round, logarithmicPercToValue, logarithmicValueToPerc, getNumberInBetween } from 'utils/mathUtils'
import { cursorButtonTouchStart, getToolPreviewTouchEvents } from './toolbarUtils'
import { fadeOutElements } from 'utils/animationsUtils'
import { getNewContextForCanvas, drawMultipleSteps } from 'utils/canvasUtils'
import { getStepsDataFromTouchEvents } from 'pages/Editor/editorUtils'
import { timing, spacing } from 'main/Theme'


const config = {
  paramsCloseDelay: 7 * 1000,
  toolPreviewCanvasSize: 30, // rem
  slidersWaitingTime: 40, // ms
}
let state = {}
const initialState = {
  paramsTimeout: false,
  sizePerc: 0, // from 0 to 100 %
  sizeValue: 0, // tool size value
  alphaPerc: 0, // from 0 to 100 %
  alphaValue: 0, // tool alpha value
  currentParamsProp: '', // 'size' or 'alpha'
  currentToolProps: {},
  toolPreviewCanvasSize: 0,
  toolPreviewTouchEvents: false,
}
const refs = {
  container: null,
  params: null,
  leftSide: null,
  centerSide: null,
  rightSide: null,
  backButton: null,
  goFullscreenButton: null,
  slider: null,
  sliderLabel: null,
  sliderCursor: null,
  sizeButton: null,
  alphaButton: null,
  sizeLabel: null,
  alphaLabel: null,
  toolPreview: null,
  toolPreviewPopup: null,
  toolPreviewCanvas: null,
  toolPreviewContext: null,
}


const toggleParams = () => {
  if (refs.params.classList.contains('params-container-visible')) {
    closeParams()
  } else {
    openParams()
  }
}

const openParams = () => {
  if (state.paramsTimeout !== false) {
    clearTimeout(state.paramsTimeout)
  }
  state.paramsTimeout = setTimeout(closeParams, config.paramsCloseDelay)
  refs.params.classList.add('params-container-visible')
}

export const closeParams = () => {
  if (state.paramsTimeout !== false) {
    refs.params.classList.remove('params-container-visible')
    clearTimeout(state.paramsTimeout)
    state.paramsTimeout = false
    state.currentParamsProp = ''
  }
}

const updateToolPreview = () => {
  const toolsProps = {
    ...state.currentToolProps,
    alpha: state.alphaValue,
    size: state.sizeValue,
    globalCompositeOperation: state.currentToolProps.globalCompositeOperation === 'destination-out' ? 'destination-out' : 'source-over',
  }
  state.toolPreviewTouchEvents = state.toolPreviewTouchEvents || getToolPreviewTouchEvents(state.toolPreviewCanvasSize * Params.pxScale)
  const previewSteps = getStepsDataFromTouchEvents(state.toolPreviewTouchEvents, toolsProps)

  drawMultipleSteps(refs.toolPreviewContext, previewSteps, toolsProps)
}

const openPreviewPopups = () => {
  requestAnimationFrame(updateToolPreview)
  refs.toolPreview.classList.add('tool-preview-visible')
  refs.toolPreview.classList.remove('displayNone')
}

const closePreviewPopups = () => {
  fadeOutElements(refs.toolPreview, timing.FAST_FADE)
  refs.toolPreview.classList.remove('tool-preview-visible')
}

const updateParams = (value) => {
  refs.sliderCursor.style.left = `${value}%`
  refs.slider.style.background = `linear-gradient(90deg, var(--palette-green-1) ${value}%, var(--palette-white) ${value}%)`
  refs.sliderLabel.innerHTML = `${value}`
}

const onSliderDrag = (value, inProgress) => {
  openParams()
  if (state.currentParamsProp === 'size') {
    updateSize(value, inProgress)
  } else {
    updateAlpha(value, inProgress)
  }
}

const updateSize = (perc, inProgress) => {
  const sizeValue = logarithmicPercToValue(perc, state.currentToolProps.minSize, state.currentToolProps.maxSize, 1)
  state.sizePerc = perc
  state.sizeValue = sizeValue
  refs.sizeLabel.innerHTML = `${perc}%`
  updateParams(perc)

  if (inProgress) {
    openPreviewPopups()
  } else {
    closePreviewPopups()
    Tools.setCurrentToolCustomProps({
      size: sizeValue,
    })
  }
}

const updateAlpha = (perc, inProgress) => {
  const alphaValue = logarithmicPercToValue(perc, state.currentToolProps.minAlpha, state.currentToolProps.maxAlpha, 3)
  state.alphaPerc = perc
  state.alphaValue = alphaValue
  refs.alphaLabel.innerHTML = `${perc}%`
  updateParams(perc)

  if (inProgress) {
    openPreviewPopups()
  } else {
    closePreviewPopups()
    Tools.setCurrentToolCustomProps({
      alpha: alphaValue,
    })
  }
}

const onSizeSingleTap = () => {
  if (state.currentParamsProp === 'size') {
    toggleParams()
  } else {
    updateParams(state.sizePerc)
    openParams()
    state.currentParamsProp = 'size'
  }
}

const onAlphaSingleTap = () => {
  if (state.currentParamsProp === 'alpha') {
    toggleParams()
  } else {
    updateParams(state.alphaPerc)
    openParams()
    state.currentParamsProp = 'alpha'
  }
}

const onSizeTouchStart = (e) => {
  preventDefault(e)
  if (!refs.sizeButton.classList.contains('disabled')) {
    Layers.closeResizeModeIfNeeded()
    cursorButtonTouchStart(state.sizePerc, getEventCoordX(e), updateSize, onSizeSingleTap, config.slidersWaitingTime)
  }
}

const onAlphaTouchStart = (e) => {
  preventDefault(e)
  if (!refs.alphaButton.classList.contains('disabled')) {
    Layers.closeResizeModeIfNeeded()
    cursorButtonTouchStart(state.alphaPerc, getEventCoordX(e), updateAlpha, onAlphaSingleTap, config.slidersWaitingTime)
  }
}

const toggleSizeAndAlpha = (enabled) => {
  refs.sizeButton && refs.sizeButton.classList.toggle('disabled', !enabled)
  refs.alphaButton && refs.alphaButton.classList.toggle('disabled', !enabled)
  if (!enabled) {
    closeParams()
  }
}

export const setTool = (toolProps) => {
  // console.log(toolProps)
  toggleSizeAndAlpha(toolProps.hasSizeAndAlpha)
  state.sizeValue = toolProps.size
  state.sizePerc = getNumberInBetween(1, 100, logarithmicValueToPerc(toolProps.size, toolProps.minSize, toolProps.maxSize, 0))
  state.alphaValue = toolProps.alpha
  state.alphaPerc = getNumberInBetween(1, 100, logarithmicValueToPerc(toolProps.alpha, toolProps.minAlpha, toolProps.maxAlpha, 0))
  refs.sizeLabel.innerHTML = `${state.sizePerc}%`
  refs.alphaLabel.innerHTML = `${state.alphaPerc}%`
  state.currentToolProps = deepCopy(toolProps)
  state.currentToolProps.frameImageFile = toolProps.frameImageFile
  closeParams()
}

export const addOptionButtonsGroup = (buttons = [], side = 'center') => {
  const spacer = createDom('editor-toolbar__spacer')
  const wrapper = createDom('editor-toolbar__options-group')
  for (const button of buttons) {
    button.classList.add('editor-toolbar__button')
    wrapper.appendChild(button)
  }
  if (side === 'left') {
    refs.leftSide.appendChild(spacer)
    refs.leftSide.appendChild(wrapper)
  } else if (side === 'center') {
    refs.centerSide.appendChild(spacer)
    refs.centerSide.appendChild(wrapper)
  } else if (side === 'right') {
    refs.rightSide.appendChild(wrapper)
    refs.rightSide.appendChild(spacer)
  }
}

const initDom = async(container) => {
  let dom = await loadTemplate(tplToolbar, {}, container)
  refs.container = dom[0]
  refs.params = dom[1]
  refs.toolPreview = dom[2]
  refs.leftSide = refs.container.querySelector('.editor-toolbar__left')
  refs.centerSide = refs.container.querySelector('.editor-toolbar__center')
  refs.rightSide = refs.container.querySelector('.editor-toolbar__right')
  refs.toolPreviewPopup = refs.toolPreview.querySelector('.editor-toolbar__tool-preview-popup')
  refs.toolPreviewCanvas = refs.toolPreview.querySelector('canvas')
  refs.backButton = refs.container.querySelector('.editor__back')
  refs.goFullscreenButton = refs.container.querySelector('.editor__go-fullscreen')
  refs.sizeButton = refs.container.querySelector('.editor-toolbar__size')
  refs.alphaButton = refs.container.querySelector('.editor-toolbar__alpha')
  refs.slider = refs.params.querySelector('.editor-toolbar__slider')
  refs.sliderLabel = refs.slider.querySelector('span')
  refs.sliderCursor = refs.slider.querySelector('div')
  refs.sizeLabel = refs.container.querySelector('.editor-toolbar__size span')
  refs.alphaLabel = refs.container.querySelector('.editor-toolbar__alpha span')

  refs.toolPreviewPopup.style.width = `${state.toolPreviewCanvasSize}px`
  refs.toolPreviewPopup.style.height = `${state.toolPreviewCanvasSize}px`
  refs.toolPreviewCanvas.style.width = `${state.toolPreviewCanvasSize}px`
  refs.toolPreviewCanvas.style.height = `${state.toolPreviewCanvasSize}px`
  refs.toolPreviewCanvas.width = state.toolPreviewCanvasSize * Params.pxScale
  refs.toolPreviewCanvas.height = state.toolPreviewCanvasSize * Params.pxScale
  refs.toolPreviewContext = getNewContextForCanvas(refs.toolPreviewCanvas)

  addHorizontalDragSliderHandler(refs.sliderCursor, refs.slider, onSliderDrag, 100, 1, false, 0, config.slidersWaitingTime)
  refs.sizeButton.addEventListener(Params.eventStart, onSizeTouchStart)
  refs.alphaButton.addEventListener(Params.eventStart, onAlphaTouchStart)
  refs.backButton.addEventListener(Params.eventStart, Editor.saveAndGoToFolder)
  refs.goFullscreenButton.addEventListener(Params.eventStart, Editor.toggleFullscreen)
  dom = null
}

export const init = async(container) => {
  state = deepCopy(initialState)
  if (Params.isPhone) {
    config.toolPreviewCanvasSize = 30
  }
  state.toolPreviewCanvasSize = round(config.toolPreviewCanvasSize * spacing.ONE_REM, 0)
  await initDom(container)
}

export const remove = async() => {
  state = {}
  cleanRefs(refs)
}
