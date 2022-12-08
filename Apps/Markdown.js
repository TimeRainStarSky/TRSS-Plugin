import fs from "fs"
import { segment } from "oicq"
import common from '../../../lib/common/common.js'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import MarkdownIt from "markdown-it"
const md = new MarkdownIt()

let htmlDir = `${process.cwd()}/plugins/TRSS-Plugin/Resources/Markdown/`
let tplFile = `${htmlDir}Markdown.html`

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
    let msg = this.e.msg.replace("md", "").trim()
    logger.mark(`[Markdown]查看：${logger.blue(msg)}`)

    let mdFile = msg
    if (/^https?:\/\//.test(msg)) {
      mdFile =`${process.cwd()}/data/cache.md`
      let ret = await common.downFile(msg, mdFile)
      if (!ret) {
        await this.e.reply("文件下载错误", true)
        return false
      }
    }

    if (!(fs.existsSync(mdFile) && fs.statSync(mdFile).isFile())) {
      await this.e.reply("文件不存在", true)
      return false
    }

    let Markdown = md.render(fs.readFileSync(mdFile, "utf-8"))
    let img = await puppeteer.screenshot("Markdown", { tplFile, htmlDir, Markdown })

    await this.e.reply(img, true)
  }
}