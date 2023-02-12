import { segment } from "oicq"
import config from "../Model/config.js"
import { exec } from "child_process"
import uploadRecord from "../Model/uploadRecord.js"
import gsCfg from "../../genshin/model/gsCfg.js"

let path = `${process.cwd()}/plugins/TRSS-Plugin/GenshinVoice/`
let Running
let errorTips = "请查看安装使用教程：\nhttps://Yunzai.TRSS.me\n并将报错通过联系方式反馈给开发者"

let speakers
if (config.GenshinVoice.publicApi) {
  speakers = ["派蒙", "空", "荧", "阿贝多", "枫原万叶", "温迪", "八重神子", "纳西妲", "钟离", "诺艾尔", "凝光", "托马", "北斗", "莫娜", "荒泷一斗", "提纳里", "芭芭拉", "艾尔海森", "雷电将军", "赛诺", "琴", "班尼特", "五郎", "神里绫华", "迪希雅", "夜兰", "辛焱", "安柏", "宵宫", "云堇", "妮露", "烟绯", "鹿野院平藏", "凯亚", "达达利亚", "迪卢克", "可莉", "早柚", "香菱", "重云", "刻晴", "久岐忍", "珊瑚宫心海", "迪奥娜", "戴因斯雷布", "魈", "神里绫人", "丽莎", "优菈", "凯瑟琳", "雷泽", "菲谢尔", "九条裟罗", "甘雨", "行秋", "胡桃", "迪娜泽黛", "柯莱", "申鹤", "砂糖", "萍姥姥", "奥兹", "罗莎莉亚", "式大将", "哲平", "坎蒂丝", "托克", "留云借风真君", "昆钧", "塞琉斯", "多莉", "大肉丸", "莱依拉", "散兵", "拉赫曼", "杜拉夫", "阿守", "玛乔丽", "纳比尔", "海芭夏", "九条镰治", "阿娜耶", "阿晃", "阿扎尔", "七七", "博士", "白术", "埃洛伊", "大慈树王", "女士", "丽塔", "失落迷迭", "缭乱星棘", "伊甸", "伏特加女孩", "狂热蓝调", "莉莉娅", "萝莎莉娅", "八重樱", "八重霞", "卡莲", "第六夜想曲", "卡萝尔", "姬子", "极地战刃", "布洛妮娅", "次生银翼", "理之律者", "迷城骇兔", "希儿", "魇夜星渊", "黑希儿", "帕朵菲莉丝", "天元骑英", "幽兰黛尔", "德丽莎", "月下初拥", "朔夜观星", "暮光骑士", "明日香", "李素裳", "格蕾修", "梅比乌斯", "渡鸦", "人之律者", "爱莉希雅", "爱衣", "天穹游侠", "琪亚娜", "空之律者", "薪炎之律者", "云墨丹心", "符华", "识之律者", "维尔薇", "芽衣", "雷之律者", "阿波尼亚"]
} else {
  speakers = ["派蒙", "凯亚", "安柏", "丽莎", "琴", "香菱", "枫原万叶", "迪卢克", "温迪", "可莉", "早柚", "托马", "芭芭拉", "优菈", "云堇", "钟离", "魈", "凝光", "雷电将军", "北斗", "甘雨", "七七", "刻晴", "神里绫华", "戴因斯雷布", "雷泽", "神里绫人", "罗莎莉亚", "阿贝多", "八重神子", "宵宫", "荒泷一斗", "九条裟罗", "夜兰", "珊瑚宫心海", "五郎", "散兵", "女士", "达达利亚", "莫娜", "班尼特", "申鹤", "行秋", "烟绯", "久岐忍", "辛焱", "砂糖", "胡桃", "重云", "菲谢尔", "诺艾尔", "迪奥娜", "鹿野院平藏"]
}
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

    if (speakers.indexOf(speaker) == -1) {
      for (let rolename of Object.values(AllAbbr)) {
        if (rolename.includes(speaker)) {
          speaker = rolename[0]
          break
        }
      }

      if (speakers.indexOf(speaker) == -1) {
        logger.warn(`[原神语音合成] 不存在该角色：${logger.yellow(speaker)}`)
        return false
      }
    }

    let url
    if (config.GenshinVoice.publicApi) {
      url = `https://yuanshenai.azurewebsites.net/api?speaker=${encodeURIComponent(speaker)}&text=${encodeURIComponent(text)}`
    } else {
      if (Running) {
        await this.reply("正在生成，请稍等……", true)
        return false
      }
      Running = true

      speaker = speakers.indexOf(speaker)
      if (config.GenshinVoice.api) {
        url = `${config.GenshinVoice.api}?user_id=${this.e.user_id}&bot_id=${Bot.uin}&id=${speaker}&text=${encodeURIComponent(text)}`
      } else {
        let cmd = `bash '${path}main.sh' output.wav ${speaker} '${text}'`

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