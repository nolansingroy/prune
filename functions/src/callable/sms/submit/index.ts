/* eslint-disable linebreak-style */
import * as functions from "firebase-functions";
import {FieldValue} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import parsePhoneNumberFromString, {
} from "libphonenumber-js";
import cors from "cors";

const db = admin.firestore();
const corsHandler = cors({origin: true});

export const submitClientData = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const {userId, clientId, firstName, lastName, email, phoneNumber, acceptSmsNotifications} = req.body;

    if (!userId || !clientId || !firstName || !lastName || !email || !phoneNumber ||
       acceptSmsNotifications === undefined) {
      res.status(400).send("All fields are required");
      return;
    }

    try {
      const clientRef = db.collection("users").doc(userId).collection("clients").doc(clientId);
      const clientDoc = await clientRef.get();

      if (!clientDoc.exists) {
        res.status(404).send("Client data not found");
        return;
      }

      const clientData = clientDoc.data();

      if (!clientData) {
        res.status(404).send("Client data not found");
        return;
      }

      // Check if the provided data is different from the existing data
      const isFirstNameChanged = clientData.firstName !== firstName;
      const isLastNameChanged = clientData.lastName !== lastName;
      const isEmailChanged = clientData.email !== email;
      const isPhoneNumberChanged = clientData.intPhoneNumber !== phoneNumber;

      const updateData: any = {
        updated_at: FieldValue.serverTimestamp(),
      };

      if (acceptSmsNotifications) {
        updateData.sms = true;
      }

      if (isFirstNameChanged || isLastNameChanged) {
        updateData.firstName = firstName;
        updateData.lastName = lastName;
        updateData.fullName = `${firstName} ${lastName}`;
      }

      if (isEmailChanged) {
        updateData.email = email;
      }

      if (isPhoneNumberChanged) {
        const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber, "US");
        const formattedPhoneNumber = parsedPhoneNumber ? parsedPhoneNumber.formatNational() : phoneNumber;
        updateData.phoneNumber = formattedPhoneNumber;
        updateData.intPhoneNumber = phoneNumber;
      }

      await clientRef.update(updateData);

      res.status(200).send("Client data updated successfully");
    } catch (error) {
      console.error("Error updating client data:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});
