import { matchedData } from "express-validator";
import { prisma } from "./lib/prisma.js";
import bcrypt from "bcryptjs";
import passport from "passport";

function checkAuth(req, res, next) {
  req.user ? next() : res.redirect("/sign-in");
}

function getHomepage(req, res) {
  res.render("homepage");
}

function getAddFile(req, res) {
  res.render("addFile");
}

function getRegister(req, res) {
  res.render("register");
}

function getLogin(req, res) {
  res.render("sign-in");
}

async function registerAccount(req, res, next) {
  console.log("Registering account");
  const { username, password } = matchedData(req);
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username: username,
        passwordHash: hashedPassword,
      },
    });
    if (!user) return next(new Error("Server Error"));
    res.redirect("/");
  } catch (error) {
    next(error);
  }
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

export {
  checkAuth,
  getHomepage,
  getAddFile,
  getRegister,
  getLogin,
  registerAccount,
  signInUser,
  logout,
};
