<div align="center">

[![亚托莉](Picture/亚托莉.png)](https://moegirl.org.cn/亚托莉)

# TRSS Yunzai Plugin
云崽机器人插件

[![Stars](https://img.shields.io/github/stars/TimeRainStarSky/TRSS-Plugin?color=yellow&label=收藏)](../../stargazers)
[![Downloads](https://img.shields.io/github/downloads/TimeRainStarSky/TRSS-Plugin/total?color=blue&label=下载)](Install.sh)
[![Releases](https://img.shields.io/github/v/release/TimeRainStarSky/TRSS-Plugin?color=green&label=发行版)](../../releases/latest)

[![访问量](https://profile-counter.glitch.me/TimeRainStarSky-TRSS-Plugin/count.svg)](https://github.com/TimeRainStarSky/TRSS-Plugin)

</div>

## 安装教程
- 推荐使用 [TRSS Yunzai 管理脚本](../../../TRSS_Yunzai) 一键安装

[![TRSS Yunzai 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Yunzai&show_owner=true)](../../../TRSS_Yunzai)

1. 准备：[Yunzai-Bot](https://github.com/Le-niao/Yunzai-Bot)

2. 安装：[GitHub](https://github.com/TimeRainStarSky/TRSS-Plugin) 或 [Gitee](https://gitee.com/TimeRainStarSky/TRSS-Plugin)
```
git clone https://gitee.com/TimeRainStarSky/TRSS-Plugin plugins/TRSS-Plugin
```
- 原神语音合成：安装 [Python 3.10](https://python.org) 和 [Poetry](https://python-poetry.org)，并执行以下操作
```
cd plugins/TRSS-Plugin
git clone https://gitee.com/TimeRainStarSky/genshin-voice
cd genshin-voice
poetry run pip install Cython -i https://pypi.mirrors.ustc.edu.cn/simple
poetry run pip install -r requirements.txt -i https://pypi.mirrors.ustc.edu.cn/simple
curl -LO http://obs.baimianxiao.cn/share/obs/sankagenkeshi/G_809000.pth
```

## 使用教程
### 原神语音合成
- 原神 `角色名` 说 `内容`
- 支持角色：派蒙、凯亚、安柏、丽莎、琴、香菱、枫原万叶、迪卢克、温迪、可莉、早柚、托马、芭芭拉、优菈、云堇、钟离、魈、凝光、雷电将军、北斗、甘雨、七七、刻晴、神里绫华、戴因斯雷布、雷泽、神里绫人、罗莎莉亚、阿贝多、八重神子、宵宫、荒泷一斗、九条裟罗、夜兰、珊瑚宫心海、五郎、散兵、女士、达达利亚、莫娜、班尼特、申鹤、行秋、烟绯、久岐忍、辛焱、砂糖、胡桃、重云、菲谢尔、诺艾尔、迪奥娜、鹿野院平藏

## 联系方式
- QQ群组：[211414032](https://jq.qq.com/?k=QU1xGLEB)
### 时雨🌌星空
- GitHub：[TimeRainStarSky](https://github.com/TimeRainStarSky)
- 酷安：[时雨丶星空](http://www.coolapk.com/u/2650948)
- QQ：[2536554304](https://qm.qq.com/cgi-bin/qm/qr?k=x8LtlP8vwZs7qLwmsbCsyLoAHy7Et1Pj)
- Telegram：[TimeRainStarSky](https://t.me/TimeRainStarSky)

## 赞助支持
- 爱发电：<https://afdian.net/a/TimeRainStarSky>
- Partme：<https://partme.com/TimeRainStarSky>

## 相关项目
[![TRSS Liteyuki 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Liteyuki&show_owner=true)](../../../TRSS_Liteyuki)
[![TRSS Yunzai 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Yunzai&show_owner=true)](../../../TRSS_Yunzai)
[![TRSS Sagiri 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Sagiri&show_owner=true)](../../../TRSS_Sagiri)
[![TRSS OneBot 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_OneBot&show_owner=true)](../../../TRSS_OneBot)