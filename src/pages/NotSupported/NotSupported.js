const tplPage = require('./notSupported.tpl')
import './notSupported.css'
import imageUrl from 'static/img/sadness.png'

import { osVersion, isSmartTV, browserName, isWearable, isAndroid, browserVersion, isIOS, isIE, isConsole, isWinPhone, isOpera } from 'mobile-device-detect'
import { addGlobalStatus } from 'src/utils/moduleUtils'
import { config } from './config'
import Params from 'main/Params'
import { loadTemplate } from 'utils/domUtils'


const labels = {
  sorry: 'We\'re sorry',
  isNoLongerSupported: 'is no longer supported',
  noNativeBrowsers: 'Native browsers are not supported, please use Chrome',
  areNotSupported: 'are not supported',
  deviceNotSupported: 'This device is not supported',
  checkUpdate: 'please check for an update',
  browserNotSupported: 'This browser is not supported, please use Chrome',
}

const getTitle = () => {
  return `${labels.sorry}`
}

const getSubTitle = () => {
  if (isIOS) {
    return `iOS ${browserVersion} ${labels.isNoLongerSupported}`
  } else if (isAndroid) {
    if (parseInt(osVersion) < config.android.minVersion) {
      return `Android ${osVersion} ${labels.isNoLongerSupported}`
    } else if (!browserName.toLowerCase().includes('chrome')) {
      return `${labels.noNativeBrowsers}`
    } else if (parseInt(browserVersion) < config.android.minBrowserVersion) {
      return `Chrome ${parseInt(browserVersion)} ${labels.isNoLongerSupported}, ${labels.checkUpdate}`
    }
  } else if (isIE) {
    return `Internet Explorer ${labels.isNoLongerSupported}`
  } else if (isSmartTV) {
    return `Smart TVs ${labels.areNotSupported}`
  } else if (isWearable) {
    return labels.deviceNotSupported
  } else if (isConsole) {
    return 'Are you serious bro?'
  } else if (isWinPhone) {
    return labels.deviceNotSupported
  } else if (isOpera) {
    return labels.browserNotSupported
  } else {
    return labels.deviceNotSupported
  }
}

export const open = async() => {
  const title = getTitle()
  const subTitle = getSubTitle()
  await loadTemplate(tplPage, {
    title,
    subTitle,
    imageUrl,
  }, Params.pagesContainer)
  addGlobalStatus('drawith__NOT_SUPPORTED')
}
