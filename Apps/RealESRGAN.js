const path = `${process.cwd()}/plugins/TRSS-Plugin/Real-ESRGAN/`
const errorTips = "请查看安装使用教程：\nhttps://Yunzai.TRSS.me\n并将报错通过联系方式反馈给开发者"
let model
let Running

export class RealESRGAN extends plugin {
  constructor() {
    super({
      name: "图片修复",
      dsc: "图片修复",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^#?(动漫)?图片修复$",
          fnc: "DetectImage"
        }
      ]
    })
  }

  async execSync(cmd) {
    return new Promise(resolve => {
      exec(cmd, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr })
      })
    })
  }

  async DetectImage(e) {
    if (!fs.existsSync(path) && !config.RealESRGAN.api) {
      logger.warn(`[图片修复] ${path} 不存在，请检查是否正确安装`)
      return false
    }

    if (this.e.msg.match("动漫")) {
      model = "RealESRGAN_x4plus_anime_6B"
    } else {
      model = "RealESRGAN_x4plus"
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
    if (reply?.message) for (const i of reply.message)
      if (i.type == "image" || i.type == "file") {
        this.e.img = [i.url]
        break
      }

    if (!this.e.img) {
      this.setContext("RealESRGAN")
      await this.reply("请发送图片", true)
    } else {
      this.RealESRGAN()
    }
  }

  async RealESRGAN(e) {
    if (!this.e.img) {
      return false
    }

    this.finish("RealESRGAN")
    if (Running) {
      await this.reply("正在生成，请稍等……", true)
      return false
    }
    Running = true
    await this.reply("开始生成，请稍等……", true)

    let url
    if (config.RealESRGAN.api) {
      url = `${config.RealESRGAN.api}?user_id=${this.e.user_id}&bot_id=${this.e.self_id}&fp32=True&tile=100&model_name=${model}&input=${encodeURIComponent(this.e.img[0])}`
    } else {
      let ret = await common.downFile(this.e.img[0], `${path}input.${config.RealESRGAN.format}`)
      if (!ret) {
        await this.reply("下载图片错误", true)
        await this.reply(errorTips)
        Running = false
        return true
      }

      logger.mark(`[图片修复] 图片保存成功：${logger.blue(this.e.img[0])}`)

      const cmd = `bash '${path}main.sh' --fp32 --tile 100 -n ${model} -i input.${config.RealESRGAN.format}`

      logger.mark(`[图片修复] 执行：${logger.blue(cmd)}`)
      ret = await this.execSync(cmd)
      logger.mark(`[图片修复]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

      if (ret.error) {
        logger.error(`图片修复错误：${logger.red(ret.error)}`)
        await this.reply(`图片修复错误：${ret.error}`, true)
        await this.reply(errorTips)
      }

      url = `file://${path}results/input_out.${config.RealESRGAN.format}`
    }

    logger.mark(`[图片修复] 发送图片：${logger.blue(url)}`)
    Running = false
    await this.reply(segment.image(url), true)
  }
}