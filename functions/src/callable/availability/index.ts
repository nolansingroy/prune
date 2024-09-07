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

        // Combine startDate and startTime into a
        // Date object for the event start
        const originalStartDate = new Date(`${startDate}T${startTime}`);
        const originalEndDate = new Date(`${startDate}T${endTime}`);

        const rule = new RRule({
          freq: RRule.WEEKLY,
          byweekday: recurrence.daysOfWeek,
          dtstart: originalStartDate,
          until: new Date(recurrence.endRecur),
        });

        const allOccurrences = rule.all();
        const instanceMap: { [key: string]: string } = {};

        // Set the original event
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
            daysOfWeek: recurrence.daysOfWeek,
            startRecur: recurrence.startRecur,
            endRecur: recurrence.endRecur,
            rrule: rule.toString(),
          },
          instanceMap,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Skip the first occurrence (index 0)
        allOccurrences.slice(1).forEach((occurrence) => {
          const instanceDate = new Date(occurrence);
          instanceDate.setDate(instanceDate.getDate() - 1); // Subtract 1 day

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
            originalEventId: eventRef.id,
            isInstance: true,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });

          instanceMap[instanceStartDate.toISOString()] = instanceRef.id;
        });

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
