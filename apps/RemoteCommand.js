import { segment } from "oicq"
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { exec, execSync } = require("child_process")

export class RemoteCommand extends plugin {
  constructor() {
    super({
      name: "远程命令",
      dsc: "远程命令",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^rc.+",
          fnc: "RemoteCommand",
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

  async RemoteCommand(e) {
    if(!e.isMaster)return false
    let cmd = this.e.msg.replace("rc", "").trim()

    logger.mark("[远程命令]执行：" + cmd)
    let ret = await this.execSync(cmd)
    logger.mark("[远程命令]\n" + ret.stdout.trim() + "\n" + logger.red(ret.stderr.trim()))

    if (ret.stdout) {
      await this.reply(ret.stdout.trim(), true)
    }

    if (ret.stderr) {
      await this.reply("标准错误输出：\n" + ret.stderr.trim(), true)
    }

    if (ret.error) {
      logger.error("远程命令错误：" + logger.red(ret.error))
      await this.reply("远程命令错误：" + ret.error, true)
    }
  }
}