import { Router } from "express";
import {
  download,
  getSharedFolder,
  requireShareAccess,
  shareRedirect,
} from "../controller.js";
import { handleRequestValidation } from "../handleValidators.js";
import { validateFileId, validateFolderId } from "../validators.js";

const shareRouter = Router();

shareRouter.get("/", shareRedirect);

shareRouter.use(
  "/folder/:folderId",
  validateFolderId,
  handleRequestValidation,
  requireShareAccess,
);
shareRouter.get("/folder/:folderId", getSharedFolder);

shareRouter.use(
  "/file/:fileId",
  validateFileId,
  handleRequestValidation,
  requireShareAccess,
);
shareRouter.get("/file/:fileId/download", download);

export { shareRouter };
