
const config = {
  maxCacheSize: 100, // forse sarebbe cool parametrizzare questo in base alle prestazioni locali
}
const state = {
  items: {},
  ids: [],
}

const updateIds = () => state.ids = Object.keys(state.items)

export const add = (id, data) => {
  // TODO se la cache html5 può fare al caso nostro, salviamo data in cache, e id nella lista cosi sappiamo cosa abbiamo e cosa no
  // altrimenti mettiamo entrambi nel dizionario state.items
  if (state.items[id]) {
    return
  }
  state.items[id] = data
  updateIds()
}

export const get = (id) => state.items[id] || false

export const set = (id, data) => {
  del(id)
  add(id, data)
}

export const del = (id) => {
  state.items[id] = undefined
  delete state.items[id]
  updateIds()
}

export const log = () => console.log(state.items)

export const ids = () => state.ids

export const length = () => state.ids.length

export const exist = (id) => state.ids.indexOf(id) >= 0

export const clean = (force = false) => { // magari anche un metodo che controlli quanto abbiamo in cache e se necessario la liberi
  if (force || state.ids.length > config.maxCacheSize) {
    // TODO
  }
}

export const reset = () => {
  for (let i = state.ids.length; i--;) {
    const draw  = state.items[state.ids[i]]
    draw.onScreen = draw.onDashboard = false
  }
}
