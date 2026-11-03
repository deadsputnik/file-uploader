import { body, param } from "express-validator";
import { prisma } from "./lib/prisma.js";

const validateRegistration = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isAlphanumeric()
    .withMessage("Username must only contain letters and numbers")
    .custom(async (value) => {
      const exists = await prisma.user.findUnique({
        where: { username: value },
        select: { id: true },
      });
      if (exists) throw new Error("Username already taken");
    }),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isStrongPassword({
      minUppercase: 0,
      minLowercase: 0,
      minLength: 8,
      maxLength: 72,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 8 characters long and contain a number and a special character",
    )
    .custom((value, { req }) => value === req.body.confirmPassword)
    .withMessage("Passwords do not match."),
];

const validateSignIn = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isAlphanumeric()
    .withMessage("Are you sure your username is correct?"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ max: 72 })
    .withMessage("Max password length 72 characters"),
];

const validateFileId = [param("fileId").trim().isInt({ min: 1 }).toInt()];
const validateFolderId = [param("folderId").trim().isInt({ min: 0 }).toInt()];

const validateFolderName = [
  body("folderName")
    .notEmpty()
    .withMessage("Folder name is required")
    .isAlphanumeric("en-GB", { ignore: "-_ " })
    .withMessage(
      "Folder name must only contain letters, numbers, dashes, underscores, and spaces",
    )
    .isLength({ max: 70 })
    .withMessage("Folder name must be 70 characters or shorter"),
];

const validateShareTime = [
  body("shareDuration")
    .isInt({ min: 1 })
    .withMessage("Share duration has to be a positive number")
    .toInt(),
];
const validateToken = [param("token").isUUID().withMessage("Invalid request")];
const validateDeleteToken = [
  body("token").isUUID().withMessage("Invalid request"),
];

export {
  validateRegistration,
  validateSignIn,
  validateFileId,
  validateFolderId,
  validateFolderName,
  validateShareTime,
  validateToken,
  validateDeleteToken,
};
