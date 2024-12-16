/* eslint-disable operator-linebreak */
/* eslint-disable indent */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import cors from "cors";
import {RRule, RRuleSet} from "rrule";
import moment from "moment-timezone";

const db = admin.firestore();

export const createRecurringBookingInstances = functions.https.onRequest(
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
          clientId,
          clientName,
          client,
          coachId,
          clientPhone,
          fee,
          paid,
          type,
          typeId,
          description,
          // location,
          startDate,
          startTime,
          endTime,
          recurrence,
          userId,
          userTimeZone,
        } = req.body;

        // if (!title || !clientId || !clientName ||
        //   !startDate || !startTime || !endTime ||
        //   !recurrence || !userId || !userTimeZone) {
        //   console.log("Missing required fields:", {
        //     title,
        //     clientId,
        //     clientName,
        //     fee,
        //     paid,
        //     type,
        //     typeId,
        //     description,
        //     location,
        //     startDate,
        //     startTime,
        //     endTime,
        //     recurrence,
        //     userId,
        //     userTimeZone,
        //   });
        //   res.status(400).json({error: "Missing required fields"});
        //   return;
        // }

        console.log("Received request with data:", {
          title,
          clientId,
          clientName,
          coachId,
          clientPhone,
          fee,
          paid,
          type,
          typeId,
          description,
          client,
          // location,
          startDate,
          startTime,
          endTime,
          recurrence,
          userId,
          userTimeZone,
        });

        const batch = db.batch();
        const eventRef = db
          .collection("users")
          .doc(userId)
          .collection("events")
          .doc();

        // Use moment-timezone to handle the time zone conversions properly
        const originalStartDate = moment.tz(`${startDate}T${startTime}:00`, userTimeZone);
        const originalEndDate = moment.tz(`${startDate}T${endTime}:00`, userTimeZone);

        console.log("Original start date (local):", originalStartDate.format());
        console.log("Original end date (local):", originalEndDate.format());

        const daysOfWeek = recurrence.daysOfWeek;

        // Adjust the original start and end dates to the next valid recurring day if necessary
        if (!daysOfWeek.includes(originalStartDate.day())) {
          let dayOffset = 1;
          while (!daysOfWeek.includes((originalStartDate.day() + dayOffset) % 7)) {
            dayOffset++;
          }
          originalStartDate.add(dayOffset, "days");
          originalEndDate.add(dayOffset, "days");
        }

        const isEveryday =
          daysOfWeek.length === 7 && daysOfWeek.every((day: number) => day >= 0 && day <= 6);
        console.log("isEveryday:", isEveryday);

        const recurrenceEndDate = moment.tz(`${recurrence.endRecur}T23:59:59Z`, userTimeZone);
        if (isEveryday) {
          recurrenceEndDate.subtract(1, "days");
        }


        console.log("Recurrence end date (local):", recurrenceEndDate.format());

        const ruleSet = new RRuleSet();
        const rule = new RRule({
          freq: RRule.WEEKLY,
          byweekday: daysOfWeek,
          dtstart: originalStartDate.toDate(),
          until: recurrenceEndDate.toDate(),
        });

        ruleSet.rrule(rule);
        ruleSet.exdate(originalStartDate.toDate());

        const allOccurrences = ruleSet.all();
        console.log("All occurrences:", allOccurrences);

        const instanceMap: { [key: string]: string } = {};

        const timestampStartDate = Timestamp.fromDate(originalStartDate.toDate());
        const timestampEndDate = Timestamp.fromDate(originalEndDate.toDate());

        console.log("Timestamp start date:", timestampStartDate.toDate());
        console.log("Timestamp end date:", timestampEndDate.toDate());

        const reminderOriginalEvent = moment.tz(`${startDate}T${startTime}:00`, userTimeZone);
        reminderOriginalEvent.subtract(1, "days");
        reminderOriginalEvent.set({hour: 8, minute: 0, second: 0, millisecond: 0});
        const timestampReminder = Timestamp.fromDate(reminderOriginalEvent.toDate());

        const clientWithTimestamps = client
          ? {...client,
            created_at: client.created_at? new Timestamp(client.created_at.seconds, client.created_at.nanoseconds)
            : null,
            updated_at: client.updated_at? new Timestamp(client.updated_at.seconds, client.updated_at.nanoseconds)
            : null,
            }
          : {};

        batch.set(eventRef, {
          title,
          clientId,
          clientName,
          client: clientWithTimestamps,
          coachId,
          clientPhone,
          fee,
          paid,
          type,
          typeId,
          description,
          // location,
          start: timestampStartDate,
          end: timestampEndDate,
          reminderDateTime: timestampReminder,
          reminderSent: false,
          isBackgroundEvent: false,
          startDate: timestampStartDate,
          startDay: originalStartDate.format("dddd"),
          endDate: timestampEndDate,
          endDay: originalEndDate.format("dddd"),
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
          // location,
          start: originalStartDate.format(),
          end: originalEndDate.format(),
        });

        allOccurrences.forEach((occurrence) => {
          const instanceDate = moment(occurrence);

          if (isEveryday) {
            console.log("Everyday instanceDate:", instanceDate.format());
          } else {
            instanceDate.subtract(1, "days");
          }

          const instanceStartDate = moment.tz(`${instanceDate.format("YYYY-MM-DD")}T${startTime}:00`, userTimeZone);
          const instanceEndDate = moment.tz(`${instanceDate.format("YYYY-MM-DD")}T${endTime}:00`, userTimeZone);

          if (instanceStartDate.isSame(originalStartDate)) {
            console.log("Skipping instance creation for original event date:", instanceStartDate.format());
            return;
          }

          const instanceRef = db
            .collection("users")
            .doc(userId)
            .collection("events")
            .doc();

          const timestampInstanceStartDate = Timestamp.fromDate(instanceStartDate.toDate());
          const timestampInstanceEndDate = Timestamp.fromDate(instanceEndDate.toDate());

          console.log("Timestamp instance start date:", timestampInstanceStartDate.toDate());
          console.log("Timestamp instance end date:", timestampInstanceEndDate.toDate());

          const reminderInstanceEvent = moment.tz(`${instanceDate.format("YYYY-MM-DD")}T${startTime}:00`, userTimeZone);
          reminderInstanceEvent.subtract(1, "days");
          reminderInstanceEvent.set({hour: 8, minute: 0, second: 0, millisecond: 0});
          const timestampInstanceReminder = Timestamp.fromDate(reminderInstanceEvent.toDate());

          batch.set(instanceRef, {
            title,
            clientId,
            clientName,
            client: clientWithTimestamps,
            coachId,
            clientPhone,
            fee,
            paid: false,
            type,
            typeId,
            description,
            // location,
            start: timestampInstanceStartDate,
            end: timestampInstanceEndDate,
            isBackgroundEvent: false,
            startDate: timestampInstanceStartDate,
            startDay: instanceStartDate.format("dddd"),
            endDate: timestampInstanceEndDate,
            endDay: instanceEndDate.format("dddd"),
            reminderDateTime: timestampInstanceReminder,
            reminderSent: false,
            originalEventId: eventRef.id,
            isInstance: true,
            created_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          });
          console.log("Instance created:", {
            title,
            description,
            // location,
            start: instanceStartDate.format(),
            end: instanceEndDate.format(),
          });

          instanceMap[instanceStartDate.toISOString()] = instanceRef.id;
        });

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
