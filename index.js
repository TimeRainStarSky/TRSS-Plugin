logger.info(logger.yellow("- 正在加载 TRSS 插件"))

if (process.version < "v18")
  throw Error(`Node.js ${process.version} < v18`)
import fs from "node:fs"

if (!global.segment)
  global.segment = (await import("oicq")).segment

if (!Bot.makeForwardArray) {
  const { makeForwardMsg } = (await import("../../lib/common/common.js")).default
  Bot.makeForwardArray = msg => makeForwardMsg({}, msg)
}

if (!Bot.sleep)
  Bot.sleep = time => new Promise(resolve => setTimeout(resolve, time))

if (!Bot.download)
  Bot.download = (await import("../../lib/common/common.js")).default.downFile

if (!Bot.String)
  Bot.String = data => {
    switch (typeof data) {
      case "string":
        return data
      case "object":
        if (data instanceof Error)
          return data.stack
        if (Buffer.isBuffer(data))
          return Buffer.from(data, "utf8").toString()
    }
    return JSON.stringify(data)
  }

if (!Bot.Loging)
  Bot.Loging = Bot.String

if (!Bot.exec) {
  const { exec } = await import("node:child_process")
  Bot.exec = (cmd, opts = {}) => new Promise(resolve => {
    logger.mark(`[执行命令] ${logger.blue(cmd)}`)
    exec(cmd, opts, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr })
      logger.mark(`[执行命令完成] ${logger.blue(cmd)}${stdout?`\n${String(stdout).trim()}`:""}${stderr?logger.red(`\n${String(stderr).trim()}`):""}`)
      if (error) logger.error(`[执行命令错误] ${logger.blue(cmd)}\n${logger.red(Bot.String(error).trim())}`)
    })
  })
}

const files = fs
  .readdirSync("plugins/TRSS-Plugin/Apps")
  .filter(file => file.endsWith(".js"))

let ret = []
for (const i of files)
  ret.push(import(`./Apps/${i}`))
ret = await Promise.allSettled(ret)

const apps = {}
for (const i in files) {
  const name = files[i].replace(".js", "")
  if (ret[i].status != "fulfilled") {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[name]
}
export { apps }

logger.info(logger.green("- TRSS 插件 加载完成"))