import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import cors from "cors";
import { RRule, RRuleSet } from "rrule";

const db = admin.firestore();

export const createRecurringAvailabilityInstances = functions.https.onRequest(
  async (req, res) => {
    cors({ origin: true })(req, res, async () => {
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

        console.log("Updated new function 7:21");

        console.log("Received request with data:", {
          title,
          description,
          location,
          startDate,
          startTime,
          endTime,
          recurrence,
          userId,
        });

        const batch = db.batch();
        const eventRef = db
          .collection("users")
          .doc(userId)
          .collection("events")
          .doc();

        // Combine startDate and startTime into Date objects
        let originalStartDate = new Date(`${startDate}T${startTime}Z`);
        let originalEndDate = new Date(`${startDate}T${endTime}Z`);

        console.log("Original start date:", originalStartDate);
        console.log("Original end date:", originalEndDate);

        const daysOfWeek = recurrence.daysOfWeek;

        // Check if the original start date is on a recurring day; adjust if not
        if (!daysOfWeek.includes(originalStartDate.getUTCDay())) {
          let dayOffset = 1;
          while (!daysOfWeek.includes((originalStartDate.getUTCDay() + dayOffset) % 7)) {
            dayOffset++;
          }
          // Set the start date and end date to the next valid recurring day
          originalStartDate.setDate(originalStartDate.getDate() + dayOffset);
          originalEndDate.setDate(originalEndDate.getDate() + dayOffset);
        }

        // Check if the recurrence is for every day (contains 0-6)
        const isEveryday =
          daysOfWeek.length === 7 && daysOfWeek.every((day: number) => day >= 0 && day <= 6);
        console.log("isEveryday:", isEveryday);

        // Adjust the endRecur to avoid the bleeding of 1 day
        const recurrenceEndDate = new Date(recurrence.endRecur + "T23:59:59Z");
        if (isEveryday) {
          recurrenceEndDate.setDate(recurrenceEndDate.getDate() - 1);
        }

        console.log("Recurrence end date:", recurrenceEndDate);

        // Set up the recurrence rule using rrule
        const ruleSet = new RRuleSet();
        const rule = new RRule({
          freq: RRule.WEEKLY,
          byweekday: daysOfWeek,
          dtstart: originalStartDate,
          until: recurrenceEndDate,
        });

        ruleSet.rrule(rule);
        ruleSet.exdate(originalStartDate);

        const allOccurrences = ruleSet.all();
        console.log("All occurrences:", allOccurrences);

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
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });
        console.log("Original event created:", {
          title,
          description,
          location,
          start: originalStartDate,
          end: originalEndDate,
        });

        // 2. Process occurrences
        allOccurrences.forEach((occurrence) => {
          const instanceDate = new Date(occurrence);

          // Conditionally handle date adjustment:
          if (isEveryday) {
            console.log("Everyday instanceDate:", instanceDate);
          } else {
            instanceDate.setDate(instanceDate.getDate() - 1);
          }

          const instanceStartDate = new Date(
            `${instanceDate.toISOString().split("T")[0]}T${startTime}`
          );
          const instanceEndDate = new Date(
            `${instanceDate.toISOString().split("T")[0]}T${endTime}`
          );

          // Skip creating the instance if it matches the original event date because it's already created and to prevent duplicated events
          if (instanceStartDate.getTime() === originalStartDate.getTime()) {
            console.log("Skipping instance creation for original event date:", instanceStartDate);
            return;
          }

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
            created_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          });
          console.log("Instance created:", {
            title,
            description,
            location,
            start: instanceStartDate,
            end: instanceEndDate,
          });

          instanceMap[instanceStartDate.toISOString()] = instanceRef.id;
        });

        // 3. Commit the batch
        await batch.commit();
        console.log("Batch committed successfully");

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