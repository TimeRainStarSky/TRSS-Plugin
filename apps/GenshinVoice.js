import { segment } from "oicq";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { exec, execSync } = require("child_process");

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
    let msg = e.msg.split("说");
    let speaker = msg.shift().replace(/^原神/, "").trim();
    let data = msg.join("说").replace("'", "").trim();

    let cmd = `sh plugins/TRSS-Plugin/genshin-voice/main.sh output.wav '${speaker}' '${data}'`;

    let ret = await this.execSync(cmd);
    logger.mark("[原神语音合成]\n" + ret.stdout);

    if (ret.error) {
      logger.error("原神语音合成错误：" + logger.red(ret.error));
      await this.reply("原神语音合成错误：" + ret.error);
      await this.reply(
        "请查看安装使用教程：\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin\n并将报错通过联系方式反馈给开发者"
      );
    }

    await this.reply(
      segment.record("plugins/TRSS-Plugin/genshin-voice/output.wav")
    );
    return true;
  }
}
