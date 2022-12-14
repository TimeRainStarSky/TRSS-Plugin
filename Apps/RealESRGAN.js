import fs from "fs"
import { segment } from "oicq"
import config from "../Model/config.js"
import { exec } from "child_process"
import common from "../../../lib/common/common.js"

let path = `${process.cwd()}/plugins/TRSS-Plugin/Real-ESRGAN/`
let model
let format = ".jpg"
let Running
let errorTips = "请查看安装使用教程：\nhttps://Yunzai.TRSS.me\n并将报错通过联系方式反馈给开发者"

export class RealESRGAN extends plugin {
  constructor() {
    super({
      name: "图片修复",
      dsc: "图片修复",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^(动漫)?图片修复$",
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
      model = "RealESRGAN_x4plus_anime_6B"
    } else {
      model = "RealESRGAN_x4plus"
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
      url = `${config.RealESRGAN.api}?user_id=${this.e.user_id}&bot_id=${Bot.uin}&fp32=True&tile=100&model_name=${model}&input=${encodeURIComponent(this.e.img[0])}`
    } else {
      let ret = await common.downFile(this.e.img[0], `${path}0${format}`)
      if (!ret) {
        await this.reply("下载图片错误", true)
        await this.reply(errorTips)
        Running = false
        return true
      }

      logger.mark(`[图片修复] 图片保存成功：${logger.blue(this.e.img[0])}`)

      let cmd = `bash ${path}main.sh --fp32 --tile 100 -n ${model} -i 0${format}`

      logger.mark(`[图片修复] 执行：${logger.blue(cmd)}`)
      ret = await this.execSync(cmd)
      logger.mark(`[图片修复]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

      if (ret.error) {
        logger.error(`图片修复错误：${logger.red(ret.error)}`)
        await this.reply(`图片修复错误：${ret.error}`, true)
        await this.reply(errorTips)
      }

      url = `${path}results/0_out${format}`
    }

    logger.mark(`[图片修复] 发送图片：${logger.blue(url)}`)
    await this.reply(segment.image(url), true)
    Running = false
  }
}