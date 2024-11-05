const tplPage = require('./tpl/folder.tpl')
const tplContent = require('./tpl/folderContent.tpl')
const tplSharePopup = require('./tpl/folderSharePopup.tpl')
import './tpl/folder.css'
import './tpl/folderContent.css'
import './tpl/folderSharePopup.css'

import Params from 'main/Params'
import * as Messages from 'modules/Messages'
import * as LocalDB from 'utils/localDbUtils'
import { removeSpinnerOverlayFrom, addSpinnerOverlayTo, setSpinner, loadTemplate, preventDefault, enableElements, disableElements } from 'utils/domUtils'
import { fadeInElements, fadeOutElements } from 'utils/animationsUtils'
import { addGlobalStatus, removeGlobalStatus } from 'utils/moduleUtils'
import { cleanRefs } from 'utils/moduleUtils'
import { shareImageWithBase64 } from 'utils/imageUtils'
import { deepCopy } from 'utils/jsUtils'
import { addListScrollClickAndPressHandlers } from 'utils/uiUtils'

import { goToPage } from 'modules/Router'


const config = {
  updateDrawingsLoadingDelay: 1000, // ms
}
let state = {}
const initialState = {
  checkDrawingsInterval: false,
  loadingDrawingsIds: [],
  selectionMode: false,
}
const refs = {
  container: null,
  drawingsContainer: null,
  selectButton: null,
  doneButton: null,
  exportButton: null,
  deleteButton: null,
  topnav: null,
}
const labels = {
  select: 'Select',
  done: 'Done',
  areYouSure: 'Are you sure?',
  tapAndHoldOneImage: 'Tap and hold the image to share it',
  tapAndHoldImages: 'Tap and hold an image to share it',
  withWhiteBackground: 'With white background',
  withoutBackground: 'With no background',
  newDrawing: 'New drawing',
  navbarTitle: 'YOUR DRAWINGS',
}

let toolsButtons = []


const createNewDrawing = (e) => {
  preventDefault(e)
  setSpinner(true)
  goToPage('editor/open/')
}

const openDrawing = async(drawingId) => {
  setSpinner(true)
  goToPage(`editor/open/${drawingId}`)
}

const onDrawingClick = (e) => {
  if (e.target.classList.contains('folder__drawing') || e.target.classList.contains('folder__drawing-preview')) {
    let touchedDrawing = e.target
    if (e.target.classList.contains('folder__drawing-preview')) {
      touchedDrawing = e.target.parentNode
    }
    if (state.selectionMode) {
      if (!touchedDrawing.classList.contains('folder__drawing-new-drawing')) {
        touchedDrawing.classList.toggle('folder__drawing-selected')
        updateTopnavButtons()
      }
    } else {
      openDrawing(touchedDrawing.getAttribute('data-local-id'))
    }
  }
}

const onDrawingLongPress = (e) => {
  onDrawingClick(e)
}

const updateTopnavButtons = () => {
  if (refs.drawingsContainer.querySelectorAll('.folder__drawing-selected').length) {
    enableElements(toolsButtons)
  } else {
    disableElements(toolsButtons)
  }
}

const onTopnavTouchStart = (e) => {
  preventDefault(e)
  if (e.target === refs.selectButton) {
    selectButtonClick()
  } else if (e.target === refs.doneButton) {
    doneButtonClick()
  } else if (e.target === refs.exportButton) {
    exportButtonClick()
  } else if (e.target === refs.deleteButton) {
    deleteButtonClick()
  }
}

const selectButtonClick = () => {
  if (refs.selectButton.classList.contains('disabled') || refs.selectButton.classList.contains('displayNone')) {
    return
  }
  state.selectionMode = true
  addGlobalStatus('drawith__FOLDER-SELECT-MODE')
  refs.selectButton.classList.add('disabled', 'displayNone')
  refs.doneButton.classList.remove('disabled', 'displayNone')
}

const doneButtonClick = () => {
  if (refs.doneButton.classList.contains('disabled') || refs.doneButton.classList.contains('displayNone')) {
    return
  }
  state.selectionMode = false
  removeGlobalStatus('drawith__FOLDER-SELECT-MODE')
  refs.doneButton.classList.add('disabled', 'displayNone')
  refs.selectButton.classList.remove('disabled', 'displayNone')
  deselectAll()
}

const exportButtonClick = async() => {
  if (refs.exportButton.classList.contains('disabled')) {
    return
  }
  setSpinner(true)
  let drawings = await Promise.all(
    getSelectedIds().map(LocalDB.getOneDrawing)
  )

  drawings = drawings.map(d => d.bitmap)
  drawings = await Promise.all(
    drawings.map(async(drawing) => ({
      w: await shareImageWithBase64(drawing, true), // white bg
      t: await shareImageWithBase64(drawing, false), // transparent bg
    }))
  )
  const popupContent = await loadTemplate(tplSharePopup, {
    drawings,
    subtitleLabel: drawings.length === 1 ? labels.tapAndHoldOneImage : labels.tapAndHoldImages,
    withoutBackgroundLabel: labels.withoutBackground,
    withBackgroundLabel: labels.withWhiteBackground,
  })
  drawings = undefined
  popupContent.addEventListener('gesturestart', preventDefault)

  setSpinner(false)
  Messages.panel(popupContent, {
    // onClose: doneButtonClick,
  })
}

const deleteButtonClick = async() => {
  if (refs.deleteButton.classList.contains('disabled')) {
    return
  }
  if (await Messages.confirm(labels.areYouSure)) {
    deleteSelectedDrawings()
  }
}

const deleteSelectedDrawings = async() => {
  setSpinner(true)
  const currentIds = getSelectedIds()
  disableElements(toolsButtons)
  await LocalDB.deleteLocalDrawings(currentIds)
  await refreshContent()
  doneButtonClick()
  setSpinner(false)
}

const deselectAll = () => {
  const selected = refs.drawingsContainer.querySelectorAll('.folder__drawing-selected')
  for (let i = selected.length; i--; ) {
    selected[i].classList.remove('folder__drawing-selected')
  }
  disableElements(toolsButtons)
}

const getSelectedIds = () => {
  return [...refs.drawingsContainer.querySelectorAll('.folder__drawing-selected')]
    .map(el => parseInt(el.getAttribute('data-local-id')))
}

const updateDrawingsLoading = async() => {
  const drawings = await LocalDB.getSomeDrawings(state.loadingDrawingsIds)
  for (const drawing of drawings) {
    const drawingDom = document.querySelector(`.folder__drawing[data-local-id="${drawing.localDbId}"]`)
    if (LocalDB.drawingIsSaving(drawing)) {
      if (!drawingDom.classList.contains('folder__drawing-saving')) {
        drawingDom.classList.add('folder__drawing-saving')
        addSpinnerOverlayTo(drawingDom, false)
      }
    } else if (drawingDom.classList.contains('folder__drawing-saving')) {
      drawingDom.classList.remove('folder__drawing-saving')
      removeSpinnerOverlayFrom(drawingDom)
    }
    drawingDom.classList.toggle('folder__drawing-saving', LocalDB.drawingIsSaving(drawing))
  }

  state.loadingDrawingsIds = drawings.filter(LocalDB.drawingIsSaving).map(d => d.localDbId)
  if (state.loadingDrawingsIds.length === 0) {
    clearInterval(state.checkDrawingsInterval)
  }
}

export const refreshContent = async() => {
  let drawings = await LocalDB.getAllLocalDrawings()
  const currentScroll = refs.drawingsContainer.scrollTop
  refs.drawingsContainer.innerHTML = ''
  await loadTemplate(tplContent, { drawings }, refs.drawingsContainer)
  refs.drawingsContainer.scrollTop = currentScroll
  refs.topnav.classList.toggle('displayNone', !drawings.length)

  state.loadingDrawingsIds = drawings.filter(LocalDB.drawingIsSaving).map(d => d.localDbId)
  if (state.loadingDrawingsIds.length > 0) {
    updateDrawingsLoading()
    clearInterval(state.checkDrawingsInterval)
    state.checkDrawingsInterval = setInterval(updateDrawingsLoading, config.updateDrawingsLoadingDelay)
  }

  drawings = undefined
}

const initDom = async() => {
  refs.container = await loadTemplate(tplPage, {
    labels,
  }, Params.pagesContainer)
  refs.selectButton = refs.container.querySelector('.folder__topbar-button-select')
  refs.doneButton = refs.container.querySelector('.folder__topbar-button-done')
  refs.exportButton = refs.container.querySelector('.folder__topbar-button-export')
  refs.deleteButton = refs.container.querySelector('.folder__topbar-button-delete')
  refs.topnav = refs.container.querySelector('.folder__topbar')
  refs.drawingsContainer = refs.container.querySelector('.folder__drawings-container')
  refs.topnav.addEventListener(Params.eventStart, onTopnavTouchStart, true)
  refs.container.querySelector('.folder__drawing-new-drawing').addEventListener(Params.eventStart, createNewDrawing)
  refs.container.querySelector('.folder__new-container').addEventListener(Params.eventStart, preventDefault)
  addListScrollClickAndPressHandlers(refs.drawingsContainer, onDrawingClick, onDrawingLongPress)
  toolsButtons.push(refs.exportButton, refs.deleteButton)
}

export const open = async() => {
  state = deepCopy(initialState)
  await initDom()
  setSpinner(true)
  await refreshContent()
  setSpinner(false)
  addGlobalStatus('drawith__FOLDER-OPEN')
  fadeInElements(refs.container)
}

export const close = async() => {
  await fadeOutElements(refs.container)
  removeGlobalStatus('drawith__FOLDER-OPEN')
  clearInterval(state.checkDrawingsInterval)
  toolsButtons = []
  state = {}
  cleanRefs(refs)
}
