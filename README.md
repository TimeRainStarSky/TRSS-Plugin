<div align="center">

[![亚托莉](Picture/亚托莉.png)](https://moegirl.org.cn/亚托莉)

# TRSS Yunzai Plugin
云崽机器人插件

[![Stars](https://img.shields.io/github/stars/TimeRainStarSky/trss-plugin?color=yellow&label=收藏)](../../stargazers)
[![Downloads](https://img.shields.io/github/downloads/TimeRainStarSky/trss-plugin/total?color=blue&label=下载)](Install.sh)
[![Releases](https://img.shields.io/github/v/release/TimeRainStarSky/trss-plugin?color=green&label=发行版)](../../releases/latest)

[![访问量](https://profile-counter.glitch.me/TimeRainStarSky-trss-plugin/count.svg)](https://github.com/TimeRainStarSky/trss-plugin)

</div>

## 安装教程
- 推荐使用脚本安装

[![TRSS Yunzai 管理脚本](https://github-readme-stats.vercel.app/api/pin/?username=TimeRainStarSky&repo=TRSS_Yunzai&show_owner=true)](../../../TRSS_Yunzai)

1. 准备：[Yunzai-Bot](https://github.com/Le-niao/Yunzai-Bot)

2. 安装：[GitHub](https://github.com/TimeRainStarSky/trss-plugin) 或 [Gitee](https://gitee.com/TimeRainStarSky/trss-plugin)
```
git clone https://gitee.com/TimeRainStarSky/trss-plugin plugins/trss-plugin
```
- 原神语音合成：安装 [Python 3.10](https://python.org) 和 [Poetry](https://python-poetry.org)，并执行以下操作
```
cd plugins/trss-plugin
git clone https://gitee.com/TimeRainStarSky/genshin-voice
cd genshin-voice
curl -LO http://obs.baimianxiao.cn/share/obs/sankagenkeshi/G_809000.pth
poetry install
cd monotonic_align
poetry run python setup.py build_ext --inplace
```

## 使用教程
### 原神语音合成
- 原神 `角色名` 说 `内容`
- 支持角色：派蒙、凯亚、安柏、丽莎、琴、香菱、枫原万叶、迪卢克、温迪、可莉、早柚、托马、芭芭拉、优菈、云堇、钟离、魈、凝光、雷电将军、北斗、甘雨、七七、刻晴、神里绫华、戴因斯雷布、雷泽、神里绫人、罗莎莉亚、阿贝多、八重神子、宵宫、荒泷一斗、九条裟罗、夜兰、珊瑚宫心海、五郎、散兵、女士、达达利亚、莫娜、班尼特、申鹤、行秋、烟绯、久岐忍、辛焱、砂糖、胡桃、重云、菲谢尔、诺艾尔、迪奥娜、鹿野院平藏