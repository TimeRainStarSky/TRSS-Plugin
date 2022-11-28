import { segment } from "oicq"
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { exec, execSync } = require("child_process")

let cmd = `type fastfetch`

try {
  execSync(cmd)
  if (process.platform == "win32") {
    cmd = `fastfetch --stdout`
  } else {
    cmd = `fastfetch --pipe`
  }
} catch {
  cmd = `bash <(curl -L nf.hydev.org) --stdout`
}

export class SystemInfo extends plugin {
  constructor() {
    super({
      name: "系统信息",
      dsc: "系统信息",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^#?系统信息$",
          fnc: "SystemInfo",
        },
      ],
    })
  }

  async execSync(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr })
      })
    })
  }

  async SystemInfo(e) {
    logger.mark("[系统信息]执行：" + cmd)
    let ret = await this.execSync(cmd)
    logger.mark("[系统信息]\n" + ret.stdout.trim() + "\n" + logger.red(ret.stderr.trim()))

    if (ret.error) {
      logger.error("系统信息错误：" + logger.red(ret.error))
      await this.reply("系统信息错误：" + ret.error, true)
      await this.reply(
        "未使用脚本安装，此功能出错属于正常情况\nhttps://gitee.com/TimeRainStarSky/TRSS_Yunzai"
      )
    }

    await this.reply(ret.stdout.trim(), true)
  }
}