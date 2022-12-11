import { segment } from "oicq"
import config from "../Model/config.js"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import { ChatGPTAPI } from "chatgpt"
import MarkdownIt from "markdown-it"
const md = new MarkdownIt()

let htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Markdown/`
let tplFile = `${htmlDir}Markdown.html`
let errorTips
let api
let conv = {}

if (config.ChatGPT.api) {
  errorTips = "ChatGPT 请求失败，请确认 API 地址正确，网络环境正常\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin"
} else if (config.ChatGPT.sessionToken) {
  errorTips = "ChatGPT 请求失败，请确认 OpenAI 账号密码 或 sessionToken 正确，网络环境正常\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin"
  try {
    api = new ChatGPTAPI({ sessionToken: config.ChatGPT.sessionToken })
    await api.ensureAuth()
    logger.mark(`[ChatGPT] sessionToken 验证成功`)
  } catch (err) {
    logger.error(`[ChatGPT] sessionToken 验证失败：${logger.red(err)}`)
    if (config.ChatGPT.tokenapi&&config.ChatGPT.username&&config.ChatGPT.password) {
      try {
        let res = await fetch(config.ChatGPT.tokenapi, {
          method: "POST",
          body: JSON.stringify({
            username: config.ChatGPT.username,
            password: config.ChatGPT.password
          })
        })
        res = res.json()
        api = new ChatGPTAPI({ sessionToken: res.token })
        await api.ensureAuth()
        logger.mark(`[ChatGPT] 账号密码 登录成功`)
      } catch (err) {
        logger.error(`[ChatGPT] 账号密码 登录失败：${logger.red(err)}`)
      }
    }
  }
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

  async API(msg) {
    try {
      if (config.ChatGPT.api) {
        let url = `${config.ChatGPT.api}${encodeURI(msg)}`
        logger.mark(`[ChatGPT] 请求API：${logger.blue(url)}`)
        let res = await fetch(url).catch((err) => logger.error(err))
        res = await res.json()
        return res.data
      } else {
        await api.ensureAuth()
        if (!conv[this.e.user_id]) {
          conv[this.e.user_id] = api.getConversation()
        }
        return await conv[this.e.user_id].sendMessage(msg)
      }
    } catch (err) {
      (`[ChatGPT] 请求失败：${logger.red(err)}`)
      return false
    }
  }

  async ChatGPT(e) {
    let msg = this.e.msg.replace("cg", "").trim()
    logger.mark(`[ChatGPT] 消息：${logger.blue(msg)}`)

    let res = await this.API(msg)

    if (res) {
      await this.e.reply(res, true)
    } else {
      await this.e.reply(errorTips, true)
    }
  }

  async ChatGPTPic(e) {
    let msg = this.e.msg.replace("cgp", "").trim()
    logger.mark(`[ChatGPT] 消息：${logger.blue(msg)}`)

    let res = await this.API(msg)

    if (res) {
      let Markdown = md.render(res)
      let img = await puppeteer.screenshot("Markdown", { tplFile, htmlDir, Markdown })
      await this.e.reply(img, true)
    } else {
      await this.e.reply(errorTips, true)
    }
  }
}