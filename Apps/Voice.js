import config from "../Model/config.js"
import { exec } from "child_process"
import uploadRecord from "../Model/uploadRecord.js"
import common from "../../../lib/common/common.js"
import gsCfg from "../../genshin/model/gsCfg.js"

let GenshinVoicePath = `${process.cwd()}/plugins/TRSS-Plugin/GenshinVoice/`
let ChatWaifuPath = `${process.cwd()}/plugins/TRSS-Plugin/ChatWaifu/`
let Running
let errorTips = "请查看安装使用教程：\nhttps://Yunzai.TRSS.me\n并将报错通过联系方式反馈给开发者"

const AllAbbr = gsCfg.getAllAbbr()
let GenshinVoiceSpeakers = ["派蒙", "凯亚", "安柏", "丽莎", "琴", "香菱", "枫原万叶", "迪卢克", "温迪", "可莉", "早柚", "托马", "芭芭拉", "优菈", "云堇", "钟离", "魈", "凝光", "雷电将军", "北斗", "甘雨", "七七", "刻晴", "神里绫华", "戴因斯雷布", "雷泽", "神里绫人", "罗莎莉亚", "阿贝多", "八重神子", "宵宫", "荒泷一斗", "九条裟罗", "夜兰", "珊瑚宫心海", "五郎", "散兵", "女士", "达达利亚", "莫娜", "班尼特", "申鹤", "行秋", "烟绯", "久岐忍", "辛焱", "砂糖", "胡桃", "重云", "菲谢尔", "诺艾尔", "迪奥娜", "鹿野院平藏"]
let ChatWaifuSpeakers = ["綾地寧々", "在原七海", "小茸", "唐乐吟", "綾地寧々J", "因幡めぐるJ", "朝武芳乃J", "常陸茉子J", "ムラサメJ", "鞍馬小春J", "在原七海J", "綾地寧々H", "因幡めぐるH", "朝武芳乃H", "常陸茉子H", "ムラサメH", "鞍馬小春H", "在原七海H"]

export class Voice extends plugin {
  constructor() {
    super({
      name: "语音合成",
      dsc: "语音合成",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: ".+(转码)?说.+",
          fnc: "Voice"
        },
        {
          reg: "#?语音(合成)?(角色)?列表$",
          fnc: "VoiceList"
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

  async Voice(e) {
    let msg = this.e.msg.split("说")
    let speaker = msg.shift()
    let text = msg.join("说").replace("'", "").trim()

    let transcoding = false
    if (speaker.match("转码")) {
      speaker = speaker.replace("转码", "")
      transcoding = true
    }

    let url
    let path
    let speakerid
    if (ChatWaifuSpeakers.indexOf(speaker) != -1){
      speakerid = ChatWaifuSpeakers.indexOf(speaker)
      if (config.Voice.ChatWaifuApi) {
        url = `${config.Voice.ChatWaifuApi}?user_id=${this.e.user_id}&bot_id=${Bot.uin}&id=${speakerid}&text=${encodeURIComponent(text)}`
      } else {
        path = ChatWaifuPath
      }
    } else {
      if (GenshinVoiceSpeakers.indexOf(speaker) == -1) {
        for (let rolename of Object.values(AllAbbr)) {
          if (rolename.includes(speaker)) {
            speaker = rolename[0]
            break
          }
        }

        if (GenshinVoiceSpeakers.indexOf(speaker) == -1) {
          logger.warn(`[语音合成] 不存在该角色：${logger.yellow(speaker)}`)
          return false
        }
      }

      speakerid = GenshinVoiceSpeakers.indexOf(speaker)
      if (config.Voice.GenshinVoiceApi) {
        url = `${config.Voice.GenshinVoiceApi}?user_id=${this.e.user_id}&bot_id=${Bot.uin}&id=${speakerid}&text=${encodeURIComponent(text)}`
      } else {
        path = GenshinVoicePath
      }
    }

    logger.mark(`[语音合成] ${logger.blue(`${speaker}(${speakerid})`)} 说 ${logger.cyan(text)}`)

    if (Running) {
      await this.reply("正在生成，请稍等……", true)
      return false
    }
    Running = true

    if (path) {
      let cmd = `bash '${path}main.sh' output.wav ${speakerid} '${text}'`

      logger.mark(`[语音合成] 执行：${logger.blue(cmd)}`)
      let ret = await this.execSync(cmd)
      logger.mark(`[语音合成]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

      if (ret.error) {
        logger.error(`语音合成错误：${logger.red(ret.error)}`)
        await this.reply(`语音合成错误：${ret.error}`, true)
        await this.reply(errorTips)
      }
      url = `${path}output.wav`
    }

    logger.mark(`[语音合成] 发送语音：${logger.blue(url)}`)
    Running = false
    await this.reply(await uploadRecord(url, 68714, transcoding))
  }

  async VoiceList(e) {
    await this.reply(await common.makeForwardMsg(this.e, [].concat("https://Yunzai.TRSS.me", GenshinVoiceSpeakers, ChatWaifuSpeakers), "TRSS-Plugin 语音合成角色列表"))
  }
}