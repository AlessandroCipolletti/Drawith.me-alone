import { error as showErrorMessage } from 'modules/Messages'


// export const saveBlobToClipboard = async(blob) => {
//   const data = [new ClipboardItem({ [blob.type]: blob })]
//   await navigator.clipboard.write(data)
// }

// export const saveImageToClipboard = async(img, errorLabel = '') => {
//   try {
//     navigator.clipboard.write([
//       new ClipboardItem({ "image/png": img })
//     ])
//   } catch (e) {
//     if (errorLabel) {
//       showErrorMessage(errorLabel)
//     }
//     console.error('clipboard error', e)
//   }
// }

export const saveTextToClipboard = async(text, errorLabel = '') => {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/plain': text }), // eslint-disable-line no-undef
    ])
  } catch (e) {
    if (errorLabel) {
      showErrorMessage(errorLabel)
    }
    console.error('clipboard error', e)
  }
}
