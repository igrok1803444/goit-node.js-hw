import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";

import { HttpError } from "../helpers/index.js";

const destination = path.resolve("temp");

const storage = multer.diskStorage({
  destination,
  filename: (req, file, callback) => {
    const newFileName = `${nanoid()}_${file.originalname}`;
    callback(null, newFileName);
  },
});

const limits = {
  fileSize: 1024 * 1024 * 10,
};

const fileFilter = (req, file, callback) => {
  const extention = file.originalname.split(".").pop();

  if (extention === "exe") {
    return callback(HttpError(400, ".exe not allowed"));
  }
  callback(null, file);
};

const upload = multer({
  storage,
  limits,
  fileFilter,
});

export default upload;
