import { onReady } from '../lib/amq/onReady'
import { PlayerAnswerTimeManager } from '../lib/amq/PlayerAnswerTimeManager'
import { fetchArmEntries } from '../lib/external/arm'
import { executeGmXhr } from '../lib/tampermonkey/executeGmXhr'
import { GM_Value } from '../lib/tampermonkey/GM_Value'

const gasUrl = new GM_Value('GAS_URL', '')
const dryRun = new GM_Value('DRY_RUN', false)

const executeGas = async (rows: (string | number | boolean)[]) => {
  const url = gasUrl.get()
  if (url === '') {
    throw new Error('Please set GAS_URL from the Storage tab in Tampermonkey dashboard.')
  }

  if (dryRun.get()) {
    return
  }

  // XXX: CORS を回避するため GM_xmlhttpRequest を使う
  // eslint-disable-next-line deprecation/deprecation
  await executeGmXhr({
    url,
    method: 'POST',
    data: JSON.stringify(rows),
    headers: {
      'User-Agent':
        'amq-result-exporter (+https://github.com/SlashNephy/userscripts/raw/master/src/amq-result-exporter.ts)',
      'Content-Type': 'application/json',
    },
  })
}

onReady(async () => {
  const armEntries = await fetchArmEntries()

  const playerAnswerTimes = new PlayerAnswerTimeManager()
  new Listener('answer results', (event) => {
    const { quiz, quizVideoController } = unsafeWindow

    // 自分が参加していないときは無視
    const self = Object.values(quiz.players).find((p) => p.isSelf && p._inGame)
    if (!self) {
      return
    }

    const players = Object.values(event.players)
      .sort((a, b) => {
        if (a.answerNumber !== undefined && b.answerNumber !== undefined) {
          return a.answerNumber - b.answerNumber
        }

        const p1name = quiz.players[a.gamePlayerId]?._name
        if (p1name === undefined) {
          return 0
        }

        const p2name = quiz.players[b.gamePlayerId]?._name
        if (p2name === undefined) {
          return 0
        }

        return p1name.localeCompare(p2name)
      })
      .map((p) => ({
        status: p.listStatus,
        id: p.gamePlayerId,
        name: quiz.players[p.gamePlayerId]?._name,
        score: p.score,
        correctGuesses: quiz.gameMode !== 'Standard' && quiz.gameMode !== 'Ranked' ? p.correctGuesses : p.score,
        correct: p.correct,
        answer: quiz.players[p.gamePlayerId]?.avatarSlot.$answerContainerText.text(),
        guessTime: playerAnswerTimes.query(p.gamePlayerId),
        active: !quiz.players[p.gamePlayerId]?.avatarSlot._disabled,
        position: p.position,
        positionSlot: p.positionSlot,
      }))

    const selfResult = players.find((p) => p.id === self.gamePlayerId)
    const selfAnswer = selfResult?.answer?.replace('...', '').replace(/ \(\d+ms\)$/, '') ?? ''

    const rows = [
      Date.now(),
      parseInt($('#qpCurrentSongCount').text(), 10),
      quiz.gameMode,
      selfResult?.correct ?? false,
      selfAnswer,
      selfResult?.guessTime ?? 0,
      event.songInfo.animeNames.romaji,
      event.songInfo.animeNames.english,
      [...new Set(event.songInfo.altAnimeNames.concat(event.songInfo.altAnimeNamesAnswers))].join('\n'),
      event.songInfo.animeDifficulty.toFixed(1),
      event.songInfo.type === 3
        ? 'Insert Song'
        : event.songInfo.type === 2
        ? `Ending ${event.songInfo.typeNumber}`
        : `Opening ${event.songInfo.typeNumber}`,
      event.songInfo.vintage,
      event.songInfo.animeType,
      event.songInfo.animeScore,
      event.songInfo.siteIds.malId,
      armEntries.find((e) => e.mal_id === event.songInfo.siteIds.malId)?.annict_id ?? '',
      event.songInfo.songName,
      event.songInfo.artist,
      event.songInfo.animeGenre.join('\n'),
      event.songInfo.animeTags.join('\n'),
      '',
      '',
      parseFloat(
        quizVideoController.moePlayers[quizVideoController.currentMoePlayerId]?.$player[0]?.duration.toFixed(2) ?? '0'
      ),
      quizVideoController.moePlayers[quizVideoController.currentMoePlayerId]?.startPoint ?? '',
      event.players.filter((player) => player.correct).length,
      Object.values(quiz.players).filter((player) => !player.avatarSlot._disabled).length,
      players
        .filter((p) => p.correct)
        .map((p) => p.name)
        .join('\n'),
      players.map((p) => p.name).join('\n'),
      selfResult?.status ?? 0,
      players
        .filter((p) => p.status)
        .map((p) => p.name)
        .join('\n'),
      event.songInfo.siteIds.aniListId,
    ]
    executeGas(rows).catch(console.error)
  }).bindListener()

  AMQ_addScriptData({
    name: 'Result Exporter',
    author: 'SlashNephy &lt;spica@starry.blue&gt;',
    description: 'Export song results to Google Spreadsheet!',
  })
})
