import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bot, InlineKeyboard } from 'grammy'
import { getLineStats, startAutoRescan } from './lib/searchEngine.js'
import { searchWithAutoType } from './lib/queryDetect.js'
import { formatResultsPage, formatStartMessage, getTotalPages } from './lib/telegramFormat.js'
import { createSession, getSession } from './lib/telegramSession.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = __dirname
const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim()

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required. Set it in /root/api/telegram.env')
  process.exit(1)
}

let indexReady = false

function buildKeyboard(sessionId, page, totalPages) {
  if (totalPages <= 1) return undefined

  const keyboard = new InlineKeyboard()
  if (page > 0) {
    keyboard.text('Onceki', `p:${sessionId}:${page - 1}`)
  }

  keyboard.text(`${page + 1}/${totalPages}`, 'page:noop')

  if (page < totalPages - 1) {
    keyboard.text('Sonraki', `p:${sessionId}:${page + 1}`)
  }

  return keyboard
}

function buildPageText(session, page) {
  return formatResultsPage({
    query: session.query,
    results: session.results,
    found: session.found,
    foundExact: session.foundExact,
    page,
    ms: session.ms,
  })
}

async function sendResults(ctx, { query, searchResult, ms, page = 0 }) {
  const sessionId = createSession({
    query,
    results: searchResult.results,
    found: searchResult.found,
    foundExact: searchResult.foundExact !== false,
    ms,
  })

  const totalPages = getTotalPages(searchResult.results.length)
  const safePage = Math.min(Math.max(page, 0), totalPages - 1)
  const text = buildPageText(
    {
      query,
      results: searchResult.results,
      found: searchResult.found,
      foundExact: searchResult.foundExact !== false,
      ms,
    },
    safePage,
  )
  const keyboard = buildKeyboard(sessionId, safePage, totalPages)

  await ctx.reply(text, { reply_markup: keyboard })
}

bot.command('start', async (ctx) => {
  const stats = getLineStats(ROOT_DIR).stats
  await ctx.reply(formatStartMessage(stats))
})

bot.callbackQuery(/^page:noop$/, async (ctx) => {
  await ctx.answerCallbackQuery()
})

bot.callbackQuery(/^p:([a-z0-9]+):(\d+)$/, async (ctx) => {
  try {
    const sessionId = ctx.match[1]
    const page = Number(ctx.match[2])
    const session = getSession(sessionId)

    if (!session) {
      await ctx.answerCallbackQuery({ text: 'Arama suresi doldu. Yeniden ara.', show_alert: true })
      return
    }

    const totalPages = getTotalPages(session.results.length)
    const safePage = Math.min(Math.max(page, 0), totalPages - 1)

    await ctx.editMessageText(buildPageText(session, safePage), {
      reply_markup: buildKeyboard(sessionId, safePage, totalPages),
    })
    await ctx.answerCallbackQuery()
  } catch (error) {
    console.error('Pagination error:', error)
    await ctx.answerCallbackQuery({ text: 'Sayfa yuklenemedi.', show_alert: true })
  }
})

bot.on('message:text', async (ctx) => {
  const query = ctx.message.text.trim()
  if (!query || query.startsWith('/')) return

  if (!indexReady) {
    await ctx.reply('Veritabani hala yukleniyor. Birka dakika sonra tekrar dene.')
    return
  }

  try {
    const started = performance.now()
    const result = searchWithAutoType(query, { rootDir: ROOT_DIR })
    const ms = Number((performance.now() - started).toFixed(0))

    if (!result.ok) {
      await ctx.reply(result.error || 'Sorgu basarisiz.')
      return
    }

    if (!result.found) {
      await ctx.reply(`Sonuc bulunamadi: ${query}`)
      return
    }

    await sendResults(ctx, { query, searchResult: result, ms, page: 0 })
  } catch (error) {
    console.error('Search handler error:', error)
    await ctx.reply('Arama sirasinda bir hata olustu. Lutfen tekrar dene.')
  }
})

bot.catch((error) => {
  console.error('Telegram bot error:', error)
})

console.log('Warming search index...')
const warmStarted = performance.now()

function waitForIndexReady() {
  const stats = getLineStats(ROOT_DIR).stats
  if (stats.status === 'ready' && stats.indexed_records > 0) {
    indexReady = true
    console.log(
      `Index ready: ${stats.indexed_records} records in ${Math.round(performance.now() - warmStarted)}ms`,
    )
    return
  }

  setTimeout(waitForIndexReady, 2000)
}

waitForIndexReady()
startAutoRescan(ROOT_DIR)

console.log('Telegram bot starting...')
bot.start({
  drop_pending_updates: true,
  onStart: () => console.log('Telegram bot is running'),
})
