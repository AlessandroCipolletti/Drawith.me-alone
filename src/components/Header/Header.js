const tplHeader = require('./header.tpl')
import './header.css'

import Params from 'main/Params'
import { toggleMainMenu } from 'main/main'
import { preventDefault, loadTemplate } from 'utils/domUtils'
import { fadeInElements, fadeOutElements } from 'utils/animationsUtils'
import { initBurgerButton } from './burgerButton'
import { addRotationHandler } from 'utils/moduleUtils'
import { spacing } from 'main/Theme'

// const config = {}
const state = {
  rightButtons: [],
  leftButtons: [],
}
const refs = {
  container: null,
  menuButton: null,
  refreshIcon: null,
}


export const addHeaderButton = (button, side = 'left', big = false) => {
  button.classList.add('header__button')
  if (big) {
    button.classList.add('header__button-big')
  }
  if (side === 'right') {
    state.rightButtons.push(button)
    updateRightButtonsPosition()
  } else {
    state.leftButtons.push(button)
    updateLeftButtonsPosition()
  }
  refs.container.appendChild(button)
}

export const removeHeaderButton = (button) => {
  if (state.rightButtons.includes(button) || state.leftButtons.includes(button)) {
    button.classList.remove('header__button', 'header__button-big')
    if (state.rightButtons.includes(button)) {
      state.rightButtons.splice(state.rightButtons.indexOf(button), 1)
      updateRightButtonsPosition()
    } else {
      state.leftButtons.splice(state.leftButtons.indexOf(button), 1)
      updateLeftButtonsPosition()
    }
    refs.container.removeChild(button)
  }
}

const updateRightButtonsPosition = () => {
  const padding = Params.isPhone && Params.width > Params.height ? spacing.PHONE_LANDSCAPE_PADDING : 0
  for (let i in state.rightButtons) {
    state.rightButtons[i].style.right = `${padding + i * spacing.HEADER_BUTTON_WIDTH + 0.5 * spacing.ONE_REM}px`
  }
}

const updateLeftButtonsPosition = () => {
  const padding = Params.isPhone && Params.width > Params.height ? spacing.PHONE_LANDSCAPE_PADDING : 0
  for (let i in state.leftButtons) {
    state.leftButtons[i].style.left = `${padding + i * spacing.HEADER_BUTTON_WIDTH + 0.5 * spacing.ONE_REM}px`
  }
}

export const hide = () => {
  fadeOutElements([refs.container])
}

export const show = () => {
  fadeInElements([refs.container])
}

const initDom = async() => {
  refs.container = await loadTemplate(tplHeader, {}, Params.pagesContainer)
  refs.menuButton = refs.container.querySelector('.menu-button')
  refs.menuButton.remove()
  addHeaderButton(refs.menuButton, 'left')
  refs.menuButton.utils = initBurgerButton(refs.menuButton)
  menuButtonAnimations = refs.menuButton.utils

  refs.refreshIcon = refs.container.querySelector('.header__refresh-icon')
  refs.refreshIcon.remove()
  addHeaderButton(refs.refreshIcon, 'left')

  refs.container.addEventListener(Params.eventStart, preventDefault)
  refs.menuButton.addEventListener(Params.eventStart, toggleMainMenu)
}

const onRotate = () => {
  updateRightButtonsPosition()
  updateLeftButtonsPosition()
}

export let menuButtonAnimations
export const init = async() => {
  await initDom()
  addRotationHandler(onRotate)
}
