const tplPage = require('./info.tpl')
import './info.css'

import Params from 'main/Params'
import { cleanRefs } from 'utils/moduleUtils'
import { loadTemplate, preventDefault } from 'utils/domUtils'
import { fadeInElements, fadeOutElements } from 'utils/animationsUtils'
import { openPageAboutUs } from 'modules/Router'
import { deselectAllTabs, selectOneTab } from 'utils/uiUtils'


const refs = {
  container: null,
}
const labels = {
  createdBy: 'Created by',
  version: 'Version',
  and: 'and',
  aboutUs: 'About us',
}


const initDom = async() => {
  refs.container = await loadTemplate(tplPage, {
    labels,
    version: Params.appVersion,
  }, Params.pagesContainer)
  if (Array.isArray(refs.container)) {
    refs.container = refs.container[0]
  }

  refs.container.addEventListener('gesturestart', preventDefault)
  refs.container.querySelector('.tabs-header div[data-tab-id="about-us"]').addEventListener(Params.eventStart, openPageAboutUs)
}

export const aboutUs = () => {
  deselectAllTabs(refs.container)
  selectOneTab(refs.container, 'about-us')
}

export const open = async() => {
  await initDom()
  aboutUs()
  fadeInElements(refs.container)
}

export const close = async() => {
  await fadeOutElements(refs.container)
  cleanRefs(refs)
}
