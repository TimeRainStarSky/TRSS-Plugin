logger.info(logger.yellow("- 正在加载 TRSS 插件"))

if (process.version < "v18")
  throw Error(`Node.js ${process.version} < v18`)
import fs from "node:fs/promises"

global.segment ??= (await import("oicq")).segment

if (!Bot.makeForwardArray) {
  const { makeForwardMsg } = (await import("../../lib/common/common.js")).default
  Bot.makeForwardArray = msg => makeForwardMsg({}, msg)
}

Bot.sleep ??= (time, promise) => {
  if (promise) return Promise.race([promise, Bot.sleep(time)])
  return new Promise(resolve => setTimeout(resolve, time))
}

Bot.download ??= (await import("../../lib/common/common.js")).default.downFile

Bot.String ??= (data, opts) => {
  switch (typeof data) {
    case "string":
      return data
    case "function":
      return String(data)
    case "object":
      if (data instanceof Error)
        return data.stack
      if (Buffer.isBuffer(data))
        return String(data)
  }

  try {
    return JSON.stringify(data, undefined, opts)
  } catch (err) {
    if (typeof data.toString == "function")
      return String(data)
    else
      return "[object null]"
  }
}

Bot.Loging ??= Bot.String

if (!Bot.exec) {
  const { exec, execFile } = await import("node:child_process")
  Bot.exec = (cmd, opts = {}) => new Promise(resolve => {
    const name = logger.cyan(Bot.String(cmd))
    logger[opts.quiet ? "debug" : "mark"]("[执行命令]", name)
    opts.encoding ??= "buffer"
    const callback = (error, stdout, stderr) => {
      const raw = { stdout, stderr }
      stdout = String(stdout).trim()
      stderr = String(stderr).trim()
      resolve({ error, stdout, stderr, raw })
      logger[opts.quiet ? "debug" : "mark"](`[执行命令] ${name} ${logger.green(`[完成${Date.now()-start_time}ms]`)} ${stdout?`\n${stdout}`:""}${stderr?logger.red(`\n${stderr}`):""}`)
      if (error) logger[opts.quiet ? "debug" : "error"]("[执行命令]", error)
    }
    const start_time = Date.now()
    if (Array.isArray(cmd))
      execFile(cmd.shift(), cmd, opts, callback)
    else
      exec(cmd, opts, callback)
  })
}

Bot.fsStat ??= async path => { try {
  return await fs.stat(path)
} catch (err) {
  logger.trace("获取", path, "状态错误", err)
  return false
}}

Bot.glob ??= async (path, opts = {}) => {
  if (!opts.force && await Bot.fsStat(path))
    return [path]
  if (!fs.glob) return []
  const array = []
  try {
    for await (const i of fs.glob(path, opts))
      array.push(i)
  } catch (err) {
    logger.error("匹配", path, "错误", err)
  }
  return array
}

const files = (await fs.readdir("plugins/TRSS-Plugin/Apps"))
  .filter(file => file.endsWith(".js"))

const ret = await Promise.allSettled(
  files.map(i => import(`./Apps/${i}`))
)

export const apps = {}
for (const i in files) {
  const name = files[i].replace(".js", "")
  if (ret[i].status != "fulfilled") {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[name]
}

logger.info(logger.green("- TRSS 插件 加载完成"))