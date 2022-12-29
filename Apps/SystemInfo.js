import { segment } from "oicq"
import { exec, execSync } from "child_process"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import AU from "ansi_up"
const ansi_up = new AU.default

let htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Code/`
let tplFile = `${htmlDir}Code.html`
let errorTips = "未使用脚本安装，此功能出错属于正常情况\nhttps://gitee.com/TimeRainStarSky/TRSS_Yunzai"

let cmd = "fastfetch"
let cmds
let benchcmd = "bash <(curl -L bench.sh)"
let Running

if (process.platform == "win32") {
  cmd = `bash -c "${cmd}"`
  cmds = `bash -c "${cmd} --stdout"`
  benchcmd = `bash -c "${benchcmd}"`
} else {
  cmds = `${cmd} --pipe`
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

  async execSync(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr })
      })
    })
  }

  async SystemInfo(e) {
    logger.mark(`[系统信息] 执行：${logger.blue(cmds)}`)
    let ret = await this.execSync(cmds)
    logger.mark(`[系统信息]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.error) {
      logger.error(`系统信息错误：${logger.red(ret.error)}`)
      await this.reply(`系统信息错误：${ret.error}`, true)
      await this.reply(errorTips)
    }

    await this.reply(ret.stdout.trim(), true)
  }

  async SystemInfoPic(e) {
    logger.mark(`[系统信息] 执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(`${cmd}`)
    logger.mark(`[系统信息]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.error) {
      logger.error(`系统信息错误：${logger.red(ret.error)}`)
      await this.reply(`系统信息错误：${ret.error}`, true)
      await this.reply(errorTips)
    }

    let Code = await ansi_up.ansi_to_html(ret.stdout.trim())
    let img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
    await this.reply(img, true)
  }

  async SystemBench(e) {
    if (Running) {
      await this.reply("正在测试，请稍等……", true)
      return false
    }
    Running = true
    await this.reply("开始测试，请稍等……", true)

    logger.mark(`[系统测试] 执行：${logger.blue(benchcmd)}`)
    let ret = await this.execSync(`${benchcmd}`)
    logger.mark(`[系统测试]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.error) {
      logger.error(`系统测试错误：${logger.red(ret.error)}`)
      await this.reply(`系统测试错误：${ret.error}`, true)
      await this.reply(errorTips)
    }

    let Code = await ansi_up.ansi_to_html(ret.stdout.trim())
    let img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
    await this.reply(img, true)
    Running = false
  }
}