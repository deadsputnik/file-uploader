import { validationResult } from "express-validator";
import { prisma } from "./lib/prisma.js";

function handleRequestValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .render("error", { status: 400, error: "Invalid request" });
  }
  next();
}

async function handleRegistrationValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const inputData = {};
    inputData.username = req.body.username;
    console.log(errors);
    return res
      .status(400)
      .render("register", { inputData, errors: errors.array() });
  }
  next();
}

function handleSignInValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const inputUsername = req.body.username;
    return res
      .status(400)
      .render("sign-in", { inputUsername, errors: errors.array() });
  }
  next();
}

function handleFolderNameValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.flash = {
      errors: errors.array(),
      folderName: req.body.folderName,
    };
    return res.redirect(req.get("Referer") || "/");
  }
  next();
}

async function handleTokenValidation(req, res, next) {
  const token = req.params.token;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .render("error", { status: 400, error: "Invalid request" });
  }
  const shareInfo = await prisma.shareLink
    .findUnique({
      where: { token },
    })
    .catch((e) => {
      if (e.code === "P2025")
        return res
          .status(404)
          .render("error", { status: 404, error: "Share link not found" });
    });

  const now = Date.now();

  if (shareInfo.expiresAt - now < 0) {
    await prisma.shareLink.delete({
      where: { token: token },
    });

    return res
      .status(410)
      .render("error", { status: 410, error: "Share expired" });
  }
  next();
}

export {
  handleRequestValidation,
  handleRegistrationValidation,
  handleSignInValidation,
  handleFolderNameValidation,
  handleTokenValidation,
};
