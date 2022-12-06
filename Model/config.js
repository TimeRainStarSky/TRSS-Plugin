import fs from "fs"
import YAML from "yaml"

let path = `${process.cwd()}/plugins/TRSS-Plugin/`
let configFile = `${path}config.yaml`

if (!fs.existsSync(configFile)) {
  fs.copyFileSync(`${path}config_demo.yaml`, configFile)
}

let config = YAML.parse(fs.readFileSync(configFile, 'utf-8'))

export default config