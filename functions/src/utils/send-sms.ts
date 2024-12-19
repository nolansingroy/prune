/* eslint-disable linebreak-style */
import axios from "axios";
import * as functions from "firebase-functions";
import * as dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

type smsOptions = {
  body: string;
  phone: string;
}

export const sendSms = (options: smsOptions) =>
  new Promise((resolve, reject) => {
    const textgridSid = process.env.TEXTGRID_SID || functions.config().textgrid.sid;
    const textgridToken = process.env.TEXTGRID_TOKEN || functions.config().textgrid.token;
    const textgridNumber = process.env.TEXTGRID_NUMBER || functions.config().textgrid.number;

    console.log("Textgrid SID:", textgridSid);
    console.log("Textgrid Token:", textgridToken);
    console.log("Textgrid Number:", textgridNumber);

    const authorizationToken = Buffer.from(
      `${textgridSid}:${textgridToken}`
    ).toString("base64");

    console.log("Authorization Token:", authorizationToken);

    axios
      .post(
        `https://api.textgrid.com/2010-04-01/Accounts/${textgridSid}/Messages.json`,
        {
          body: options.body,
          from: textgridNumber,
          to: options.phone,
        },
        {
          headers: {
            Authorization: `Bearer ${authorizationToken}`,
          },
        }
      )
      .then((response) => {
        resolve(response.data);
      })
      .catch((err) => {
        console.error("Error sending SMS:", err.response ? err.response.data : err.message);
        reject(err);
      });
  });
