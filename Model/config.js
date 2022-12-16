import fs from "fs"
import YAML from "yaml"
import _ from "lodash"

let path = `${process.cwd()}/plugins/TRSS-Plugin/`
let configFile = `${path}config.yaml`
let configData

let config = {
  tips: ["欢迎使用 TRSS Yunzai Plugin ! 作者：时雨🌌星空", "按 Ctrl+Q Y 保存退出", "参考：https://gitee.com/TimeRainStarSky/TRSS-Plugin"],

  GenshinVoice: {
    api: ""
  },

  RealESRGAN: {
    api: ""
  },

  ChatGPT: {
    api: "",
    tokenapi: "",
    username: "",
    password: "",
    sessionToken: ""
  }
}

if (fs.existsSync(configFile)) {
  configData = YAML.parse(fs.readFileSync(configFile, "utf-8"))
  _.merge(config, configData)
}

if (config != configData) {
  fs.writeFileSync(configFile, YAML.stringify(config), "utf-8")
}

export default config