import express from "express";
import * as authController from "../../controllers/auth-controllers.js";
import {
  authorization,
  isEmptyBody,
  isValid,
  upload,
} from "../../middlewares/index.js";

const authRouter = express.Router();

authRouter.post(
  "/register",
  isEmptyBody,
  isValid.isValidUserAddBody,
  authController.register
);

authRouter.post("/login", isEmptyBody, authController.login);

authRouter.post("/logout", authorization, authController.logout);

authRouter.post("/current", authorization, authController.current);

authRouter.patch(
  "/subscription",
  authorization,
  isEmptyBody,
  isValid.isValidUpdateSubscription,
  authController.updateSubscription
);

authRouter.patch(
  "/avatars",
  authorization,
  upload.single("avatar"),
  authController.updateAvatar
);

authRouter.get("/verify/:verificationToken", authController.updateVerification);

authRouter.post(
  "/verify",
  isValid.isValidResendEmailBody,
  authController.resendVerificationEmail
);
export default authRouter;
