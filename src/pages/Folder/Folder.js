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
import { deepCopy, copyTextToClipboard } from 'utils/jsUtils'
import { addListScrollClickAndPressHandlers } from 'utils/uiUtils'

import { goToPage } from 'modules/Router'
import * as Coworking from 'modules/Coworking'


const config = {
  updateDrawingsLoadingDelay: 1000, // ms
}
let state = {}
const initialState = {
  checkDrawingsInterval: false,
  loadingDrawingsIds: [],
  selectionMode: false,
  coworkingPopupOpened: false,
  sendCheckboxChecked: false,
}
const refs = {
  container: null,
  drawingsContainer: null,
  selectButton: null,
  doneButton: null,
  exportButton: null,
  deleteButton: null,
  sendButton: null,
  topnav: null,
  coworkingPopup: null,
  coworkingId: null,
  copyCoworkingUrlButton: null,
  copiedCoworkingLabel: null,
  // sendPopup: null,
  // sendPopupCheckbox: null,
  // confirmSendPopupButton: null,
}
const labels = {
  select: 'Select',
  done: 'Done',
  offline: 'OFFLINE',
  areYouSure: 'Are you sure?',
  tapAndHoldOneImage: 'Tap and hold the image to share it',
  tapAndHoldImages: 'Tap and hold an image to share it',
  withWhiteBackground: 'With white background',
  withoutBackground: 'With no background',
  newDrawing: 'Draw alone',
  drawWithAFriend: 'Draw with a friend',
  navbarTitle: 'YOUR DRAWINGS',
  tapToShare: '^ Double tap to share ^',
  copied: 'Copied!',
  coworkingPopupTitle: 'Send this url to a friend to start drawing together',
  coworkingPopupIstructions1: 'Each unique url works for one session only.',
  coworkingPopupIstructions2: 'Do not reload the page until your friend has connected.',
  waitingToReconnect: 'Waiting for connections...',
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

const copyCoworkingUrl = (() => {
  let lastTapTimestamp = 0
  const doubleTapDelay = 250
  return () => {
    copyTextToClipboard(refs.coworkingId.innerHTML)
    const now = Date.now()
    if (Params.isDesktop || now - lastTapTimestamp < doubleTapDelay) {
      refs.copyCoworkingUrlButton.classList.add('displayNone')
      refs.copiedCoworkingLabel.classList.remove('displayNone')
    }
    lastTapTimestamp = now
  }
})()

const shareCoworkingUrl = (e) => {
  preventDefault(e)
  copyCoworkingUrl()
  if (!Params.isDesktop && navigator.share) {
    navigator.share({
      title: 'Let\'s draw together on Drawith.me',
      // text: 'Let\'s draw together on Drawith.me',
      url: refs.coworkingId.innerHTML,
    })
  }
}

const onCloseCoworkingPopup = () => {
  state.coworkingPopupOpened = false
}

export const closeCoworkingPopup = () => {
  if (state.coworkingPopupOpened) {
    onCloseCoworkingPopup()
    Messages.panel(refs.coworkingPopup)
  }
}

const openCoworkingPopup = (e) => {
  preventDefault(e)
  if (Coworking.isOnline()) {
    state.coworkingPopupOpened = true
    refs.coworkingId.innerHTML = `${document.location.origin}${document.location.pathname}?S=${Coworking.getSocketId()}`
    Messages.panel(refs.coworkingPopup, {
      onClose: onCloseCoworkingPopup,
    })
    refs.copyCoworkingUrlButton.classList.remove('displayNone')
    refs.copiedCoworkingLabel.classList.add('displayNone')
  }
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
  // } else if (e.target === refs.sendButton) {
  //   sendButtonClick()
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
  refs.coworkingPopup = refs.container.querySelector('.folder__coworking-popup')
  refs.coworkingId = refs.coworkingPopup.querySelector('.folder__coworking-popup-id')
  refs.copyCoworkingUrlButton = refs.coworkingPopup.querySelector('.folder__coworking-popup-copy')
  refs.copiedCoworkingLabel = refs.coworkingPopup.querySelector('.folder__coworking-popup-copied')
  refs.topnav.addEventListener(Params.eventStart, onTopnavTouchStart, true)
  refs.coworkingId.addEventListener(Params.eventStart, shareCoworkingUrl)
  refs.copyCoworkingUrlButton.addEventListener(Params.eventStart, shareCoworkingUrl)
  refs.coworkingPopup.querySelector('.folder__coworking-copy-icon').addEventListener(Params.eventStart, shareCoworkingUrl)
  refs.coworkingPopup.addEventListener(Params.eventStart, preventDefault)
  refs.container.querySelector('.folder__drawing-new-drawing').addEventListener(Params.eventStart, createNewDrawing)
  refs.container.querySelector('.folder__drawing-new-coworking').addEventListener(Params.eventStart, openCoworkingPopup)
  refs.container.querySelector('.folder__new-container').addEventListener(Params.eventStart, preventDefault)
  refs.coworkingPopup.remove()
  addListScrollClickAndPressHandlers(refs.drawingsContainer, onDrawingClick, onDrawingLongPress)
  toolsButtons.push(refs.exportButton, refs.deleteButton /*, refs.sendButton */)
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
  closeCoworkingPopup()
  clearInterval(state.checkDrawingsInterval)
  toolsButtons = []
  state = {}
  cleanRefs(refs)
}
