import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import path from "path";
import fs from "fs/promises";
import "dotenv/config.js";
import { HttpError } from "../helpers/index.js";
import User from "../models/Users.js";
import Jimp from "jimp";
import { error } from "console";

const { SECRET_JWT } = process.env;

export async function register(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      throw HttpError(409, "Email in use");
    }
    const hashPassword = await bcrypt.hash(password, 10);

    const avatarURL = gravatar.url(email);

    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL,
    });

    res.status(201).json({
      user: { email: newUser.email, subscription: newUser.subscription },
    });
  } catch (error) {
    next(error);
  }
}
export async function login(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw HttpError(401, "Email or password is wrong");
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

    await Jimp.read(oldPath)
      .then((image) => {
        image.resize(250, 250).writeAsync(oldPath);
      })
      .catch((error) => {
        console.log(error.message);
      })
      .catch((error) => {
        HttpError(404, error.message);
      });

    await fs.rename(oldPath, path.join(avatarsDir, filename));

    const result = await User.findOneAndUpdate(_id, {
      avatarURL: path.join("public", "avatars", filename),
    });

    res.json(result.avatarURL);
  } catch (error) {
    next(error);
  }
}
