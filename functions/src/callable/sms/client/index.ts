/* eslint-disable linebreak-style */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

const db = admin.firestore();
const corsHandler = cors({origin: true});

export const getClientData = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const {userId, clientId, token} = req.query;

    console.log("Received request with:", {userId, clientId, token});

    if (!userId || !clientId || !token) {
      res.status(400).send("The request must include userId, clientId, and token.");
      return;
    }

    try {
      const clientDoc = await db
        .doc(`users/${userId}/clients/${clientId}`)
        .get();

      if (!clientDoc.exists) {
        res.status(404).send("Client data not found.");
        return;
      }

      const clientData = clientDoc.data();

      console.log("Client data retrieved:", clientData);

      // checking the validity of the token
      if (clientData?.token === token) {
        res.status(200).json({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          phoneNumber: clientData.intPhoneNumber,
        });
      } else {
        console.log("Invalid token provided:", token);
        res.status(403).send("Invalid token.");
      }
    } catch (error) {
      console.error("Error retrieving client data:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});
