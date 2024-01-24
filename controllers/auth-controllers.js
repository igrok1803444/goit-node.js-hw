import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import path from "path";
import fs from "fs/promises";
import "dotenv/config.js";
import { HttpError, sendEmail } from "../helpers/index.js";
import User from "../models/Users.js";
import Jimp from "jimp";
import { error } from "console";
import { nanoid } from "nanoid";

const { SECRET_JWT, BASE_URL } = process.env;

export async function register(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      throw HttpError(409, "Email in use");
    }
    const hashPassword = await bcrypt.hash(password, 10);

    const avatarURL = gravatar.url(email);

    const verificationToken = nanoid();

    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL,
      verificationToken,
    });

    const emailData = {
      to: email,
      subject: "Verify your email",
      html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Click to verify email</a>`,
    };

    await sendEmail(emailData);

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        message: "Check your email for verification",
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function login(req, res, next) {
  const { email, password } = req.body;

  console.log(email);
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw HttpError(401, "Email is wrong");
    }
    if (!user.verify) {
      throw HttpError(401, "Email is not verified");
    }
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw HttpError(401, "Email or password is wrong");
    }

    const { _id: id } = user;

    const payload = {
      id,
    };

    const token = jwt.sign(payload, SECRET_JWT, { expiresIn: "3h" });

    await User.findByIdAndUpdate(id, { token });

    res.status(200).json({
      token,
      user: { email: user.email, subscription: user.subscription },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  const { _id: id } = req.user;

  await User.findByIdAndUpdate(id, { token: "" });
  res.status(204).json({ message: "Not authorized" });
}

export async function current(req, res, next) {
  const { email, subscription } = req.user;

  res.json({
    email: email,
    subscription: subscription,
  });
}
export async function updateSubscription(req, res, next) {
  const { id: _id } = req.user;
  const { subscription } = req.body;
  try {
    const result = await User.findByIdAndUpdate({ _id }, { subscription });
    if (!result) {
      throw HttpError(404);
    } else {
      res.json(result);
    }
  } catch (error) {
    next(error);
  }
}

export async function updateAvatar(req, res, next) {
  try {
    const avatarsDir = path.resolve("public", "avatars");

    const { _id } = req.user;

    const { path: oldPath, filename } = req.file;

    const newPath = path.join(avatarsDir, filename);

    await fs.rename(oldPath, newPath);

    await Jimp.read(newPath)
      .then((image) => {
        return image.resize(250, 250).writeAsync(newPath);
      })
      .catch((error) => {
        HttpError(404, error.message);
      });

    const result = await User.findByIdAndUpdate(_id, {
      avatarURL: path.join("public", "avatars", filename),
    });

    res.json(result.avatarURL);
  } catch (error) {
    next(error);
  }
}
export async function updateVerification(req, res, next) {
  const { verificationToken } = req.params;

  try {
    const user = await User.findOne({ verificationToken });

    if (!user) {
      throw HttpError(404, "User not found or email already verify");
    }

    await User.findOneAndUpdate(
      { verificationToken },
      {
        verificationToken: "",
        verify: true,
      }
    );

    res.json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationEmail(req, res, next) {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(404, "User not Found");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const emailData = {
    to: email,
    subject: "Verify your email",
    html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">Click to verify email</a>`,
  };

  await sendEmail(emailData);

  res.json({ message: "Verification email sent" });

  try {
  } catch (error) {
    next(error);
  }
}
