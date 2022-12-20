import { segment } from "oicq"
import { spawn } from "child_process"
import fetch from "node-fetch"
import crypto from "crypto"
import _ from "lodash"

const CN_DS_SALT = "JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS"
const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDvekdPMHN3AYhm/vktJT+YJr7cI5DcsNKqdsx5DZX0gDuWFuIjzdwButrIYPNmRJ1G8ybDIF7oDW2eEpm5sMbL9zs
9ExXCdvqrn51qELbqj0XxtMTIpaCHFSI50PfPpTFV9Xt/hmyVwokoOXFlAEgCn+Q
CgGs52bFoYMtyi+xEQIDAQAB
-----END PUBLIC KEY-----`

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
  let t = Math.floor(Date.now()/1000)
  let r = _.sampleSize("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 6).join("")
  let b = data
  let h = md5(`salt=JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS&t=${t}&r=${r}&b=${b}&q=`)
  return `${t},${r},${h}`
}

function sleep(ms) {
  return new Promise(resolve=>setTimeout(resolve, ms))
}

async function request(data, aigis) {
  return await fetch("https://passport-api.mihoyo.com/account/ma-cn-passport/app/loginByPassword", {
    method: "post",
	body: data,
    headers: {
      "x-rpc-app_version": "2.41.0",
      "DS": ds(data),
      "x-rpc-aigis": aigis,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "x-rpc-game_biz": "bbs_cn",
      "x-rpc-sys_version": "11",
      "x-rpc-device_id": "375a021233a1fef7",
      "x-rpc-device_fp": "38d7eaecf48b1",
      "x-rpc-device_name": "2698291465%E7%9A%84Redmi+Note+11+5G",
      "x-rpc-device_model": "21091116AC",
      "x-rpc-app_id": "bll8iq97cem8",
      "x-rpc-client_type": "2",
      "User-Agent": "okhttp/4.8.0",
    }
  })
}

let path = `${process.cwd()}/plugins/TRSS-Plugin/Python/main.sh`
let errorTips = "登录失败，请检查日志\nhttps://gitee.com/TimeRainStarSky/TRSS-Plugin"
let accounts = {}

export class miHoYoLogin extends plugin {
  constructor() {
    super({
      name: "米哈游登录",
      dsc: "米哈游登录",
      event: "message",
      priority: 10,
      rule: [
        {
          reg: "^米哈游登录.+",
          event: "message.private",
          fnc: "miHoYoLoginDetect"
        }
      ]
    })
  }

  async miHoYoLoginDetect(e) {
    accounts[this.e.user_id] = this.e
    this.setContext("miHoYoLogin")
    await await this.e.reply("请发送密码", true)
  }

  async crack_geetest(gt, challenge) {
    let res = await fetch(`https://s.microgg.cn/gt/https://validate.microgg.cn/?gt=${gt}&challenge=${challenge}`)
    let data = await res.json()
    logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(data))}`)
    await this.e.reply(`请完成验证：${data.shorturl}`, true)
    for (let n=1;n<60;n++) {
      await sleep(5000)
      try {
        res = await fetch(`https://validate.microgg.cn/?callback=${challenge}`)
        data = await res.json()
        if (data.geetest_validate) {
          return data
        }
      } catch (err) {
        logger.error(`[米哈游登录] 错误：${logger.red(err)}`)
      }
    }
    await this.e.reply("验证超时", true)
    return false
  }

  async miHoYoLogin(e) {
    if(!this.e.msg)return false
    this.finish("miHoYoLogin")

    let password = this.e.msg.trim()
    this.e = accounts[this.e.user_id]
    let account = this.e.msg.replace("米哈游登录", "").trim()

    let data = JSON.stringify({
      account: encrypt_data(account),
      password: encrypt_data(password)
    })

    let res = await request(data, "")
    let aigis_data = JSON.parse(res.headers.get("x-rpc-aigis"))
    res = await res.json()

    if (res.retcode == -3101) {
      logger.mark("[米哈游登录] 正在验证")
      let aigis_captcha_data = JSON.parse(aigis_data.data)
      let challenge = aigis_captcha_data.challenge
      let validate = await this.crack_geetest(aigis_captcha_data.gt, challenge)
      if (validate.geetest_validate) {
        logger.mark("[米哈游登录] 验证成功")
      } else {
        logger.error("[米哈游登录] 验证失败")
        return false
      }

      let aigis = aigis_data.session_id + ";" + Buffer.from(JSON.stringify({
        geetest_challenge: challenge,
        geetest_seccode: validate.geetest_validate + "|jordan",
        geetest_validate: validate.geetest_validate,
      })).toString("base64")

      res = await request(data, aigis)
      res = await res.json()
    }

    if (res.retcode == 0) {
      logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(res))}`)
      let cookie = await fetch(`https://api-takumi.mihoyo.com/auth/api/getCookieAccountInfoBySToken?stoken=${res.data.token.token}&mid=${res.data.user_info.mid}`)
      cookie = await cookie.json()
      logger.mark(`[米哈游登录] ${logger.blue(JSON.stringify(cookie))}`)
      await this.e.reply(`ltoken=${res.data.token.token};ltuid=${res.data.user_info.aid};cookie_token=${cookie.data.cookie_token};login_ticket=${res.data.login_ticket}`, true)
      await this.e.reply("登录完成，回复 Cookie 绑定", true)
    } else {
      logger.error(`[米哈游登录] 错误：${logger.red(JSON.stringify(res))}`)
      await this.e.reply(`错误：${JSON.stringify(res)}`, true)
      return false
    }
  }
}