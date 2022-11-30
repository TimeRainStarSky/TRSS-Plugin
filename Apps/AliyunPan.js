import fs from "fs"
import { segment } from "oicq"
import common from '../../../lib/common/common.js'
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { exec, execSync } = require("child_process")

let Commands = {
  "":         "help",
  "帮助":     "help",
  "相簿":     "album",
  "下载":     "download",
  "链接":     "locate",
  "查看":     "ls",
  "创建目录": "mkdir",
  "移动":     "mv",
  "回收站":   "recycle",
  "重命名":   "rename",
  "删除":     "rm",
  "分享":     "share",
  "同步备份": "sync",
  "树形图":   "tree",
  "上传":     "upload",
  "在线网盘": "webdav",
  "切换网盘": "drive",
  "登录账号": "login",
  "账号列表": "loglist",
  "退出账号": "logout",
  "空间配额": "quota",
  "切换账号": "su",
  "当前账号": "who"
}

let path = `${process.env.HOME}/aliyunpan/`
let cmdPath = `${path}aliyunpan`
let Running
let es
let errorTips = "请使用脚本安装阿里云盘，并正常登录后再使用此功能\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin\nhttps://gitee.com/TimeRainStarSky/TRSS_Yunzai"

export class AliyunPan extends plugin {
  constructor() {
    super({
      name: "阿里云盘",
      dsc: "阿里云盘",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^阿里云盘上传",
          fnc: "AliyunPanUploadDetect",
        },
        {
          reg: "^阿里云盘下载",
          fnc: "AliyunPanDownload",
        },
        {
          reg: "^阿里云盘",
          fnc: "AliyunPan",
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

  async execTask(e, cmd) {
    logger.mark(`[阿里云盘]执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(cmd)
    logger.mark(`[阿里云盘]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.stdout) {
      await this.e.reply(ret.stdout.trim(), true)
    }

    if (ret.stderr) {
      await this.e.reply(`标准错误输出：\n${ret.stderr.trim()}`, true)
    }

    if (ret.error) {
      logger.error(`阿里云盘错误：${logger.red(ret.error)}`)
      await this.e.reply(`阿里云盘错误：${ret.error}`, true)
      await this.e.reply(errorTips)
    }

  }

  async AliyunPanUploadDetect(e) {
    es = this.e
    this.setContext('AliyunPanUpload')
    await this.e.reply("请发送文件", true)
  }

  async AliyunPanUpload(e) {
    if(!this.e.isMaster)return false
    if(!this.e.file)return false

    this.finish('AliyunPanUpload')
    let filePath = `${path}${this.e.file.name}`
    let fileUrl
    if (this.e.isGroup) {
      fileUrl = await this.e.group.getFileUrl(this.e.file.fid)
    } else {
      fileUrl = await this.e.friend.getFileUrl(this.e.file.fid)
    }
    this.e = es

    if (Running) {
      await this.e.reply("有正在执行的阿里云盘任务，请稍等……", true)
      return false
    }
    Running = true
    await this.e.reply(`开始下载文件，请稍等……\n文件链接：${fileUrl}\n保存路径：${filePath}`, true)

    let ret = await common.downFile(fileUrl, filePath)
    if (!ret) {
      this.e.reply("下载文件错误", true)
      Running = false
      return true
    }

    let remotePath = es.msg.replace("阿里云盘上传", "").trim()
    await this.e.reply(`文件下载完成，开始上传到：${remotePath}`, true)
    let cmd = `"${cmdPath}" upload "${filePath}" "${remotePath}"`

    await this.execTask(es, cmd)
    await fs.unlinkSync(filePath)
    Running = false
  }

  async AliyunPanDownload(e) {
    if(!this.e.isMaster)return false
    if (Running) {
      await this.e.reply("有正在执行的阿里云盘任务，请稍等……", true)
      return false
    }

    this.finish('AliyunPanDownload')
    let remotePath = this.e.msg.replace("阿里云盘下载", "").trim()
    if (!remotePath) {
      this.setContext('AliyunPanDownload')
      await this.e.reply("请发送文件路径", true)
      return true
    }

    Running = true
    await this.e.reply("开始下载文件，请稍等……", true)

    let cmd = `"${cmdPath}" download "${remotePath}" --saveto "${path}"`

    await this.execTask(e, cmd)

    let filePath = `${path}${remotePath}`
    if (!fs.existsSync(filePath)) {
      await this.e.reply("下载文件失败", true)
      Running = false
      return true
    }
    if (!fs.statSync(filePath).isFile()) {
      await this.e.reply("暂不支持发送文件夹", true)
      Running = false
      return true
    }

    let res
    if (this.e.isGroup) {
      res = await this.e.group.fs.upload(filePath).catch((err) => {
        this.e.reply(`发送文件失败：${JSON.stringify(err)}`)
        logger.error(`发送文件失败：${logger.red(JSON.stringify(err))}`)
      })
    } else {
      res = await this.e.friend.sendFile(filePath).catch((err) => {
        this.e.reply(`发送文件失败：${JSON.stringify(err)}`)
        logger.error(`发送文件失败：${logger.red(JSON.stringify(err))}`)
      })
    }

    if (res) {
      let fileUrl
      if (this.e.isGroup) {
        fileUrl = await this.e.group.getFileUrl(res.fid)
      } else {
        fileUrl = await this.e.friend.getFileUrl(res)
      }
      await this.e.reply(`文件发送完成：${fileUrl}`, true)
    }

    await fs.unlinkSync(filePath)
    Running = false
  }

  async AliyunPan(e) {
    if(!this.e.isMaster)return false
    let msg = this.e.msg.replace("阿里云盘", "").trim().split(" ")
    if (msg[0] in Commands) {
      msg[0] = Commands[msg[0]]
    }
    msg = msg.join(" ")
    let cmd = `"${cmdPath}" ${msg}`

    await this.execTask(e, cmd)
  }
}