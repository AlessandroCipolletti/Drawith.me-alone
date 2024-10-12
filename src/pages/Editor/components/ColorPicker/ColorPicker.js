const tplColorPicker = require('./colorPicker.tpl')
import './colorPicker.css'

import Params from 'main/Params'
import * as Tools from 'pages/Editor/components/Tools'
import * as Layers from 'pages/Editor/components/Layers'
import { preventDefault, preventDefaultTouchOnEls, loadTemplate, createDom } from 'utils/domUtils'
import { applyBrightnessToHex, getHexBrightness, getSuggestedColors, getRandomHexColor } from 'utils/colorsUtils'
import { cleanRefs } from 'utils/moduleUtils'
import { addInElement, removeOutElement } from 'utils/animationsUtils'
import { setToolColor, saveDrawingsPalette, hidePipetteCursor } from 'pages/Editor'
import { addHorizontalDragSliderHandler, addListHorizontalScrollClickAndPressHandlers, handleElementsListDragAndDrop } from 'utils/uiUtils'
import { shiftArrayElement, deepCopy } from 'utils/jsUtils'


const INITIAL_COLORS = [
  '#000000', '#FFFFFF', '#FFB6C1', '#FF1493', '#FF00FF', '#9400D3', '#4B0082', '#F08080', '#FF0000',
  '#8B0000', '#FF8C00', '#FF6347', '#FFFF00', '#FFD700', '#90EE90', '#008000', '#66CDAA', '#40E0D0',
  '#00FFFF', '#0000FF', '#191970', '#808000', '#8B4513', '#FFFFF0', '#808080', '#778899',
]
const config = {
  initialColors: [],
  paramsCloseDelay: 7 * 1000,
}
let state = {}
const initialState = {
  colors: [],
  lastAddedColorId: false,
  lastSelectedColorId: 'random',
  selectedColorId: 'random',
  paramsTimeout: false,
  currentRandomColor: '',
}
const refs = {
  colorPickerContainer: null,
  randomButtom: null,
  pipetteButtom: null,
  colorsContainer: null,
  input: null,
  paramsContainer: null,
  brightnessSlider: null,
  brightnessCursor: null,
  brightnessLabel: null,
  suggestedContainer: null,
  deleteButton: null,
}
const labels = {
  brightness: 'Brightness:',
  suggested: 'Suggested:',
}


const updateColorPalette = (colors) => {
  colors.forEach((color) => {
    state.colors.push(color)
    addNewColorDom(color.id)
  })
}

const addNewColorDom = (idColor, selected = false, prepend = false, animate = false) => {
  let newColorElement
  if (selected) {
    newColorElement = createDom('editor-colorpicker__color', 'editor-colorpicker__color-selected')
  } else {
    newColorElement = createDom('editor-colorpicker__color')
  }
  newColorElement.setAttribute('data-id', idColor)
  newColorElement.style.backgroundColor = getFinalColorById(idColor)
  if (prepend) {
    refs.colorsContainer.prepend(newColorElement)
  } else {
    refs.colorsContainer.append(newColorElement)
  }
  if (animate) {
    addInElement(newColorElement, { commitResult: false })
  }
}

export const addPaletteColor = (colorHex, autoDeselect = true) => {
  if (autoDeselect) {
    deselectAll()
  }
  const animateNewColor = (state.lastAddedColorId === false)
  removeLastAddedColorIfNeeded()
  const newColor = {
    id: 1000 + state.colors.length,
    initialHex: colorHex,
    brightness: getHexBrightness(colorHex),
    finalHex: colorHex,
  }
  state.lastAddedColorId = newColor.id
  state.colors.unshift(newColor)
  addNewColorDom(newColor.id, true, true, animateNewColor)
  selectColor(newColor.id, false)
  refs.colorsContainer.scrollLeft = 0
}

const toggleParams = () => {
  if (refs.paramsContainer.classList.contains('params-container-visible')) {
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
  refs.paramsContainer.classList.add('params-container-visible')
}

export const closeParams = () => {
  if (state.paramsTimeout !== false) {
    refs.paramsContainer.classList.remove('params-container-visible')
    clearTimeout(state.paramsTimeout)
    state.paramsTimeout = false
  }
}

const getFinalColorById = (idColor) => state.colors.find(c => c.id === idColor).finalHex

const updateParamsByColor = (idColor, showParams = true) => {
  if (Number.isInteger(idColor)) {
    if (showParams) {
      openParams()
    }
    const color = state.colors.find(c => c.id === idColor)

    // set slider brightness
    refs.brightnessLabel.innerHTML = color.brightness
    refs.brightnessCursor.style.left = `${color.brightness}%`
    const gradientMiddleColor = applyBrightnessToHex(color.initialHex, 50)
    refs.brightnessSlider.style.background = `linear-gradient(to right, #000000 0%, ${gradientMiddleColor} 50%, #ffffff 100%)`

    // set suggested colors
    updateSuggestedColorByHex(color.finalHex)
  }
}

const updateSuggestedColorByHex = (hex) => {
  refs.suggestedContainer.innerHTML = ''
  const suggestedColors = getSuggestedColors(hex)
  suggestedColors.forEach(c => {
    const newColorElement = createDom('editor-colorpicker__color')
    newColorElement.style.backgroundColor = c
    newColorElement.setAttribute('data-hex', c)
    refs.suggestedContainer.appendChild(newColorElement)
  })
}

const onSuggestedColorsTouchStart = (e) => {
  e.preventDefault()
  if (e.target.classList.contains('editor-colorpicker__color')) {
    const colorHex = e.target.getAttribute('data-hex')
    addPaletteColor(colorHex)
  }
}

const updateColorBrightness = (brightness) => {
  let finalHex
  openParams()
  state.colors = state.colors.map(c => {
    if (c.id === state.selectedColorId) {
      finalHex = applyBrightnessToHex(c.initialHex, brightness)
      c.brightness = brightness
      c.finalHex = finalHex
    }
    return c
  })
  updateSuggestedColorByHex(finalHex)
  refs.brightnessCursor.style.left = `${brightness}%`
  refs.brightnessLabel.innerHTML = `${brightness}`
  const target = refs.colorsContainer.querySelector(`div[data-id="${state.selectedColorId}"]`)
  target.style.backgroundColor = finalHex
  setToolColor(finalHex, false)
}

const removeLastAddedColorIfNeeded = () => {
  if (state.lastAddedColorId) {
    document.querySelector(`div[data-id="${state.lastAddedColorId}"]`).remove()
    state.colors = state.colors.filter(c => c.id !== state.lastAddedColorId)
    state.lastAddedColorId = false
  }
}

const confirmLastRandomColor = () => {
  if (state.currentRandomColor && state.currentRandomColor !== state.colors[0]?.initialHex) {
    addPaletteColor(state.currentRandomColor)
  }
}

export const confirmLastAddedColorIfNeeded = () => {
  if (state.lastAddedColorId) {
    saveDrawingsPalette(state.colors)
    state.lastAddedColorId = false
  }
}

export const getCurrentColorsPalette = () => state.colors

export const getCurrentSelectedColorId = () => (parseInt(state.selectedColorId) || -1)

export const getRandomColor = () => {
  state.currentRandomColor = getRandomHexColor()
  return state.currentRandomColor
}

const deselectAll = () => {
  deselectPipette()
  resetRandom()
  deselectCurrentColor()
}

const deselectCurrentColor = () => {
  const selected = refs.colorPickerContainer.querySelector('.editor-colorpicker__color-selected')
  if (selected) {
    selected.classList.remove('editor-colorpicker__color-selected')
  }
}

const resetRandom = () => {
  refs.randomButtom.classList.remove('editor-colorpicker__random-selected')
  refs.randomButtom.classList.remove('editor-colorpicker__random-locked')
}

const selectColor = (idColor, autoDeselect = true, showParams = true) => {
  if (autoDeselect) {
    deselectAll()
  }
  Layers.closeResizeModeIfNeeded()
  state.lastSelectedColorId = idColor
  updateParamsByColor(idColor, showParams)
  const target = refs.colorsContainer.querySelector(`div[data-id="${idColor}"]`)
  target.classList.add('editor-colorpicker__color-selected')
  state.selectedColorId = idColor
  setToolColor(getFinalColorById(idColor), false)
}

const selectRandom = (autoDeselect = true) => {
  if (autoDeselect) {
    deselectAll()
  }
  Layers.closeResizeModeIfNeeded()
  state.selectedColorId = 'random'
  state.lastSelectedColorId = 'random'
  refs.randomButtom.classList.add('editor-colorpicker__random-selected')
  setToolColor(false, true)
}

const selectPipette = (autoDeselect = true) => {
  if (!refs.pipetteButtom.classList.contains('editor-colorpicker__pipette-selected')) {
    if (autoDeselect) {
      deselectAll()
    }
    state.selectedColorId = 'pipette'
    Tools.clickButton('pipette')
    refs.pipetteButtom.classList.add('editor-colorpicker__pipette-selected')
  }
}

export const deselectPipette = (selectLastUsedTool = true, showToolChange = false, selectLastUsedColor = false) => {
  if (refs.pipetteButtom && refs.pipetteButtom.classList.contains('editor-colorpicker__pipette-selected')) {
    refs.pipetteButtom.classList.remove('editor-colorpicker__pipette-selected')
    hidePipetteCursor()
    if (selectLastUsedTool) {
      Tools.selectLastUsedTool(showToolChange)
    }
    if (selectLastUsedColor) {
      if (state.lastSelectedColorId === 'random') {
        selectRandom(false)
      } else {
        selectColor(state.lastSelectedColorId, false)
      }
    } else {
      state.colors.length && selectColor(state.colors[0].id)
    }
  }
}

const reorderColorsList = () => {
  state.colors.forEach(color => refs.colorsContainer.appendChild(refs.colorsContainer.querySelector(`div[data-id="${color.id}"]`)))
}

const onDragChange = (draggedElement, newIndex) => {
  const idColor = parseInt(draggedElement.getAttribute('data-id'))
  const currentIndex = state.colors.findIndex(c => c.id === idColor)
  shiftArrayElement(state.colors, currentIndex, newIndex)
  reorderColorsList()
}

const startDragColor = (e, colorDom) => {
  closeParams()
  preventDefault(e)
  handleElementsListDragAndDrop(e, refs.colorsContainer, colorDom, onDragChange, 'horizontal')
}

const onListClick = (e) => {
  if (e.target.classList.contains('editor-colorpicker__color')) {
    confirmLastAddedColorIfNeeded()
    if (e.target.classList.contains('editor-colorpicker__color-selected')) {
      toggleParams()
    } else {
      const idColor = parseInt(e.target.getAttribute('data-id'))
      selectColor(idColor)
    }
  }
}

const onListLongPress = (e) => {
  if (state.colors.length > 1) {
    if (e.target.classList.contains('editor-colorpicker__color')) {
      selectColor(parseInt(e.target.getAttribute('data-id')))
      startDragColor(e, e.target)
    }
  }
}

const onRandomTouchStart = (e) => {
  preventDefault(e)
  closeParams()
  if (state.selectedColorId === 'random') {
    confirmLastRandomColor()
  } else {
    selectRandom()
  }
}

const onPipetteTouchStart = (e) => {
  preventDefault(e)
  closeParams()
  if (state.selectedColorId == 'pipette') {
    deselectPipette(true, true, true)
  } else {
    selectPipette()
  }
}

const onInputChange = (e) => {
  addPaletteColor(e.target.value)
}

const deleteSelectedColor = (e) => {
  preventDefault(e)
  if (Number.isInteger(state.selectedColorId)) {
    closeParams()
    removeOutElement(refs.colorsContainer.querySelector(`div[data-id="${state.selectedColorId}"]`))
    state.colors = state.colors.filter(c => c.id !== state.selectedColorId)
    if (state.lastAddedColorId === state.selectedColorId) {
      state.lastAddedColorId = false
    }
    selectRandom(true)
  }
}

const initDom = async(container) => {
  let dom = await loadTemplate(tplColorPicker, {
    colors: state.colors, // []
    labels,
  }, container)
  refs.colorPickerContainer = dom[0]
  refs.randomButtom = refs.colorPickerContainer.querySelector('.editor-colorpicker__random')
  refs.pipetteButtom = refs.colorPickerContainer.querySelector('.editor-colorpicker__pipette')
  refs.colorsContainer = refs.colorPickerContainer.querySelector('.editor-colorpicker__colors-container')
  refs.input = refs.colorPickerContainer.querySelector('.editor-colorpicker__input-container input')
  refs.paramsContainer = dom[1]
  refs.brightnessSlider = refs.paramsContainer.querySelector('.editor-colorpicker__brightness-slider')
  refs.brightnessCursor = refs.paramsContainer.querySelector('.editor-colorpicker__brightness-slider div')
  refs.brightnessLabel = refs.paramsContainer.querySelector('.editor-colorpicker__brightness-slider div span')
  refs.suggestedContainer = refs.paramsContainer.querySelector('.editor-colorpicker__suggested-container')
  refs.deleteButton = refs.paramsContainer.querySelector('.editor-colorpicker__delete-button')

  addListHorizontalScrollClickAndPressHandlers(refs.colorsContainer, onListClick, onListLongPress)
  refs.input.addEventListener('input', onInputChange)
  refs.randomButtom.addEventListener(Params.eventStart, onRandomTouchStart)
  refs.pipetteButtom.addEventListener(Params.eventStart, onPipetteTouchStart)
  refs.suggestedContainer.addEventListener(Params.eventStart, onSuggestedColorsTouchStart)
  refs.deleteButton.addEventListener(Params.eventStart, deleteSelectedColor)
  addHorizontalDragSliderHandler(refs.brightnessCursor, refs.brightnessSlider, updateColorBrightness, 100, 0, false, 0)

  preventDefaultTouchOnEls(
    refs.colorPickerContainer.querySelector('.editor-colorpicker__random-container'),
    refs.colorPickerContainer.querySelector('.editor-colorpicker__pipette-container'),
    refs.brightnessSlider
  )
  refs.colorPickerContainer.querySelector('.editor-colorpicker__input').addEventListener(Params.eventStart, (e) => {
    if (e.target.tagName.toLowerCase() !== 'input') {
      preventDefault(e)
    }
  })
  dom = undefined
}

export const init = async(container, drawingColors = [], selectedColorId = -1) => {
  config.initialColors = INITIAL_COLORS.map((c, i) => ({
    id: i,
    initialHex: c,
    brightness: getHexBrightness(c),
    finalHex: c,
  }))
  state = deepCopy(initialState)
  await initDom(container)
  const colors = (drawingColors.length ? drawingColors : config.initialColors)
  updateColorPalette(colors)

  if (selectedColorId >= 0 && colors.find(c => c.id === selectedColorId)) {
    selectColor(selectedColorId, true, false)
  } else {
    selectRandom(true)
  }
  refs.colorsContainer.scrollLeft = 0
}

export const remove = async() => {
  closeParams()
  clearTimeout(state.paramsTimeout)
  state = {}
  config.initialColors = []
  cleanRefs(refs)
}
