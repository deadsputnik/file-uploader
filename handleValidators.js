import { validationResult } from "express-validator";

async function handleRegistrationValidation(req, res, next) {
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
    const inputData = {};
    inputData.username = req.body.username;
    console.log(errors);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .render("register", { inputData, errors: errors.array() });
    }
  }
  console.log("validation successful");
  next();
}

async function handleSignInValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const inputUsername = req.body.username;
    res
      .status(400)
      .render("sign-in", { inputUsername, errors: errors.array() });
  }
  next();
}

export { handleRegistrationValidation, handleSignInValidation };
