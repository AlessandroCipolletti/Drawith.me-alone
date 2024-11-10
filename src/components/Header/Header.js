const tplHeader = require('./header.tpl')
import './header.css'

import Params from 'main/Params'
import { preventDefault, loadTemplate } from 'utils/domUtils'
import { fadeInElements, fadeOutElements } from 'utils/animationsUtils'

const refs = {
  container: null,
}

export const hide = () => {
  fadeOutElements([refs.container])
}

export const show = () => {
  fadeInElements([refs.container])
}

const initDom = async() => {
  refs.container = await loadTemplate(tplHeader, {}, Params.pagesContainer)
  refs.container.addEventListener(Params.eventStart, preventDefault)
}

export const init = async() => {
  await initDom()
}
