import { segment } from "oicq"
import { spawn } from "child_process"

let path = `${process.cwd()}/plugins/TRSS-Plugin/Python/main.sh`
let errorTips = "登录失败，请检查日志\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin"
let accounts = {}

export class miHoYoLogin extends plugin {
  constructor() {
    super({
      name: "米哈游登录",
      dsc: "米哈游登录",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^米哈游登录.+",
          event: "message.private",
          fnc: "miHoYoLoginDetect"
        }
      ]
    })
  }

  async miHoYoLoginDetect(e) {
    accounts[this.e.user_id] = this.e
    this.setContext("miHoYoLogin")
    await this.e.reply("请发送密码", true)
  }

  async miHoYoLogin(e) {
    if(!this.e.msg)return false
    this.finish("miHoYoLogin")

    let password = this.e.msg.trim()
    this.e = accounts[this.e.user_id]
    let username = this.e.msg.replace("米哈游登录", "").trim()

    let cmd = `bash '${path}' miHoYoLogin.py '${username}' '${password}'`
    logger.mark(`[米哈游登录] 执行：${logger.blue(cmd)}`)
    let ret = spawn("bash", ["-c", cmd], { stdio: ["pipe", process.stdout, "pipe"] })

    ret.stderr.on("data", data => {
      data = data.toString().trim()
      logger.mark(`[米哈游登录] ${data}`)
      this.e.reply(data, true)
    })

    ret.on("close", code => {
      if (code == 0) {
        this.e.reply("登录完成，回复 Cookie 绑定", true)
      } else {
        this.e.reply(errorTips, true)
      }
    })
  }
}