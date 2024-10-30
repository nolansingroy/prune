import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import cors from "cors";
import {RRule, RRuleSet} from "rrule";
import {toDate} from "date-fns-tz";

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
          userTimeZone,
        } = req.body;

        console.log("availabilities");

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
        const originalStartDate = toDate(`${startDate}T${startTime}`, {timeZone: userTimeZone});
        const originalEndDate = toDate(`${startDate}T${endTime}`, {timeZone: userTimeZone});

        console.log("Original start date:", originalStartDate);
        console.log("Original end date:", originalEndDate);

        const daysOfWeek = recurrence.daysOfWeek;

        // Check if the original start date is on a recurring day; adjust if not
        if (!daysOfWeek.includes(originalStartDate.getDay())) {
          let dayOffset = 1;
          while (!daysOfWeek.includes((originalStartDate.getDay() + dayOffset) % 7)) {
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
        const recurrenceEndDate = toDate(`${recurrence.endRecur}T23:59:59`, {timeZone: userTimeZone});
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

        const timestampStartDate = Timestamp.fromDate(originalStartDate);
        const timestampEndDate = Timestamp.fromDate(originalEndDate);

        console.log("Timestamp start date:", timestampStartDate);
        console.log("Timestamp end date:", timestampEndDate);

        // 1. Create the original event
        batch.set(eventRef, {
          title,
          description,
          location,
          start: timestampStartDate,
          end: timestampEndDate,
          isBackgroundEvent: true,
          startDate: timestampStartDate,
          startDay: originalStartDate.toLocaleDateString("en-US", {
            weekday: "long",
          }),
          endDate: timestampEndDate,
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
          const instanceDate = toDate(occurrence, {timeZone: userTimeZone});

          // Conditionally handle date adjustment:
          if (isEveryday) {
            console.log("Everyday instanceDate:", instanceDate);
          } else {
            instanceDate.setDate(instanceDate.getDate() - 1);
          }

          const instanceStartDate = toDate(
            `${instanceDate.toISOString().split("T")[0]}T${startTime}`,
            {timeZone: userTimeZone}
          );
          const instanceEndDate = toDate(
            `${instanceDate.toISOString().split("T")[0]}T${endTime}`,
            {timeZone: userTimeZone}
          );

          // Skip creating the instance if it matches the original event date because it's
          // already created and to prevent duplicated events
          if (instanceStartDate.getTime() === originalStartDate.getTime()) {
            console.log("Skipping instance creation for original event date:", instanceStartDate);
            return;
          }

          const instanceRef = db
            .collection("users")
            .doc(userId)
            .collection("events")
            .doc();

          const timestampInstanceStartDate = Timestamp.fromDate(instanceStartDate);
          const timestampInstanceEndDate = Timestamp.fromDate(instanceEndDate);

          console.log("Timestamp instance start date:", timestampInstanceStartDate);
          console.log("Timestamp instance end date:", timestampInstanceEndDate);


          batch.set(instanceRef, {
            title,
            description,
            location,
            start: timestampInstanceStartDate,
            end: timestampInstanceEndDate,
            isBackgroundEvent: true,
            startDate: timestampInstanceStartDate,
            startDay: instanceStartDate.toLocaleDateString("en-US", {
              weekday: "long",
            }),
            endDate: timestampInstanceEndDate,
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
