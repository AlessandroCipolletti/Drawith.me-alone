import { error as errorMessage } from 'modules/Messages'
import { mergeObject } from 'utils/moduleUtils'
import { addGlobalStatus, removeGlobalStatus } from 'utils/moduleUtils'
import { convertAngleRadToDeg, convertAngleDegToRad } from 'utils/mathUtils'

const config = {
  px4mm: 1,
  gpsRefreshTime: 5000,
  gpsTimeoutTime: 25000,
  scalePrecision: true,
  watchPosition: false,
  watchDuration: 10000,
}
const state = {
  lastPosition: false,
  geoWatchId: false,
}
const labels = {
  geoError: 'Geolocalisation error',
}

const GEO = navigator.geolocation
const GPS_GLOBAL_STATUS = 'drawith__GPS-ON'
let scaleFactor


const WGS84 = {
  r_major: 6378137000,
  r_minor: 6356752314.245179,
  f: 298.257223563,
}
const geolocalisationOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
}

const positionIsValid = () => (state.lastPosition && (Date.now() - state.lastPosition.timestamp < config.gpsRefreshTime))

const scaleFactorExact = (lat) => {
  const r = convertAngleDegToRad(lat)
  const s = 1 / Math.cos(r)
  const c = Math.sqrt(1 - Math.pow(0.006694379990141317, 2) * Math.pow(Math.sin(r), 2))
  return s * c
}

const scaleFactorRounded = (lat) => (1 / Math.cos(convertAngleDegToRad(lat)))

const lon2mm = (lon) => (Math.round((WGS84.r_major * convertAngleDegToRad(lon)) * 10) / 10)

const lat2mm = (lat) => {
  if (lat > 89.5) {lat = 89.5}
  if (lat < -89.5) {lat = -89.5}
  const phi = convertAngleDegToRad(lat)
  let con = WGS84.eccent * Math.sin(phi)
  con = Math.pow((1.0 - con) / (1.0 + con), 0.5 * WGS84.eccent)
  return Math.round((-WGS84.r_major * Math.log(Math.tan(0.5 * (Math.PI * 0.5 - phi)) / con)) * 10) / 10
}

// const mm2lon = (mmx) => convertAngleRadToDeg((mmx / WGS84.r_major))

const mm2lat = (mmy) => {
  let N_ITER = 15
  const HALFPI = Math.PI / 2
  const TOL = 0.0000000001
  const ts = Math.exp(0 - (mmy / WGS84.r_major))
  const e = WGS84.eccent
  const eccnth = 0.5 * e
  let Phi = HALFPI - 2 * Math.atan(ts)
  let con, dphi

  do {
    con = e * Math.sin(Phi)
    dphi = HALFPI - 2 * Math.atan(ts * Math.pow((1 - con) / (1 + con), eccnth)) - Phi
    Phi = Phi + dphi
  } while (Math.abs(dphi) > TOL && --N_ITER)

  return convertAngleRadToDeg(Phi)
}

const gps2px = (position, lat, lon) => {
  if (position) {
    lon = position.coords.longitude
    lat = position.coords.latitude
  }
  return {
    x: lon2mm(lon) * config.px4mm,
    y: lat2mm(lat) * config.px4mm,
  }
}

// const px2gps = (pxx, pxy) => ({
//   lat: mm2lat(pxy / config.px4mm),
//   lon: mm2lon(pxx / config.px4mm),
// })

const geoError = (err) => {
  console.log('error gps', err)
  errorMessage(labels.geoError)
}

const startWatchPosition = (callback, error) => {
  GEO.getCurrentPosition(callback, error, geolocalisationOptions)
  clearWatchPosition()
  state.geoWatchId = GEO.watchPosition(callback, error, geolocalisationOptions)
  setTimeout(clearWatchPosition, config.watchDuration)
  addGlobalStatus(GPS_GLOBAL_STATUS)
}

const clearWatchPosition = () => {
  if (state.geoWatchId) {
    GEO.clearWatch(state.geoWatchId)
    state.geoWatchId = false
    removeGlobalStatus(GPS_GLOBAL_STATUS)
  }
}

const getCurrentPosition = (callback, error) => {
  addGlobalStatus(GPS_GLOBAL_STATUS)
  GEO.getCurrentPosition(callback, error, geolocalisationOptions)
  setTimeout(() => {
    removeGlobalStatus(GPS_GLOBAL_STATUS)
  }, 2500)
}

const getGeoPosition = GEO ? (force, callback, error) => {
  if (config.watchPosition) {
    startWatchPosition(callback, error)
  } else if (force || !positionIsValid()) {
    getCurrentPosition(callback, error)
  } else {
    callback(state.lastPosition)
  }
} : (force, callback, error) => {
  error()
}

export const pxy2scale = (pxy) => scaleFactor(mm2lat(pxy / config.px4mm))

export const coordGps2px = (lat, lon) => gps2px(false, lat, lon)

export const currentGps2px = (forceRefresh, callback, error) => {
  if (!callback) {
    return
  }
  getGeoPosition(forceRefresh, (position) => {
    state.lastPosition = position
    console.log('GPS - lat:', position.coords.latitude, 'lon:', position.coords.longitude)
    const px = gps2px(position)
    callback(px.x, px.y)
  }, error || geoError)
}

export const init = (props) => {
  mergeObject(config, props)
  geolocalisationOptions.timeout = config.gpsTimeoutTime
  WGS84.temp = WGS84.r_minor / WGS84.r_major
  WGS84.eccent = Math.sqrt(1.0 - (WGS84.temp * WGS84.temp))
  scaleFactor = config.scalePrecision ? scaleFactorExact : scaleFactorRounded
}
