
const GET = 'GET'
const POST = 'POST'
// const PUT = 'PUT'
// const DELETE = 'DELETE'
// const PATCH = 'PATCH'

const api = (url, method = GET, isPrivate = true, asFormData = false) => ({
  url,
  method,
  isPrivate,
  asFormData,
})


const ApisConfig = {
  // Drawings apis
  // sendDrawings: api('drawings/sendDrawings', POST),
  saveDrawing: api('drawings/saveDrawing', POST),
  deleteDrawings: api('drawings/deleteDrawings', POST),
  getOneDrawing: api('drawings/getOneDrawing', POST),
  pushSyncDrawings: api('drawings/pushToSync', POST),
  setDrawingStateSaved: api('drawings/setDrawingStateSaved', POST),

  // App
  pageHide: api('app/pageHide', POST),
  pageShow: api('app/pageShow', POST),
}

export default ApisConfig
