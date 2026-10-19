import { Router } from "express";
import {
  checkAuth,
  getHomepage,
  getAddFile,
  getRegister,
  getLogin,
  registerAccount,
  signInUser,
  logout,
} from "./controller.js";
import {
  handleRegistrationValidation,
  handleSignInValidation,
} from "./handleValidators.js";
import { validateRegistration, validateSignIn } from "./validators.js";

const router = Router();

router.get("/", getHomepage);
router.get("/register", getRegister);
router.get("/login", getLogin);
router.get("/add-file", getAddFile);

router.post(
  "/register",
  validateRegistration,
  handleRegistrationValidation,
  registerAccount,
);
router.post("/login", validateSignIn, handleSignInValidation, signInUser);
router.post("/logout", logout);

export { router };
