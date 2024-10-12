const Tinycolor = require('tinycolor2')
import { getRandomNumber, round } from 'utils/mathUtils'


const SUGGESTED_COLORS = 6 + 1

export const rgbaToRgbaString = (r, g, b, a = 1) => {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// r: 0-255, g: 0-255, b: 0-255, a: 0-1
export const rgbaStringToRgba = (rgbaString) => {
  const [r, g, b, a] = rgbaString.substring(rgbaString.indexOf('(') + 1).replace(')', '').replaceAll(' ', '').split(',')
  return {
    r: parseInt(r),
    g: parseInt(g),
    b: parseInt(b),
    a: typeof a !== 'undefined' ? parseFloat(a) : 1,
  }
}

// r: 0-255, g: 0-255, b: 0-255, a: 0-1
export const hexToRgba = (hex) => ({
  r: parseInt(hex.substring(0, 2), 16),
  g: parseInt(hex.substring(2, 4), 16),
  b: parseInt(hex.substring(4, 6), 16),
  a: round(parseInt(hex.substring(6, 8), 16) / 255, 0) || 1,
})

// r: 0-255, g: 0-255, b: 0-255
export const rgbToHex = (r, g, b) => `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`

// r: 0-255, g: 0-255, b: 0-255, a: 0-1
export const rgbaToHex = (r, g, b, a) => `${rgbToHex(r, g, b)}${round(a * 255, 0).toString(16).padStart(2, '0')}`

// if they are equals => true
// r: 0-255, g: 0-255, b: 0-255
export const compareRgbColorsWithinTollerance = (rgb1, rgb2, tolerance) => {
  return !(
    Math.abs(rgb1.r - rgb2.r) > tolerance ||
    Math.abs(rgb1.g - rgb2.g) > tolerance ||
    Math.abs(rgb1.b - rgb2.b) > tolerance
  )
}

export const hslaToRgba = (hue, sat, light, a) => {
  sat = round(sat / 100, 2)
  light = round(light / 100, 2)
  let t1, t2, r, g, b
  hue = hue / 60
  if (light <= 0.5) {
    t2 = light * (sat + 1)
  } else {
    t2 = light + sat - (light * sat)
  }
  t1 = light * 2 - t2
  r = round(hueToRgb(t1, t2, hue + 2) * 255, 0)
  g = round(hueToRgb(t1, t2, hue) * 255, 0)
  b = round(hueToRgb(t1, t2, hue - 2) * 255, 0)

  return { r, g, b, a }
}

const hueToRgb = (t1, t2, hue) => {
  if (hue < 0) {hue += 6}
  if (hue >= 6) {hue -= 6}
  if (hue < 1) {return (t2 - t1) * hue + t1}
  else if (hue < 3) {return t2}
  else if (hue < 4) {return (t2 - t1) * (4 - hue) + t1}
  else {return t1}
}

const rgbaToHsla = (r, g, b, a) => {
  let min, max, i, l, s, maxcolor, h, rgb = []
  rgb[0] = r / 255
  rgb[1] = g / 255
  rgb[2] = b / 255
  min = rgb[0]
  max = rgb[0]
  maxcolor = 0
  for (i = 0; i < rgb.length - 1; i++) {
    if (rgb[i + 1] <= min) {
      min = rgb[i + 1]
    }
    if (rgb[i + 1] >= max) {
      max = rgb[i + 1]
      maxcolor = i + 1
    }
  }
  if (maxcolor == 0) {
    h = (rgb[1] - rgb[2]) / (max - min)
  }
  if (maxcolor == 1) {
    h = 2 + (rgb[2] - rgb[0]) / (max - min)
  }
  if (maxcolor == 2) {
    h = 4 + (rgb[0] - rgb[1]) / (max - min)
  }
  if (isNaN(h)) {h = 0}
  h = h * 60
  if (h < 0) {h = h + 360 }
  l = (min + max) / 2
  if (min == max) {
    s = 0
  } else {
    if (l < 0.5) {
      s = (max - min) / (max + min)
    } else {
      s = (max - min) / (2 - max - min)
    }
  }
  return {
    h: round(h, 0),
    s: round(s * 100, 0),
    l: round(l * 100, 0),
    a,
  }
}

export const hslaStringToRgba = (hslaString) => {
  const [h, s, l, a] = hslaString.substring(hslaString.indexOf('(') + 1).replace(')', '').replaceAll(' ', '').split(',')
  return hslaToRgba(h, parseInt(s) / 100, parseInt(l) / 100, typeof a !== 'undefined' ? parseFloat(a) : 1)
}

export const getRandomRgbaColor = (alpha = false) => {
  if (alpha === false) {alpha = 1}
  else if (alpha === true) {alpha = 0.7}
  else if (typeof(alpha) !== 'number') {alpha = 1}

  return `rgba(${getRandomNumber(256)}, ${getRandomNumber(256)}, ${getRandomNumber(256)}, ${alpha})`
}

export const getRandomHexColor = () => {
  const a = getRandomNumber(256)
  const b = getRandomNumber(256)
  const c = getRandomNumber(256)
  return `#${((256+a<<8|b)<<8|c).toString(16).slice(1)}`
}

export const getRandomHslaColor = (alpha = false, defaultSat = true, defaultLight = true) => {
  if (alpha === false) {alpha = 1}
  else if (alpha === true) {alpha = 0.7}
  else if (typeof(alpha) !== 'number') {alpha = 1}

  const hue = getRandomNumber(360)
  const sat = defaultSat ? 100 : getRandomNumber(101)
  const light = defaultLight ? 50 : getRandomNumber(101)

  return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`
}

export const colorStringToRgb = (colorString) => {
  if (colorString.startsWith('#')) {
    colorString = hexToRgba(colorString.substring(1))
  } else if (colorString.startsWith('rgb')) {
    colorString = rgbaStringToRgba(colorString)
  } else if (colorString.startsWith('hsl')) {
    colorString = hslaStringToRgba(colorString)
  }

  return colorString
}

export const applyBrightnessToHex = (hex, brightness) => {
  if (hex.startsWith('#')) {
    hex = hex.substring(1)
  }
  const rgb = hexToRgba(hex)
  const hsl = rgbaToHsla(rgb.r, rgb.g, rgb.b)
  const newRgb = hslaToRgba(hsl.h, hsl.s, brightness)
  const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
  return newHex
}

export const getHexBrightness = (hex) => {
  if (hex.startsWith('#')) {
    hex = hex.substring(1)
  }
  const rgb = hexToRgba(hex)
  const hsl = rgbaToHsla(rgb.r, rgb.g, rgb.b)
  return hsl.l
}

export const getSuggestedColors = (colorHex) => {
  const colors = []
  const base = Tinycolor(colorHex)

  for (let i = 1; i < SUGGESTED_COLORS - 1; i++) {
    colors.push(base.spin(360 / SUGGESTED_COLORS * i).toString())
  }

  return colors
}
