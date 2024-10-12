const MATH = Math
const PI = MATH.PI
const PI2 = PI / 2

export const arrayOrderNumberUp = (a, b) => a - b
export const arrayOrderNumberDown = (a, b) => b - a


export const getNumberInBetween = (a, b, c, decimals = 4) => round([a, b, c].sort(arrayOrderNumberUp)[1], decimals)
export const getRandomNumber = (n, float = false) => float ? MATH.random() * n : MATH.random() * n | 0
// export const getRandomNumber = (max, float = false, d = 0) => float ? round(MATH.random() * max, d) : MATH.random() * max | 0
export const getInverseNumber = (num) => MATH.pow(num, -1)
export const getAngleDegBetweenTwoPoints = (x1, y1, x2, y2) => convertAngleRadToDeg(getAngleRadBetweenTwoPoints(x1, y1, x2, y2))
export const getPerc = (value, total, decimals = 4) => round(!total ? value : value * 100 / total, decimals)
export const getFactorial = (n) => n <= 1 ? 1 : n * getFactorial(n - 1)
export const percToValue = (perc, total, decimals = 4) => round(!total ? perc : perc * total / 100, decimals)
export const getDistanceBetweenTwoPoints = (x1, y1, x2, y2, decimals = 0) => round(MATH.sqrt(MATH.pow(x2 - x1, 2) + MATH.pow(y2 - y1, 2)), decimals)
export const distanceBetweenTwoPointsGreaterThan = (x1, y1, x2, y2, distance) => (MATH.pow(x2 - x1, 2) + MATH.pow(y2 - y1, 2) >= MATH.pow(distance, 2))
export const convertAngleRadToDeg = (rad) => rad * 180 / PI
export const convertAngleDegToRad = (deg) => deg * PI / 180
export const rotateCoords = (x, y, a) => ([round(x * MATH.cos(a) + y * MATH.sin(a)), round(-x * MATH.sin(a) + y * MATH.cos(a))])
export const translateCoords = (x, y, dx, dy) => ([x + dx, y + dy])
export const getMiddlePointCoords = (x1, y1, x2, y2, decimals = 0) => ([round((x1 + x2) / 2, decimals), round((y1 + y2) / 2, decimals)])
export const getAverage = (values = [], decimals = 0) => round(values.reduce((t, v) => t + v, 0) / values.length, decimals)
export const getLineFunctionBetweenTwoPoints = (x1, y1, x2, y2) => (x) => (((x - x1) * (y2 - y1)) / (x2 - x1)) + y1
export const getSlopeCoefficientBetweenTwoPoints = (x1, y1, x2, y2) => (y2 - y1) / (x2 - x1)
export const getPerpendicularLineFunctionPassingByPoint = (slope, x1, y1) => (x) => (-1 / slope) * (x - x1) + y1
export const getScopeCoefficientBetweenTwoPoints = (x1, y1, x2, y2) => -(y2 - y1) / (x2 - x1) // (y2 + y1) / (x2 - x1) // TO DELETE
export const quadraticBezierValue = (t, p1, p2, p3) => ((1 - t) * (1 - t) * p1 + 2 * (1 - t) * t * p2 + t * t * p3)
export const getQuadraticBezierCurvePointAtTime = (t, x1, y1, x2, y2, x3, y3, d = 0) => ([
  round((1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * x2 + t * t * x3, d), // curve x at time t
  round((1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * y2 + t * t * y3, d), // curve y at time t
])

export const logarithmicPercToValue = (perc, minValue, maxValue, decimals = 0) => {
  minValue = Math.log(minValue)
  maxValue = Math.log(maxValue)
  const scale = ((maxValue - minValue) / 100)
  return round(Math.exp(minValue + (scale * perc)), decimals)
}

export const logarithmicValueToPerc = (value, minValue, maxValue, decimals = 0) => {
  minValue = Math.log(minValue)
  maxValue = Math.log(maxValue)
  const scale = ((maxValue - minValue) / 100)
  if (scale > 0) {
    return round((Math.log(value) - minValue) / scale, decimals)
  } else {
    return 100
  }
}

export const getOriginalCoordsFromScaleRotation = (x, y, originX, originY, scale, rotation) => {
  [x, y] = translateCoords(x, y, -originX, -originY);
  [x, y] = rotateCoords(x, y, convertAngleDegToRad(rotation))
  return [round(x / scale, 1), round(y / scale, 1)]
}

export const round = (n, d = 0) => {
  const m = d ? MATH.pow(10, d) : 1
  return MATH.round(n * m) / m
}

export const getIntersectionBetween4Points = (x1, y1, x2, y2, x3, y3, x4, y4, d = 0) => {
  // points {x1, y1} and {x2, y2} define the first line
  // points {x3, y3} and {x4, y4} define the second line
  let ua, denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) {
    return [false, false]
  }
  ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  return [
    round(x1 + ua * (x2 - x1), d),
    round(y1 + ua * (y2 - y1), d),
  ]
}

export const getPointProjectionOnLine = (x1, y1, x2, y2, x3, y3) => {
  // points {x1, y1} and {x2, y2} define the line
  // point {x3, y3} is the point to project on the line
  let x4, y4
  const slopeLine1 = getSlopeCoefficientBetweenTwoPoints(x1, y1, x2, y2)
  if (slopeLine1 === 0) {
    x4 = x3
    y4 = y1
  } else if (isFinite(slopeLine1)) {
    const line2 = getPerpendicularLineFunctionPassingByPoint(slopeLine1, x3, y3)
    if (x3 === x1) {
      x4 = x2
    } else {
      x4 = x1
    }
    y4 = line2(x4)
  } else {
    x4 = x1
    y4 = y3
  }
  return getIntersectionBetween4Points(x1, y1, x2, y2, x3, y3, x4, y4)
}

export const radToFirstQuadrant = (rad) => {
  let result = rad
  while (result > PI2) {
    result = result - PI2
  }
  if (rad % PI === 0) {
    result = 0
  } else if (rad % PI > PI2) {
    result = PI2 - result
  }
  return result
}

export const degToFirstQuadrant = (deg) => {
  deg = MATH.abs(deg)
  let result = deg
  while (result > 90) {
    result = result - 90
  }
  if (deg % 180 === 0) {
    result = 0
  } else if (deg % 180 > 90) {
    result = 90 - result
  }
  return result
}

export const getAngleRadBetweenTwoPoints = (x1, y1, x2, y2) => {
  const m1 = x2 - x1
  const m2 = y2 - y1
  if (m1 > 0 && m2 > 0) { // first quadrant
    return (MATH.atan(m2 / m1))
  } else if (m1 < 0 && m2 > 0) { // second quadrant
    return (MATH.atan(m2 / m1) + PI)
  } else if (m1 < 0 && m2 < 0) { // third quadrant
    return (MATH.atan(m2 / m1) + PI)
  } else if (m1 > 0 && m2 < 0) { // fourth quadrant
    return (MATH.atan(m2 / m1) + PI * 2)
  } else {
    // multiples of 90
    if (m1 === 0) {
      if (m2 > 0) {
        return PI / 2
      } else {
        return PI * 1.5
      }
    } else {
      if (m1 > 0) {
        return 0
      } else {
        return PI
      }
    }
  }
}

export const intToHex = (int, length = 6) => {
  let hex = int.toString(16)
  while (hex.length < length) {
    hex = `0${hex}`
  }
  return hex
}

export const getQuadraticBezierLength = (() => {
  let a, b, A, B, C, Sabc, A_2, A_32, C_2, BA
  return (p0x, p0y, p1x, p1y, p2x, p2y, decimals = 1) => {
    a = {
      x: p0x - 2 * p1x + p2x,
      y: p0y - 2 * p1y + p2y,
    }
    b = {
      x: 2 * p1x - 2 * p0x,
      y: 2 * p1y - 2 * p0y,
    }
    A = 4 * (a.x * a.x + a.y * a.y)
    B = 4 * (a.x * b.x + a.y * b.y)
    C = b.x * b.x + b.y * b.y
    Sabc = 2 * MATH.sqrt(A+B+C)
    A_2 = MATH.sqrt(A)
    A_32 = 2 * A * A_2
    C_2 = 2 * MATH.sqrt(C)
    BA = B / A_2
    if (BA === -C_2 && a.x !=0 && a.y != 0 && b.x != 0 && b.y != 0) {
      BA += 1
    }
    return round((A_32 * Sabc + A_2 * B * (Sabc - C_2) + (4 * C * A - B * B) * MATH.log((2 * A_2 + BA + Sabc) / (BA + C_2))) / (4 * A_32), decimals)
  }
})()

export const getDistanceBetweenThreePoints = (x1, y1, x2, y2, x3, y3, decimals = 1) => {
  return round((getDistanceBetweenTwoPoints(x1, y1, x2, y2, decimals) || 0) + (getDistanceBetweenTwoPoints(x2, y2, x3, y3, decimals) || 0), decimals)
}

export const valuesAreSimilar = (values = [], tollerance = 0) => {
  return values.reduce(
    (tot, v, i) => tot &&
      (i === values.length - 1
        ? Math.abs(v - values[0]) <= tollerance
        : Math.abs(v - values[i + 1]) <= tollerance
      ),
    true
  )
}

export const roundAngleForSteps = (deg, step = 3, interval = 45) => {
  const delta = deg % interval
  if (Math.abs(Math.trunc(delta)) < step) {
    return deg - delta
  }
  if (Math.abs(Math.trunc(delta)) > interval - step) {
    if (delta > 0) {
      return Math.round(deg + interval - delta)
    } else {
      return Math.round(deg - interval - delta)
    }
  }
  return deg
}


export const getTranslatedFunction = (fn, dx = 0, dy = 0) => (x) => fn(x - dx) + dy

export const getScaledFunction = (fn, horizontalScale, verticalScale) => (x) => verticalScale * fn(horizontalScale * x)

export const getScaledAndTranslatedFunction = (fn, horizontalScale, verticalScale, dx, dy) => (x) => verticalScale * fn(horizontalScale * (x - dx)) + dy

export const functionIsEven = (fn, tests = 10) => {
  const randomXValues = (new Array(tests)).fill().map(() => getRandomNumber(1000))
  return randomXValues.every((x) => fn(x) === fn(-x))
}

export const functionIsOdd = (fn, tests = 10) => {
  const randomXValues = (new Array(tests)).fill().map(() => getRandomNumber(1000))
  return randomXValues.every((x) => fn(x) === -fn(-x))
}

export const functionIsPeriodic = (fn, period, tests = 10) => {
  const randomXValues = (new Array(tests)).fill().map(() => getRandomNumber(1000))
  return randomXValues.every((x) => fn(x) === fn(x + period))
}

export const getQuadraticFunctionVertex = (a, b, c) => {
  // quadratic function standard form: F(y) = ax^2 + bx + c
  // if a === 0 ==> it's a line
  // if a > 0 ==> it's a parabola with vertex at the bottom
  // if a < 0 ==> it's a parabola with vertex at the top
  const x = -b / (2 * a)
  const y = a * x * x + b * x + c
  return [x, y]
}

export const getQuadraticFunctioRoots = (a, b, c) => {
  // quadratic function standard form: F(y) = ax^2 + bx + c
  const d = Math.sqrt(b * b - 4 * a * c)
  return [(-b + d) / (2 * a), (-b - d) / (2 * a)]
}

export const getQuadraticExpressionX = (a, b, c) => {
  // ax^2 + bx + c = 0
  return [(-b + Math.sqrt(b*b - 4*a*c)) / (2 * a), (-b - Math.sqrt(b*b - 4*a*c)) / (2 * a)]
}

export const getDigitalRoot = (n) => {
  return n - 9 * Math.floor((n - 1) / 9)
  // while (n > 9) {
  //   n = [...`${n}`].map(e => parseInt(e)).reduce((t, e) => t + e, 0)
  // }
  // return n
}

// const logSlider = (position) => {
//   // position will be between 0 and 100
//   const minp = 0
//   const maxp = 100
//
//   // The result should be between 100 an 10000000
//   const minv = Math.log(0.01)
//   const maxv = Math.log(1)
//
//   // calculate adjustment factor
//   const scale = (maxv-minv) / (maxp-minp)
//
//   return Math.exp(minv + scale*(position-minp))
// }
export const getGreatCommonDivisor = (a, b) => {
  if (a === 0) {
    return b
  }
  return getGreatCommonDivisor(b % a, a)
}

// how many integers are relatively prime to the given number
export const getTotient = (n) => {
  let result = 1
  for (let i = 2; i < n; i++) {
    if (getGreatCommonDivisor(i, n) === 1) {
      result++
    }
  }
  return result
}

