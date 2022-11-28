import fs from "fs"
import { segment } from "oicq"
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { exec, execSync } = require("child_process")
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import AU from "ansi_up"
const ansi_up = new AU.default

let htmlFile = "data/html/SystemInfo.html"
let cmd
let cmdArgv = "--stdout"

try {
  execSync("type fastfetch")
  cmd = "fastfetch"
  if (process.platform != "win32") {
    cmdArgv = "--pipe"
  }
} catch {
  cmd = "bash <(curl -L nf.hydev.org)"
}

export class SystemInfo extends plugin {
  constructor() {
    super({
      name: "系统信息",
      dsc: "系统信息",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^#?系统信息$",
          fnc: "SystemInfo",
        },
        {
          reg: "^#?系统信息图片$",
          fnc: "SystemInfoPic",
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

  async SystemInfo(e) {
    logger.mark(`[系统信息]执行：${logger.blue(cmd)} ${cmdArgv}`)
    let ret = await this.execSync(`${cmd} ${cmdArgv}`)
    logger.mark(`[系统信息]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.error) {
      logger.error(`系统信息错误：${logger.red(ret.error)}`)
      await this.reply(`系统信息错误：${ret.error}`, true)
      await this.reply(
        "未使用脚本安装，此功能出错属于正常情况\nhttps://gitee.com/TimeRainStarSky/TRSS_Yunzai"
      )
    }

    await this.reply(ret.stdout.trim(), true)
  }

  async SystemInfoPic(e) {
    logger.mark(`[系统信息]执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(`${cmd}`)
    logger.mark(`[系统信息]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.error) {
      logger.error(`系统信息错误：${logger.red(ret.error)}`)
      await this.reply(`系统信息错误：${ret.error}`, true)
      await this.reply(
        "未使用脚本安装，此功能出错属于正常情况\nhttps://gitee.com/TimeRainStarSky/TRSS_Yunzai"
      )
    }

    let html = `<p style="white-space: pre-wrap;"><code>${ansi_up.ansi_to_html(ret.stdout.trim())}</code></p>`
    await fs.writeFileSync(htmlFile, html, "utf-8")

    let img = await puppeteer.screenshot("SystemInfo", { tplFile: htmlFile })
    await this.reply(segment.image(img.file), true)
  }
}