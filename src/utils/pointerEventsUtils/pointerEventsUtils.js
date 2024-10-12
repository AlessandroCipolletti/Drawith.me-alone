import Params from 'main/Params'

import { handleTouchEventsWithGestures } from './touchEventsUtils'
import { handleDesktopEventsWithGesture } from './desktopEventsUtils'
import { preventDefault } from 'utils/domUtils'
import { delayFn } from 'utils/jsUtils'


export const handlePointerEvents = (target, {
  onSingleTouchStart = () => {},
  onSingleTouchMove = () => {},
  onSingleTouchEnd = () => {},
  onGestureStart = () => {},
  onGestureChange = () => {},
  onGestureEnd = () => {},
  onTwoFingersSingleTap = () => {},
  onThreeFingersSingleTap = () => {},
  onFourFingersSingleTap = () => {},
} = {}) => {
  if (!Array.isArray(target)) {
    target = [target]
  }
  target.forEach(el => {
    if (el instanceof HTMLElement === false) {
      return
    }
    // Mobile first. All base events drawing a line are handled only in one place, in handleTouchEventsWithGestures.
    // Even if we are on desktop with just a mouse input.
    handleTouchEventsWithGestures(el, {
      onSingleTouchStart: delayFn(onSingleTouchStart),
      onSingleTouchMove: delayFn(onSingleTouchMove),
      onSingleTouchEnd: delayFn(onSingleTouchEnd),
      onGestureStart: delayFn(onGestureStart),
      onGestureChange: delayFn(onGestureChange),
      onGestureEnd: delayFn(onGestureEnd),
      onTwoFingersSingleTap: delayFn(onTwoFingersSingleTap),
      onThreeFingersSingleTap: delayFn(onThreeFingersSingleTap),
      onFourFingersSingleTap: delayFn(onFourFingersSingleTap),
    })

    // But zoom gestures can not be handled with multi touch on a desktop.
    // So on desktop we need to handle trackpad gesture events to handle zoom.
    if (Params.isDesktop) {
      handleDesktopEventsWithGesture(el, {
        onGestureStart,
        onGestureChange,
        onGestureEnd,
      })
    } else {
      el.addEventListener('gesturestart', preventDefault)
      el.addEventListener('gesturechange', preventDefault)
      el.addEventListener('gestureend', preventDefault)
    }
  })
}
