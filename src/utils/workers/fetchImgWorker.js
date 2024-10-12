
self.addEventListener('message', async (event) => {
  const { id, url } = event.data

  const response = await fetch(url)

  const blob = await response.blob()

  self.postMessage({ id, blob })
})
