import { Router } from "express";
import {
  requireAuth,
  getHomepage,
  getRegister,
  getLogin,
  registerAccount,
  signInUser,
  logout,
} from "./controller.js";
import {
  handleRegistrationValidation,
  handleSignInValidation,
  handleTokenValidation,
} from "./handleValidators.js";
import {
  validateRegistration,
  validateSignIn,
  validateToken,
} from "./validators.js";
import { userRouter } from "./routes/user.js";
import { shareRouter } from "./routes/share.js";

const router = Router();
router.get("/", getHomepage);

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

// USER - SHARE routes
router.use("/user/", userRouter);
router.use("/share/:token/", validateToken, handleTokenValidation, shareRouter);

export { router };
