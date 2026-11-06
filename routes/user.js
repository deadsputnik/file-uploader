import { Router } from "express";
import {
  requireAuth,
  getAddFile,
  uploadFile,
  getFolder,
  download,
  deleteFile,
  createFolder,
  deleteFolder,
  getShareFolder,
  shareFolder,
  requireItemOwner,
  stopSharingFolder,
  rejectRootFolder,
} from "../controller.js";
import {
  handleRequestValidation,
  handleFolderNameValidation,
} from "../handleValidators.js";
import {
  validateFileId,
  validateFolderId,
  validateFolderName,
  validateShareTime,
  validateDeleteToken,
} from "../validators.js";
import multer from "multer";
const upload = multer({ dest: "../filestore/" });

const userRouter = Router();

// USER PATHS
userRouter.use("/", requireAuth);

// USER FOLDER
userRouter.use(
  "/folder/:folderId",
  validateFolderId,
  handleRequestValidation,
  requireItemOwner,
);
userRouter.post(
  "/folder/:folderId/create-new-folder",
  validateFolderName,
  handleFolderNameValidation,
  createFolder,
);
userRouter.get("/folder/:folderId", getFolder);
userRouter.get("/folder/:folderId/upload", getAddFile);
userRouter.get("/folder/:folderId/share", rejectRootFolder, getShareFolder);

userRouter.post(
  "/folder/:folderId/share",
  validateShareTime,
  handleRequestValidation,
  rejectRootFolder,
  shareFolder,
);
userRouter.post(
  "/folder/:folderId/stopShare",
  validateDeleteToken,
  handleRequestValidation,
  rejectRootFolder,
  stopSharingFolder,
);
userRouter.post(
  "/folder/:folderId/upload",
  upload.array("uploaded_file"),
  uploadFile,
);
userRouter.post("/folder/:folderId/delete", rejectRootFolder, deleteFolder);
// USER FILE
userRouter.use(
  "/file/:fileId",
  validateFileId,
  handleRequestValidation,
  requireItemOwner,
);
userRouter.get("/file/:fileId/download", download);

userRouter.post("/file/:fileId/delete", deleteFile);

export { userRouter };
