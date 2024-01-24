import nodemailer from "nodemailer";
import "dotenv/config";

const { SENDING_CLIENT, SENDING_CLIENT_PASSWORD, SENDING_HOST } = process.env;

const config = {
  host: SENDING_HOST,
  port: 465,
  secure: true,
  auth: {
    user: SENDING_CLIENT,
    pass: SENDING_CLIENT_PASSWORD,
  },
};

const transport = nodemailer.createTransport(config);

export default function sendEmail(emailData) {
  const email = { ...emailData, from: SENDING_CLIENT };
  return transport.sendMail(email);
}
