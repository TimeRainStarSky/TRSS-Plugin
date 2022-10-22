import { segment } from "oicq";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { exec, execSync } = require("child_process");

let path = "plugins/TRSS-Plugin/genshin-voice/"
let running

export class GenshinVoice extends plugin {
  constructor() {
    super({
      name: "原神语音合成",
      dsc: "原神语音合成",
      event: "message",
      priority: 1000,
      rule: [
        {
          reg: "^原神.+说.+",
          fnc: "GenshinVoice",
        },
      ],
    });
  }

  async execSync(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });
  }

  async GenshinVoice(e) {
    if (running) {
      await this.reply("正在生成，请稍等……", true);
      return false;
    }
    running = true
    await this.reply("开始生成，请稍等……", true);

    let msg = this.e.msg.split("说");
    let speaker = msg.shift().replace(/^原神/, "").trim();
    let data = msg.join("说").replace("'", "").trim();

    let cmd = `sh ${path}main.sh output.wav '${speaker}' '${data}'`;

    logger.mark("[原神语音合成]执行：" + cmd);
    let ret = await this.execSync(cmd);
    logger.mark("[原神语音合成]\n" + ret.stdout);

    if (ret.error) {
      logger.error("原神语音合成错误：" + logger.red(ret.error));
      await this.reply("原神语音合成错误：" + ret.error, true);
      await this.reply(
        "请查看安装使用教程：\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin\n并将报错通过联系方式反馈给开发者"
      );
    }

    await this.reply(
      segment.record(path + "output.wav")
    );
    running = false
  }
}
