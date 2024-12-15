/* eslint-disable linebreak-style */
import * as functions from "firebase-functions";
import {sendSms} from "../../utils/send-sms";

export const testSendSms = functions.https.onRequest(async (req, res) => {
  // const {body, phone} = req.query;

  // if (!body || !phone) {
  //   res.status(400).send("Missing 'body' or 'phone' query parameters");
  //   return;
  // }

  const options = {
    body: "Rahman is sending test SMS from Firebase cloud function and textgrid API",
    phone: "+12067550348",
  };

  try {
    const response = await sendSms(options);
    res.status(200).send(`SMS sent successfully: ${JSON.stringify(response)}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
    if (error instanceof Error) {
      res.status(500).send(`Error sending SMS: ${error.message}`);
    } else {
      res.status(500).send("Error sending SMS: unknown error");
    }
  }
});
