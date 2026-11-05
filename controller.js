import { matchedData } from "express-validator";
import { prisma } from "./lib/prisma.js";
import bcrypt from "bcryptjs";
import passport from "passport";
import { unlink } from "node:fs/promises";

function errorHandler(error, req, res, next) {
  console.log("ERROR HANDLER");
  if (res.headersSent) {
    return next(error);
  }
  console.log(error);
  res.status(500).render("./error.ejs", { status: 500, error: "Server error" });
}

function requireAuth(req, res, next) {
  req.user ? next() : res.redirect("/login");
}

async function isFolderOwner(folderId, userId) {
  const count = await prisma.folder.count({
    where: { id: folderId, ownerId: userId },
  });
  return count > 0;
}

async function isFileOwner(fileId, userId) {
  const count = await prisma.file.count({
    where: { id: fileId, ownerId: userId },
  });
  return count > 0;
}

async function requireItemOwner(req, res, next) {
  const { folderId, fileId } = matchedData(req);
  if (folderId === 0) return next();
  const [label, isOwner, id] = folderId
    ? ["Folder", isFolderOwner, folderId]
    : ["File", isFileOwner, fileId];

  if (!(await isOwner(id, req.user.id)))
    return res.status(404).render("error", {
      status: 404,
      error: `${label} Not Found`,
    });
  next();
}

function getHomepage(req, res) {
  res.render("homepage");
}

function getAddFile(req, res) {
  const { folderId } = matchedData(req);
  res.render("addFile", { folderId });
}

function getRegister(req, res) {
  res.render("register");
}

function getLogin(req, res) {
  res.render("sign-in");
}

async function registerAccount(req, res, next) {
  const { username, password } = matchedData(req);
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        username: username,
        passwordHash: hashedPassword,
      },
    });

    res.redirect("/");
  } catch (error) {
    if (error.code === "P2002") {
      const inputData = {};
      inputData.username = req.body.username;
      return res.status(400).render("register", {
        inputData,
        errors: [{ msg: "Username already exists" }],
      });
    }
    next(error);
  }
}

async function uploadFile(req, res) {
  const { folderId } = matchedData(req);
  const files = req.files;

  await prisma.file.createMany({
    data: files.map((file) => ({
      name: file.originalname,
      ownerId: req.user.id,
      link: file.path,
      size: file.size,
      folderId: folderId || null,
    })),
  });
  res.redirect(`/user/folder/${folderId}`);
}

const signInUser = [
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureMessage: true,
  }),
];

function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
}

async function download(req, res, next) {
  const { fileId } = matchedData(req);
  const fileInfo = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!fileInfo) {
    return res
      .status(404)
      .render("error", { status: 404, error: "File not found" });
  }

  const path = fileInfo.link;
  const filename = fileInfo.name;
  console.log("downloading: " + filename);
  res.download(path, filename);
}

async function deleteFile(req, res, next) {
  const { fileId } = matchedData(req);
  const file = await prisma.file.delete({
    where: { id: fileId, ownerId: req.user.id },
  });

  await unlink(file.link).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });

  res.redirect(`/user/folder/${file.folderId || "0"}`);
}

async function getSharedFolderList(userId) {
  const response = await prisma.shareLink.findMany({
    where: {
      folder: {
        ownerId: userId,
      },
    },
    select: { childrenIds: true, folderId: true },
  });
  const idList = response.flatMap((entry) => entry.childrenIds);
  const sharedFolderIds = [...new Set(idList)];

  const rootList = response.flatMap((entry) => entry.folderId);
  const rootIds = [...new Set(rootList)];

  return { sharedFolderIds, rootIds };
}

async function getFolder(req, res, next) {
  const { folderId } = matchedData(req);

  const folderInfo =
    folderId !== 0
      ? await prisma.folder.findUnique({
          where: { id: folderId },
        })
      : { name: "root", id: 0 };

  const folders = await prisma.folder.findMany({
    where: { ownerId: req.user.id, parentId: folderId || null },
  });

  const files = await prisma.file.findMany({
    where: { ownerId: req.user.id, folderId: folderId || null },
  });

  const { sharedFolderIds, rootIds } = await getSharedFolderList(req.user.id);

  const flash = req.session.flash;
  delete req.session.flash;

  res.render("files", {
    folders,
    files,
    flash,
    folderInfo,
    sharedFolderIds,
    rootIds,
  });
}

async function createFolder(req, res, next) {
  const { folderId, folderName } = matchedData(req);
  const newFolder = await prisma.folder.create({
    data: {
      name: folderName,
      ownerId: req.user.id,
      parentId: folderId || null,
    },
  });

  // check if parent in share > update share childrenIds
  const shares = await prisma.shareLink.findMany({
    where: { childrenIds: { has: newFolder.parentId } },
  });

  for (const share of shares) {
    const childrenIds = await getDescendantIds(share.folderId);
    await prisma.shareLink.update({
      where: { id: share.id },
      data: { childrenIds },
    });
  }

  res.redirect(`/user/folder/${newFolder.parentId || 0}`);
}

async function getDescendantIds(folderId) {
  const ids = [folderId];
  let current = [folderId];

  while (current.length > 0) {
    const children = await prisma.folder.findMany({
      where: { parentId: { in: current } },
      select: { id: true },
    });
    current = children.map((c) => c.id);
    ids.push(...current);
  }
  return ids;
}

async function deleteFolder(req, res, next) {
  const { folderId } = matchedData(req);
  const folderIds = await getDescendantIds(folderId);

  const fileList = await prisma.file.findMany({
    where: { folderId: { in: folderIds } },
    select: { link: true },
  });

  const result = await prisma.folder.delete({
    where: { id: folderId },
  });

  await Promise.all(
    fileList.map((file) =>
      unlink(file.link).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      }),
    ),
  );

  res.redirect(`/user/folder/${result.parentId || 0}`);
}

async function getShareFolder(req, res, next) {
  const { folderId } = matchedData(req);
  const folderInfo = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  const shared = await prisma.shareLink.findFirst({
    where: { folderId },
  });

  const link = shared
    ? shared.token
    : res.render("shareFolder", { folderInfo, link });
}

async function shareFolder(req, res, next) {
  const { folderId, shareDuration } = matchedData(req);
  const folderInfo = await prisma.folder.findUnique({
    where: { id: folderId },
  });
  const shareForMs = shareDuration * 60 * 1000;
  const expiresAt = new Date(Date.now() + shareForMs);
  const childIds = await getDescendantIds(folderId);
  const response = await prisma.shareLink.create({
    data: {
      expiresAt: expiresAt,
      folderId: folderId,
      childrenIds: childIds,
    },
  });
  res.render("shareFolder", { folderInfo, link: response.token });
}

async function stopSharingFolder(req, res, next) {
  const { folderId, token } = matchedData(req);
  const folderInfo = await removeShare(token, folderId);
  res.redirect(`/user/folder/${folderInfo.parentId ?? 0}`);
}

async function removeShare(token, folderId) {
  const share = await prisma.shareLink.delete({
    where: { token, folderId: folderId },
    include: { folder: true },
  });
  return share.folder;
}

async function requireShareAccess(req, res, next) {
  const { token, folderId, fileId } = matchedData(req);
  const shareInfo = await prisma.shareLink.findUnique({
    where: { token },
  });

  if (fileId) {
    const fileInfo = await prisma.file.findUnique({
      where: { id: fileId },
    });
    if (!fileInfo || !shareInfo.childrenIds.includes(fileInfo.folderId)) {
      console.log("Unauthorised access blocked file:", fileInfo.name);
      return res
        .status(404)
        .render("error", { status: 404, error: "File not found" });
    }
  }

  if (folderId) {
    const folderInfo = await prisma.folder.findUnique({
      where: { id: folderId },
    });
    if (!folderInfo || !shareInfo.childrenIds.includes(folderInfo.id)) {
      console.log("Unauthorised access blocked. Folder:", folderInfo.name);
      return res
        .status(404)
        .render("error", { status: 404, error: "Folder not found" });
    }
  }

  next();
}

async function shareRedirect(req, res, next) {
  const { token } = matchedData(req);
  const shareInfo = await prisma.shareLink.findUnique({
    where: { token: token },
  });

  if (!shareInfo) {
    return res
      .status(404)
      .render("error", { status: 404, error: "Share not found" });
  }

  res.redirect(`/share/${token}/folder/${shareInfo.folderId}`);
}

async function getSharedFolder(req, res, next) {
  const { token, folderId } = matchedData(req);
  const shareInfo = await prisma.shareLink.findUnique({
    where: { token },
  });

  const folderIsRoot = shareInfo.folderId == folderId;

  const currFolder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  const folders = await prisma.folder.findMany({
    where: { parentId: currFolder.id },
  });

  const files = await prisma.file.findMany({
    where: { folderId: currFolder.id },
  });

  res.render("sharedFiles", {
    folders,
    files,
    currFolder,
    folderIsRoot,
    token,
  });
}

export {
  errorHandler,
  requireAuth,
  requireItemOwner,
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
  stopSharingFolder,
  requireShareAccess,
  getSharedFolder,
  shareRedirect,
};
