import type { PicGo } from "picgo";
import { getRefreshOptions } from "./option";
import type { UserConfig } from "./types";
import { bedName } from "./config";
import { rmBothEndSlashes, rmEndSlashes } from "./utils/index";

// 异步获取alist文件列表
async function getAlistFileData(
  ctx: PicGo,
  guiApi,
  data: any[],
  refreshOptions: any
) {
  if (data === null) {
    return [];
  }
  let files = [];
  for (const item of data) {
    if (item.is_dir) {
      let newUploadPath = `${refreshOptions.uploadPath}/${item.name}`;
      if (item?.is_first) {
        newUploadPath = refreshOptions.uploadPath;
      }
      const newOptions = {
        ...refreshOptions,
        uploadPath: newUploadPath,
      };
      const options = getRefreshOptions(newOptions);
      const res = await ctx.request(options);
      if (res.code !== Number(200)) {
        ctx.log.error(`[刷新请求出错]${res}`);
        throw new Error(`[刷新请求出错]${res}`);
      }
      const subFiles = await getAlistFileData(
        ctx,
        guiApi,
        res.data.content,
        newOptions
      );
      files.push(...subFiles);
    } else {
      files.push({ ...item, dir: refreshOptions.uploadPath });
    }
  }
  return files;
}

export const guiMenu = (ctx: PicGo) => {
  return [
    {
      label: "同步服务器图片",
      handle: async (ctx: PicGo, guiApi) => {
        guiApi.showNotification({
          title: "提示",
          body: "开始同步alist数据",
        });
        const userConfig: UserConfig = ctx.getConfig(bedName);
        if (!userConfig) {
          ctx.log.error("找不到UserConfig");
          throw new Error("找不到UserConfig");
        }
        let { url, uploadPath, accessPath, version } = userConfig;
        const { token } = userConfig;
        uploadPath = rmBothEndSlashes(uploadPath);
        if (!accessPath) accessPath = uploadPath;
        else accessPath = rmBothEndSlashes(accessPath);
        url = rmEndSlashes(url);
        version = Number(version);
        try {
          const files = await getAlistFileData(
            ctx,
            guiApi,
            [{ name: uploadPath, is_dir: true, is_first: true }],
            {
              url,
              uploadPath,
              version,
              token,
            }
          );
          let repeatCount = 0;
          const oldFiles = await guiApi.galleryDB.get();
          const insertFiles = files
            .filter((file) => {
              const duplicateFile = oldFiles?.data.find(
                (item) => item.imgUrl === `${url}/d/${file.dir}/${file.name}`
              );
              if (duplicateFile) {
                repeatCount++;
                return false;
              }
              return true;
            })
            .map((file) => ({
              fileName: file.name,
              extname: `.${file.name.split(".").pop()}`,
              imgUrl: `${url}/d/${file.dir}/${file.name}`,
              type: "alist",
              dir: file.dir,
            }));
          guiApi.galleryDB.insertMany(insertFiles);
          ctx.log.info(
            `[同步alist数据] 重复项: ${repeatCount}`
          );
          ctx.log.info(`[新插入内容] files size:${insertFiles.length}`);
          // 判断oldFiles中有，但是files中没有的，删除
          const delFiles = oldFiles?.data.filter(
            (item) => !files.some((file) => `${url}/d/${file.dir}/${file.name}` === item.imgUrl)
          );
          ctx.log.info(`[删除内容] files size:${delFiles?.length}`);
          if (delFiles?.length) {
            const res = await guiApi.showMessageBox({
              title: "提示",
              message: "alist云端图片不存在，是否彻底删除本地记录",
              type: "info",
              buttons: ["是", "否"],
            });
            if (res.result === 0) {
              delFiles?.forEach((item) => {
                guiApi.galleryDB.removeById(item.id);
              });
            }
          }
          guiApi.showNotification({
            title: "提示",
            body: "同步alist数据完成",
          });
        } catch (err) {
          ctx.log.error(`[同步服务器操作]异常：${err.message}`);
          throw new Error(`[同步服务器操作]异常：${err.message}`);
        }
      },
    },
  ];
};
