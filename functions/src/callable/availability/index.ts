import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import {RRule} from "rrule";

const db = admin.firestore();

export const createRecurringAvailabilityInstances = functions.https.onRequest(
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

      try {
        const {
          title,
          description,
          location,
          startDate,
          startTime,
          endTime,
          recurrence,
          userId,
        } = req.body;

        const batch = db.batch();
        const eventRef = db
          .collection("users")
          .doc(userId)
          .collection("events")
          .doc();

        // Combine startDate and startTime into Date objects
        const originalStartDate = new Date(`${startDate}T${startTime}Z`);
        const originalEndDate = new Date(`${startDate}T${endTime}Z`);

        const daysOfWeek = recurrence.daysOfWeek;

        // Check if the recurrence is for every day (contains 0-6)
        const isEveryday =
          daysOfWeek.length === 7 && daysOfWeek.every((day:
            number) => day >= 0 && day <= 6);
        console.log("isEveryday:", isEveryday);

        // Adjust the endRecur to avoid the bleeding of 1 day
        const recurrenceEndDate = new Date(recurrence.endRecur + "T23:59:59Z");
        // If it's an everyday recurrence, adjust
        // the until date by subtracting 1 day to stop exactly at the end date.
        if (isEveryday) {
          recurrenceEndDate.setDate(recurrenceEndDate.getDate() - 1);
        }

        // Set up the recurrence rule using rrule
        const rule = new RRule({
          freq: RRule.WEEKLY,
          byweekday: daysOfWeek,
          dtstart: originalStartDate,
          until: recurrenceEndDate,
        });

        const allOccurrences = rule.all();
        const instanceMap: { [key: string]: string } = {};

        // 1. Create the original event
        batch.set(eventRef, {
          title,
          description,
          location,
          start: originalStartDate,
          end: originalEndDate,
          isBackgroundEvent: true,
          startDate: originalStartDate,
          startDay: originalStartDate.toLocaleDateString("en-US", {
            weekday: "long",
          }),
          endDate: originalEndDate,
          endDay: originalEndDate.toLocaleDateString("en-US", {
            weekday: "long",
          }),
          recurrence: {
            daysOfWeek,
            startRecur: recurrence.startRecur,
            endRecur: recurrence.endRecur,
            rrule: rule.toString(),
          },
          instanceMap,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Process occurrences and skip
        // the first one if it's an everyday recurrence
        // const occurrencesToProcess = isEveryday ?
        // allOccurrences.slice(1) : allOccurrences;
        // 2. Process occurrences and skip the first one
        const occurrencesToProcess = allOccurrences.slice(1);
        occurrencesToProcess.forEach((occurrence) => {
          const instanceDate = new Date(occurrence);

          // Conditionally handle date adjustment:
          // - Subtract 1 day for weekly events (fixes time zone issue).
          // - Add 1 day for everyday events to fix the duplication issue.
          if (isEveryday) {
            // Add 1 day back for everyday
            // instanceDate.setDate(instanceDate.getDate() + 1);
            console.log("Everyday instanceDate:", instanceDate);
          } else {
            // Subtract 1 day for weekly events
            instanceDate.setDate(instanceDate.getDate() - 1);
          }

          const instanceStartDate = new Date(
            `${instanceDate.toISOString().split("T")[0]}T${startTime}`
          );
          const instanceEndDate = new Date(
            `${instanceDate.toISOString().split("T")[0]}T${endTime}`
          );

          const instanceRef = db
            .collection("users")
            .doc(userId)
            .collection("events")
            .doc();

          batch.set(instanceRef, {
            title,
            description,
            location,
            start: instanceStartDate,
            end: instanceEndDate,
            isBackgroundEvent: true,
            startDate: instanceStartDate,
            startDay: instanceStartDate.toLocaleDateString("en-US", {
              weekday: "long",
            }),
            endDate: instanceEndDate,
            endDay: instanceEndDate.toLocaleDateString("en-US", {
              weekday: "long",
            }),
            originalEventId: eventRef.id, // Reference to the original event
            isInstance: true,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });

          instanceMap[instanceStartDate.toISOString()] = instanceRef.id;
        });

        // 3. Commit the batch
        await batch.commit();

        res.set("Access-Control-Allow-Origin", "*");
        res.status(200).json({
          message: "Recurring event and instances created successfully.",
        });
      } catch (error) {
        console.error("Error creating recurring event instances:", error);
        res.status(500).json({
          error: "Error creating recurring event instances.",
        });
      }
    });
  }
);


