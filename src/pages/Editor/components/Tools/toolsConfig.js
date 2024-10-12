import Params from 'main/Params'
import { toolDefaultProps } from 'pages/Editor/config'
import { round, logarithmicPercToValue } from 'utils/mathUtils'

import {
  TOOL_FRAME_CIRCLE,
  TOOL_FRAME_PARTICLES_RECT,
  TOOL_FRAME_PARTICLES_CIRCLE,
  TOOL_FRAME_SPRAY_CIRCLE,
  TOOL_FRAME_IMAGE,
} from 'pages/Editor/constants'


const getCustomTool = (props, versions = []) => {
  const tool = {
    ...toolDefaultProps,
    ...props,
    versions: versions.map(v => {
      v.customProps = {}
      return v
    }),
  }
  if (Params.isPhone) {
    tool.maxSize = round(tool.maxSize / 3, 0)
  }
  if (tool.hasSizeAndAlpha) {
    tool.size = logarithmicPercToValue(50, tool.minSize, tool.maxSize, 1)
    tool.alpha = logarithmicPercToValue(50, tool.minAlpha, tool.maxAlpha, 3)
  }
  return tool
}

const toolsConfigInit = () => ({
  marker: getCustomTool({
    name: 'marker',
    frameType: TOOL_FRAME_CIRCLE,
    minSize: 2,
    sizeForceFactor: 0.3,
    minAlpha: 0.003,
    maxAlpha: 0.24,
    alphaForceFactor: 0.075,
    sizeToFramesRatio: 1 / 40,
    // minPxDistanceBetweenFrames: 0.1,
  }),
  pencil: getCustomTool({
    name: 'pencil',
    hasSizeAndAlpha: false,
  }, [{
    name : '2H',
    props: {
      frameType: TOOL_FRAME_PARTICLES_RECT,
      size: 2,
      minSize: 2,
      maxSize: 8,
      sizeAltitudeFactor: 3,
      alpha: 0.06,
      minAlpha: 0.06,
      maxAlpha: 0.3,
      alphaForceFactor: 0.35,
      alphaAltitudeFactor: -0.1,
      sizeToFramesRatio: 1/2,
    },
  }, {
    name: 'HB',
    props: {
      frameType: TOOL_FRAME_PARTICLES_CIRCLE,
      size: 3,
      minSize: 3,
      maxSize: 10,
      sizeAltitudeFactor: 1.5,
      alpha: 0.06,
      minAlpha: 0.06,
      maxAlpha: 0.25,
      alphaForceFactor: 0.25,
      alphaAltitudeFactor: -0.05,
      sizeToFramesRatio: 1/2,
    },
  }, {
    name : '2B',
    props: {
      frameType: TOOL_FRAME_PARTICLES_CIRCLE,
      size: 3,
      minSize: 3,
      maxSize: 9,
      sizeAltitudeFactor: 2,
      sizeForceFactor: 1,
      alpha: 0.1,
      minAlpha: 0.1,
      maxAlpha: 0.4,
      alphaForceFactor: 0.4,
      alphaAltitudeFactor: -0.1,
      sizeToFramesRatio: 1/2,
      minPxDistanceBetweenFrames: 2,
    },
  }]),
  highlighter: getCustomTool({
    name: 'highlighter',
    frameType: TOOL_FRAME_IMAGE,
    minSize: 15,
    maxSize: 200,
    sizeAltitudeFactor: 3,
    minAlpha: 0.01,
    maxAlpha: 0.5,
    alphaForceFactor: 0.3,
    showVersionPreview: true,
    sizeToFramesRatio: 1/70,
    handleStylusRotation: true,
    handlePathRotation: false,
    minPxDistanceBetweenFrames: 0.1,
  }, [{
    name : 'right',
    props: {
      frameImageName: Params.isDesktop ? 'highlighter-r' : 'highlighter-h',
    },
  }, {
    name : 'left',
    props: {
      frameImageName: Params.isDesktop ? 'highlighter-l' : 'highlighter-v',
    },
  }]),
  brush: getCustomTool({
    name: 'brush',
    frameType: TOOL_FRAME_IMAGE,
    showVersionPreview: true,
    sizeToFramesRatio: 1/100,
    minPxDistanceBetweenFrames: 0.1,
    handleStylusRotation: true,
    minSize: 6,
    maxSize: 100,
    sizeForceFactor: 3,
    sizeAltitudeFactor: 2,
    minAlpha: 0.003,
    maxAlpha: 0.5,
    alphaForceFactor: 0.03,
    // alphaSpeedFactor: -0.05,
  }, [{
    name: '1',
    props: {
      frameImageName: 'brush-1',
    },
  }, {
    name: '2',
    props: {
      frameImageName: 'brush-2',
    },
  }, {
    name: '3',
    props: {
      frameImageName: 'brush-3',
    },
  }, {
    name: '4',
    props: {
      frameImageName: 'brush-4',
    },
  }, {
    name: '5',
    props: {
      frameImageName: 'brush-5',
    },
  }]),
  hardBrush: getCustomTool({
    name: 'hardBrush',
    frameType: TOOL_FRAME_IMAGE,
    showVersionPreview: true,
    handleStylusRotation: true,
    sizeToFramesRatio: 1/100,
    minPxDistanceBetweenFrames: 0.1,
    minSize: 10,
    maxSize: 100,
    sizeForceFactor: 1,
    sizeSpeedFactor: 0.4,
    sizeAltitudeFactor: 4,
    minAlpha: 0.003,
    maxAlpha: 0.11,
    alphaForceFactor: 0.05,
    // alphaSpeedFactor: -0.02,
  }, [{
    name: '6',
    props: {
      frameImageName: 'brush-6',
    },
  }, {
    name: '7',
    props: {
      frameImageName: 'brush-7',
    },
  }, {
    name: '8',
    props: {
      frameImageName: 'brush-8',
    },
  }, {
    name: '9',
    props: {
      frameImageName: 'brush-9',
    },
  }, {
    name: '10',
    props: {
      frameImageName: 'brush-10',
    },
  }, {
    name: '11',
    props: {
      frameImageName: 'brush-11',
    },
  }]),
  spray: getCustomTool({
    name: 'spray',
    frameType: TOOL_FRAME_SPRAY_CIRCLE,
    size: 50,
    minSize: 10,
    maxSize: 250,
    sizeToFramesRatio: 1 / 20,
    minPxDistanceBetweenFrames: 2,
    minAlpha: 0.04,
    alphaForceFactor: 0.5,
    maxSizeThatNeedsToAdaptLine: 0,
    stepsToUpdateCoworking: 10,
  }),
  eraser: getCustomTool({
    name: 'eraser',
    frameType: TOOL_FRAME_CIRCLE,
    globalCompositeOperation: 'destination-out',
    cursor: true,
    minSize: 3,
    maxSize: 400,
    sizeToFramesRatio: 1/100,
    minAlpha: 0.003,
    maxAlpha: 1,
  }),
  bucket: getCustomTool({
    name: 'bucket',
    hasSizeAndAlpha: false,
    maxSizeThatNeedsToAdaptLine: 0,
  }, []),
  pipette: getCustomTool({
    name: 'pipette',
    hasSizeAndAlpha: false,
  }, []),
})

export default toolsConfigInit
