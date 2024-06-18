export default class {
  constructor(p) {
    this.p = p
  }

  async choose(path, type = "isFile") {
    let files = await Bot.glob(path, { type })
    if (type) {
      const array = []
      for (const i of files) try {
        if ((await Bot.fsStat(i))[type]())
          array.push(i)
      } catch {}
      files = array
    }
    if (files.length < 2)
      return files[0]

    await this.p.reply(`检测到${files.length}个文件，请选择\n${files.map((i, n) => `${n+1}. ${i}`).join("\n")}`, true, { recallMsg: 10 })
    const { msg } = await this.p.awaitContext()
    if (files[msg-1])
      return files[msg-1]
    if (files.includes(msg))
      return msg
    return false
  }
}