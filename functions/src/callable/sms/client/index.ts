/* eslint-disable linebreak-style */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

const db = admin.firestore();

export const getClientData = functions.https.onRequest(
  async (req, res) => {
    cors({origin: true})(req, res, async () => {
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization"
        );
        res.set("Access-Control-Allow-Origin", "*");
        res.status(204).send("");
        return;
      }
      const {userId, clientId, token} = req.query;

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


        // checking the validity of the token
        if (clientData?.token === token) {
          res.status(200).json({
            firstName: clientData.firstName,
            lastName: clientData.lastName,
            email: clientData.email,
            phoneNumber: clientData.intPhoneNumber,
          });
        } else {
          res.status(403).send("Invalid token.");
        }
      } catch (error) {
        if (error instanceof Error) {
          res.status(500).send(error.message);
        } else {
          res.status(500).send("An unknown error occurred.");
        }
      }
    });
  });


