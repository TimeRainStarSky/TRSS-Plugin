import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import { AnsiUp } from "ansi_up"
const ansi_up = new AnsiUp

const htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Code/`
const tplFile = `${htmlDir}Code.html`
const errorTips = "未使用脚本安装，此功能出错属于正常情况\nhttps://TRSS.me"

let cmd = "fastfetch"
let cmds
let benchcmd = "bash <(curl -L bench.sh)"
let Running

if (process.platform == "win32") {
  cmds = `bash -c "${cmd}"`
  cmd = `bash -c "${cmd} --stdout"`
  benchcmd = `bash -c "${benchcmd}"`
} else {
  cmd = `${cmd} --pipe`
  cmds = `${cmd} false`
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
          fnc: "SystemInfo"
        },
        {
          reg: "^#?系统信息图片$",
          fnc: "SystemInfoPic"
        },
        {
          reg: "^#?系统测试$",
          fnc: "SystemBench"
        }
      ]
    })
  }

  async SystemInfo(e) {
    const ret = await Bot.exec(cmd)

    if (ret.error) {
      logger.error(`系统信息错误：${logger.red(ret.error)}`)
      await this.reply(`系统信息错误：${ret.error}`, true)
      await this.reply(errorTips)
    }

    await this.reply(ret.stdout.trim(), true)
  }

  async SystemInfoPic(e) {
    const ret = await Bot.exec(cmds)

    if (ret.error) {
      logger.error(`系统信息错误：${logger.red(ret.error)}`)
      await this.reply(`系统信息错误：${ret.error}`, true)
      await this.reply(errorTips)
    }

    const Code = await ansi_up.ansi_to_html(ret.stdout.trim())
    const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
    await this.reply(img, true)
  }

  async SystemBench(e) {
    if (Running) {
      await this.reply("正在测试，请稍等……", true)
      return false
    }
    Running = true
    await this.reply("开始测试，请稍等……", true)

    const ret = await Bot.exec(benchcmd)

    if (ret.error) {
      logger.error(`系统测试错误：${logger.red(ret.error)}`)
      await this.reply(`系统测试错误：${ret.error}`, true)
      await this.reply(errorTips)
    }

    const Code = await ansi_up.ansi_to_html(ret.stdout.trim())
    const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
    await this.reply(img, true)
    Running = false
  }
}