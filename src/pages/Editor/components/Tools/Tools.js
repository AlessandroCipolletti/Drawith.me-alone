const tplTools = require('./tools.tpl')
import './tools.css'

import Params from 'main/Params'
import * as Editor from 'pages/Editor'
import * as Ruler from 'pages/Editor/components/Ruler'
import * as Layers from 'pages/Editor/components/Layers'
import * as ColorPicker from 'pages/Editor/components/ColorPicker'
import { preventDefault, loadTemplate } from 'utils/domUtils'
import { deepCopy } from 'utils/jsUtils'
import { getImageFromUrl } from 'utils/imageUtils'
import { addRotationHandler, removeRotationHandler, cleanRefs } from 'utils/moduleUtils'

import toolsConfigInit from './toolsConfig'

let toolsConfig
const config = {
  tools: ['marker', 'pencil', 'highlighter', 'brush', 'hardBrush', 'spray', 'bucket', 'eraser', 'ruler', 'undo', 'redo', 'paper', 'clear'],
  writingTools: ['pencil', 'marker', 'highlighter', 'brush', 'hardBrush', 'spray'],
  toolsDisabledByDefault: ['undo', 'redo'],
  versionsCloseDelay: 7 * 1000,
  papers: ['white', 'squares', 'lines', 'points'],
  initialSelectedVersions: {
    pencil: 0,
    highlighter: 0,
    brush: 0,
    hardBrush: 0,
  },
}
let state
const initialState = {
  selectedTool: 'marker',
  currentPaper: config.papers[0],
  toolsMaxScroll: 0,
  currentScroll: 0,
  versionsTimeout: false,
  lastUsedTool: '',
  selectedVersions: { ...config.initialSelectedVersions },
  actionsPromises: [],
}
const refs = {
  toolsContainer: null,
  versionsContainer: null,
  toolsButtons: {},
  toolsVersions: {},
}

const toolsImgs = {
  'brush-1': require('static/img/tools/brush-1.png'),
  'brush-2': require('static/img/tools/brush-2.png'),
  'brush-3': require('static/img/tools/brush-3.png'),
  'brush-4': require('static/img/tools/brush-4.png'),
  'brush-5': require('static/img/tools/brush-5.png'),
  'brush-6': require('static/img/tools/brush-6.png'),
  'brush-7': require('static/img/tools/brush-7.png'),
  'brush-8': require('static/img/tools/brush-8.png'),
  'brush-9': require('static/img/tools/brush-9.png'),
  'brush-10': require('static/img/tools/brush-10.png'),
  'brush-11': require('static/img/tools/brush-11.png'),
  'highlighter-h': require('static/img/tools/highlighter-h.png'),
  'highlighter-l': require('static/img/tools/highlighter-l.png'),
  'highlighter-r': require('static/img/tools/highlighter-r.png'),
  'highlighter-v': require('static/img/tools/highlighter-v.png'),
}
// const toolsImgsFileNames = ['brush-1', 'brush-2', 'brush-3', 'brush-4', 'brush-5', 'brush-6', 'brush-7', 'brush-8', 'brush-9', 'brush-10', 'brush-11', 'highlighter-h', 'highlighter-l', 'highlighter-r', 'highlighter-v']
// const toolsImgs = Object.fromEntries(toolsImgsFileNames.map(imgName => ([imgName, require(`static/img/tools/${imgName}.png`)])))
const toolsFrameFiles = {}

const toolsFunctions = {
  marker: (selected) => {
    if (selected) {
      toggleVersions('marker')
    } else {
      selectTool('marker')
    }
  },
  pencil: (selected) => {
    if (selected) {
      toggleVersions('pencil')
    } else {
      selectTool('pencil')
    }
  },
  spray: (selected) => {
    if (selected) {
      toggleVersions('spray')
    } else {
      selectTool('spray')
    }
  },
  highlighter: (selected) => {
    if (selected) {
      toggleVersions('highlighter')
    } else {
      selectTool('highlighter')
    }
  },
  brush: (selected) => {
    if (selected) {
      toggleVersions('brush')
    } else {
      selectTool('brush')
    }
  },
  hardBrush: (selected) => {
    if (selected) {
      toggleVersions('hardBrush')
    } else {
      selectTool('hardBrush')
    }
  },
  eraser: (selected) => {
    if (selected) {
      toggleVersions('eraser')
    } else {
      selectTool('eraser')
    }
  },
  bucket: () => {
    selectTool('bucket')
  },
  pipette: () => {
    selectTool('pipette')
  },
  ruler: () => {
    (toggleActiveTool('ruler') ? Ruler.show() : Ruler.hide())
  },
  paper: () => {
    state.currentPaper = config.papers[(config.papers.indexOf(state.currentPaper) + 1) % config.papers.length]
    refs.toolsButtons.paper.classList.remove(...config.papers.map(e => `paper-${e}`))
    refs.toolsButtons.paper.classList.add(`paper-${config.papers[(config.papers.indexOf(state.currentPaper) + 1) % config.papers.length]}`)
    Editor.changePaper(state.currentPaper)
  },
  undo: () => PushNewActionPromise(Layers.undoLayers),
  redo: () => PushNewActionPromise(Layers.redoLayers),
  // save: () => Editor.save(),
  clear: () => {
    Editor.clear()
  },
}

const PushNewActionPromise = async(promise) => {
  state.actionsPromises.push(promise)
  if (state.actionsPromises.length === 1) {
    await executeOlderActionPromise()
  }
}
const executeOlderActionPromise = async() => {
  if (state.actionsPromises.length > 0) {
    await state.actionsPromises[0]()
    state.actionsPromises.shift()
    await executeOlderActionPromise()
  }
}

export const toggleButton = (tool, enabled) => {
  if (config.tools.indexOf(tool) >= 0) {
    const button = refs.toolsButtons[tool]
    if (button) {
      if (enabled) {
        button.classList.remove('disabled')
      } else {
        button.classList.add('disabled')
      }
    }
  }
}

export const clickButton = (tool) => {
  if (Object.prototype.hasOwnProperty.call(toolsFunctions, tool)) {
    (toolsFunctions[tool])()
  }
}

export const closeVersions = () => {
  if (state.versionsTimeout !== false && refs.versionsContainer.querySelector('.editor-tools__versions-open')) {
    refs.versionsContainer.querySelector('.editor-tools__versions-open').classList.remove('editor-tools__versions-open')
    clearTimeout(state.versionsTimeout)
    state.versionsTimeout = false
  }
}

const selectInitialTools = (selectedTool = false) => {
  for (let tool in refs.toolsVersions) {
    const selectedVersion = refs.toolsVersions[tool].querySelector('.editor-tools__versions-button-selected')
    if (selectedVersion) {
      selectedVersion.classList.remove('editor-tools__versions-button-selected')
    }
    refs.toolsVersions[tool].classList.remove('editor-tools__versions-open')
    refs.toolsVersions[tool].querySelector(`[data-versionsIndex='${state.selectedVersions[tool]}']`).classList.add('editor-tools__versions-button-selected')
  }

  if (selectedTool && config.tools.includes(selectedTool.name)) {
    selectTool(selectedTool.name, selectedTool.version, false)
  } else {
    selectTool(state.selectedTool, false, false)
  }

  refs.toolsContainer.scrollTop = 0
  refs.toolsButtons.ruler.classList.remove('editor-tools__tool-activated')
  state.currentPaper = config.papers[0]
  refs.toolsButtons.paper.classList.remove(...config.papers.map(e => `paper-${e}`))
  refs.toolsButtons.paper.classList.add(`paper-${config.papers[1]}`)
  Editor.changePaper(state.currentPaper)
  setTimeout(onRotate, 100)
}

const toggleVersions = (tool) => {
  Layers.closeResizeModeIfNeeded()
  const versions = refs.toolsVersions[tool]
  if (versions) {
    if (versions.classList.contains('editor-tools__versions-open')) {
      clearTimeout(state.versionsTimeout)
      state.versionsTimeout = false
      versions.classList.remove('editor-tools__versions-open')
    } else {
      versions.classList.add('editor-tools__versions-open')
      clearTimeout(state.versionsTimeout)
      state.versionsTimeout = setTimeout(closeVersions, config.versionsCloseDelay)
    }
  }
}

export const selectTool = (tool, versionIndex = false, showToolChange = true) => {
  Layers.closeResizeModeIfNeeded()
  Layers.updateCurrentTool(tool === 'eraser')
  if (state.lastUsedTool !== state.selectedTool && config.writingTools.includes(state.selectedTool)) {
    state.lastUsedTool = state.selectedTool
  }
  versionIndex = versionIndex !== false ? versionIndex : parseInt(state.selectedVersions[tool])

  setEditorToolByVersion(tool, versionIndex)
  closeVersions()
  if (showToolChange) {
    toggleVersions(tool)
  }
}

const setEditorToolByVersion = (tool, versionIndex) => {
  const toolProps = getOneToolVersionCompleteProps(tool, versionIndex)
  state.selectedTool = tool

  if (config.tools.includes(tool)) {
    for (let i in refs.toolsButtons) {
      if (i === tool) {
        refs.toolsButtons[tool].classList.add('editor-tools__tool-selected')
      } else {
        refs.toolsButtons[i].classList.remove('editor-tools__tool-selected')
      }
    }
  }

  if (toolsConfig[tool]?.versions.length) {
    refs.toolsVersions[tool].querySelector('.editor-tools__versions-button-selected').classList.remove('editor-tools__versions-button-selected')
    refs.toolsVersions[tool].querySelector(`.editor-tools__versions-button[data-versionsIndex="${versionIndex}"]`).classList.add('editor-tools__versions-button-selected')
    state.selectedVersions[tool] = versionIndex
    toolProps.version = versionIndex
  }

  ColorPicker.deselectPipette(false)
  Editor.setTool(toolProps)
}

export const selectLastUsedTool = (showToolChange = true) => {
  if (state.lastUsedTool) {
    selectTool(state.lastUsedTool, false, showToolChange)
  }
}

const toggleActiveTool = (tool) => refs.toolsContainer.querySelector(`.editor-tools__tool-${tool}`).classList.toggle('editor-tools__tool-activated')

// const toolIsActive = (tool) => refs.toolsButtons[tool].classList.contains('editor-tools__tool-activated')

export const setCurrentToolCustomProps = (customProps) => {
  // changing some tool props, like size or alpha
  const versionIndex = state.selectedVersions[state.selectedTool]
  if (versionIndex >= 0) {
    // this tool has versions ==> selected version custom props
    const version = toolsConfig[state.selectedTool].versions[versionIndex]
    version.customProps = {
      ...version.customProps,
      ...customProps,
    }
  } else {
    // this tool has no versions ==> tool custom props
    const tool = toolsConfig[state.selectedTool]
    tool.customProps = {
      ...tool.customProps,
      ...customProps,
    }
  }

  setEditorToolByVersion(state.selectedTool, versionIndex)
}

export const getCurrentToolCustomProps = () => {
  const versionIndex = state.selectedVersions[state.selectedTool]
  if (versionIndex >= 0) {
    return toolsConfig[state.selectedTool].versions[versionIndex].customProps
  } else {
    return toolsConfig[state.selectedTool].customProps || {}
  }
}

export const getOneToolVersionCompleteProps = (tool, versionIndex = false, higherProps = {}) => {
  if (versionIndex === false) {
    versionIndex = state.selectedVersions[tool]
  }

  let toolProps = {}
  if (toolsConfig[tool].versions.length && versionIndex >= 0) {
    toolProps = {
      ...toolsConfig[tool],
      ...toolsConfig[tool].versions[versionIndex].props,
      ...toolsConfig[tool].versions[versionIndex].customProps,
      name: toolsConfig[tool].name,
      versionName: toolsConfig[tool].versions[versionIndex].name,
      ...higherProps,
    }
  } else {
    toolProps = {
      ...toolsConfig[tool],
      ...toolsConfig[tool].customProps,
      ...higherProps,
    }
  }

  toolProps.frameImageFile = toolsFrameFiles[toolProps.frameImageName] || null

  delete toolProps.customProps
  delete toolProps.versions
  return toolProps
}

export const getCurrentSelectedTool = () => ({
  name: state.selectedTool,
  version: parseInt(state.selectedVersions[state.selectedTool]) || false,
})

export const getToolsCustomProps = () => {
  let toolsCustomProps = Object.values(toolsConfig).map(getToolCustomProps)
  toolsCustomProps.forEach(tool => {
    if (Object.keys(tool.customProps).length === 0) {
      delete tool.customProps
    }
    if (tool.versions) {
      tool.versions = tool.versions.filter(version => Object.keys(version.customProps).length)
      if (tool.versions.length === 0) {
        delete tool.versions
      }
    }
  })
  toolsCustomProps = toolsCustomProps.filter(tool => tool.customProps || tool.versions)
  return toolsCustomProps
}

const getToolCustomProps = (tool) => {
  const res = {
    name: tool.name,
    customProps: tool.customProps,
  }
  if (tool.versions && tool.versions.length > 0) {
    res.versions = tool.versions.map(getToolCustomProps)
  }
  return res
}

const onVersionsTouchStart = (el, e) => {
  preventDefault(e)
  const target = e.target.nodeName === 'P' ? e.target.parentNode : e.target
  if (
    target.classList.contains('editor-tools__versions-button') &&
    !target.classList.contains('editor-tools__versions-button-selected')
  ) {
    clearTimeout(state.versionsTimeout)
    state.versionsTimeout = setTimeout(closeVersions, config.versionsCloseDelay)
    setEditorToolByVersion(target.getAttribute('data-tool'), target.getAttribute('data-versionsIndex'))
  }
}

const onToolsScrollTouchStart = (e) => {
  if (e.type.indexOf('mouse') >= 0 && e.button > 0 || (e.touches && e.touches.length > 1)) {
    e.preventDefault()
    return
  }
  document.addEventListener(Params.eventEnd, onToolsScrollTouchEnd)

  if (state.toolsMaxScroll > 0) {
    if (refs.toolsContainer.scrollTop === 0) {
      state.currentScroll = refs.toolsContainer.scrollTop = 1
    } else if (refs.toolsContainer.scrollTop === state.toolsMaxScroll) {
      state.currentScroll = refs.toolsContainer.scrollTop = state.toolsMaxScroll - 1
    } else {
      state.currentScroll = refs.toolsContainer.scrollTop
    }
  }
}

const onToolsScrollTouchEnd = async(e) => {
  preventDefault(e)
  document.removeEventListener(Params.eventEnd, onToolsScrollTouchEnd)
  if (state.toolsMaxScroll > 0 && Math.abs(state.currentScroll - refs.toolsContainer.scrollTop) > 10) {
    return
  }
  state.currentScroll = 0
  const tool = e.target.getAttribute('data-tool')
  if (e.target.classList.contains('editor-tools__tool') && !e.target.classList.contains('disabled')) {
    if (Object.prototype.hasOwnProperty.call(toolsFunctions, tool)) {
      await toolsFunctions[tool](e.target.classList.contains('editor-tools__tool-selected'))
    }
  }
}

const onRotate = (e) => {
  state.toolsMaxScroll = refs.toolsContainer.scrollHeight - refs.toolsContainer.clientHeight
}

const initToolsImages = async() => {
  const promises = []

  for (const frameName of Object.keys(toolsImgs)) {
    const frameFileName = toolsImgs[frameName]
    promises.push(getImageFromUrl(frameFileName).then((img) => {
      toolsFrameFiles[frameName] = img
    }))
  }

  await Promise.all(promises)

  for (const tool of Object.values(toolsConfig)) {
    for (const i in tool.versions) {
      const version = tool.versions[i]
      const frameImageName = version.props.frameImageName || tool.frameImageName

      if (frameImageName) {
        const showVersionPreview = version.props.showVersionPreview || tool.showVersionPreview
        if (showVersionPreview) {
          const versionButton = document.querySelector(`.editor-tools__versions-${tool.name} [data-versionsIndex='${i}']`)
          versionButton.innerHTML = ''
          versionButton.style.backgroundImage = `url('${toolsImgs[frameImageName]}')`
        }
      }
    }
  }
}

const mergeCustomProps = (toolsCustomProps = []) => {
  if (toolsCustomProps && toolsCustomProps.length) {
    Object.values(toolsConfig).forEach(tool => {
      const customTool = toolsCustomProps.find(e => e.name === tool.name)
      if (customTool) {
        tool.customProps = customTool.customProps || {}
        if (tool.versions?.length > 0 && customTool.versions?.length > 0) {
          tool.versions.forEach(version => {
            version.customProps = customTool.versions.find(v => v.name === version.name)?.customProps || {}
          })
        }
      }
    })
  }
}

const initDom = async(moduleContainer) => {
  const toolsData = []
  for (var i = 0, l = config.tools.length; i < l; i++) {
    toolsData.push({
      name: config.tools[i],
      disabled: config.toolsDisabledByDefault.includes(config.tools[i]),
      versions: toolsConfig[config.tools[i]] ? toolsConfig[config.tools[i]].versions : false,
    })
  }

  let dom = await loadTemplate(tplTools, { toolsData }, moduleContainer)
  refs.toolsContainer = dom[0]
  refs.versionsContainer = dom[1]

  for (let i in config.tools) {
    const tool = config.tools[i]
    refs.toolsButtons[tool] = refs.toolsContainer.querySelector(`.editor-tools__tool-${tool}`)
    if (toolsConfig[tool]?.versions.length) {
      refs.toolsVersions[tool] = refs.versionsContainer.querySelector(`.editor-tools__versions-${tool}`)
      refs.toolsVersions[tool].addEventListener(Params.eventStart, onVersionsTouchStart.bind({}, refs.toolsVersions[tool]), true)
    }
  }
  refs.toolsButtons.paper.classList.add('paper-squares')
  refs.toolsContainer.addEventListener(Params.eventStart, onToolsScrollTouchStart)
  await initToolsImages()
  dom = undefined
}

export const init = async(moduleContainer, toolsCustomProps, selectedTool) => {
  toolsConfig = toolsConfigInit()
  mergeCustomProps(toolsCustomProps)
  await initDom(moduleContainer)
  state = deepCopy(initialState)
  selectInitialTools(selectedTool)
  addRotationHandler(onRotate)
}

export const remove = () => {
  removeRotationHandler(onRotate)
  closeVersions()
  clearTimeout(state.versionsTimeout)

  state = {}
  toolsConfig = undefined
  cleanRefs(refs)
}
