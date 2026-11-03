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

// pages non auth
router.get("/", getHomepage);
router.get("/register", getRegister);
router.get("/login", getLogin);

// pages auth
router.get(
  "/user/folder/:folderId/upload",
  requireAuth,
  validateFolderId,
  handleRequestValidation,
  requireItemOwner,
  getAddFile,
);

router.get(
  "/user/file/:fileId/download",
  requireAuth,
  validateFileId,
  handleRequestValidation,
  requireItemOwner,
  download,
);

router.get(
  "/user/folder/:folderId",
  requireAuth,
  validateFolderId,
  handleRequestValidation,
  requireItemOwner,
  getFolder,
);

router.get(
  "/user/folder/:folderId/share",
  requireAuth,
  validateFolderId,
  handleRequestValidation,
  requireItemOwner,
  getShareFolder,
);

// file sharing access
router.get(
  "/share/:token/",
  validateToken,
  handleTokenValidation,
  shareRedirect,
);

router.get(
  "/share/:token/folder/:folderId",
  validateToken,
  handleTokenValidation,
  validateFolderId,
  handleRequestValidation,
  requireShareAccess,
  getSharedFolder,
);

router.get(
  "/share/:token/file/:fileId/download",
  validateToken,
  handleTokenValidation,
  validateFileId,
  handleRequestValidation,
  requireShareAccess,
  download,
);

// POST USER FLOW
router.post(
  "/register",
  validateRegistration,
  handleRegistrationValidation,
  registerAccount,
);

router.post("/login", validateSignIn, handleSignInValidation, signInUser);
router.post("/logout", requireAuth, logout);

// POST AUTH FILE
router.post(
  "/user/folder/:folderId/upload",
  requireAuth,
  validateFolderId,
  handleRequestValidation,
  requireItemOwner,
  upload.array("uploaded_file"),
  uploadFile,
);

router.post(
  "/user/file/:fileId/delete",
  requireAuth,
  validateFileId,
  handleRequestValidation,
  requireItemOwner,
  deleteFile,
);

// POST AUTH FOLDER
//  need to create /user/folder/:folderId/new-folder
router.post(
  "/user/folder/:folderId/create-new-folder",
  requireAuth,
  validateFolderId,
  handleRequestValidation,
  validateFolderName,
  handleFolderNameValidation,
  requireItemOwner,
  createFolder,
);

router.post(
  "/user/folder/:folderId/delete",
  requireAuth,
  validateFolderId,
  handleRequestValidation,
  requireItemOwner,
  deleteFolder,
);

router.post(
  "/user/folder/:folderId/share",
  requireAuth,
  validateFolderId,
  validateShareTime,
  handleRequestValidation,
  requireItemOwner,
  shareFolder,
);

router.post(
  "/user/folder/:folderId/stopShare",
  requireAuth,
  validateFolderId,
  validateDeleteToken,
  handleRequestValidation,
  requireItemOwner,
  stopSharingFolder,
);

export { router };
