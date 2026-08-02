import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Bot } from 'grammy'
import { getLineStats, startAutoRescan } from './lib/searchEngine.js'
import { searchWithAutoType } from './lib/queryDetect.js'
import { formatResultsMessage, formatStartMessage } from './lib/telegramFormat.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = __dirname
const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim()

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required. Set it in /root/api/telegram.env')
  process.exit(1)
}

const bot = new Bot(TOKEN)

bot.command('start', async (ctx) => {
  const stats = getLineStats(ROOT_DIR).stats
  await ctx.reply(formatStartMessage(stats))
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
  const result = searchWithAutoType(query, { limit: 10, rootDir: ROOT_DIR })
  const ms = Number((performance.now() - started).toFixed(1))

  const message = `${formatResultsMessage(query, result)}\n\n${ms}ms`
  await ctx.reply(message)
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
