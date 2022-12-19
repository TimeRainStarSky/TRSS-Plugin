import sys
import base64
from hashlib import md5
from json import dumps
import json
from random import choices
from string import ascii_letters
from time import time, sleep
from typing import Any, Mapping, Optional
import requests
from Crypto.PublicKey import RSA
from Crypto.Hash import SHA
from Crypto.Cipher import PKCS1_v1_5 as PKCS1_cipher

CN_DS_SALT = "JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS"
RSA_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDvekdPMHN3AYhm/vktJT+YJr7cI5DcsNKqdsx5DZX0gDuWFuIjzdwButrIYPNmRJ1G8ybDIF7oDW2eEpm5sMbL9zs
9ExXCdvqrn51qELbqj0XxtMTIpaCHFSI50PfPpTFV9Xt/hmyVwokoOXFlAEgCn+Q
CgGs52bFoYMtyi+xEQIDAQAB
-----END PUBLIC KEY-----
"""

def get_key():
  key = RSA.importKey(RSA_PUBLIC_KEY)
  return key

def encrypt_data(msg: str) -> str:
  public_key = get_key()
  cipher = PKCS1_cipher.new(public_key)
  encrypt_text = base64.b64encode(cipher.encrypt(bytes(msg.encode("utf8"))))
  return encrypt_text.decode('utf-8')

def _md5(self) -> str:
  return md5(self.encode()).hexdigest()

def ds(body: Any = None, query: Optional[Mapping[str, Any]] = None) -> str:
  t = int(time())
  r = "".join(choices(ascii_letters, k=6))
  b = dumps(body) if body else ""
  q = "&".join(f"{k}={v}" for k, v in sorted(query.items())) if query else ""
  h = _md5(f"salt={CN_DS_SALT}&t={t}&r={r}&b={b}&q={q}")
  return f"{t},{r},{h}"

def crack_geetest(gt,challenge):
  data=requests.get(f"https://s.microgg.cn/gt/https://validate.microgg.cn/?gt={gt}&challenge={challenge}",timeout=60).json()
  print(data["shorturl"], file=sys.stderr)
  n = 0
  while n < 60:
    sleep(5)
    try:
      data=requests.get(f"https://validate.microgg.cn/?callback={challenge}",timeout=60).json()
      if data["geetest_validate"]:
        return data
    except Exception as e:
      print(f"错误：{e}")
    n += 1
    print(f"重试：{n}")
  print("验证超时")

def main():
  def _request(aigis: str = ""):
    resp = requests.post(
      "https://passport-api.mihoyo.com/account/ma-cn-passport/app/loginByPassword",
      headers={
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
      },
      json=data,
      proxies={
        "http": None,
        "https": None,
      }
    )
    return resp

  account = encrypt_data(sys.argv[1])
  password = encrypt_data(sys.argv[2])
  data = {"account": account, "password": password}
  resp = _request()
  resp_data = resp.json()
  if resp_data["retcode"] == -3101:
    try:
      print("正在通过验证")
      aigis_data = json.loads(resp.headers["x-rpc-aigis"])
      aigis_captcha_data = json.loads(aigis_data["data"])
      challenge = aigis_captcha_data["challenge"]
      data_validate = crack_geetest(aigis_captcha_data["gt"], challenge)
      if data_validate["geetest_validate"]:
        print("验证成功")
        validate=data_validate["geetest_validate"]
        seccode=data_validate["geetest_validate"]+"|jordan"
    except:
      print("验证失败")
      exit(1)
    aigis = aigis_data["session_id"] + ";" + base64.b64encode(
      json.dumps(
        {
          "geetest_challenge": challenge,
          "geetest_seccode": seccode,
          "geetest_validate": validate,
        }
      ).replace(" ", "").encode()
    ).decode()
    resp = _request(aigis)
    resp_data = resp.json()
  if resp_data["retcode"] != 0:
    print(f"错误：{resp_data}", file=sys.stderr)
    exit(1)
  else:
    print(resp_data["data"])
    cookietoken=requests.get(f"https://api-takumi.mihoyo.com/auth/api/getCookieAccountInfoBySToken?stoken={resp_data['data']['token']['token']}&mid={resp_data['data']['user_info']['mid']}",headers={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36"},proxies={"http": None,"https": None}).json()
    print(cookietoken)
    print(f"ltoken={resp_data['data']['token']['token']};ltuid={resp_data['data']['user_info']['aid']};cookie_token={cookietoken['data']['cookie_token']};login_ticket={resp_data['data']['login_ticket']}", file=sys.stderr)

if __name__ == "__main__":
  main()