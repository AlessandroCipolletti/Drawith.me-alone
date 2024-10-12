import Params from 'main/Params'
import * as Colors from './Colors'

export const spacing = {
  // GLOBAL
  ONE_REM: 10,
  ONE_CM_SIZE: '1.375',
  PHONE_LANDSCAPE_PADDING: 3,
  APP_MARGIN_BOTTOM: 2.5,

  // HEADER
  HEADER_HEIGHT: 5.5,
  DESKTOP_HEADER_BUTTON_WIDTH: 6.5,
  MOBILE_HEADER_BUTTON_WIDTH: 4.5,
  HEADER_BUTTON_WIDTH: 0,

  // EDITOR
  EDITOR_TOOLS_WIDTH: 5,
  EDITOR_PAGE_MARGIN: 1,

  // color picker
  COLORPICKER_HEIGHT: 5.5,

  // ruler
  RULER_HEIGHT: (Params.iphone ? 9 : 12),
}

export const timing = {
  FAST_FADE: '100ms',
  OPEN_MENU_TRANSITION: '350ms',
  FADE_TRANSITION: '250ms',
  SLIDE_TRANSITION: '250ms',
  OPTIONS_SHOW_TRANSITION: '500ms',
}

export const palette = {
  ...Colors,
}

export const init = () => {
  spacing.ONE_REM = spacing.ONE_REM / Params.viewportScale
  spacing.ONE_CM_SIZE = `${spacing.ONE_CM_SIZE / Params.viewportScale}cm`
  spacing.DESKTOP_HEADER_BUTTON_WIDTH *= spacing.ONE_REM
  spacing.MOBILE_HEADER_BUTTON_WIDTH *= spacing.ONE_REM
  spacing.PHONE_LANDSCAPE_PADDING *= spacing.ONE_REM
  spacing.HEADER_BUTTON_WIDTH = Params.isPhone ? spacing.MOBILE_HEADER_BUTTON_WIDTH : spacing.DESKTOP_HEADER_BUTTON_WIDTH
  spacing.EDITOR_TOOLS_WIDTH *= spacing.ONE_REM
  spacing.EDITOR_PAGE_MARGIN *= spacing.ONE_REM
  spacing.COLORPICKER_HEIGHT *= spacing.ONE_REM
  spacing.RULER_HEIGHT *= spacing.ONE_REM
  spacing.HEADER_HEIGHT *= spacing.ONE_REM

  if (Params.ipad || (Params.ios && Params.isInstalledWebapp)) {
    spacing.APP_MARGIN_BOTTOM *= spacing.ONE_REM
  } else {
    spacing.APP_MARGIN_BOTTOM *= spacing.ONE_REM * 0.3
  }

}
