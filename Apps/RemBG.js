import config from "../Model/config.js"
import { exec } from "child_process"
import common from "../../../lib/common/common.js"
let segment
try {
  segment = (await import("icqq")).segment
} catch (err) {
  logger.warn(`找不到 icqq，建议升级 Yunzai\n${logger.red(err)}`)
  segment = (await import("oicq")).segment
}

let path = `${process.cwd()}/plugins/TRSS-Plugin/RemBG/`
let model
let Running
let errorTips = "请查看安装使用教程：\nhttps://Yunzai.TRSS.me\n并将报错通过联系方式反馈给开发者"

export class RemBG extends plugin {
  constructor() {
    super({
      name: "图片背景去除",
      dsc: "图片背景去除",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^#?(动漫)?(图片)?(去除?背景|背景去除?)$",
          fnc: "DetectImage"
        }
      ]
    })
  }

  async execSync(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr })
      })
    })
  }

  async DetectImage(e) {
    if (this.e.msg.match("动漫")) {
      model = "anime.sh"
    } else {
      model = "main.sh i"
    }

    if (this.e.source) {
      let reply
      if (this.e.isGroup) {
        reply = (await this.e.group.getChatHistory(this.e.source.seq, 1)).pop()?.message
      } else {
        reply = (await this.e.friend.getChatHistory(this.e.source.time, 1)).pop()?.message
      }

      if (reply) {
        for (let val of reply) {
          if (val.type == "image") {
            this.e.img = [val.url]
            break
          }
        }
      }
    }

    if (!this.e.img) {
      this.setContext("RemBG")
      await this.reply("请发送图片", true)
    } else {
      this.RemBG()
    }
  }

  async RemBG(e) {
    if (!this.e.img) {
      return false
    }

    this.finish("RemBG")
    if (Running) {
      await this.reply("正在生成，请稍等……", true)
      return false
    }
    Running = true
    await this.reply("开始生成，请稍等……", true)

    let url
    if (config.RemBG.api) {
      url = `${config.RemBG.api}?user_id=${this.e.user_id}&bot_id=${Bot.uin}&url=${encodeURIComponent(this.e.img[0])}`
    } else {
      let ret = await common.downFile(this.e.img[0], `${path}input.png`)
      if (!ret) {
        await this.reply("下载图片错误", true)
        await this.reply(errorTips)
        Running = false
        return true
      }

      logger.mark(`[图片背景去除] 图片保存成功：${logger.blue(this.e.img[0])}`)

      let cmd = `bash '${path}'${model} input.png output.png`

      logger.mark(`[图片背景去除] 执行：${logger.blue(cmd)}`)
      ret = await this.execSync(cmd)
      logger.mark(`[图片背景去除]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

      if (ret.error) {
        logger.error(`图片背景去除错误：${logger.red(ret.error)}`)
        await this.reply(`图片背景去除错误：${ret.error}`, true)
        await this.reply(errorTips)
      }

      url = `${path}output.png`
    }

    logger.mark(`[图片背景去除] 发送图片：${logger.blue(url)}`)
    Running = false
    await this.reply(segment.image(url), true)
  }
}