import * as admin from "firebase-admin";
admin.initializeApp();

export {onCreateFunction} from "./firestore/signUps";
export {createRecurringAvailabilityInstances} from "./callable/availability";
export {createRecurringBookingInstances} from "./callable/bookings";
export {fetchAllEvents} from "./callable/events";
export {testSendSms} from "./callable/testing";
export {getClientData} from "./callable/sms/client";
export {submitClientData} from "./callable/sms/submit";
