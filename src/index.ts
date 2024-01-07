import type { IPluginConfig, PicGo } from "picgo";
import type { PostOptions, RefreshOptions, UserConfig } from "./types";
import { bedName, getConfig, uploaderName } from "./config";
import { guiMenu } from "./menu";
import { handle } from "./handler";
import { removeHandle } from "./event";

export = (ctx: PicGo) => {
  const register = () => {
    ctx.helper.uploader.register(uploaderName, {
      handle,
      name: "alist",
      config: getConfig,
    });
    ctx.on("remove", (files, guiApi) => {
      removeHandle(ctx, files, guiApi);
    });
  };
  return {
    uploader: uploaderName,
    guiMenu,
    register,
  };
};
