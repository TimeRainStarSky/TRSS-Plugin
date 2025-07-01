import fs from "node:fs/promises"
import YAML from "yaml"
import _ from "lodash"

const configFile = "config/TRSS.yaml"
const config = {
  tips: "",

  Voice: {
    GenshinVoiceApi: "",
    ChatWaifuApi: "",
  },

  RealESRGAN: {
    api: "",
    format: "jpg",
  },

  RemBG: {
    api: "",
  },

  miHoYoLogin: {
    help: true,
  },
}

let configData

if (await Bot.fsStat(configFile))
  try {
    configData = YAML.parse(await fs.readFile(configFile, "utf-8"))
    _.merge(config, configData)
  } catch (err) {
    logger.error(`配置文件 读取失败：${logger.red(err)}`)
  }

config.tips = [
  "欢迎使用 TRSS Yunzai Plugin ! 作者：时雨🌌星空",
  "按 Ctrl+Q Y 保存退出",
  "参考：https://Yunzai.TRSS.me",
]

if (YAML.stringify(config) != YAML.stringify(configData))
  await fs.writeFile(configFile, YAML.stringify(config), "utf-8")

export default config
