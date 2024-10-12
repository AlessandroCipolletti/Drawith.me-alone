import { isAndroid, osName, isMobileOnly, isMobile, isTablet, isBrowser, isIOS, isMacOs, isIPad13, browserName } from 'mobile-device-detect'
import { getRealScreenWidth, getRealScreenHeight } from 'utils/moduleUtils'

const Params = {}

Params.init = (appState) => {
  Params.appName = appState.NAME
  Params.appVersion = appState.VERSION
  Params.isInstalledWebapp = !!window.navigator.standalone
  Params.isLocal = (document.location.hostname === 'localhost' || document.location.hostname.includes('192.168'))
  Params.isDevEnv = document.location.hostname.includes('dev.drawith.me')
  Params.isProdEnv = document.location.hostname.includes('app.drawith.me')
  Params.debugMode = Params.isLocal && appState.DEBUG
  Params.supportTouch = ('ontouchstart' in window)
  // Params.supportGesture = ('ongesturechange' in window)

  if (Params.supportTouch) {
    Params.eventStart = 'touchstart'
    Params.eventMove = 'touchmove'
    Params.eventEnd = 'touchend'
    Params.eventOut = ''
    Params.eventCanceled = 'touchcancel'
  } else {
    Params.eventStart = 'pointerdown'
    Params.eventMove = 'pointermove'
    Params.eventEnd = 'pointerup'
    Params.eventOut = 'pointerout'
    Params.eventCanceled = 'pointercancel'
  }
  Params.eventScroll = 'wheel'
  Params.eventPageVisibilityChange = 'visibilitychange'

  const userAgent = navigator.userAgent.toLowerCase()
  Params.android = isAndroid
  Params.isMacOs = isMacOs
  Params.osName = osName
  Params.ipad = isMacOs && isTablet
  Params.iphone = /iphone/.test(userAgent)
  Params.ios = isIOS
  Params.isTablet = isTablet
  Params.isPhone = isMobileOnly
  Params.isMobile = isMobile
  Params.isDesktop = !isTablet && !isMobile && isBrowser
  Params.isAppOnline = (document.location.host.toLowerCase() === Params.appName)

  if (Params.ipad) {
    Params.osName = 'ipad os'
  }

  if (Params.isPhone) {
    Params.deviceType = 'PHONE'
  } else if (Params.isDesktop) {
    Params.deviceType = 'DESKTOP'
  } else {
    Params.deviceType = 'TABLET'
  }

  const pixelRatio = (Math.round(window.devicePixelRatio * 100) / 100)
  // Params.pixelRatio = (Params.isMobile ? (Params.ios ? 1 : pixelRatio) : pixelRatio)
  Params.pixelRatio = (Params.isPhone ? 1 : pixelRatio)

  Params.isHighPerformanceTablet = isIPad13 && Math.max(getRealScreenWidth(), getRealScreenHeight()) > 2300
  Params.isHighPerformanceDesktop = Params.isDesktop && (Params.isLocal || (browserName === 'Chrome' && navigator.hardwareConcurrency >= 8))
  Params.deviceHasGoodPerformance = Params.isHighPerformanceTablet || Params.isHighPerformanceDesktop

  // peer RTC config
  Params.peerServerHost = '0.peerjs.com'
  Params.peerServerPort = 443
  Params.peerServerPath = '/'
  Params.peerPingInterval = 5000,

  // Local db name
  Params.localDbName = 'drawith.me_DB'
}

Params.set = (key, value) => {
  if (key !== 'set') {
    Params[key] = value
  }
}

export default Params
