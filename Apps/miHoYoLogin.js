import _ from "lodash"
import crypto from "crypto"
import fetch from "node-fetch"

const regex = "^#?(米哈?游社?登(录|陆|入)|登(录|陆|入)米哈?游社?)"
const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDvekdPMHN3AYhm/vktJT+YJr7cI5DcsNKqdsx5DZX0gDuWFuIjzdwButrIYPNmRJ1G8ybDIF7oDW2eEpm5sMbL9zs
9ExXCdvqrn51qELbqj0XxtMTIpaCHFSI50PfPpTFV9Xt/hmyVwokoOXFlAEgCn+Q
CgGs52bFoYMtyi+xEQIDAQAB
-----END PUBLIC KEY-----`
const app_id = 8

function random_string(n) {
  return _.sampleSize("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", n).join("")
}

function encrypt_data(data) {
  return crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }, data).toString("base64")
}

function md5(data) {
  return crypto.createHash("md5").update(data).digest("hex")
}

function ds(data) {
  const t = Math.floor(Date.now()/1000)
  const r = random_string(6)
  const h = md5(`salt=JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS&t=${t}&r=${r}&b=${data}&q=`)
  return `${t},${r},${h}`
}

function sleep(ms) {
  return new Promise(resolve=>setTimeout(resolve, ms))
}

async function request(url, data, aigis) {
  return await fetch(url, {
    method: "post",
    body: data,
    headers: {
      "x-rpc-app_version": "2.41.0",
      "DS": ds(data),
      "x-rpc-aigis": aigis,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "x-rpc-game_biz": "bbs_cn",
      "x-rpc-sys_version": "12",
      "x-rpc-device_id": random_string(16),
      "x-rpc-device_fp": random_string(13),
      "x-rpc-device_name": random_string(16),
      "x-rpc-device_model": random_string(16),
      "x-rpc-app_id": "bll8iq97cem8",
      "x-rpc-client_type": "2",
      "User-Agent": "okhttp/4.8.0"
    }
  })
}

const errorTips = "登录失败，请检查日志\nhttps://Yunzai.TRSS.me"
const accounts = {}
const Running = {}

export class miHoYoLogin extends plugin {
  constructor() {
    super({
      name: "米哈游登录",
      dsc: "米哈游登录",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: `${regex}$`,
          fnc: "miHoYoLoginQRCode"
        },
        {
          reg: `${regex}.+$`,
          fnc: "miHoYoLoginDetect"
        },
        {
          reg: "^#?(体力|(c|C)(oo)?k(ie)?|(s|S)(to)?k(en)?)(帮助|教程)$",
          fnc: "miHoYoLoginHelp"
        }
      ]
    })
  }

  miHoYoLoginDetect() {
    accounts[this.e.user_id] = this.e
    this.setContext("miHoYoLogin")
    this.reply("请发送密码", true, { recallMsg: 60 })
  }

  async crack_geetest(gt, challenge) {
    let res
    this.reply(`请完成验证：https://challenge.minigg.cn/manual/index.html?gt=${gt}&challenge=${challenge}`, true, { recallMsg: 60 })
    for (let n=1;n<60;n++) {
      await sleep(5000)
      try {
        res = await fetch(`https://challenge.minigg.cn/manual/?callback=${challenge}`)
        res = await res.json()
        if (res.retcode == 200)
          return res.data
      } catch (err) {
        logger.error(`[米哈游登录] 错误：${logger.red(err)}`)
      }
    }
    this.reply("验证超时", true)
    return false
  }

  async miHoYoLogin() {
    if(!this.e.msg)return false
    this.finish("miHoYoLogin")
    if (Running[this.e.user_id]) {
      this.reply("有正在进行的登录操作，请完成后再试……", true, { recallMsg: 60 })
      return false
    }
    Running[this.e.user_id] = true

    const password = this.e.msg.trim()
    this.e = accounts[this.e.user_id]
    const account = this.e.msg.replace(new RegExp(regex), "").trim()

    const data = JSON.stringify({
      account: encrypt_data(account),
      password: encrypt_data(password)
    })

    const url = "https://passport-api.mihoyo.com/account/ma-cn-passport/app/loginByPassword"
    let res = await request(url, data, "")
    const aigis_data = JSON.parse(res.headers.get("x-rpc-aigis"))
    res = await res.json()
    logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(res))}`)

    if (res.retcode == -3101) {
      logger.mark("[米哈游登录] 正在验证")
      const aigis_captcha_data = JSON.parse(aigis_data.data)
      const challenge = aigis_captcha_data.challenge
      const validate = await this.crack_geetest(aigis_captcha_data.gt, challenge)
      if (validate.geetest_validate) {
        logger.mark("[米哈游登录] 验证成功")
      } else {
        logger.error("[米哈游登录] 验证失败")
        Running[this.e.user_id] = false
        return false
      }

      const aigis = aigis_data.session_id + ";" + Buffer.from(JSON.stringify({
        geetest_challenge: challenge,
        geetest_seccode: validate.geetest_validate + "|jordan",
        geetest_validate: validate.geetest_validate
      })).toString("base64")

      res = await request(url, data, aigis)
      res = await res.json()
      logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(res))}`)
    }

    if (res.retcode != 0)  {
      this.reply(`错误：${JSON.stringify(res)}`, true)
      Running[this.e.user_id] = false
      return false
    }

    let cookie = await fetch(`https://api-takumi.mihoyo.com/auth/api/getCookieAccountInfoBySToken?stoken=${res.data.token.token}&mid=${res.data.user_info.mid}`)
    cookie = await cookie.json()
    logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(cookie))}`)
    cookie = [
      `ltoken=${res.data.token.token};ltuid=${res.data.user_info.aid};cookie_token=${cookie.data.cookie_token};login_ticket=${res.data.login_ticket}`,
      `stoken=${res.data.token.token};stuid=${res.data.user_info.aid};mid=${res.data.user_info.mid}`,
    ]
    for (const i of cookie) this.makeMessage(i)
    if (this.e.isPrivate)
      this.reply(await common.makeForwardMsg(this.e, cookie, "登录完成，以下分别是 Cookie 和 Stoken，将会自动绑定"))

    Running[this.e.user_id] = false
  }

  async miHoYoLoginQRCode() {
    if (Running[this.e.user_id]) {
      this.reply(["请使用米游社扫码登录", Running[this.e.user_id]], true, { recallMsg: 60 })
      return true
    }
    Running[this.e.user_id] = true

    const device = random_string(64)
    let res = await fetch("https://hk4e-sdk.mihoyo.com/hk4e_cn/combo/panda/qrcode/fetch", {
      method: "post",
      body: JSON.stringify({ app_id, device })
    })
    res = await res.json()
    logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(res))}`)

    const url = res.data.url
    const ticket = url.split("ticket=")[1]
    const img = segment.image((await QR.toDataURL(url)).replace("data:image/png;base64,", "base64://"))
    Running[this.e.user_id] = img
    this.reply(["请使用米游社扫码登录", img], true, { recallMsg: 60 })

    let data
    let Scanned
    for (let n=1;n<60;n++) {
      await sleep(5000)
      try {
        res = await fetch("https://hk4e-sdk.mihoyo.com/hk4e_cn/combo/panda/qrcode/query", {
          method: "post",
          body: JSON.stringify({ app_id, device, ticket })
        })
        res = await res.json()

        if (res.retcode != 0) {
          this.reply(["二维码已过期，请重新登录", segment.button([
            { text: "米哈游登录", callback: "米哈游登录" },
          ])], true, { recallMsg: 60 })
          Running[this.e.user_id] = false
          return false
        }

        if (res.data.stat == "Scanned" && !Scanned) {
          logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(res))}`)
          Scanned = true
          this.reply("二维码已扫描，请确认登录", true, { recallMsg: 60 })
        }

        if (res.data.stat == "Confirmed") {
          logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(res))}`)
          data = JSON.parse(res.data.payload.raw)
          break
        }
      } catch (err) {
        logger.error(`[米哈游登录] 错误：${logger.red(err)}`)
      }
    }

    if (!(data.uid&&data.token)) {
      this.reply(errorTips, true)
      Running[this.e.user_id] = false
      return false
    }

    res = await request(
      "https://passport-api.mihoyo.com/account/ma-cn-session/app/getTokenByGameToken",
      JSON.stringify({ account_id: parseInt(data.uid), game_token: data.token }),
      ""
    )
    res = await res.json()
    logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(res))}`)

    let cookie = await fetch(`https://api-takumi.mihoyo.com/auth/api/getCookieAccountInfoByGameToken?account_id=${data.uid}&game_token=${data.token}`)
    cookie = await cookie.json()
    logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(cookie))}`)

    cookie = [
      `ltoken=${res.data.token.token};ltuid=${res.data.user_info.aid};cookie_token=${cookie.data.cookie_token}`,
      `stoken=${res.data.token.token};stuid=${res.data.user_info.aid};mid=${res.data.user_info.mid}`,
    ]
    for (const i of cookie) this.makeMessage(i)
    if (this.e.isPrivate)
      this.reply(await common.makeForwardMsg(this.e, cookie, "登录完成，以下分别是 Cookie 和 Stoken，将会自动绑定"))

    Running[this.e.user_id] = false
  }

  makeMessage(msg) {
    Bot.emit("message", {
      self_id: this.e.self_id,
      message_id: this.e.message_id,
      user_id: this.e.user_id,
      sender: this.e.sender,
      friend: this.e.friend,
      reply: (...args) => this.reply(...args),
      post_type: "message",
      message_type: "private",
      message: [{ type: "text", text: msg }],
      raw_message: msg,
    })
  }

  miHoYoLoginHelp() {
    if (!config.miHoYoLogin.help) return false
    this.reply(["发送【米哈游登录】", segment.button([
      { text: "米哈游登录", callback: "米哈游登录" },
    ])], true)
  }
}