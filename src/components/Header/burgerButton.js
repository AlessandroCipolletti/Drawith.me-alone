import { easeElasticOut, easeElasticIn, easeBounceOut } from 'd3-ease'
import Segment from 'segment-js'


const beginAC = 80, endAC = 320, beginB = 80, endB = 320
const inAC = (s) => {
  s.draw('80% - 240', '80%', 0.3, {
    delay: 0.1,
    callback: () => inAC2(s),
  })
}

const inAC2 = (s) => {
  s.draw('100% - 545', '100% - 305', 0.6, {
    easing: easeElasticOut,
  })
}

const inB = (s) => {
  s.draw(beginB - 60, endB + 60, 0.1, {
    callback: () => inB2(s),
  })
}

const inB2 = (s) => {
  s.draw(beginB + 120, endB - 120, 0.3, {
    easing: easeBounceOut,
  })
}

const outAC = (s) => {
  s.draw('90% - 240', '90%', 0.1, {
    easing: easeElasticIn,
    callback: () => outAC2(s),
  })
}

const outAC2 = (s) => {
  s.draw('20% - 240', '20%', 0.3, {
    callback: () => outAC3(s),
  })
}

const outAC3 = (s) => {
  s.draw(beginAC, endAC, 0.7, {
    easing: easeElasticOut,
  })
}

const outB = (s) => {
  s.draw(beginB, endB, 0.7, {
    delay: 0.1,
    easing: easeElasticOut,
  })
}

export const initBurgerButton = (dom) => {
  let isOpen = false
  const pathA = dom.querySelector('#pathA')
  const pathB = dom.querySelector('#pathB')
  const pathC = dom.querySelector('#pathC')
  const segmentD = new Segment(pathA, beginAC, endAC)
  const segmentE = new Segment(pathB, beginB, endB)
  const segmentF = new Segment(pathC, beginAC, endAC)

  const open = () => {
    isOpen = true
    inAC(segmentD)
    inB(segmentE)
    inAC(segmentF)
  }
  const close = () => {
    isOpen = false
    outAC(segmentD)
    outB(segmentE)
    outAC(segmentF)
  }
  const toggle = () => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }

  dom.classList.remove('displayNone')

  return {
    open,
    close,
    toggle,
  }
}
