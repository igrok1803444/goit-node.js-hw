import app from "./app.js";
import mongoose from "mongoose";
import "dotenv/config.js";

const { DB_HOST, PORT } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    console.log("Database connection successful");
    app.listen(PORT, () => {
      console.log(`Server running. Use our API on port: ${PORT} `);
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
