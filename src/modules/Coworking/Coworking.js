import { v4 as uuidv4 } from 'uuid'
import Params from 'main/Params'
import PeerSocket from 'modules/PeerSocket'
import { goToPage, openPageFolder, getCurrentPage } from 'modules/Router'
import * as Messages from 'modules/Messages'
import { deepCopy, delay } from 'utils/jsUtils'
import { drawCoworkingMultipleStepsData, getCanvasPxSizes } from 'pages/Editor'
import * as Layers from 'pages/Editor/components/Layers'
import { closeCoworkingPopup } from 'pages/Folder'
import { editorEvents, SOCKET_CONNECTED_STATUS } from './constants'
import { addGlobalStatus, removeGlobalStatus } from 'utils/moduleUtils'


let peerClient = {}
const config = {
  maxConcurrentConnections: 1,
}
export const state = {
  userId: uuidv4(),
  isOpen: false,
  connectedUserId: '',
  iAskedForCoworking: false, // true if I'm connecting to someone else
  clientData: {
    userId: '',
    codeVersion: 0,
    deviceType: '',
    screenWidth: 0,
    screenHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
  },
  coworkingData: {
    minCanvasWidth: 0,
    minCanvasHeight: 0,
  },
  isWaitingPeerConnection: false,
  waitingToConnectToSocketId: false, // false or coworkerSocketId. If coworkerSocketId, onConnect we try to open coworking with that coworkerSocketId
  stepsBuffer: [],
}
const labels = {
  networkError: 'Network Error',
  coworkingClosed: 'Session closed',
  errorHimself: 'You can\'t connect to yourself',
  alreadyConnected: 'You are already connected to someone',
  badCode: 'This code is not valid',
  coworkingStarted: 'Coworking session started!',
  userNotAvailable: 'Selected user is already connected with someone',
  coworkerNeedsToUpdate: 'Your coworker needs to update the app at the latest version',
  youNeedToUpdate: 'You need to update the app to connect with someone else',
}

export const isOnline = () => !!peerClient.online
export const isConnectedWithSomeone = () => !!peerClient.connected
export const isOpen = () => !!state.isOpen
export const getSocketId = () => peerClient.id
export const getUserId = () => state.userId
export const getCoworkerUserId = () => state.connectedUserId
export const isHostingCoworking = () => state.isOpen && !state.iAskedForCoworking

const handlePeerMessage = (message) => {
  console.log(`coworking message: ${message.event}`)
  if (message.event === editorEvents.coworkingSteps) {
    drawCoworkingMultipleStepsData(message.data)
  } else if (message.event === editorEvents.newLayer) {
    receiveNewLayer(message.data.layer)
  } else if (message.event === editorEvents.clientEnvironment) {
    checkCoworkerEnvironment(message.data)
  } else if (message.event === editorEvents.selectedLayer) {
    receiveSelectedLayer(message.data.layerId)
  } else if (message.event === editorEvents.undo) {
    receiveUndo(message.data.userId)
  } else if (message.event === editorEvents.redo) {
    receiveRedo(message.data.userId)
  } else if (message.event === editorEvents.deleteLayer) {
    receiveDeleteLayer(message.data.layerId, message.data.nextSelectedId)
  } else if (message.event === editorEvents.renameLayer) {
    receiveRenameLayer(message.data.layerId, message.data.newName)
  } else if (message.event === editorEvents.duplicateLayer) {
    receiveDuplicateLayer(message.data.layerId, message.data.newId)
  } else if (message.event === editorEvents.mergeLayers) {
    receiveMergeLayers(message.data.layerOneId, message.data.layerTwoId, message.data.newLayerId)
  } else if (message.event === editorEvents.opacityLayer) {
    receiveOpacityLayer(message.data.layerId, message.data.newValue, message.data.oldValue)
  } else if (message.event === editorEvents.enableLayer) {
    receiveEnableLayer(message.data.layerId)
  } else if (message.event === editorEvents.disableLayer) {
    receiveDisableLayer(message.data.layerId)
  } else if (message.event === editorEvents.orderDragLayer) {
    receiveOrderDragLayer(message.data.layerId, message.data.newOrder, message.data.oldOrder)
  } else if (message.event === editorEvents.flipLayer) {
    receiveFlipLayer(message.data.layerId, message.data.horizontally)
  } else if (message.event === editorEvents.resizeLayer) {
    receiveResizeLayer(message.data.layerId, message.data.x, message.data.y, message.data.w, message.data.h, message.data.r)
  } else if (message.event === editorEvents.clearLayer) {
    receiveClearLayer(message.data.layerId)
  } else if (message.event === editorEvents.transferLayer) {
    receiveTransferLayer(message.data.layerId)
  }
}

export const sendDeleteLayer = (layerId, nextSelectedId) => {
  const message = {
    event: editorEvents.deleteLayer,
    data: {
      layerId,
      nextSelectedId,
    },
  }

  peerClient.sendMessage(message)
}

const receiveDeleteLayer = (layerId, nextSelectedId) => {
  Layers.deleteLayerFromCoworker(layerId, nextSelectedId)
}

export const sendRenameLayer = (layerId, newName) => {
  const message = {
    event: editorEvents.renameLayer,
    data: {
      layerId,
      newName,
    },
  }

  peerClient.sendMessage(message)
}

const receiveRenameLayer = (layerId, newName) => {
  Layers.renameLayerFromCoworker(layerId, newName)
}

export const sendDuplicateLayer = (layerId, newId) => {
  const message = {
    event: editorEvents.duplicateLayer,
    data: {
      layerId,
      newId,
    },
  }

  peerClient.sendMessage(message)
}

const receiveDuplicateLayer = (layerId, newId) => {
  Layers.duplicateLayerFromCoworker(layerId, newId)
}

export const sendMergeDownLayer = (layerOneId, layerTwoId, newLayerId) => {
  const message = {
    event: editorEvents.mergeLayers,
    data: {
      layerOneId,
      layerTwoId,
      newLayerId,
    },
  }

  peerClient.sendMessage(message)
}

const receiveMergeLayers = (layerOneId, layerTwoId, newLayerId) => {
  Layers.mergeLayersFromCoworker(layerOneId, layerTwoId, newLayerId)
}

export const sendOpacityLayer = (layerId, newValue, oldValue) => {
  const message = {
    event: editorEvents.opacityLayer,
    data: {
      layerId,
      newValue,
      oldValue,
    },
  }

  peerClient.sendMessage(message)
}

const receiveOpacityLayer = (layerId, newValue, oldValue) => {
  Layers.updateLayerOpacityFromCoworker(layerId, newValue, oldValue)
}

export const sendEnableLayer = (layerId) => {
  const message = {
    event: editorEvents.enableLayer,
    data: {
      layerId,
    },
  }

  peerClient.sendMessage(message)
}

const receiveEnableLayer = (layerId) => {
  Layers.enableLayerFromCoworker(layerId)
}

export const sendDisableLayer = (layerId) => {
  const message = {
    event: editorEvents.disableLayer,
    data: {
      layerId,
    },
  }

  peerClient.sendMessage(message)
}

const receiveDisableLayer = (layerId) => {
  Layers.disableLayerFromCoworker(layerId)
}

export const sendOrderDragLayer = (layerId, newOrder, oldOrder) => {
  const message = {
    event: editorEvents.orderDragLayer,
    data: {
      layerId,
      newOrder,
      oldOrder,
    },
  }

  peerClient.sendMessage(message)
}

const receiveOrderDragLayer = (layerId, newOrder, oldOrder) => {
  Layers.layerDragChangeFromCoworker(layerId, newOrder, oldOrder)
}

export const sendFlipLayer = (layerId, horizontally) => {
  const message = {
    event: editorEvents.flipLayer,
    data: {
      layerId,
      horizontally,
    },
  }

  peerClient.sendMessage(message)
}

const receiveFlipLayer = (layerId, horizontally) => {
  Layers.receiveFlipLayerFromCoworker(layerId, horizontally)
}

export const sendResizeLayer = (layerId, x, y, w, h, r) => {
  const message = {
    event: editorEvents.resizeLayer,
    data: {
      layerId,
      x,
      y,
      w,
      h,
      r,
    },
  }

  peerClient.sendMessage(message)
}

const receiveResizeLayer = (layerId, x, y, w, h, r) => {
  Layers.receiveResizeLayerFromCoworker(layerId, x, y, w, h, r)
}

export const sendClearLayer = (layerId) => {
  const message = {
    event: editorEvents.clearLayer,
    data: {
      layerId,
    },
  }

  peerClient.sendMessage(message)
}

const receiveClearLayer = (layerId) => {
  Layers.clearLayerFromCoworker(layerId)
}

export const sendTransferLayer = (layerId) => {
  const message = {
    event: editorEvents.transferLayer,
    data: {
      layerId,
    },
  }

  peerClient.sendMessage(message)
}

const receiveTransferLayer = (layerId) => {
  Layers.receiveLayerFromCoworker(layerId)
}

const receiveNewLayer = async(layer) => {
  await waitForEditorToBeReady()
  layer.minX = Infinity
  layer.minY = Infinity
  layer.maxX = -Infinity
  layer.maxY = -Infinity
  Layers.addNewLayerFromCoworker(layer)
}

export const sendNewLayer = (layer) => {
  layer = JSON.parse(JSON.stringify(layer))
  delete layer.minX
  delete layer.minY
  delete layer.maxX
  delete layer.maxY
  delete layer.canvas
  delete layer.history
  delete layer.previewRef

  const message = {
    event: editorEvents.newLayer,
    data: {
      layer,
    },
  }

  peerClient.sendMessage(message)
}

export const sendUndo = () => {
  const message = {
    event: editorEvents.undo,
    data: {
      userId: state.userId,
    },
  }

  peerClient.sendMessage(message)
}

const receiveUndo = (userId) => {
  Layers.doUndoForUser(userId)
}

export const sendRedo = () => {
  const message = {
    event: editorEvents.redo,
    data: {
      userId: state.userId,
    },
  }

  peerClient.sendMessage(message)
}

const receiveRedo = (userId) => {
  Layers.doRedoForUser(userId)
}

const receiveSelectedLayer = (layerId) => {
  Layers.selectCoworkerLayer(layerId)
}

export const sendSelectedLayer = (layerId) => {
  const message = {
    event: editorEvents.selectedLayer,
    data: {
      layerId,
    },
  }

  peerClient.sendMessage(message)
}

export const addStep = (step) => {
  state.stepsBuffer.push(step)
}

export const clearSteps = () => state.stepsBuffer = []

export const sendSteps = (layerId, tool) => {
  tool = deepCopy(tool)
  delete tool.frameImageFile

  const message = {
    event: editorEvents.coworkingSteps,
    data: {
      steps: state.stepsBuffer,
      layerId,
      tool,
    },
  }

  peerClient.sendMessage(message)
  clearSteps()
}

const startCoworkingSession = async(userId) => {
  state.isOpen = true
  state.connectedUserId = userId
  // qui passo la dimensione dello schermo piú piccolo tra i due per farli disegnare sullo stesso foglio
  // ma questa cosa dovrà essere modificata quando sarà possibile anche aprire un coworking da dentro l'editor con un disegno già esistente
  // il canvas li resterà alle sue dimensioni attuali, ma chi ha lo schermo più piccolo deve ricevere una notifica
  Messages.info(labels.coworkingStarted)
  const editorOptions = {
    coworkerId: userId,
    withCoworking: true,
    isHostingCoworking: !state.iAskedForCoworking,
    coworkingCanvasWidth: state.coworkingData.minCanvasWidth,
    coworkingCanvasHeight: state.coworkingData.minCanvasHeight,
  }

  goToPage(`/editor/open/false/${JSON.stringify(editorOptions)}`)
}

export const updateClientEnvironment = () => {
  if (isOnline()) {
    const [canvasWidth, canvasHeight] = getCanvasPxSizes(true)
    state.clientData.userId = state.userId
    state.clientData.codeVersion = Params.appVersion
    state.clientData.deviceType = Params.deviceType
    state.clientData.canvasWidth = canvasWidth
    state.clientData.canvasHeight = canvasHeight
    state.clientData.screenWidth = Params.width
    state.clientData.screenHeight = Params.height
  }
}

const sendClientEnvironmentToCoworker = () => {
  peerClient.sendMessage({
    event: editorEvents.clientEnvironment,
    data: state.clientData,
  })
}

const checkCoworkerEnvironment = (coworkerEnvironment) => {
  if (coworkerEnvironment.codeVersion !== state.clientData.codeVersion) {
    if (coworkerEnvironment.codeVersion < state.clientData.codeVersion) {
      Messages.info(labels.coworkerNeedsToUpdate)
    } else {
      Messages.info(labels.youNeedToUpdate)
    }
    return
  }

  state.coworkingData.minCanvasWidth = Math.min(coworkerEnvironment.canvasWidth, state.clientData.canvasWidth)
  state.coworkingData.minCanvasHeight = Math.min(coworkerEnvironment.canvasHeight, state.clientData.canvasHeight)

  startCoworkingSession(coworkerEnvironment.userId)
}

// to call from module Editor, when url drawith.me/editor/coworking/abc123 is open
export const requestSession = (coworkerSocketId) => {
  console.log('Coworking requestSession', coworkerSocketId)
  state.iAskedForCoworking = true
  if (!coworkerSocketId) {
    return
  }
  if (!isOnline()) {
    state.waitingToConnectToSocketId = coworkerSocketId
    return
  }
  if (isOpen()) {
    Messages.error(labels.alreadyConnected)
    return
  }
  if (coworkerSocketId === peerClient.id) {
    Messages.error(labels.errorHimself)
    return
  }

  peerClient.connectTo(coworkerSocketId)
}

export const stop = () => {
  if (isOpen()) {
    peerClient.disconnectFrom()
  }
}

const handlePeerClientOnline = async(id) => {
  console.log('Peer client online', id)
  state.isWaitingPeerConnection = false
  addGlobalStatus(SOCKET_CONNECTED_STATUS)
  updateClientEnvironment()
  if (state.waitingToConnectToSocketId) {
    requestSession(state.waitingToConnectToSocketId)
    state.waitingToConnectToSocketId = false
  }
}

const handlePeerClientOffline = (duringCoworkingSession) => {
  console.log('Peer client offline')
  removeGlobalStatus(SOCKET_CONNECTED_STATUS)
  if (duringCoworkingSession) {
    Messages.error(labels.networkError)
  }
  if (getCurrentPage() === 'folder') {
    closeCoworkingPopup()
  }
}

const handleNewConnection = () => {
  console.log('Coworking newConnection')
  sendClientEnvironmentToCoworker()
}

const handleConnectionFailed = () => {
  console.log('Coworking newConnectionFailed')
  Messages.error(labels.badCode)
  openPageFolder()
}

const handleConnectionRefused = () => {
  console.log('Coworking newConnectionRefused')
  Messages.error(labels.userNotAvailable)
  openPageFolder()
}

const handleConnectionClosed = () => {
  console.log('Coworking connectionClosed')
  Messages.info(labels.coworkingClosed)
  state.connectedUserId = ''
  state.isOpen = false
  state.iAskedForCoworking = false
}

const waitForEditorToBeReady = async() => {
  let attempts = 0
  const maxAttempts = 10

  while (getCurrentPage() !== 'editor') {
    if (attempts > maxAttempts) {
      throw new Error('waitForEditorToBeReady timeout')
    }
    attempts++
    await delay(100)
  }
}

export const init = () => {
  return new Promise((resolve, reject) => {
    if (!isOnline() && !state.isWaitingPeerConnection) {
      state.isWaitingPeerConnection = true

      peerClient = new PeerSocket({
        host: Params.peerServerHost,
        port: Params.peerServerPort,
        path: Params.peerServerPath,
        pingInterval: Params.peerPingInterval,
        maxConcurrentConnections: config.maxConcurrentConnections,
      })

      peerClient.on('online', handlePeerClientOnline)
      peerClient.on('offline', handlePeerClientOffline)
      peerClient.on('newConnection', handleNewConnection)
      peerClient.on('message', handlePeerMessage)
      peerClient.on('newConnectionFailed', handleConnectionFailed)
      peerClient.on('newConnectionRefused', handleConnectionRefused)
      peerClient.on('connectionClosed', handleConnectionClosed)
    }
    resolve()
  })
}
