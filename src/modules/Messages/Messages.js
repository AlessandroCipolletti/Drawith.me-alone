const tpl = require('./messages.tpl')
import './messages.css'
import { debounce } from 'debounce'

import Params from 'main/Params'
import { addGlobalStatus, removeGlobalStatus } from 'utils/moduleUtils'
import { preventDefault, loadTemplate, createDom, redrawDomElement } from 'utils/domUtils'
import { fadeInElements, fadeOutElements } from 'utils/animationsUtils'
import { delay } from 'utils/jsUtils'


const config = {
  defaultCloseDelay: 3500,
}
const state = {
  messageIsVisible: false,
  panelIsVisible: false,
  currentIsMandatory: false,
  currentPanelOnClose: false,
}
const refs = {
  messageDom: null,
  messageText: null,
  overlay: null,
  confirmButton: null,
  cancelButton: null,
  panel: null,
  updateDom: null,
  currentPanelcontent: null,
  icon: null,
  inputText: null,
  multipleChoice: null,
}
const labels = {
  ok: 'Ok',
  cancel: 'Cancel',
}

let autoCloseTimeout = false
let messagesStack = []


const setType = (type) => {
  resetType()
  refs.messageDom.classList.add(`messages__container-${type}`)
  refs.icon.classList.add(`svg-icon-${type}`)
}

const resetType = () => {
  refs.messageDom.classList.remove(
    'messages__container-success',
    'messages__container-error',
    'messages__container-info',
    'messages__container-alert',
    'messages__container-confirm',
    'messages__container-input',
    'messages__container-warning'
  )
  refs.icon.classList.remove(
    'svg-icon-success',
    'svg-icon-error',
    'svg-icon-info',
    'svg-icon-alert',
    'svg-icon-confirm',
    'svg-icon-input',
    'svg-icon-warning'
  )
}

const show = (mandatory = false, closeDelay = config.defaultCloseDelay) => {
  state.currentIsMandatory = mandatory
  addGlobalStatus('drawith__MESSAGE-OPEN')
  if (mandatory) {
    addGlobalStatus('drawith__MESSAGE-MANDATORY-OPEN')
    fadeInElements(refs.overlay)
  } else {
    autoCloseTimeout = setTimeout(hide, closeDelay)
  }
}

export const hide = (preventNextMessage = false) => {
  state.messageIsVisible = false
  removeGlobalStatus('drawith__MESSAGE-OPEN')
  if (state.currentIsMandatory) {
    removeGlobalStatus('drawith__MESSAGE-MANDATORY-OPEN')
    fadeOutElements(refs.overlay)
    state.currentIsMandatory = false
  }
  if (autoCloseTimeout) {
    clearTimeout(autoCloseTimeout)
    autoCloseTimeout = false
  }
  if (!preventNextMessage) {
    setTimeout(onHide, 200)
  }
}

const onHide = () => {
  const nextMessage = messagesStack.splice(0, 1)[0]
  if (nextMessage) {
    if (nextMessage.type === 'input' || nextMessage.type === 'confirm') {
      allMessageTypes[nextMessage.type](nextMessage.msg, nextMessage.mandatory, nextMessage.onConfirm, nextMessage.onCancel)
    } else {
      allMessageTypes[nextMessage.type](nextMessage.msg)
    }
  }
}

const makeMessage = (type, msg, mandatory, closeDelay = config.defaultCloseDelay) => {
  if (state.messageIsVisible) {
    messagesStack.push({ type, msg, mandatory })
  } else {
    state.messageIsVisible = true
    setType(type)
    redrawDomElement(refs.messageDom)
    refs.messageText.innerHTML = msg
    requestAnimationFrame(() => {
      show(mandatory, closeDelay)
    })
  }
}

const onMessageTouchStart = async(e) => {
  preventDefault(e)
  if (
    refs.messageDom.classList.contains('messages__container-success') ||
    refs.messageDom.classList.contains('messages__container-warning') ||
    refs.messageDom.classList.contains('messages__container-error') ||
    refs.messageDom.classList.contains('messages__container-info')
  ) {
    await delay(50)
    hide()
  }
}

const onButtonClick = (callback) => {
  hide()
  callback && callback()
}

const removeAllListeners = (button) => {
  const newButton = button.cloneNode(true)
  button.parentNode.appendChild(newButton)
  button.parentNode.removeChild(button)
  button = undefined
  return newButton
}

export const alert = (msg, callback) => {
  if (state.messageIsVisible) {
    hide(true)
  }
  refs.confirmButton = removeAllListeners(refs.confirmButton)
  refs.confirmButton.addEventListener(Params.eventStart, onButtonClick.bind({}, callback))
  makeMessage('alert', msg, true)
}

export const multipleChoice = (options = []) => {
  const makeCallback = (action, e) => {
    preventDefault(e)
    panel(refs.multipleChoice)
    action()
  }

  refs.multipleChoice.innerHTML = ''
  options = options.forEach(op => {
    const dom = createDom()
    dom.addEventListener(Params.eventStart, makeCallback.bind({}, op.action))
    dom.innerHTML = op.label
    refs.multipleChoice.appendChild(dom)
  })

  const dom = createDom('option-cancel')
  dom.addEventListener(Params.eventStart, makeCallback.bind({}, () => {}))
  dom.innerHTML = labels.cancel
  refs.multipleChoice.appendChild(dom)

  panel(refs.multipleChoice)
}

export const info = (msg, closeDelay = config.defaultCloseDelay) => {
  makeMessage('info', msg, false, closeDelay)
}

export const success = (msg, closeDelay = config.defaultCloseDelay) => {
  makeMessage('success', msg, false, closeDelay)
}

export const error = (msg, closeDelay = config.defaultCloseDelay) => {
  makeMessage('error', msg, false, closeDelay * 1.4)
}

export const warning = (msg, closeDelay = config.defaultCloseDelay) => {
  makeMessage('warning', msg, false, closeDelay)
}

export const update = (msg) => {
  refs.updateDom.innerHTML = msg
  fadeInElements(refs.updateDom)
  closeUpdateMsg()
}

const closeUpdateMsg = debounce(() => {
  fadeOutElements(refs.updateDom)
}, 1500)

export const confirm = (msg, mandatory = true, closeDelay = config.defaultCloseDelay) => {
  return new Promise((resolve, reject) => {
    const onConfirm = () => resolve(true)
    const onCancel = () => resolve(false)
    if (state.messageIsVisible) {
      hide(true)
    }
    refs.cancelButton = removeAllListeners(refs.cancelButton)
    refs.confirmButton = removeAllListeners(refs.confirmButton)
    refs.confirmButton.addEventListener(Params.eventStart, onButtonClick.bind({}, onConfirm))
    refs.cancelButton.addEventListener(Params.eventStart, onButtonClick.bind({}, onCancel))
    makeMessage('confirm', msg, mandatory, closeDelay)
  })
}

export const input = (msg, initialValue, mandatory = true, closeDelay = config.defaultCloseDelay) => {
  return prompt(msg, initialValue)
  // return new Promise((resolve, reject) => {
  //   const onConfirm = () => resolve(refs.inputText.value)
  //   const onCancel = () => resolve(false)
  //   if (state.messageIsVisible) {
  //     hide(true)
  //   }
  //   refs.cancelButton = removeAllListeners(refs.cancelButton)
  //   refs.confirmButton = removeAllListeners(refs.confirmButton)
  //   refs.confirmButton.addEventListener(Params.eventStart, onButtonClick.bind({}, onConfirm))
  //   refs.cancelButton.addEventListener(Params.eventStart, onButtonClick.bind({}, onCancel))
  //   refs.inputText.addEventListener(Params.eventStart, (e) => {
  //     e.target.focus()
  //     console.log('text', e)
  //   })
  //   refs.inputText.value = initialValue || ''
  //   makeMessage('input', msg, mandatory)
  //   refs.inputText.focus()
  // })
}

export const panel = async(content, {
  mandatory = false,
  force = false,
  onClose = false,
} = {}) => {
  if (!state.panelIsVisible || force) {
    state.panelIsVisible = true
    if (refs.currentPanelcontent) {
      refs.currentPanelcontent.remove()
      refs.currentPanelcontent = null
    }
    state.currentPanelOnClose = onClose
    content.classList.add('panel-content')
    refs.panel.innerHTML = ''
    refs.panel.appendChild(content)
    refs.currentPanelcontent = content
    fadeInElements([refs.panel, refs.overlay])
    if (!mandatory) {
      refs.overlay.addEventListener(Params.eventStart, panelCloseClick)
    }
  } else if (Object.is(refs.currentPanelcontent, content)) {
    await fadeOutElements([refs.panel, refs.overlay])
    onPanelClose()
  }
}

const panelCloseClick = async(e) => {
  preventDefault(e)
  if (state.panelIsVisible) {
    refs.overlay.removeEventListener(Params.eventStart, panelCloseClick)
    await fadeOutElements([refs.panel, refs.overlay])
    onPanelClose()
  }
}

const onPanelClose = () => {
  state.panelIsVisible = false
  refs.currentPanelcontent.remove()
  refs.currentPanelcontent = null
  if (state.currentPanelOnClose) {
    state.currentPanelOnClose()
    state.currentPanelOnClose = false
  }
}

const allMessageTypes = { alert, info, success, error, confirm, input, panel, warning }

const initDom = async() => {
  await loadTemplate(tpl, {
    labels,
  }, Params.pagesContainer)

  refs.overlay = document.querySelector('.messages__overlay')
  refs.messageDom = document.querySelector('.messages__container')
  refs.messageText = refs.messageDom.querySelector('.messages__text')
  refs.confirmButton = refs.messageDom.querySelector('.messages__button-ok')
  refs.cancelButton = refs.messageDom.querySelector('.messages__button-cancel')
  refs.panel = document.querySelector('.messages__panel')
  refs.updateDom = document.querySelector('.messages__update')
  refs.icon = document.querySelector('.messages__icon')
  refs.inputText = document.querySelector('.messages__container-text-input')
  refs.multipleChoice = document.querySelector('.messages__multiple-choice')
  refs.multipleChoice.remove()

  refs.messageDom.addEventListener(Params.eventStart, onMessageTouchStart)
  refs.updateDom.addEventListener(Params.eventStart, preventDefault)
  refs.overlay.addEventListener('gesturestart', preventDefault, true)
  refs.overlay.addEventListener(Params.eventStart, (e) => {
    e.preventDefault()
  }, true)
}

export const init = async() => {
  await initDom()
}
