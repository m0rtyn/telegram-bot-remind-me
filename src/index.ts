import { Markup, Telegraf } from "telegraf"
import { Answers, BOT_TOKEN, MESSAGES, WEBHOOK_URL } from "./constants/index.js"
import {
  askNextChapter,
  logUserIn,
  onChapterRead,
  onOtherChapterRead,
  onStart,
  selectOtherChapter,
  showUserStats
} from "./bot.js"

if (!BOT_TOKEN || !WEBHOOK_URL) throw new Error("No token or webhook url")

const bot = new Telegraf(BOT_TOKEN)

export interface DialogState {
  isOtherChapterSelectionActive: boolean
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
  // TODO: add logging to m0rtyn
  // const m0rtynChatId = ???
  // ctx.forwardMessage(ctx, m0rtynChartId, err)

  if (typeof err === "string" && err.includes("Quota exceeded")) {
    ctx.reply(MESSAGES.SHEETS_QUOTA_EXCEEDED)
  } else {
    ctx.reply(MESSAGES.ERROR)
    console.error(
      `⚠️ Ooops, encountered an error for ${ctx.updateType.toUpperCase()}:\n${err}`
    )
  }
})

bot.start(onStart)
bot.help((ctx) => ctx.reply(MESSAGES.HELP))

bot.hears(Answers.ADD_CHAPTER, askNextChapter)
bot.hears(Answers.STATS, showUserStats)
bot.hears(Answers.FEEDBACK, ctx => {
  ctx.reply(
    MESSAGES.FEEDBACK, 
    Markup.inlineKeyboard([[
      Markup.button.url("G.Form ↗", "https://forms.gle/ii2pZUZJhF1pD4AT8")
    ]])
  )
})
bot.hears(Answers.HANDBOOK, ctx => ctx.reply(
  MESSAGES.HANDBOOK,
  Markup.inlineKeyboard([
    [
      Markup.button.url(
        "📖",
        "https://www.rationality.org/files/CFAR_Handbook_2021-01.pdf"
      ),
    ],
  ])
))
bot.hears(Answers.TABLE, ctx => ctx.reply(
  MESSAGES.TABLE,
  Markup.inlineKeyboard([
    [
      Markup.button.url(
        "📊",
        "bit.ly/HoT-board"
      ),
    ],
  ])
))
bot.hears(Answers.UPDATE, async (ctx) => {
  const dialogBotVersion = botState[ctx.chat.id]?.currentVersion
  const isNewVersion = !!dialogBotVersion && dialogBotVersion === process.env?.npm_package_version
  
  ctx.reply(`${MESSAGES.BOT_VERSION} ${dialogBotVersion || "unknown"} ${isNewVersion ? "👍" : "👎"}`)
  !isNewVersion && ctx.reply(MESSAGES.UPDATE_AVAILABLE)
})

// NOTE: inline keyboard answers

bot.action(Answers.LOG_ME_IN, (ctx) => logUserIn(ctx))
bot.action(Answers.NEVERMORE, (ctx) => ctx.reply(MESSAGES.OKAY))
bot.action(Answers.YES, onChapterRead)
bot.action(Answers.OTHER, selectOtherChapter)
bot.action(Answers.NO, (ctx) => ctx.reply(MESSAGES.OKAY))

bot.hears(/^[0-9]{1,2}$/, onOtherChapterRead)

bot.hears(/.*/, (ctx) => ctx.reply(MESSAGES.UNKNOWN_TEXT))

bot
  .launch({allowedUpdates: ['message', 'callback_query']}).then(() => {
    console.log("🎬 Bot is up and running")
  })
  .catch((err) => console.error("🚀 ~ err", err))
process.once("SIGINT", () => bot.stop())
process.once("SIGTERM", () => bot.stop())
