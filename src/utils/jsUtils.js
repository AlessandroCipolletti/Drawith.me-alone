// import Dexie from 'dexie'
const isEqual = require('lodash.isequal')
import { v4 as uuidv4 } from 'uuid'

import { setSpinner } from 'utils/domUtils'


const fibonacciTimeoutSequence = [
  1, 1, 1,
  2, 2, 2,
  3, 3, 3,
  5, 5, 5,
  8, 8, 8,
  13, 13, 13,
  21, 21, 21,
  34, 34, 34,
  55, 55, 55,
]

export const exponentialTimeout = (fn, iteration = 0) => {
  setTimeout(() => {
    const shouldTryAgain = fn()
    if (shouldTryAgain) {
      exponentialTimeout(fn, iteration + 1)
    }
  }, (fibonacciTimeoutSequence[iteration] || Math.max(fibonacciTimeoutSequence)) * 1000)
}

export const arrayOrderStringDown = (a, b) => {
  if (a < b) {return +1}
  if (a > b) {return -1}
  return 0
}

export const arrayOrderStringUp = (a, b) => {
  if (a > b) {return +1}
  if (a < b) {return -1}
  return 0
}

export const arrayOrderNumberUp = (a, b) => a - b

export const arrayOrderNumberDown = (a, b) => b - a

export const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

export const delayFn = (fn) => function() {
  requestAnimationFrame(() => {
    fn(...arguments)
  })
}

export const deepCopy = (value) => JSON.parse(JSON.stringify(value))

export const securizeFn = (fn, errorMsg, fnName = '') => function () {
  try {
    return fn(...arguments)
  } catch (error) {
    handleJsError(fn, error, errorMsg, fnName)
    return false
  }
}

export const securizeAsyncFn = (fn, errorMsg, fnName, showErrorMsg = true) => async function () {
  try {
    return await fn(...arguments)
  } catch (error) {
    await delay(100)
    handleJsError(fn, error, errorMsg, fnName, showErrorMsg)
    return false
  }
}

const handleJsError = (fn, error, errorMsg, fnName, showErrorMsg = true) => {
  console.log(`
    ${errorMsg}
    ${fn.name || fnName}
    ${error.stack}
  `)
  setSpinner(false)
  if (showErrorMsg) {
    window.Messages.error(errorMsg)
  }
}

export const iterateFn = async(els, fn, params = []) => {
  if (els instanceof Array) {
    const promises = els.map(el => new Promise(async(resolve) => { // eslint-disable-line
      await fn(el, ...params)
      resolve()
    }))
    await Promise.all(promises)
  } else {
    await fn(els, ...params)
  }
}

export const throttle = (callback, limit) => {
  let waiting = false                   // Initially, we're not waiting
  return function () {                  // We return a throttled function
    if (!waiting) {                     // If we're not waiting
      callback.apply(this, arguments)   // Execute users function
      waiting = true                    // Prevent future invocations
      setTimeout(() => {                // After a period of time
        waiting = false                 // And allow future invocations
      }, limit)
    }
  }
}

export const debounceThrottle = (callback, limit) => {
  let waiting = false, lastCallback = null, lastArguments = null
  return function () {
    if (waiting) {
      lastCallback = callback
      lastArguments = Array.from(arguments)
    } else {
      callback.apply(this, arguments)
      waiting = true
      setTimeout(() => {
        if (lastCallback) {
          lastCallback.apply(this, lastArguments)
          lastCallback = lastArguments = null
          setTimeout(() => {
            waiting = false
          }, limit)
        } else {
          waiting = false
        }
      }, limit)
    }
  }
}

export const debounceJustFirst = (callback, limit) => {
  let waiting = false
  return function () {
    if (!waiting) {
      callback.apply(this, arguments)
      waiting = true
      setTimeout(() => {
        waiting = false
      }, limit)
    }
  }
}

export const callCallbackIfDataChanged = (callback) => {
  let lastArguments = []
  return function() {
    const newArguments = Array.from(arguments)
    let changed = false
    for (let i = 0; i < newArguments.length; i++) {
      if (!isEqual(lastArguments[i], newArguments[i])) {
        changed = true
        break
      }
    }
    if (changed) {
      lastArguments = newArguments
      callback.apply(this, newArguments)
    }
  }
}

export const shiftArrayElement = (arr, oldIndex, newIndex) => {
  // if (newIndex >= arr.length) {
  //   let k = newIndex - arr.length + 1
  //   while (k--) {
  //     arr.push(undefined)
  //   }
  // }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
}

export const noop = () => {}

// const fileLoader = new Worker(
//   new URL('./workers/fileLoader.js', import.meta.url),
//   { type: 'module' }
// )
// export const fetchUrlFileOffThread = (url) => {
//   return new Promise((resolve, reject) => {
//     const id = uuidv4()
//     const onLoaded = (event) => {
//       const { id: idMsg, blob } = event.data
//       if (id === idMsg) {
//         fileLoader.removeEventListener('message', onLoaded)
//         resolve(URL.createObjectURL(blob))
//       }
//     }
//     fileLoader.addEventListener('message', onLoaded)
//     fileLoader.postMessage({ id, url })
//   })
// }

export const waitWorkerMessage = (worker, id) => {
  return new Promise((resolve, reject) => {
    const onLoaded = (event) => {
      const { id: idMsg } = event.data
      if (id === idMsg) {
        worker.removeEventListener('message', onLoaded)
        resolve(event.data)
      }
    }
    worker.addEventListener('message', onLoaded)
  })
}

export const postWorkerCommand = async(worker, data) => {
  const id = uuidv4()
  data.id = id
  worker.postMessage(data)
  const result = await waitWorkerMessage(worker, id)
  delete result.id
  return result
}

export const parallelize = async(data, fn, maxParallel = 8) => {
  const results = []
  const promises = []
  let i = 0

  while (i < data.length) {
    promises.push(fn(data[i], i))
    if (promises.length >= maxParallel) {
      results.push(...(await Promise.all(promises)))
      promises.length = 0
    }
    i++
  }
  results.push(...(await Promise.all(promises)))

  return results
}
