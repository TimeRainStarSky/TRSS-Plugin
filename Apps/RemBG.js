import config from "../Model/config.js"

const path = `plugins/TRSS-Plugin/RemBG/`
const errorTips = "请查看安装使用教程：\nhttps://Yunzai.TRSS.me\n并将报错通过联系方式反馈给开发者"
let model
let Running

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
          fnc: "DetectImage",
        },
      ],
    })
  }

  async DetectImage(e) {
    if (!(await Bot.fsStat(path)) && !config.RemBG.api) {
      logger.warn(`[图片背景去除] ${path} 不存在，请检查是否正确安装`)
      return false
    }

    if (this.e.msg.match("动漫")) {
      model = "anime.sh"
    } else {
      model = "main.sh i"
    }

    let reply
    if (this.e.getReply) {
      reply = await this.e.getReply()
    } else if (this.e.source) {
      if (this.e.group?.getChatHistory)
        reply = (await this.e.group.getChatHistory(this.e.source.seq, 1)).pop()
      else if (this.e.friend?.getChatHistory)
        reply = (await this.e.friend.getChatHistory(this.e.source.time, 1)).pop()
    }
    if (reply?.message)
      for (const i of reply.message)
        if (i.type == "image" || i.type == "file") {
          this.e.img = [i.url]
          break
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
      url = `${config.RemBG.api}?user_id=${this.e.user_id}&bot_id=${this.e.self_id}&url=${encodeURIComponent(this.e.img[0])}`
    } else {
      let ret = await Bot.download(this.e.img[0], `${path}input.png`)
      if (!ret) {
        await this.reply("下载图片错误", true)
        await this.reply(errorTips)
        Running = false
        return true
      }

      logger.mark(`[图片背景去除] 图片保存成功：${logger.blue(this.e.img[0])}`)

      const cmd = `bash '${path}'${model} input.png output.png`
      ret = await Bot.exec(cmd)

      if (ret.error) {
        logger.error(`图片背景去除错误：${logger.red(ret.error)}`)
        await this.reply(`图片背景去除错误：${ret.error}`, true)
        await this.reply(errorTips)
      }

      url = `file://${path}output.png`
    }

    logger.mark(`[图片背景去除] 发送图片：${logger.blue(url)}`)
    Running = false
    await this.reply(segment.image(url), true)
  }
}
