import { Context, Markup, Telegraf } from "telegraf"
import { BOT_TOKEN, WEBHOOK_URL } from "./constants/index.js"

if (!BOT_TOKEN || !WEBHOOK_URL) throw new Error("No token or webhook url")

const bot = new Telegraf(BOT_TOKEN)
const DEFAULT_DELAY= 5
let delay = DEFAULT_DELAY

export interface DialogState {
  currentVersion: string
}
export interface BotState {
  [key: number]: DialogState
}
export const botState: BotState = {}

try {
  bot.use(Telegraf.log((resp) => console.log('update')))
  bot.telegram.setWebhook(WEBHOOK_URL)
    .then((res) => console.log(res))
    .catch((err) => console.error(err))
} catch (error) {
  console.error(error)
  bot.stop()
}

bot.catch((err, ctx) => {
    console.error(
      `⚠️ Ooops, encountered an error for ${ctx.updateType.toUpperCase()}:\n${err}`
    )
})

bot.start((ctx) => ctx.reply('Hi!'))
bot.help((ctx) => ctx.reply('MESSAGES.HELP'))

bot.hears(/\d+/, ctx => {
  delay=+ctx.text
})
bot.hears(/.*/, ctx => {
  if (ctx.message.from.username !== 'm0rtyn') return ctx.reply("You aren't Martyn")

  ctx.reply(`👌 Отложил на ${delay} секунд`)
  setTimeout(() => {
    ctx.forwardMessage(ctx.chat.id)
    delay=DEFAULT_DELAY
  }, delay * 1000)
  return
})

bot
  .launch({allowedUpdates: ['message', 'callback_query']}).then(() => {
    console.log("🎬 Bot is up and running")
  })
  .catch((err) => console.error("🚀 ~ err", err))
process.once("SIGINT", () => bot.stop())
process.once("SIGTERM", () => bot.stop())
