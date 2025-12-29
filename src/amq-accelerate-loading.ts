import { onReady } from '../lib/amq/onReady'

declare function swal(message: Record<string, unknown>): Promise<void>

declare const popoutMessages: {
  displayStandardMessage(header: string, message: string): void
  displayPopoutMessage(htmlBody: string, force?: boolean, onDisplay?: () => void): void
}

declare class MoeVideoPlayer {
  public getNextVideoId(): string | undefined
}

declare class ExpandQuestionBox {
  public showVideoPreview(url: string | undefined, ...args: unknown[]): void
}

const proxyHost = 'https://amq-proxy.starry.blue'

async function checkSession(): Promise<boolean> {
  try {
    const response = await fetch(`${proxyHost}/healthcheck`, {
      redirect: 'error',
      mode: 'cors',
      credentials: 'include',
    })

    return response.ok
  } catch {
    return false
  }
}

function replaceUrl(url: string): string {
  return `${proxyHost}/api/media?u=${encodeURIComponent(url)}`
}

onReady(async () => {
  const isAuthenticated = await checkSession()
  if (!isAuthenticated) {
    // すぐにアラートを出すとなぜか閉じられてしまうので遅延する
    setTimeout(() => {
      void swal({
        title: 'AMQ Accelerate Loading',
        text: 'この UserScript を使用するにはユーザ認証が必要です。認証後、AMQ に再度ログインしてください。',
        confirmButtonText: '認証',
        showCancelButton: true,
        cancelButtonText: 'キャンセル',
        allowOutsideClick: false,
        focusConfirm: true,
        showCloseButton: false,
        allowEscapeKey: false,
      }).then(() => {
        window.location.replace(proxyHost)
      })
    }, 5000)

    return
  } else {
    popoutMessages.displayStandardMessage('AMQ Accelerate Loading', '認証成功! UserScript は正常に動作しています。')
  }

  const { getNextVideoId } = MoeVideoPlayer.prototype
  MoeVideoPlayer.prototype.getNextVideoId = function () {
    const url = getNextVideoId.apply(this)
    if (!url) {
      return undefined
    }

    return replaceUrl(url)
  }

  const { showVideoPreview } = ExpandQuestionBox.prototype
  ExpandQuestionBox.prototype.showVideoPreview = function (url, ...args) {
    if (url) {
      showVideoPreview.apply(this, [replaceUrl(url), ...args])
    } else {
      showVideoPreview.apply(this, [url, ...args])
    }
  }

  AMQ_addScriptData({
    name: '[Closed Test] Accelerate Loading',
    author: 'SlashNephy &lt;spica@starry.blue&gt;',
    description: 'Load media faster from alternative sources.',
  })
})
