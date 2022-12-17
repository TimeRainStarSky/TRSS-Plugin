<div align="center">

[![亚托莉](Picture/亚托莉.png)](https://moegirl.org.cn/亚托莉)

# TRSS Yunzai Plugin

云崽机器人插件

[![访问量](https://visitor-badge.glitch.me/badge?page_id=TimeRainStarSky.TRSS-Plugin&right_color=red&left_text=访%20问%20量)](https://github.com/TimeRainStarSky/TRSS-Plugin)
[![Stars](https://img.shields.io/github/stars/TimeRainStarSky/TRSS-Plugin?color=yellow&label=收藏)](../../stargazers)
[![Downloads](https://img.shields.io/github/downloads/TimeRainStarSky/TRSS-Plugin/total?color=blue&label=下载)](Install.sh)
[![Releases](https://img.shields.io/github/v/release/TimeRainStarSky/TRSS-Plugin?color=green&label=发行版)](../../releases/latest)

[![访问量](https://profile-counter.glitch.me/TimeRainStarSky-TRSS-Plugin/count.svg)](https://github.com/TimeRainStarSky/TRSS-Plugin)

</div>

## 安装教程

- 推荐使用 [TRSS Yunzai 管理脚本](../../../TRSS_Yunzai) 安装

[![TRSS Yunzai 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Yunzai&show_owner=true)](../../../TRSS_Yunzai)

1. 准备：[Yunzai-Bot](https://github.com/Le-niao/Yunzai-Bot)

2. 安装：[GitHub](https://github.com/TimeRainStarSky/TRSS-Plugin) 或 [Gitee](https://gitee.com/TimeRainStarSky/TRSS-Plugin)

```
git clone --depth=1 https://gitee.com/TimeRainStarSky/TRSS-Plugin plugins/TRSS-Plugin
pnpm i
```

3. 安装 [Python 3.10](https://python.org) 和 [Poetry](https://python-poetry.org)，并在插件目录执行以下操作

```
poetry install
```

- 图片修复：

```
git clone --depth=1 https://gitee.com/TimeRainStarSky/Real-ESRGAN
cd Real-ESRGAN
poetry run python setup.py develop
```

<details><summary>部署为 API 服务器</summary>

```
poetry run python inference_realesrgan_server.py [端口]
```

</details>

- 原神语音合成：

```
git clone --depth=1 https://gitee.com/TimeRainStarSky/GenshinVoice
cd GenshinVoice
poetry run pip install monotonic-align
curl -LO https://github.com/TimeRainStarSky/TRSS-Plugin/releases/download/latest/G_809000.pth.xz
xz -dv G_809000.pth.xz
```

<details><summary>部署为 API 服务器</summary>

```
poetry run python server.py [端口]
```

</details>

- 阿里云盘 / 百度网盘：

使用脚本安装后，启动 CLI，输入 `login -h`，按提示登录

## 使用教程

### 图片修复

<details><summary>展开</summary>

- 图片修复 / 动漫图片修复 + `图片`

</details>

### 原神语音合成

<details><summary>展开</summary>

- `角色名` + (转码)?说 + `中文`
- 支持角色：派蒙、凯亚、安柏、丽莎、琴、香菱、枫原万叶、迪卢克、温迪、可莉、早柚、托马、芭芭拉、优菈、云堇、钟离、魈、凝光、雷电将军、北斗、甘雨、七七、刻晴、神里绫华、戴因斯雷布、雷泽、神里绫人、罗莎莉亚、阿贝多、八重神子、宵宫、荒泷一斗、九条裟罗、夜兰、珊瑚宫心海、五郎、散兵、女士、达达利亚、莫娜、班尼特、申鹤、行秋、烟绯、久岐忍、辛焱、砂糖、胡桃、重云、菲谢尔、诺艾尔、迪奥娜、鹿野院平藏

</details>

### 系统信息

<details><summary>展开</summary>

- 系统信息 / 系统信息图片 / 系统测试

</details>

### Markdown（权限：主人）

<details><summary>展开</summary>

- md + `文件` / `URL`

</details>

### 远程命令（权限：主人）

<details><summary>展开</summary>

- rc / rcp + `命令`

</details>

### 文件操作（权限：主人）

<details><summary>展开</summary>

- 文件查看 / 文件上传 / 文件下载 + `路径`

</details>

### 阿里云盘（权限：主人）

<details><summary>展开</summary>

阿里云盘 +

- 帮助
- 上传
- 下载
- 相簿
- 链接
- 查看
- 创建目录
- 移动
- 回收站
- 重命名
- 删除
- 分享
- 同步备份
- 树形图
- 在线网盘
- 切换网盘
- 登录账号
- 账号列表
- 退出账号
- 空间配额
- 切换账号
- 当前账号

</details>

### 百度网盘（权限：主人）

<details><summary>展开</summary>

百度网盘 +

- 帮助
- 上传
- 下载
- 复制
- 链接
- 查看
- 元信息
- 创建目录
- 移动
- 离线下载
- 空间配额
- 回收站
- 删除
- 搜索
- 分享
- 转存
- 树形图
- 登录账号
- 账号列表
- 退出账号
- 切换账号
- 当前账号

</details>

## 常见问题

<details><summary>展开</summary>

- 问：`ModuleNotFoundError: No module named 'torch/cv2'`
- 答：未正确执行 `poetry install`

- 问：使用 `Git Bash` 执行 `poetry install` 失败
- 答：改用 `命令提示符` 或 `Windows PowerShell`

- 问：`error: Microsoft Visual C++ 14.0 or greater is required.`
- 答：下载安装 [Microsoft C++ 生成工具](https://visualstudio.microsoft.com/zh-hans/visual-cpp-build-tools)
![Microsoft C++ 生成工具](Picture/Microsoft_C++_生成工具.png)

- 问：`'sh' 不是内部或外部命令，也不是可运行的程序或批处理文件` `sh : 无法将“sh”项识别为 cmdlet、函数、脚本文件或可运行程序的名称。请检查名称的拼写，如果包括路径，请确保路径正确，然后再试一次。`
- 答：改用 `Git Bash`

- 问：手动安装过程中出现问题
- 答：建议自行解决，不会就用脚本一键安装

- 问：我有其他问题
- 答：提供详细问题描述，通过下方 联系方式 反馈问题

</details>

## 联系方式

- QQ 群组：[211414032](https://jq.qq.com/?k=QU1xGLEB)

### 时雨 🌌 星空

- GitHub：[TimeRainStarSky](https://github.com/TimeRainStarSky)
- 酷安：[时雨丶星空](http://www.coolapk.com/u/2650948)
- QQ：[2536554304](https://qm.qq.com/cgi-bin/qm/qr?k=x8LtlP8vwZs7qLwmsbCsyLoAHy7Et1Pj)
- Telegram：[TimeRainStarSky](https://t.me/TimeRainStarSky)

## 赞助支持

- 爱发电：<https://afdian.net/a/TimeRainStarSky>
- Partme：<https://partme.com/TimeRainStarSky>

## 相关项目

[![TRSS OneBot 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_OneBot&show_owner=true)](../../../TRSS_OneBot)
[![TRSS Liteyuki 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Liteyuki&show_owner=true)](../../../TRSS_Liteyuki)
[![TRSS Yunzai 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Yunzai&show_owner=true)](../../../TRSS_Yunzai)
[![TRSS Sagiri 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Sagiri&show_owner=true)](../../../TRSS_Sagiri)
[![TRSS Amiya 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Amiya&show_owner=true)](../../../TRSS_Amiya)
[![TRSS Zhenxun 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Zhenxun&show_owner=true)](../../../TRSS_Zhenxun)
