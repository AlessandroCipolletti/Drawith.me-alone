import Dexie from 'dexie'
import Params from 'main/Params'
import { securizeAsyncFn } from 'utils/jsUtils'
import { mergeUnchangedLayers } from '../pages/Editor/components/Layers/Layers'

export const DEFAULT_LOCAL_DB_ERROR_MSG = 'Db Error: refresh the page.'
export const DRAWING_STATE_SAVING_DRAFT_LOCALLY = 1
export const DRAWING_STATE_DRAFT_SAVED_LOCALLY = 2
export const DRAWING_STATE_SAVING_LOCALLY = 3
export const DRAWING_STATE_SAVED_LOCALLY = 4

export const drawingIsSaving = (drawing) => {
  return drawing.state === DRAWING_STATE_SAVING_DRAFT_LOCALLY || drawing.state === DRAWING_STATE_SAVING_LOCALLY
}

/*
  DB VERSION HISTORY:
  -------------------
*/


let LocalDatabase
export const initLocalDb = securizeAsyncFn(async() => {
  // indexedDB.deleteDatabase(Params.localDbName); return
  LocalDatabase = new Dexie(Params.localDbName)

  LocalDatabase.version(1).stores({
    Drawings: '++localDbId, folderId, title, state, wasSavedAsDraft, createTimestamp, updateTimestamp, createdAt, updatedAt, base64, bitmap, minX, minY, maxX, maxY, width, height, canvasWidth, canvasHeight, selectedTool, selectedColorId, colors, layers, appVersions, toolsCustomProps',
  })

  await deleteUnsavedDrawings()

  return true
}, DEFAULT_LOCAL_DB_ERROR_MSG, 'initLocalDb')

export const emptyDatabase = securizeAsyncFn(async() => {
  await LocalDatabase.Drawings.clear()
}, DEFAULT_LOCAL_DB_ERROR_MSG, 'emptyDatabase')

export const getDeviceLocalData = securizeAsyncFn(async() => ((await LocalDatabase.AppData.toArray())[0]), DEFAULT_LOCAL_DB_ERROR_MSG)

export const emptyDrawingsData = securizeAsyncFn(async() => await LocalDatabase.Drawings.clear(), DEFAULT_LOCAL_DB_ERROR_MSG, 'emptyDrawingsData')

export const deleteLocalDrawings = securizeAsyncFn(async(ids = []) => await LocalDatabase.Drawings.where('localDbId').anyOf(ids).delete(), DEFAULT_LOCAL_DB_ERROR_MSG, 'deleteLocalDrawings')

export const deleteUnsavedDrawings = securizeAsyncFn(async(ids = []) => await LocalDatabase.Drawings.where('state').equals(DRAWING_STATE_SAVING_DRAFT_LOCALLY).or('state').equals(DRAWING_STATE_SAVING_LOCALLY).delete(), DEFAULT_LOCAL_DB_ERROR_MSG, 'deleteUnsavedDrawings')

export const getAllLocalDrawings = securizeAsyncFn(async() => (await LocalDatabase.Drawings.orderBy('updateTimestamp').reverse().toArray()), DEFAULT_LOCAL_DB_ERROR_MSG, 'getAllLocalDrawings')

export const getDrawingsCount = securizeAsyncFn(async() => await LocalDatabase.Drawings.count(), DEFAULT_LOCAL_DB_ERROR_MSG, 'getDrawingsCount')

export const getOneDrawing = securizeAsyncFn(async(localDbId) => ((await LocalDatabase.Drawings.where('localDbId').equals(localDbId).toArray())[0]), DEFAULT_LOCAL_DB_ERROR_MSG, 'getOneDrawing')

export const getSomeDrawings = securizeAsyncFn(async(ids = []) => await Promise.all(ids.map(id => getOneDrawing(id))), DEFAULT_LOCAL_DB_ERROR_MSG, 'getSomeDrawings')

export const updateLocalDrawing = securizeAsyncFn(async(localDbId, drawing) => await LocalDatabase.Drawings.where('localDbId').equals(localDbId).modify(drawing), DEFAULT_LOCAL_DB_ERROR_MSG, 'updateLocalDrawing')

const addLocalDrawing = securizeAsyncFn(async(drawing) => await LocalDatabase.Drawings.add(drawing), DEFAULT_LOCAL_DB_ERROR_MSG, 'addLocalDrawing')

const updateDrawing = securizeAsyncFn(async(drawing) => {
  const oldDrawing = await getOneDrawing(drawing.localDbId)
  const appVersions = oldDrawing.appVersions
  if (!appVersions.includes(Params.appVersion)) {
    appVersions.push(Params.appVersion)
  }
  drawing.createTimestamp = oldDrawing.createTimestamp
  drawing.appVersions = appVersions
  drawing.updateTimestamp = Date.now()
  await updateLocalDrawing(drawing.localDbId, drawing)
}, DEFAULT_LOCAL_DB_ERROR_MSG, 'updateDrawing')

const addDrawing = securizeAsyncFn(async(drawing) => {
  const now = Date.now()
  drawing.createTimestamp = now
  drawing.updateTimestamp = now
  drawing.appVersions = [Params.appVersion]
  drawing.localDbId = await addLocalDrawing(drawing)
  return drawing.localDbId
}, DEFAULT_LOCAL_DB_ERROR_MSG, 'addDrawing')

export const saveDrawingToDB = securizeAsyncFn(async(drawing, isDraft = false) => {
  let id = drawing.localDbId
  const existingDrawing = !!id && await getOneDrawing(id)
  drawing.wasSavedAsDraft = isDraft

  if (isDraft) {
    if (drawing.layers.length) {
      drawing.state = DRAWING_STATE_DRAFT_SAVED_LOCALLY
    } else {
      drawing.state = DRAWING_STATE_SAVING_DRAFT_LOCALLY
    }
  } else {
    if (drawing.layers.length) {
      drawing.state = DRAWING_STATE_SAVED_LOCALLY
    } else {
      drawing.state = DRAWING_STATE_SAVING_LOCALLY
    }
  }

  console.log(`${existingDrawing ? 'Updated' : 'Saved new'} drawing ${isDraft ? 'draft' : ''}${drawing.layers.length === 0 ? 'temporarly': `(${drawing.layers.filter(l => l.base64).length} modified layers)`} --> state: ${drawing.state}`)

  // Ogni salvataggio fatto a mano passa di qui due volte:
  //   la prima salvo la preview del disegno completo, poi apro il folder per dare effetto async, e infine ripasso da qui per salvare tutti i layer esportati in background.
  // Quindi anche durante il primo salvataggio (senza layer) ho bisogno di mantenere i layer precedenti nel database per poterli sfruttare durante il secondo salvataggio definitivo.
  // Questo perché per ottimizzare il secondo salvataggio, esporto solo i layers che sono stati modificati, e per gli altri copio il base64 del layer già nel db.
  // Quindi se all'init trovo un disegno bloccato in stato di "saving" devo eliminarlo perché contiene la preview del disegno finito ma con i layers precedenti.
  if (existingDrawing) {
    if (drawing.layers.length) {
      drawing.layers = mergeUnchangedLayers(drawing.layers, existingDrawing.layers)
    } else {
      drawing.layers = existingDrawing.layers
    }
    await updateDrawing(drawing, isDraft)
  } else {
    delete drawing.localDbId
    id = await addDrawing(drawing, isDraft)
  }

  return id
}, DEFAULT_LOCAL_DB_ERROR_MSG, 'saveDrawingToDB')

export const saveDrawingPaletteColors = securizeAsyncFn(async(localDbId, colors = []) => {
  await updateLocalDrawing(localDbId, {
    colors,
  })
}, DEFAULT_LOCAL_DB_ERROR_MSG, 'saveDrawingPaletteColors')


export default LocalDatabase
