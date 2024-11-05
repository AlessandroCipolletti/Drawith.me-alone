export const toolDefaultProps = {
  name: '',

  size: 25,
  minSize: 10,
  maxSize: 400,
  sizeForceFactor: 0,
  sizeSpeedFactor: 0,
  sizeAltitudeFactor: 0,

  alpha: 0.3,
  minAlpha: 0.01,
  maxAlpha: 1,
  alphaForceFactor: 0,
  alphaSpeedFactor: 0,
  alphaAltitudeFactor: 0,

  sizeToFramesRatio: 1,
  minPxDistanceBetweenFrames: 1,

  degradeAlphaBySize: false,
  showVersionPreview: false,
  // color: '',
  // randomColor: true,
  frameType: false,
  frameImageName: false,
  frameImageFile: null,
  handleStylusRotation: false,
  handlePathRotation: false,
  // globalCompositeOperation: 'source-over', // default
  cursor: false,
  maxSizeThatNeedsToAdaptLine: 75, // if 0 ==> tool neven needs to adapt line
  pxToAdaptLine: 15,
  msToAdaptLine: 10,
  stepsToAdaptLine: 5,
  hasSizeAndAlpha: true,

  customProps: {},
}
