import * as functions from "firebase-functions";
import axios from "axios";

// Initialize Firebase Admin SDK
// admin.initializeApp();

// Firestore onCreate function
export const onCreateFunction = functions.firestore
  .document("signups/{signupId}")
  .onCreate(async (snapshot) => {
    const data = snapshot.data();
    console.log("New signup document created:", data);

    try {
      // Ping Slack webhook
      const webhookUrl =
        "https://hooks.slack.com/services/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";
      const message = "New signup document created: " + JSON.stringify(data);
      await axios.post(webhookUrl, {text: message});
    } catch (error) {
      console.error("Error pinging Slack webhook:", error);
    }

    return null;
  });
