import { segment } from "oicq"
import fs from "fs"
import fetch from 'node-fetch'
import { pipeline } from "stream"
import { promisify } from "util"

import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { exec, execSync } = require("child_process")

let path = "plugins/TRSS-Plugin/Real-ESRGAN/"
let model
let format = ".jpg"
let running

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
          fnc: "DetectImage",
        },
      ],
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
      this.setContext('RealESRGAN')
      await this.reply("请发送图片", true)
    } else {
      this.RealESRGAN()
    }
  }

  async RealESRGAN() {
    if (!this.e.img) {
      return false
    }

    if (running) {
      await this.reply("正在生成，请稍等……", true)
      return false
    }
    running = true
    this.finish('RealESRGAN')
    await this.reply("开始生成，请稍等……", true)

    const response = await fetch(this.e.img[0])
    const streamPipeline = promisify(pipeline)
    await streamPipeline(response.body, fs.createWriteStream(path + "0" + format))
    logger.mark("[图片修复]图片保存成功：" + this.e.img[0])

    let cmd = `sh ${path}main.sh --fp32 --tile 100 -n ${model} -i 0${format}`

    logger.mark("[图片修复]执行：" + cmd)
    let ret = await this.execSync(cmd)
    logger.mark("[图片修复]\n" + ret.stdout)

    if (ret.error) {
      logger.error("图片修复错误：" + logger.red(ret.error))
      await this.reply("图片修复错误：" + ret.error, true)
      await this.reply(
        "请查看安装使用教程：\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin\n并将报错通过联系方式反馈给开发者"
      )
    }

    await this.reply(
      segment.image(path + "results/0_out" + format),
      true
    )
    running = false
  }
}