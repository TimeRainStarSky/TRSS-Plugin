logger.info("正在加载 TRSS 插件……");

import fs from "node:fs";

const files = fs
  .readdirSync("./plugins/TRSS-Plugin/apps")
  .filter((file) => file.endsWith(".js"));

let ret = [];

files.forEach((file) => {
  ret.push(import(`./apps/${file}`));
});

ret = await Promise.allSettled(ret);

let apps = {};
for (let i in files) {
  let name = files[i].replace(".js", "");

  if (ret[i].status != "fulfilled") {
    logger.error("载入插件错误：" + logger.red(name));
    logger.error(ret[i].reason);
    continue;
  }

  apps[name] = ret[i].value[name];
}

export { apps };

logger.info("TRSS 插件加载完成");
