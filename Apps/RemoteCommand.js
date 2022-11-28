import fs from "fs"
import { segment } from "oicq"
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { exec, execSync } = require("child_process")
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import AU from "ansi_up"
const ansi_up = new AU.default

let htmlFile = "data/html/RemoteCommand.html"

export class RemoteCommand extends plugin {
  constructor() {
    super({
      name: "远程命令",
      dsc: "远程命令",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^rcp.+",
          fnc: "RemoteCommandPic",
        },
        {
          reg: "^rc.+",
          fnc: "RemoteCommand",
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

  async RemoteCommand(e) {
    if(!e.isMaster)return false
    let cmd = this.e.msg.replace("rc", "").trim()

    logger.mark(`[远程命令]执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(cmd)
    logger.mark(`[远程命令]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.stdout) {
      await this.reply(ret.stdout.trim(), true)
    }

    if (ret.stderr) {
      await this.reply(`标准错误输出：\n${ret.stderr.trim()}`, true)
    }

    if (ret.error) {
      logger.error(`远程命令错误：${logger.red(ret.error)}`)
      await this.reply(`远程命令错误：${ret.error}`, true)
    }
  }

  async RemoteCommandPic(e) {
    if(!e.isMaster)return false
    let cmd = this.e.msg.replace("rcp", "").trim()

    logger.mark(`[远程命令]执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(cmd)
    logger.mark(`[远程命令]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.stdout) {
      let html = `<p style="white-space: pre-wrap;"><code>${ansi_up.ansi_to_html(ret.stdout.trim())}</code></p>`
      fs.writeFileSync(htmlFile, html, "utf-8")

      let img = await puppeteer.screenshot("RemoteCommand", { tplFile: htmlFile })
      await this.reply(segment.image(img.file), true)
    }

    if (ret.stderr) {
      let html = `<p style="white-space: pre-wrap;"><code>${ansi_up.ansi_to_html(ret.stderr.trim())}</code></p>`
      fs.writeFileSync(htmlFile, html, "utf-8")

      let img = await puppeteer.screenshot("RemoteCommand", { tplFile: htmlFile })
      await this.reply(["标准错误输出：", segment.image(img.file)], true)
    }

    if (ret.error) {
      logger.error(`远程命令错误：${logger.red(ret.error)}`)
      await this.reply(`远程命令错误：${ret.error}`, true)
    }
  }
}