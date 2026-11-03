import expressSession from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "./lib/prisma.js";
import path from "node:path";
import express from "express";
import passport from "passport";
import "./config/passport.js";
import { router } from "./router.js";
import { errorHandler } from "./controller.js";

const app = express();

app.set("views", path.join(import.meta.dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(import.meta.dirname, "public")));
app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
app.locals.formatDate = (date) => dateFormat.format(date);

app.locals.icons = {
  download:
    '<svg xmlns="http://www.w3.org/2000/svg"width="30px"height="30px"viewBox="0 0 24 24"> <path d="M0 0h24v24H0z" fill="none" /> <path fill="none"stroke="currentColor"stroke-linecap="round"stroke-linejoin="round"stroke-width="2"d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.877a2 2 0 0 0 1.94-1.515L22 17"/></svg>',
  delete:
    '<svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 2048 2048"><path d="M0 0h2048v2048H0z" fill="none"/><path fill="currentColor" d="M1792 384h-128v1472q0 40-15 75t-41 61t-61 41t-75 15H448q-40 0-75-15t-61-41t-41-61t-15-75V384H128V256h512V128q0-27 10-50t27-40t41-28t50-10h384q27 0 50 10t40 27t28 41t10 50v128h512zM768 256h384V128H768zm768 128H384v1472q0 26 19 45t45 19h1024q26 0 45-19t19-45zM768 1664H640V640h128zm256 0H896V640h128zm256 0h-128V640h128z"/></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 16 16"><path d="M0 0h16v16H0z" fill="none"/><g fill="currentColor"><path d="M7 4a3 3 0 0 0 3 3h3v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h2z"/><path d="M13 6h-3a2 2 0 0 1-2-2V1z"/></g></svg>',
  folder:
    '<svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 16 16"><path d="M0 0h16v16H0z" fill="none"/><g fill="currentColor"><path d="M14.081 7a1 1 0 0 1 .942 1.336l-1.55 4.337A2 2 0 0 1 11.592 14H3a2 2 0 0 1-.923-.227l1.51-5.66A1.5 1.5 0 0 1 5.037 7z"/><path d="M4.586 2a1 1 0 0 1 .707.293L7 4h4a2 2 0 0 1 2 2H5.036a2.5 2.5 0 0 0-2.415 1.855l-1.366 5.12A2 2 0 0 1 1 12V4a2 2 0 0 1 2-2z"/></g></svg>',
  up: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path fill="currentColor" fill-rule="evenodd" d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11s11-4.925 11-11S18.075 1 12 1M8.707 14.207a1 1 0 0 1-1.414-1.414l4-4a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1-1.414 1.414L12 10.914z" clip-rule="evenodd"/></svg>',
  share:
    '<svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m0-12L8 7m4-4l4 4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.877a2 2 0 0 0 1.94-1.515L22 17"/></svg>',
};

app.use((req, res, next) => {
  if (req.user) {
    res.locals.loggedIn = true;
  }
  next();
});

app.use("/", router);
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`listening on port ${PORT}`);
});
