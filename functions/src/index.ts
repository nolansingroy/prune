import * as admin from "firebase-admin";
admin.initializeApp();

export {onCreateFunction} from "./firestore/signUps";
export {createRecurringAvailabilityInstances} from "./callable/availability";

// export {onBackgroundEvents} from "./firestore/backgroundEvents";
