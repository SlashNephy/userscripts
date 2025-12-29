import { onReady } from '../lib/amq/onReady'

declare const quizVideoController: {
  getCurrentPlayer():
    | {
      resolution: number
      $player: JQuery<HTMLVideoElement>
    }
    | undefined
}

onReady(() => {
  const video = document.createElement('video')
  video.style.position = 'fixed'
  video.style.top = '0'
  video.style.left = '0'
  video.style.width = '100%'
  video.style.height = '100%'
  video.style.objectFit = 'cover'
  video.muted = true
  video.loop = true

  const container = document.getElementById('quizPage') ?? document.body
  container.insertAdjacentElement('afterbegin', video)

  new Listener('answer results', () => {
    const quizPlayer = quizVideoController.getCurrentPlayer()
    if (!quizPlayer) {
      return
    }

    // Sound Only の時は video をコピーしない
    if (quizPlayer.resolution === 0) {
      return
    }

    const quizVideo = quizPlayer.$player[0]
    if (quizVideo && video.src !== quizVideo.src) {
      video.src = quizVideo.src
      video.currentTime = quizVideo.currentTime
      void video.play()
    }
  }).bindListener()

  AMQ_addScriptData({
    name: 'Dynamic Background',
    author: 'SlashNephy &lt;spica@starry.blue&gt;',
    description: 'Set the currently playing video surface as the background image.',
  })
})
