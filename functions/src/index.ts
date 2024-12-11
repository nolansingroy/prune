import * as admin from "firebase-admin";
admin.initializeApp();

export {onCreateFunction} from "./firestore/signUps";
export {createRecurringAvailabilityInstances} from "./callable/availability";
export {createRecurringBookingInstances} from "./callable/bookings";
export {fetchAllEvents} from "./callable/events";