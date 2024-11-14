export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  timezone: string;
  calendarStartTime: string;
  contactPreference: string;
  creationTime: Date;
  displayName: string;
  emailVerified: boolean;
  loginType: string;
  photoURL: string;
  role: string;
  updated_at: Date;
}
