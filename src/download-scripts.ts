import { saveAs } from 'file-saver'
import JSZip from 'jszip'

import { executeGmXhr } from '../lib/tampermonkey/executeGmXhr'

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    downloadScripts(): Promise<void>
  }
}

let inlines = 0

async function downloadScripts(): Promise<void> {
  const zip = new JSZip()
  for (const { type, src, textContent } of Array.from(document.getElementsByTagName('script'))) {
    if (type !== '' && type !== 'text/javascript') {
      continue
    }

    try {
      if (src) {
        // eslint-disable-next-line no-await-in-loop
        await addRemoteScript(zip, new URL(src))
      } else if (textContent) {
        addInlineScript(zip, textContent)
      }
    } catch (e: unknown) {
      console.warn(`failed to fetch script: ${e}`)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${sanitizeHost(window.location.host)}.zip`)
}

async function addRemoteScript(zip: JSZip, url: URL): Promise<void> {
  const directoryName = sanitizeHost(url.host)
  const directory = zip.folder(directoryName)
  if (!directory) {
    throw new Error(`failed to create folder: ${directoryName}`)
  }

  // eslint-disable-next-line deprecation/deprecation
  const { responseText } = await executeGmXhr({ url: url.toString() })

  const path = url.pathname.split('/').pop() ?? 'index.js'
  directory.file(path, responseText)
}

function addInlineScript(zip: JSZip, content: string) {
  const directoryName = sanitizeHost(window.location.host)
  const directory = zip.folder(directoryName)
  if (!directory) {
    throw new Error(`failed to create folder: ${directoryName}`)
  }

  const path = `inline_${inlines++}.js`
  directory.file(path, content)
}

function sanitizeHost(host: string): string {
  return host.replace(':', '_')
}

unsafeWindow.downloadScripts = downloadScripts
GM_registerMenuCommand('Download Scripts', () => {
  downloadScripts().catch(console.error)
})
