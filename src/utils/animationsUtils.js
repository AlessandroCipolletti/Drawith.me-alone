import { timing } from 'main/Theme'
import { iterateFn } from 'utils/jsUtils'

const animationsKeyframes = {
  fadeIn: (maxFadeIn = 1) => ([
    { opacity: 0, offset: 0 },
    { opacity: maxFadeIn, offset: 1 },
  ]),
  fadeOut: (maxFadeIn = 1) => ([
    { opacity: maxFadeIn, offset: 0 },
    { opacity: 0, offset: 1 },
  ]),
}



const elementHasAnimation = (el, animName) => el?.animationsInProgress
  ? Object.prototype.hasOwnProperty.call(el.animationsInProgress, animName)
  : false

export const cancelElementAnimationIfExists = (el, animName) => {
  if (elementHasAnimation(el, animName)) {
    el.animationsInProgress[animName].onfinish = undefined
    el.animationsInProgress[animName].cancel()
    delete el.animationsInProgress[animName]
  }
}

const fadeInEl = async(el, duration, maxFadeIn, commitResult = true) => {
  if (el instanceof HTMLElement) {
    cancelElementAnimationIfExists(el, 'fadeOut')
    if (!elementHasAnimation(el, 'fadeIn') && el.classList.contains('displayNone')) {
      el.classList.remove('displayNone')
      await animateElement(el, 'fadeIn', animationsKeyframes.fadeIn(maxFadeIn), duration, {}, commitResult)
    }
  }
}

const fadeOutEl = async(el, duration, maxFadeIn, commitResult = true) => {
  if (el instanceof HTMLElement) {
    cancelElementAnimationIfExists(el, 'fadeIn')
    if (!elementHasAnimation(el, 'fadeOut') && !el.classList.contains('displayNone')) {
      const res = await animateElement(el, 'fadeOut', animationsKeyframes.fadeOut(maxFadeIn), duration, {}, commitResult)
      if (res) {
        el.classList.add('displayNone')
      }
    }
  }
}

const toggleFadeEl = async(el, duration, maxFadeIn) => {
  if (el) {
    if (el.classList.contains('displayNone')) {
      await fadeInEl(el, duration, maxFadeIn)
    } else {
      await fadeOutEl(el, duration, maxFadeIn)
    }
  }
}

export const fadeInElements = async(els, {
  duration = parseInt(timing.FADE_TRANSITION),
  maxFadeIn = 1,
  commitResult = true,
} = {}) => {
  await iterateFn(els, fadeInEl, [duration, maxFadeIn, commitResult])
}

export const fadeOutElements = async(els, {
  duration = parseInt(timing.FADE_TRANSITION),
  maxFadeIn = 1,
  commitResult = true,
} = {}) => {
  await iterateFn(els, fadeOutEl, [duration, maxFadeIn, commitResult])
}

export const toggleFadeElements = async(els, duration = parseInt(timing.FADE_TRANSITION), maxFadeIn = 1) => {
  await iterateFn(els, toggleFadeEl, [duration, maxFadeIn])
}

export const animateElement = async(el, name, keyframes = [], duration = 200, options = {}, commitResult = true) => {
  if (el instanceof HTMLElement && name && typeof name === 'string' && keyframes.length) {
    options = {
      duration,
      fill: 'both',
      ...options,
    }
    return await new Promise((resolve) => {
      // const timeOut = setTimeout(() => {
      //   resolve(false)
      // }, duration * 2)
      const anim = el.animate(keyframes, options)
      el.animationsInProgress = el.animationsInProgress || {}
      el.animationsInProgress[name] = anim
      anim.onfinish = () => {
        // clearTimeout(timeOut)
        delete el.animationsInProgress[name]
        if (commitResult) {
          try {
            anim.commitStyles()
          } catch(e) {
            console.error(e)
          }
        }
        anim.cancel()
        resolve(true)
      }
    })
  }
}

export const addInElement = async(el, { duration = parseInt(timing.FADE_TRANSITION), commitResult = true } = {}) => {
  el.classList.add('displayNone')
  animateElement(el, 'addIn', [
    { width: '0px', height: '0px', marginTop: '0px', offset: 0 },
  ], duration, {
    easing: 'ease-in-out',
  }, commitResult)
  await fadeInElements(el, { duration, commitResult })
  cancelElementAnimationIfExists(el, 'addIn')
}

export const removeOutElement = async(el, { duration = parseInt(timing.FADE_TRANSITION), commitResult = true } = {}) => {
  animateElement(el, 'removeOut', [
    { width: '0px', height: '0px', marginTop: '0px', offset: 1 },
  ], duration, {
    easing: 'ease-in-out',
  }, commitResult)
  await fadeOutElements(el, { duration, commitResult })
  cancelElementAnimationIfExists(el, 'removeOut')
  el.remove()
}
