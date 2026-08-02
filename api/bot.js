import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bot, InlineKeyboard } from 'grammy'
import { getLineStats, startAutoRescan } from './lib/searchEngine.js'
import { searchWithAutoType } from './lib/queryDetect.js'
import {
  formatResultsPage,
  formatStartMessage,
  getTotalPages,
  MAX_FETCH,
  PAGE_SIZE,
} from './lib/telegramFormat.js'
import { createSession, getSession } from './lib/telegramSession.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = __dirname
const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim()

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required. Set it in /root/api/telegram.env')
  process.exit(1)
}

const bot = new Bot(TOKEN)

function buildKeyboard(sessionId, page, totalPages) {
  if (totalPages <= 1) return undefined

  const keyboard = new InlineKeyboard()
  if (page > 0) {
    keyboard.text('◀️ Önceki', `p:${sessionId}:${page - 1}`)
  }

  keyboard.text(`${page + 1} / ${totalPages}`, 'page:noop')

  if (page < totalPages - 1) {
    keyboard.text('Sonraki ▶️', `p:${sessionId}:${page + 1}`)
  }

  return keyboard
}

async function sendResults(ctx, { query, searchResult, ms, page = 0, edit = false }) {
  const sessionId = createSession({
    query,
    results: searchResult.results,
    found: searchResult.found,
    ms,
  })

  const totalPages = getTotalPages(searchResult.results.length)
  const safePage = Math.min(Math.max(page, 0), totalPages - 1)
  const text = formatResultsPage({
    query,
    results: searchResult.results,
    found: searchResult.found,
    page: safePage,
    ms,
  })
  const keyboard = buildKeyboard(sessionId, safePage, totalPages)
  const options = { parse_mode: 'HTML', reply_markup: keyboard }

  if (edit && ctx.callbackQuery?.message) {
    await ctx.editMessageText(text, options)
    await ctx.answerCallbackQuery()
    return
  }

  await ctx.reply(text, options)
}

bot.command('start', async (ctx) => {
  const stats = getLineStats(ROOT_DIR).stats
  await ctx.reply(formatStartMessage(stats), { parse_mode: 'HTML' })
})

bot.callbackQuery(/^page:noop$/, async (ctx) => {
  await ctx.answerCallbackQuery()
})

bot.callbackQuery(/^p:([a-z0-9]+):(\d+)$/, async (ctx) => {
  const sessionId = ctx.match[1]
  const page = Number(ctx.match[2])
  const session = getSession(sessionId)

  if (!session) {
    await ctx.answerCallbackQuery({ text: 'Bu arama süresi doldu. Yeniden ara.', show_alert: true })
    return
  }

  const text = formatResultsPage({
    query: session.query,
    results: session.results,
    found: session.found,
    page,
    ms: session.ms,
  })
  const totalPages = getTotalPages(session.results.length)
  const safePage = Math.min(Math.max(page, 0), totalPages - 1)

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: buildKeyboard(sessionId, safePage, totalPages),
  })
  await ctx.answerCallbackQuery()
})

bot.on('message:text', async (ctx) => {
  const query = ctx.message.text.trim()
  if (!query || query.startsWith('/')) return

  const stats = getLineStats(ROOT_DIR).stats
  if (stats.status !== 'ready' || stats.indexed_records === 0) {
    await ctx.reply('Veritabanı hâlâ yükleniyor. Birkaç dakika sonra tekrar dene.')
    return
  }

  await ctx.replyWithChatAction('typing')

  const started = performance.now()
  const result = searchWithAutoType(query, { limit: MAX_FETCH, rootDir: ROOT_DIR })
  const ms = Number((performance.now() - started).toFixed(1))

  if (!result.ok) {
    await ctx.reply(result.error || 'Sorgu başarısız.')
    return
  }

  if (!result.found) {
    await ctx.reply(`Sonuç bulunamadı: ${query}`)
    return
  }

  await sendResults(ctx, { query, searchResult: result, ms, page: 0 })
})

bot.catch((error) => {
  console.error('Telegram bot error:', error)
})

console.log('Warming search index...')
const warmStarted = performance.now()
const warmStats = getLineStats(ROOT_DIR).stats
console.log(
  `Index status: ${warmStats.status} (${warmStats.indexed_records} records) in ${Math.round(performance.now() - warmStarted)}ms`,
)

startAutoRescan(ROOT_DIR)

console.log('Telegram bot starting...')
bot.start({
  drop_pending_updates: true,
  onStart: () => console.log('Telegram bot is running'),
})
