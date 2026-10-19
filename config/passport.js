import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { username: username },
      });

      if (!user) {
        console.log("incorrect username");
        return done(null, false, { message: "Incorrect username" });
      }
      bcrypt.compare(password, user.passwordHash, (err, result) => {
        if (err) return done(err);
        if (!result) {
          console.log("incorrect pass");
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      });
    } catch (error) {
      return done(error);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});
