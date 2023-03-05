logger.info(logger.yellow("- 正在加载 TRSS 插件"))

import fs from "fs"
import QR from "qrcode"
import config from "./Model/config.js"
import uploadRecord from "./Model/uploadRecord.js"
import common from "../../lib/common/common.js"
import puppeteer from "../../lib/puppeteer/puppeteer.js"
import { exec } from "child_process"
import MarkdownIt from "markdown-it"
import AU from "ansi_up"

global.fs = fs
global.QR = QR
global.config = config
global.uploadRecord = uploadRecord
global.common = common
global.puppeteer = puppeteer
global.exec = exec
global.md = new MarkdownIt()
global.ansi_up = new AU.default

if (!global.segment) {
  logger.warn(logger.red("! 找不到 segment，建议升级 Yunzai"))
  global.segment = (await import("oicq")).segment
}

const files = fs
  .readdirSync("plugins/TRSS-Plugin/Apps")
  .filter((file) => file.endsWith(".js"))

let ret = []
files.forEach((file) => {
  ret.push(import(`./Apps/${file}`))
})
ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace(".js", "")
  if (ret[i].status != "fulfilled") {
    logger.error("载入插件错误：" + logger.red(name))
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[name]
}
export { apps }

logger.info(logger.green("- TRSS 插件加载完成"))