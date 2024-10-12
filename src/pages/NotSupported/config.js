
export const config = {
  ios: {
    supported: true,
    minVersion: '16.4.0', // compared by string with something like '14.2.1'. So the real min working version is ios 13.4
  },
  android: {
    supported: true,
    minVersion: 9,
    minBrowserVersion: 89,
  },
  ie: {
    supported: false,
  },
  smartTV: {
    supported: false,
  },
  wearable: {
    supported: false,
  },
  console: {
    supported: false,
  },
  windowsMobile: {
    supported: false,
  },
  opera: {
    supported: false,
  },
}
