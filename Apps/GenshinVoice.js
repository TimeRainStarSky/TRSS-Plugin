import { segment } from "oicq"
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { exec, execSync } = require("child_process")
import uploadRecord from "../Model/uploadRecord.js"

let path = "plugins/TRSS-Plugin/genshin-voice/"
let running
const speakers = ["派蒙", "凯亚", "安柏", "丽莎", "琴", "香菱", "枫原万叶", "迪卢克", "温迪", "可莉", "早柚", "托马", "芭芭拉", "优菈", "云堇", "钟离", "魈", "凝光", "雷电将军", "北斗", "甘雨", "七七", "刻晴", "神里绫华", "戴因斯雷布", "雷泽", "神里绫人", "罗莎莉亚", "阿贝多", "八重神子", "宵宫", "荒泷一斗", "九条裟罗", "夜兰", "珊瑚宫心海", "五郎", "散兵", "女士", "达达利亚", "莫娜", "班尼特", "申鹤", "行秋", "烟绯", "久岐忍", "辛焱", "砂糖", "胡桃", "重云", "菲谢尔", "诺艾尔", "迪奥娜", "鹿野院平藏"]

export class GenshinVoice extends plugin {
  constructor() {
    super({
      name: "原神语音合成",
      dsc: "原神语音合成",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^(派蒙|凯亚|安柏|丽莎|琴|香菱|枫原万叶|迪卢克|温迪|可莉|早柚|托马|芭芭拉|优菈|云堇|钟离|魈|凝光|雷电将军|北斗|甘雨|七七|刻晴|神里绫华|戴因斯雷布|雷泽|神里绫人|罗莎莉亚|阿贝多|八重神子|宵宫|荒泷一斗|九条裟罗|夜兰|珊瑚宫心海|五郎|散兵|女士|达达利亚|莫娜|班尼特|申鹤|行秋|烟绯|久岐忍|辛焱|砂糖|胡桃|重云|菲谢尔|诺艾尔|迪奥娜|鹿野院平藏)(API)?(转码)?说.+",
          fnc: "GenshinVoice",
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

  async GenshinVoice(e) {
    let msg = this.e.msg.split("说")
    let speaker = msg.shift()
    let data = msg.join("说").replace("'", "").trim()

    let transcoding = false
    if (speaker.match("转码")) {
      speaker = speaker.replace("转码", "")
      transcoding = true
    }

    if (speaker.match("API")) {
      let speakerid = speakers.indexOf(speaker.replace("API", ""))
      let url = `https://genshin.azurewebsites.net/api/speak?format=mp3&id=${speakerid}&text=${encodeURI(data)}`
      logger.mark(`[原神语音合成]发送API语音：${url}`)

      await this.reply(
        await uploadRecord(url, 68714, transcoding)
      )
      return true
    }

    if (running) {
      await this.reply("正在生成，请稍等……", true)
      return false
    }
    running = true
    await this.reply("开始生成，请稍等……", true)

    let cmd = `sh ${path}main.sh output.wav '${speaker}' '${data}'`

    logger.mark(`[原神语音合成]执行：${logger.blue(cmd)}`)
    let ret = await this.execSync(cmd)
    logger.mark(`[原神语音合成]\n${ret.stdout.trim()}\n${logger.red(ret.stderr.trim())}`)

    if (ret.error) {
      logger.error(`原神语音合成错误：${logger.red(ret.error)}`)
      await this.reply(`原神语音合成错误：${ret.error}`, true)
      await this.reply(
        "请查看安装使用教程：\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin\n并将报错通过联系方式反馈给开发者"
      )
    }

    await this.reply(
      await uploadRecord(`${path}output.wav`, 68714, transcoding)
    )
    running = false
  }
}