import { Router } from "express";
import {
  requireAuth,
  getHomepage,
  getAddFile,
  getRegister,
  getLogin,
  registerAccount,
  signInUser,
  logout,
  uploadFile,
  getFolder,
  download,
  deleteFile,
  createFolder,
  deleteFolder,
  getShareFolder,
  shareFolder,
  getSharedFolder,
  requireShareAccess,
  shareRedirect,
  requireItemOwner,
  stopSharingFolder,
  rejectRootFolder,
} from "./controller.js";
import {
  handleRegistrationValidation,
  handleSignInValidation,
  handleRequestValidation,
  handleFolderNameValidation,
  handleTokenValidation,
} from "./handleValidators.js";
import {
  validateRegistration,
  validateSignIn,
  validateFileId,
  validateFolderId,
  validateFolderName,
  validateShareTime,
  validateToken,
  validateDeleteToken,
} from "./validators.js";
import multer from "multer";
const upload = multer({ dest: "./filestore/" });

const router = Router();
router.get("/", getHomepage);

// USER ACC ACTIONS
router.get("/register", getRegister);
router.get("/login", getLogin);

router.post(
  "/register",
  validateRegistration,
  handleRegistrationValidation,
  registerAccount,
);
router.post("/login", validateSignIn, handleSignInValidation, signInUser);
router.post("/logout", requireAuth, logout);

// USER PATHS
router.use("/user/", requireAuth);

// USER FOLDER
router.use(
  "/user/folder/:folderId",
  validateFolderId,
  handleRequestValidation,
  requireItemOwner,
);
router.post(
  "/user/folder/:folderId/create-new-folder",
  validateFolderName,
  handleFolderNameValidation,
  createFolder,
);
router.get("/user/folder/:folderId", getFolder);
router.get("/user/folder/:folderId/upload", getAddFile);
router.get("/user/folder/:folderId/share", rejectRootFolder, getShareFolder);

router.post(
  "/user/folder/:folderId/share",
  validateShareTime,
  handleRequestValidation,
  rejectRootFolder,
  shareFolder,
);
router.post(
  "/user/folder/:folderId/stopShare",
  validateDeleteToken,
  handleRequestValidation,
  rejectRootFolder,
  stopSharingFolder,
);
router.post(
  "/user/folder/:folderId/upload",
  upload.array("uploaded_file"),
  uploadFile,
);
router.post("/user/folder/:folderId/delete", rejectRootFolder, deleteFolder);
// USER FILE
router.use(
  "/user/file/:fileId",
  validateFileId,
  handleRequestValidation,
  requireItemOwner,
);
router.get("/user/file/:fileId/download", download);

router.post("/user/file/:fileId/delete", deleteFile);

// SHARED FILES
router.use("/share/:token/", validateToken, handleTokenValidation);
router.get("/share/:token/", shareRedirect);

router.use(
  "/share/:token/folder/:folderId",
  validateFolderId,
  handleRequestValidation,
  requireShareAccess,
);
router.get("/share/:token/folder/:folderId", getSharedFolder);

router.use(
  "/share/:token/file/:fileId",
  validateFileId,
  handleRequestValidation,
  requireShareAccess,
);
router.get("/share/:token/file/:fileId/download", download);

export { router };
