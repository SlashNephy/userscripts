import { awaitFor } from '../awaitFor'

export const onReady = (callback: () => void | Promise<void>): void => {
  // should not work on pre-login page
  if (document.getElementById('startPage')) {
    return
  }

  awaitFor(() => document.getElementById('loadingScreen')?.classList.contains('hidden') === true)
    // eslint-disable-next-line promise/no-callback-in-promise
    .then(callback)
    .catch(console.error)
}
