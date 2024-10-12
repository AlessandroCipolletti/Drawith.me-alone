// const fs = require('fs')


const TYPE_LOG = 'log'
const TYPE_INFO = 'info'
const TYPE_WARN = 'warn'
const TYPE_ERROR = 'error'

// const FILE_ID = Math.trunc(Math.random() * 100000000000)

const formatLogMessage = (message, data) => {
  let result = ''

  if (
    typeof message === 'object' &&
    !Array.isArray(message) &&
    message !== null
  ) {
    result = Object.keys(message).map((k) => `${k}:${message[k]}`).join('; ')
  } else if (typeof(message) === 'string') {
    result = message
  }

  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data)
  ) {
    result = `${result} ${Object.keys(data).map((k) => `${k}:${data[k]}`).join('; ')}`
  }

  return result
}

// const getCurrentDateString = () => new Date().toISOString().slice(0, 10)


class MyLogger {
  constructor(options = {}) {
    this.includeDate = options.includeDate || (typeof (process) !== 'undefined')
    this.formatDate = options.formatDate || true
    this.dateFormatIntl = options.dateFormatIntl || 'fr-BE'
    // this.saveTofile = options.saveTofile && (typeof (process) !== 'undefined')
    // this.filesPath = options.filesPath || './'

    // if (this.saveTofile) {
    //   this.fileName = `${this.filesPath}/${getCurrentDateString()}-${FILE_ID}.txt`
    //   this.fileStream = fs.createWriteStream(this.fileName)
    // }
  }

  // code colors: https://en.m.wikipedia.org/wiki/ANSI_escape_code#Colors
  consoleColors = {
    white: 97,
    gray: 37,
    black: 30,
    blue: 34,
    yellow: 33,
    green: 32,
    red: 31,
  }

  logTypeColors = {
    [TYPE_LOG]: this.consoleColors.white,
    [TYPE_INFO]: this.consoleColors.blue,
    [TYPE_WARN]: this.consoleColors.yellow,
    [TYPE_ERROR]: this.consoleColors.red,
  }

  getDate() {
    let result = ''

    if (this.includeDate) {
      if (this.formatDate) {
        result = `${(new Date()).toLocaleString(this.dateFormatIntl)}`
      } else {
        result = `${Date.now()}`
      }
    }

    return result
  }

  // getHour() {
  //   let result = ''

  //   if (this.includeDate) {
  //     if (this.formatDate) {
  //       result = `${(new Date()).toLocaleString(this.dateFormatIntl)}`
  //       result = result.substring(result.indexOf(' ') + 1, result.length)
  //     } else {
  //       result = `${Date.now()}`
  //     }
  //   }

  //   return result
  // }

  doLog(type, message, data) {
    const messageString = formatLogMessage(message, data)
    console[type](`${this.getDate()} - \x1b[${this.logTypeColors[type]}m${type.toUpperCase()}: \x1b[0m${messageString}`)

    // if (this.saveTofile) {
    //   this.fileStream.write(`${this.getHour()} - ${type.toUpperCase()}: ${messageString}`)
    // }
  }


  /**
   * Public log function
   * @param {String | Object} message
   * @param {Object} [data]
   */
  log(message, data) {
    this.doLog(TYPE_LOG, message, data)
  }

  /**
   * Public info function
   * @param {String | Object} message
   * @param {Object} [data]
   */
  info(message, data) {
    this.doLog(TYPE_INFO, message, data)
  }

  /**
   * Public warn function
   * @param {String | Object} message
   * @param {Object} [data]
   */
  warn(message, data) {
    this.doLog(TYPE_WARN, message, data)
  }

  /**
   * Public error function
   * @param {String | Object} message
   * @param {Object} [data]
   */
  error(message, data) {
    this.doLog(TYPE_ERROR, message, data)
  }
}

export default MyLogger
