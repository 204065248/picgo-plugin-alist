import type { UserConfig } from "./types";
import { removeServerImg } from "./option";
import { bedName } from "./config";

export const removeHandle = async (ctx, files, guiApi) => {
  const res = await guiApi.showMessageBox({
    title: "提示",
    message: "是否删除alist远端真实数据？",
    type: "info",
    buttons: ["是", "否"],
  });
  if (res.result !== 0) {
    return;
  }
  guiApi.showNotification({
    title: "提示",
    body: "开始同步删除alist数据",
  });
  const userConfig: UserConfig = ctx.getConfig(bedName);
  if (!userConfig) {
    ctx.log.error("找不到UserConfig");
    throw new Error("找不到UserConfig");
  }
  let { url, token } = userConfig;
  files.forEach(async (file) => {
    const options = removeServerImg({
      url,
      token,
      filenames: [file.fileName],
      dir: file.dir,
    });
    const res = await ctx.request(options);
    if (res.code !== Number(200)) {
      ctx.log.error(`[同步删除出错]${res}`);
      throw new Error(`[同步删除出错]${res}`);
    }

    guiApi.showNotification({
      title: "提示",
      body: "同步删除alist数据成功",
    });
    ctx.log.info(`[同步删除结果] res:${JSON.stringify(res)}`);
  });
  // https://pan.pigeoooon.cool/d/Alist图床/blog/2024/01/07/02-39-13-664-cd1a6afc1420f43c97c0fa668eec9b09.png
};
