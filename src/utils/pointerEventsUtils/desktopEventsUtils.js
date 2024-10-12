import { debounce } from 'debounce'
import { preventDefault, getEventCoordX, getEventCoordY } from 'utils/domUtils'

import Params from 'main/Params'

const TIME_TO_END_SCROLL_GESTURE = 50


export const handleDesktopEventsWithGesture = (target, {
  onGestureStart = () => {},
  onGestureChange = () => {},
  onGestureEnd = () => {},
} = {}) => {
  let isScrolling = false
  let currentGestureS = 1
  let currentGestureX = 0
  let currentGestureY = 0
  let currentGestureR = 0

  const debouncedStopScrolling = debounce(() => {
    onGestureEnd(currentGestureX, currentGestureY, currentGestureS, currentGestureR)
    isScrolling = false
    currentGestureS = 1
    currentGestureX = 0
    currentGestureY = 0
  }, TIME_TO_END_SCROLL_GESTURE)

  target.addEventListener(Params.eventScroll, (e) => {
    preventDefault(e)

    // if scrolling just started, the gesture is initialized at current coordinates
    currentGestureX = currentGestureX || getEventCoordX(e, 0)
    currentGestureY = currentGestureY || getEventCoordY(e, 0)

    // e.ctrlKey it's a safari hack to identify pinch to zoom gesture on mac's trackpad
    // if (pinch to zoom scoll)
    if (e.ctrlKey) {
      currentGestureS -= e.deltaY * 0.01
    } else { // normal X Y scroll
      currentGestureX -= e.deltaX
      currentGestureY -= e.deltaY
    }

    // scroll event hasn't a scrollStart, scrollChange and scrollEnd events,
    // so I need to figure it out
    if (!isScrolling) {
      onGestureStart(currentGestureX, currentGestureY, currentGestureS, 0)
      isScrolling = true
    } else {
      onGestureChange(currentGestureX, currentGestureY, currentGestureS, 0)
    }
    debouncedStopScrolling()
  })

}

// target.addEventListener('gesturestart', (e) => {
//   preventDefault(e)
//   // onGestureStart(currentGestureX, currentGestureY, currentGestureS, currentGestureR)
// })
// target.addEventListener('gesturechange', (e) => {
//   preventDefault(e)
//   // onGestureChange(currentGestureX, currentGestureY, currentGestureS, currentGestureR)
// })
// target.addEventListener('gestureend', (e) => {
//   preventDefault(e)
//   // onGestureEnd(currentGestureX, currentGestureY, currentGestureS, currentGestureR)
// })
//
