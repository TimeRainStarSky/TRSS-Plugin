import { segment } from "oicq"
import config from "../Model/config.js"
import { exec } from "child_process"
import uploadRecord from "../Model/uploadRecord.js"
import gsCfg from "../../genshin/model/gsCfg.js"

let path = `${process.cwd()}/plugins/TRSS-Plugin/GenshinVoice/`
let Running
let errorTips = "请查看安装使用教程：\nhttps://Yunzai.TRSS.me\n并将报错通过联系方式反馈给开发者"

const speakers = ["派蒙", "凯亚", "安柏", "丽莎", "琴", "香菱", "枫原万叶", "迪卢克", "温迪", "可莉", "早柚", "托马", "芭芭拉", "优菈", "云堇", "钟离", "魈", "凝光", "雷电将军", "北斗", "甘雨", "七七", "刻晴", "神里绫华", "戴因斯雷布", "雷泽", "神里绫人", "罗莎莉亚", "阿贝多", "八重神子", "宵宫", "荒泷一斗", "九条裟罗", "夜兰", "珊瑚宫心海", "五郎", "散兵", "女士", "达达利亚", "莫娜", "班尼特", "申鹤", "行秋", "烟绯", "久岐忍", "辛焱", "砂糖", "胡桃", "重云", "菲谢尔", "诺艾尔", "迪奥娜", "鹿野院平藏"]
const AllAbbr = gsCfg.getAllAbbr()

export class GenshinVoice extends plugin {
  constructor() {
    super({
      name: "原神语音合成",
      dsc: "原神语音合成",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: `.+(转码)?说.+`,
          fnc: "GenshinVoice"
        }
      ]
    })
  }

  async execSync(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr })
      })
    })
  }

  async GenshinVoice(e) {
    let msg = this.e.msg.split("说")
    let speaker = msg.shift()
    let text = msg.join("说").replace("'", "").trim()

    let transcoding = false
    if (speaker.match("转码")) {
      speaker = speaker.replace("转码", "")
      transcoding = true
    }

    let speakerid
    let url
    if (speaker.match("派蒙")) {
      speakerid = "派蒙"
    } else {
      for (let rolename of Object.values(AllAbbr)) {
        if (rolename.includes(speaker)) {
          speakerid = rolename[0]
          break
        }
      }
    }

    if (!speakerid) {
      return false
    }

    if (config.GenshinVoice.publicApi) {
      url = `https://yuanshenai.azurewebsites.net/api?speaker=${encodeURIComponent(speakerid)}&text=${encodeURIComponent(text)}`
    } else {
      speakerid = speakers.indexOf(speakerid)
      if (speakerid == -1) {
        return false
      }

      if (Running) {
        await this.reply("正在生成，请稍等……", true)
        return false
      }
      Running = true

      if (config.GenshinVoice.api) {
        url = `${config.GenshinVoice.api}?user_id=${this.e.user_id}&bot_id=${Bot.uin}&id=${speakerid}&text=${encodeURIComponent(text)}`
      } else {
        let cmd = `bash '${path}main.sh' output.wav ${speakerid} '${text}'`

        logger.mark(`[原神语音合成] 执行：${logger.blue(cmd)}`)
        let ret = await this.execSync(cmd)
        logger.mark(`[原神语音合成]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

        if (ret.error) {
          logger.error(`原神语音合成错误：${logger.red(ret.error)}`)
          await this.reply(`原神语音合成错误：${ret.error}`, true)
          await this.reply(errorTips)
        }
        url = `${path}output.wav`
      }
    }

    logger.mark(`[原神语音合成] 发送语音：${logger.blue(url)}`)
    await this.reply(await uploadRecord(url, 68714, transcoding))
    Running = false
  }
}