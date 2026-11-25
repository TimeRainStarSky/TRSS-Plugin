import config from "../Model/config.js"
import QR from "qrcode"
import _ from "lodash"
import crypto from "crypto"
import fetch from "node-fetch"

const regex = "^#(米哈?游社?登(录|陆|入)|登(录|陆|入)米哈?游社?)"
const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDvekdPMHN3AYhm/vktJT+YJr7cI5DcsNKqdsx5DZX0gDuWFuIjzdwButrIYPNmRJ1G8ybDIF7oDW2eEpm5sMbL9zs
9ExXCdvqrn51qELbqj0XxtMTIpaCHFSI50PfPpTFV9Xt/hmyVwokoOXFlAEgCn+Q
CgGs52bFoYMtyi+xEQIDAQAB
-----END PUBLIC KEY-----`

function random_string(n) {
  return _.sampleSize("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", n).join("")
}

function encrypt_data(data) {
  return crypto
    .publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      data,
    )
    .toString("base64")
}

function md5(data) {
  return crypto.createHash("md5").update(data).digest("hex")
}

// 不同 x-rpc-client_type 使用不同 DS 盐：
// 2 = passport / CookieToken 换票，5 = record 系 / LToken 换票
const DS_SALT = {
  2: "JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS",
  5: "xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs",
}

function ds(data, clientType = 2) {
  const t = Math.floor(Date.now() / 1000)
  const r = random_string(6)
  const salt = DS_SALT[clientType] ?? DS_SALT[2]
  const h = md5(`salt=${salt}&t=${t}&r=${r}&b=${data}&q=`)
  return `${t},${r},${h}`
}

// 新版换票接口（dst_token_type: 2=ltoken_v2 / 4=cookie_token_v2）
const EXCHANGE_APP_VERSION = "2.106.2"
const EXCHANGE_PASSPORT_VERSION = "2.44.0"
const EXCHANGE_DEVICE_ID = random_string(32).toUpperCase()
const EXCHANGE_LIFECYCLE_ID = crypto.randomBytes(5).toString("hex")

function request(url, { data, aigis, cookie, clientType = 2, deviceId } = {}) {
  const opts = {}
  if (data) {
    opts.method = "post"
    opts.body = JSON.stringify(data)
  }
  opts.headers = {
    "x-rpc-app_version": "2.104.0",
    DS: ds(opts.body ?? "", clientType),
    "x-rpc-aigis": aigis,
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-rpc-game_biz": "bbs_cn",
    "x-rpc-sys_version": "12",
    "x-rpc-device_id": deviceId ?? random_string(16),
    "x-rpc-device_fp": random_string(13),
    "x-rpc-device_name": random_string(16),
    "x-rpc-device_model": random_string(16),
    "x-rpc-app_id": "bll8iq97cem8",
    "x-rpc-client_type": String(clientType),
    "User-Agent": "Hyperion/550 CFNetwork/3860.500.112 Darwin/25.4.0",
    Cookie: cookie,
  }
  return fetch(url, opts)
}

/**
 * 用 v2 stoken 换取 ltoken_v2 / cookie_token_v2。
 * 老的 getLTokenBySToken / getCookieAccountInfoBySToken 已废弃（-464）。
 *
 * @param {string} stoken v2_ 开头的 stoken
 * @param {string} mid 账号 mid
 * @param {2|4} dstTokenType 2=ltoken_v2，4=cookie_token_v2
 */
async function exchangeToken(stoken, mid, dstTokenType) {
  const body = JSON.stringify({
    dst_token_type: dstTokenType,
    src_token: { token: stoken, token_type: 1 },
    mid,
  })
  try {
    const res = await fetch("https://passport-api.mihoyo.com/account/ma-cn-session/app/exchange", {
      method: "post",
      body,
      headers: {
        "content-type": "application/json",
        DS: ds(body, 2),
        "User-Agent": `Mozilla/5.0 (Linux; Android 12; Unspecified Device) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/103.0.5060.129 Mobile Safari/537.36 miHoYoBBS/${EXCHANGE_APP_VERSION}`,
        "x-rpc-app_version": EXCHANGE_APP_VERSION,
        "x-rpc-client_type": "2",
        "x-rpc-app_id": "bll8iq97cem8",
        "x-rpc-device_id": EXCHANGE_DEVICE_ID,
        "x-rpc-device_name": "Mihoyo Capture",
        "x-rpc-device_model": "Mi 14",
        "x-rpc-game_biz": "bbs_cn",
        "x-rpc-sdk_version": EXCHANGE_PASSPORT_VERSION,
        "x-rpc-account_version": EXCHANGE_PASSPORT_VERSION,
        "x-rpc-lifecycle_id": EXCHANGE_LIFECYCLE_ID,
      },
    })
    return await res.json()
  } catch (err) {
    logger.error("[米游社登录][exchange] 请求异常", err)
    return null
  }
}

/**
 * 按票据前缀组装 Cookie：
 * - ltoken 以 v2_ 开头：ltoken_v2 / ltuid_v2 / ltmid_v2
 * - cookie_token 以 v2_ 开头：cookie_token_v2 / account_id_v2 / account_mid_v2
 * 参考 gsuid_core（GenshinUID Core）的票据归一化规则。
 */
function buildMysCookie({ uid, mid, ltoken, cookieToken, extras = [] }) {
  const parts = []
  if (ltoken) {
    if (ltoken.startsWith("v2_")) parts.push(`ltoken_v2=${ltoken}`, `ltuid_v2=${uid}`, `ltmid_v2=${mid}`)
    else parts.push(`ltoken=${ltoken}`, `ltuid=${uid}`)
  }
  if (cookieToken) {
    if (cookieToken.startsWith("v2_"))
      parts.push(`cookie_token_v2=${cookieToken}`, `account_id_v2=${uid}`, `account_mid_v2=${mid}`)
    else parts.push(`cookie_token=${cookieToken}`)
  }
  return [...parts, ...extras].join(";")
}

function app_request(url, { data, device_id }) {
  return fetch(url, {
    method: "post",
    body: data ? JSON.stringify(data) : "{}",
    headers: {
      "User-Agent": "HYPContainer/1.3.3.182",
      "x-rpc-app_id": "ddxf5dufpuyo",
      "x-rpc-client_type": "3",
      "x-rpc-device_id": device_id,
    },
  })
}

const web_headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
  "x-rpc-app_id": "bll8iq97cem8",
  "x-rpc-device_id": random_string(16),
}

const errorTips = [
  "登录失败，请检查日志\n如果【米哈游登录】无法使用，请尝试【米游社登录】\nhttps://git.trss.me/TRSS-Plugin",
  segment.button([
    { text: "米哈游登录", callback: "米哈游登录" },
    { text: "米游社登录", callback: "米游社登录" },
  ]),
]
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
          reg: `(${regex}|^#(扫码|二维码|辅助)(登录|绑定|登陆))(终止)?$`,
          fnc: "miHoYoLoginQRCode",
        },
        {
          reg: `${regex}.+$`,
          fnc: "miHoYoLoginDetect",
        },
        {
          reg: "^#(体力|(c|C)(oo)?k(ie)?|(s|S)(to)?k(en)?)(帮助|教程)$",
          fnc: "miHoYoLoginHelp",
        },
      ],
    })
  }

  miHoYoLoginDetect() {
    accounts[this.e.user_id] = this.e
    this.setContext("miHoYoLogin")
    this.reply("请发送密码", true, { recallMsg: 60 })
  }

  async crack_geetest(gt, challenge) {
    let res
    this.reply(
      `请完成验证：https://challenge.minigg.cn/manual/index.html?gt=${gt}&challenge=${challenge}`,
      true,
      { recallMsg: 60 },
    )
    for (let n = 1; n < 60; n++) {
      await Bot.sleep(5000)
      try {
        res = await fetch(`https://challenge.minigg.cn/manual/?callback=${challenge}`)
        res = await res.json()
        if (res.retcode === 200) return res.data
      } catch (err) {
        logger.error(this.e.logFnc, err)
      }
    }
    this.reply("验证超时", true, { recallMsg: 60 })
    return false
  }

  async miHoYoLogin() {
    if (!this.e.msg) return false
    this.finish("miHoYoLogin")
    if (Running[this.e.user_id]) {
      this.reply("有正在进行的登录操作，请完成后再试……", true, { recallMsg: 60 })
      return false
    }
    Running[this.e.user_id] = true

    const password = this.e.msg.trim()
    this.e = accounts[this.e.user_id]
    const account = this.e.msg.replace(new RegExp(regex), "").trim()

    const data = {
      account: encrypt_data(account),
      password: encrypt_data(password),
    }

    const url = "https://passport-api.mihoyo.com/account/ma-cn-passport/app/loginByPassword"
    let res = await request(url, { data, aigis: "" })
    const aigis_data = JSON.parse(res.headers.get("x-rpc-aigis"))
    res = await res.json()
    logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(res))}`)

    if (res.retcode === -3101) {
      logger.mark("${this.e.logFnc} 正在验证")
      const aigis_captcha_data = JSON.parse(aigis_data.data)
      const challenge = aigis_captcha_data.challenge
      const validate = await this.crack_geetest(aigis_captcha_data.gt, challenge)
      if (validate.geetest_validate) {
        logger.mark("${this.e.logFnc} 验证成功")
      } else {
        logger.error("${this.e.logFnc} 验证失败")
        Running[this.e.user_id] = false
        return false
      }

      const aigis =
        aigis_data.session_id +
        ";" +
        Buffer.from(
          JSON.stringify({
            geetest_challenge: challenge,
            geetest_seccode: validate.geetest_validate + "|jordan",
            geetest_validate: validate.geetest_validate,
          }),
        ).toString("base64")

      res = await request(url, { data, aigis })
      res = await res.json()
      logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(res))}`)
    }

    if (res.retcode !== 0) {
      this.reply(`错误：${JSON.stringify(res)}`, true, { recallMsg: 60 })
      Running[this.e.user_id] = false
      return false
    }

    const uid = res.data.user_info.aid
    const mid = res.data.user_info.mid
    const stoken = res.data.token.token
    if (stoken.startsWith("v2_") && !mid) {
      this.reply(errorTips, true, { recallMsg: 60 })
      Running[this.e.user_id] = false
      return false
    }

    const ltRes = await exchangeToken(stoken, mid, 2)
    logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(ltRes))}`)
    const ltoken = ltRes?.data?.token?.token
    if (Number(ltRes?.retcode) !== 0 || !ltoken) {
      logger.error("[米哈游登录] ltoken_v2 换票失败")
      this.reply(errorTips, true, { recallMsg: 60 })
      Running[this.e.user_id] = false
      return false
    }

    const ctRes = await exchangeToken(stoken, mid, 4)
    logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(ctRes))}`)
    const cookieToken = ctRes?.data?.token?.token
    if (Number(ctRes?.retcode) !== 0 || !cookieToken) {
      logger.error("[米哈游登录] cookie_token_v2 换票失败")
      this.reply(errorTips, true, { recallMsg: 60 })
      Running[this.e.user_id] = false
      return false
    }

    const cookie = [
      buildMysCookie({
        uid,
        mid,
        ltoken,
        cookieToken,
        extras: res.data.login_ticket ? [`login_ticket=${res.data.login_ticket}`] : [],
      }),
      `stoken=${stoken};stuid=${uid};mid=${mid}`,
    ]
    for (const i of cookie) this.makeMessage(i)
    if (this.e.isPrivate)
      this.reply(
        await Bot.makeForwardArray([
          "登录完成，以下分别是 Cookie 和 Stoken，将会自动绑定",
          ...cookie,
        ]),
      )

    Running[this.e.user_id] = false
  }

  async miHoYoLoginQRCode() {
    if (this.e.msg.includes("终止")) {
      Running[this.e.user_id] = false
      return true
    }

    if (Running[this.e.user_id])
      return this.reply(
        [
          "请使用米游社扫码登录",
          Running[this.e.user_id],
          segment.button([{ text: "终止登录", callback: "米哈游登录终止" }]),
        ],
        true,
        {
          recallMsg: 60,
        },
      )
    Running[this.e.user_id] = true

    if (this.e.msg.includes("米游社")) return this.HyperionLogin()

    const device_id = random_string(16)
    let res, ticket
    try {
      res = await app_request(
        "https://passport-api.mihoyo.com/account/ma-cn-passport/app/createQRLogin",
        { device_id },
      )
      res = await res.json()
      logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(res))}`)

      const url = res.data.url
      ticket = res.data.ticket
      const img = segment.image(
        (await QR.toDataURL(url)).replace("data:image/png;base64,", "base64://"),
      )
      Running[this.e.user_id] = img
      this.reply(
        [
          "请使用米游社扫码登录",
          img,
          segment.button([{ text: "终止登录", callback: "米哈游登录终止" }]),
        ],
        true,
        { recallMsg: 60 },
      )
    } catch (err) {
      Running[this.e.user_id] = false
      return logger.error(this.e.logFnc, err)
    }

    let data, Scanned
    for (let n = 1; n < 60; n++) {
      await Bot.sleep(5000)
      if (Running[this.e.user_id] === false)
        return this.reply(
          [
            "米哈游登录已终止",
            segment.button([
              { text: "米哈游登录", callback: "米哈游登录" },
              { text: "米游社登录", callback: "米游社登录" },
            ]),
          ],
          true,
          { recallMsg: 60 },
        )
      try {
        res = await app_request(
          "https://passport-api.mihoyo.com/account/ma-cn-passport/app/queryQRLoginStatus",
          {
            device_id,
            data: { ticket },
          },
        )
        res = await res.json()

        if (res.retcode !== 0) {
          Running[this.e.user_id] = false
          return this.reply(
            [
              "二维码已过期，请重新登录",
              segment.button([
                { text: "米哈游登录", callback: "米哈游登录" },
                { text: "米游社登录", callback: "米游社登录" },
              ]),
            ],
            true,
            { recallMsg: 60 },
          )
        }

        if (res.data.status === "Scanned" && !Scanned) {
          logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(res))}`)
          Scanned = true
          this.reply(
            [
              "二维码已扫描，请确认登录",
              segment.button([{ text: "终止登录", callback: "米哈游登录终止" }]),
            ],
            true,
            { recallMsg: 60 },
          )
        }

        if (res.data.status === "Confirmed") {
          logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(res))}`)
          break
        }
      } catch (err) {
        logger.error(this.e.logFnc, err)
      }
    }
    Running[this.e.user_id] = false

    const cookie = []
    try {
      if (!(res.data?.tokens && res.data?.user_info))
        return this.reply(errorTips, true, { recallMsg: 60 })

      const uid = res.data.user_info.aid || res.data.user_info.uid || res.data.user_info.account_id,
        token = (
          res.data.tokens.find(i => i.name === "stoken" || i.name === "stoken_v2") ||
          res.data.tokens[0]
        )?.token,
        mid = res.data.user_info.mid
      if (!(uid && token && mid)) return this.reply(errorTips, true, { recallMsg: 60 })
      // v2 类型 stoken 必须携带 mid，否则换票接口无法校验
      if (String(token).startsWith("v2_") && !mid) return this.reply(errorTips, true, { recallMsg: 60 })

      cookie.push(`stoken=${token};stuid=${uid};mid=${mid}`)

      const ltRes = await exchangeToken(token, mid, 2)
      logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(ltRes))}`)
      const ltoken = ltRes?.data?.token?.token
      if (Number(ltRes?.retcode) !== 0 || !ltoken) {
        logger.error("[米哈游登录] ltoken_v2 换票失败")
        return this.reply(errorTips, true, { recallMsg: 60 })
      }

      const ctRes = await exchangeToken(token, mid, 4)
      logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(ctRes))}`)
      const cookieToken = ctRes?.data?.token?.token
      if (Number(ctRes?.retcode) !== 0 || !cookieToken) {
        logger.error("[米哈游登录] cookie_token_v2 换票失败")
        return this.reply(errorTips, true, { recallMsg: 60 })
      }

      cookie.push(
        buildMysCookie({
          uid,
          mid,
          ltoken,
          cookieToken,
        }),
      )
    } catch (err) {
      logger.error(this.e.logFnc, err)
      return this.reply(errorTips, true, { recallMsg: 60 })
    }

    for (const i of cookie) this.makeMessage(i)
    if (this.e.isPrivate)
      this.reply(
        await Bot.makeForwardArray([
          "登录完成，以下分别是 Cookie 和 Stoken，将会自动绑定",
          ...cookie,
        ]),
      )
  }

  async HyperionLogin() {
    let res, ticket
    try {
      res = await fetch(
        "https://passport-api.mihoyo.com/account/ma-cn-passport/web/createQRLogin",
        { headers: web_headers, method: "post", body: "{}" },
      )
      res = await res.json()
      logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(res))}`)

      const url = res.data.url
      ticket = res.data.ticket
      const img = segment.image(
        (await QR.toDataURL(url)).replace("data:image/png;base64,", "base64://"),
      )
      Running[this.e.user_id] = img
      this.reply(
        [
          "请使用米游社扫码登录",
          img,
          segment.button([{ text: "终止登录", callback: "米游社登录终止" }]),
        ],
        true,
        { recallMsg: 60 },
      )
    } catch (err) {
      Running[this.e.user_id] = false
      logger.error(this.e.logFnc, err)
      return this.reply(errorTips, true, { recallMsg: 60 })
    }

    let cookie, Scanned
    for (let n = 1; n < 60; n++) {
      await Bot.sleep(5000)
      if (Running[this.e.user_id] === false)
        return this.reply(
          [
            "米游社登录已终止",
            segment.button([
              { text: "米哈游登录", callback: "米哈游登录" },
              { text: "米游社登录", callback: "米游社登录" },
            ]),
          ],
          true,
          { recallMsg: 60 },
        )
      try {
        res = await fetch(
          "https://passport-api.mihoyo.com/account/ma-cn-passport/web/queryQRLoginStatus",
          { headers: web_headers, method: "post", body: JSON.stringify({ ticket }) },
        )
        cookie = res.headers.getSetCookie()
        res = await res.json()

        if (res.retcode !== 0) {
          Running[this.e.user_id] = false
          return this.reply(
            [
              "二维码已过期，请重新登录",
              segment.button([
                { text: "米哈游登录", callback: "米哈游登录" },
                { text: "米游社登录", callback: "米游社登录" },
              ]),
            ],
            true,
            { recallMsg: 60 },
          )
        }

        if (res.data.status === "Scanned" && !Scanned) {
          logger.mark(`${this.e.logFnc} ${logger.blue(JSON.stringify(res))}`)
          Scanned = true
          this.reply(
            [
              "二维码已扫描，请确认登录",
              segment.button([{ text: "终止登录", callback: "米游社登录终止" }]),
            ],
            true,
            { recallMsg: 60 },
          )
        }

        if (res.data.status === "Confirmed") {
          logger.mark(
            `${this.e.logFnc} ${logger.blue(JSON.stringify(res))} ${logger.green(JSON.stringify(cookie))}`,
          )
          break
        }
      } catch (err) {
        logger.error(this.e.logFnc, err)
      }
    }
    Running[this.e.user_id] = false

    if (!cookie?.length) return this.reply(errorTips, true, { recallMsg: 60 })

    cookie = cookie.map(i => i.split(";")[0]).join(";")
    this.makeMessage(cookie)
    if (this.e.isPrivate)
      this.reply(await Bot.makeForwardArray(["登录完成，以下是 Cookie，将会自动绑定", cookie]))
  }

  makeMessage(msg) {
    Bot.em("message.private.friend", {
      self_id: this.e.self_id,
      message_id: this.e.message_id,
      user_id: this.e.user_id,
      sender: this.e.sender,
      friend: this.e.friend,
      reply: (msg, quote, opts) => this.reply(msg, quote, { ...opts, recallMsg: 60 }),
      post_type: "message",
      message_type: "private",
      sub_type: "friend",
      message: [{ type: "text", text: msg }],
      raw_message: msg,
    })
  }

  miHoYoLoginHelp() {
    if (!config.miHoYoLogin.help) return false
    this.reply(
      [
        "优先发送【米哈游登录】\n如果无法登录发送【米游社登录】",
        segment.button([
          { text: "米哈游登录", callback: "米哈游登录" },
          { text: "米游社登录", callback: "米游社登录" },
        ]),
      ],
      true,
    )
  }
}
