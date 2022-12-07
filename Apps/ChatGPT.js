import { segment } from "oicq"
import config from "../Model/config.js"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import { ChatGPTAPI } from "chatgpt"
import MarkdownIt from "markdown-it"
const md = new MarkdownIt()

let tplFile = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Markdown/Markdown.html`
let errorTips = "ChatGPT 请求失败\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin"
let api

try {
  api = new ChatGPTAPI({ sessionToken: config.ChatGPT.sessionToken })
  await api.ensureAuth()
} catch {
  logger.error("[ChatGPT]验证失败，请输入正确 sessionToken，不需要此功能可忽略")
}

export class ChatGPT extends plugin {
  constructor() {
    super({
      name: "ChatGPT",
      dsc: "ChatGPT",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^cgp.+",
          fnc: "ChatGPTPic",
        },
        {
          reg: "^cg.+",
          fnc: "ChatGPT",
        },
      ],
    })
  }

  async ChatGPT(e) {
    let msg = this.e.msg.replace("cg", "").trim()
    logger.mark(`[ChatGPT]消息：${logger.blue(msg)}`)

    let res = await api.sendMessage(msg)
    if (res) {
      await this.e.reply(res, true)
    } else {
      await this.e.reply(errorTips, true)
    }
  }

  async ChatGPTPic(e) {
    let msg = this.e.msg.replace("cgp", "").trim()
    logger.mark(`[ChatGPT]消息：${logger.blue(msg)}`)

    let res = await api.sendMessage(msg)
    if (res) {
      let Markdown = md.render(res)
      let img = await puppeteer.screenshot("Markdown", { tplFile, Markdown })
      await this.e.reply(img, true)
    } else {
      await this.e.reply(errorTips, true)
    }
  }
}