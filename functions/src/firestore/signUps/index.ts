import * as functions from "firebase-functions";
import axios from "axios";
import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
const client = new SecretManagerServiceClient();

// Firestore onCreate function
export const onCreateFunction = functions.firestore
  .document("signups/{signupId}")
  .onCreate(async (snapshot) => {
    const data = snapshot.data();
    console.log("New signup document created:", data);
    console.log("Sending Slack notification...");
    console.log(`data.email: ${data.email}`);

    try {
      // Retrieve the Slack webhook URL from Secret Manager
      const [version] = await client.accessSecretVersion({
        name: "projects/964726998539/secrets/slack-signups/versions/latest",
      });
      const webhookUrl = version?.payload?.data?.toString(); // Add null check

      // Ping Slack webhook if webhookUrl is defined
      if (webhookUrl) {
        const message = `New signup from ${data.firstName} ${data.lastName} 
          with email ${data.email} has been created.`;
        await axios.post(webhookUrl, {text: message});
      } else {
        console.log("Url is not defined - error with google secret manager");
      }
    } catch (error) {
      console.error("Error pinging Slack webhook:", error);
    }

    return null;
  });
