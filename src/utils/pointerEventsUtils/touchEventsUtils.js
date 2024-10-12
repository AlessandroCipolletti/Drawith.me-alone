import Params from 'main/Params'
import { round, getAngleDegBetweenTwoPoints, getDistanceBetweenTwoPoints, getMiddlePointCoords } from 'utils/mathUtils'
import { preventDefault, getEventCoordX, getEventCoordY, filterTouchesByTargets } from 'utils/domUtils'
import { delay } from 'utils/jsUtils'
import { TOUCH_TYPE_STYLUS, TOUCH_TYPE_FINGER } from 'main/constants'

const TIME_TO_WAIT_FOR_SECOND_FINGER = 40
const TIME_TO_WAIT_FOR_TAP_END = 50
const MOVE_EVENTS_TO_FORCE_MOVE = 6


const fixAndroidTouchEvent = (touchEvent) => {
  if (Params.android) {
    touchEvent.touchType = (touchEvent.touchType === TOUCH_TYPE_STYLUS) ? TOUCH_TYPE_STYLUS : TOUCH_TYPE_FINGER
  }
  return touchEvent
}

export const handleTouchEventsWithGestures = (target, {
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
  let touches = []
  let ratedTouchEvents = []
  let waitedForFingers = false
  let waitedForTapEnd = false
  let movedBeforeGesture = false
  let gestureStarted = false
  let gestureInterrupted = false
  let touchCanceled = false
  let usedForSingleTouch = false
  let maxTouchesLength = 0
  let initialRotation = 0
  let initialGesturePointsDistance = 0
  let touchMoveLength = 0
  let currentGestureX = 0
  let currentGestureY = 0
  let currentGestureS = 0
  let currentGestureR = 0

  const reset = () => {
    touches = []
    ratedTouchEvents = []
    waitedForFingers = false
    waitedForTapEnd = false
    movedBeforeGesture = false
    gestureInterrupted = false
    gestureStarted = false
    usedForSingleTouch = false
    initialRotation = 0
    initialGesturePointsDistance = 0
    maxTouchesLength = 0
    touchMoveLength = 0
    currentGestureX = 0
    currentGestureY = 0
    currentGestureS = 0
    currentGestureR = 0
  }
  const getCurrentGestureCoords = () => {
    const x1 = getEventCoordX(touches[0], 0)
    const y1 = getEventCoordY(touches[0], 0)
    const x2 = getEventCoordX(touches[1], 0)
    const y2 = getEventCoordY(touches[1], 0)
    return getMiddlePointCoords(x1, y1, x2, y2, 0)
  }
  const getCurrentGestureScale = () => {
    const x1 = getEventCoordX(touches[0], 0)
    const y1 = getEventCoordY(touches[0], 0)
    const x2 = getEventCoordX(touches[1], 0)
    const y2 = getEventCoordY(touches[1], 0)
    const currentGesturePointsDistance = getDistanceBetweenTwoPoints(x1, y1, x2, y2, 1)
    initialGesturePointsDistance = initialGesturePointsDistance || currentGesturePointsDistance
    return initialGesturePointsDistance ? (round(currentGesturePointsDistance / initialGesturePointsDistance, 10) || 1) : 1
  }
  const getCurrentGestureRotation = () => {
    const currentRotation = getAngleDegBetweenTwoPoints(touches[0].clientX, touches[0].clientY, touches[1].clientX, touches[1].clientY)
    initialRotation = initialRotation || currentRotation
    return initialRotation ? (currentRotation - initialRotation) : 0
  }
  const handleGestureChange = () => {
    if (maxTouchesLength === 2 && touches.length === 2 && (touchMoveLength > MOVE_EVENTS_TO_FORCE_MOVE || waitedForTapEnd) && !movedBeforeGesture && !gestureInterrupted && !usedForSingleTouch) {
      [currentGestureX, currentGestureY] = getCurrentGestureCoords()
      currentGestureS = getCurrentGestureScale()
      currentGestureR = getCurrentGestureRotation()
      if (gestureStarted) {
        // console.log('Gesture', 'change', currentGestureX, currentGestureY, currentGestureS, currentGestureR)
        onGestureChange(currentGestureX, currentGestureY, currentGestureS, currentGestureR)
      } else {
        // console.log('Gesture', 'start', currentGestureX, currentGestureY, currentGestureS, currentGestureR)
        gestureStarted = true
        onGestureStart(currentGestureX, currentGestureY, currentGestureS, currentGestureR)
      }
    }
  }

  const handleTouchStart = async(e) => {
    preventDefault(e)
    const isFirstTouch = (touches.length === 0)
    if (isFirstTouch) {
      touchCanceled = false
    }
    if (touchCanceled) {
      return
    }
    touches = filterTouchesByTargets(e, target)
    maxTouchesLength = Math.max(maxTouchesLength, touches.length)
    // console.log('S', e.touches.length, maxTouchesLength)
    if (!touches.length) {
      return
    }
    // maxTouchesLength = Math.max(maxTouchesLength, touches.length)
    if (isFirstTouch) {
      document.addEventListener(Params.eventMove, handleTouchMove)
      document.addEventListener(Params.eventEnd, handleTouchEnd)
      document.addEventListener(Params.eventCanceled, handleTouchCanceled)
      ratedTouchEvents.push(fixAndroidTouchEvent(touches[0]))
      await delay(TIME_TO_WAIT_FOR_SECOND_FINGER)
      if (!touches.length) {
        return
      } // if touchEnd appened while waiting TIME_TO_WAIT_FOR_SECOND_FINGER, we already done onTouchStart and onTouchEnd
      waitedForFingers = true
      if (maxTouchesLength === 1) {
        if (!usedForSingleTouch && ratedTouchEvents.length) {
          usedForSingleTouch = true
          // console.log('TouchStart', 'usedForSingleTouch', touches.length, ratedTouchEvents[0])
          onSingleTouchStart(e, ratedTouchEvents[0])
          ratedTouchEvents = []
        }
      }
      if (touches.length > 0) {
        await delay(TIME_TO_WAIT_FOR_TAP_END)
        waitedForTapEnd = true
      }
    }
    if (touches.length > 1 && usedForSingleTouch) {
      // if (touchMoveLength <= MOVE_EVENTS_TO_FORCE_MOVE) {
      //   // alert('bug?')
      // }
      // console.log('TouchEnd')
      onSingleTouchEnd(touches[0])
      touchCanceled = true
      reset()
    }
    if (touches.length > 2) {
      gestureInterrupted = true
    }
  }
  const handleTouchMove = (e) => {
    // console.log('M')
    preventDefault(e)
    if (!touches.length) {
      return
    }
    if (touchCanceled) {
      return
    }
    touches = filterTouchesByTargets(e, [])
    touchMoveLength++
    if (touches.length) {
      if (maxTouchesLength === 1) {
        if (!usedForSingleTouch) {
          ratedTouchEvents.push(fixAndroidTouchEvent(touches[0]))
        }
        if (touchMoveLength > MOVE_EVENTS_TO_FORCE_MOVE || waitedForFingers) {
          if (!usedForSingleTouch) {
            usedForSingleTouch = true
            // console.log('TouchStart by touchmove', touchMoveLength, waitedForFingers, ratedTouchEvents[0])
            onSingleTouchStart(e, ratedTouchEvents[0])
            for (let i = 1; i < ratedTouchEvents.length; i++) {
              // console.log('TouchMove arretrati', ratedTouchEvents[i])
              onSingleTouchMove(e, ratedTouchEvents[i])
              ratedTouchEvents = []
            }
          }
          movedBeforeGesture = true
          // console.log('TouchMove', touches)
          onSingleTouchMove(e, fixAndroidTouchEvent(touches[0]))
        }
      } else if (touchMoveLength > MOVE_EVENTS_TO_FORCE_MOVE) {
        handleGestureChange()
      }
    }
  }
  const handleTouchEnd = (e) => {
    preventDefault(e)
    if (touchCanceled) {
      return
    }
    touches = filterTouchesByTargets(e, [])
    // console.log('E', touches.length, usedForSingleTouch, waitedForFingers, touchMoveLength, maxTouchesLength)
    if (!touches.length || !Params.supportTouch) {
      document.removeEventListener(Params.eventMove, handleTouchMove)
      document.removeEventListener(Params.eventEnd, handleTouchEnd)
      document.removeEventListener(Params.eventCanceled, handleTouchCanceled)
      if (usedForSingleTouch) {
        // console.log('TouchEnd', 'usedForSingleTouch')
        onSingleTouchEnd(e)
      } else if (!usedForSingleTouch && touchMoveLength <= MOVE_EVENTS_TO_FORCE_MOVE && maxTouchesLength === 1) {
        // console.log('TouchStart by TouchEnd', ratedTouchEvents[0])
        usedForSingleTouch = true
        onSingleTouchStart(e, ratedTouchEvents[0])
        // console.log('TouchEnd after TouchStart by TouchEnd')
        onSingleTouchEnd(ratedTouchEvents[0])
      } else if (maxTouchesLength > 1) {
        if (gestureStarted) {
          // console.log('Gesture', 'end', currentGestureX, currentGestureY, currentGestureS, currentGestureR)
          onGestureEnd(currentGestureX, currentGestureY, currentGestureS, currentGestureR)
        } else if (!usedForSingleTouch && touchMoveLength < MOVE_EVENTS_TO_FORCE_MOVE) {
          if (maxTouchesLength === 2) {
            // console.log('TwoFingersTouch', touchMoveLength)
            onTwoFingersSingleTap(e, touches)
          } else if (maxTouchesLength === 3) {
            // console.log('ThreeFingersTouch')
            onThreeFingersSingleTap(e, touches)
          } else if (maxTouchesLength === 4) {
            // console.log('FourFingersTouch')
            onFourFingersSingleTap(e, touches)
          }
        }
      }
      reset()
    } else if (gestureStarted && touches.length !== 2) {
      gestureInterrupted = true
    }
  }
  const handleTouchCanceled = (e) => {
    // console.log('Touch Canceled')
    preventDefault(e)
    touchCanceled = true
    if (maxTouchesLength === 2 && gestureStarted) {
      // console.log('Gesture', 'end', currentGestureX, currentGestureY, currentGestureS, currentGestureR)
      onGestureEnd(currentGestureX, currentGestureY, currentGestureS, currentGestureR)
    }
    reset()
    document.removeEventListener(Params.eventMove, handleTouchMove)
    document.removeEventListener(Params.eventEnd, handleTouchEnd)
    document.removeEventListener(Params.eventCanceled, handleTouchCanceled)
  }

  target.addEventListener(Params.eventStart, handleTouchStart)

}
