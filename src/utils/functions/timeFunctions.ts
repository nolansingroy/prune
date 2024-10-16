// utils.ts

/**
 * Adjusts a given date for the local timezone.
 * @param date - The date to be adjusted.
 * @returns The adjusted date.
 */
export const adjustForLocalTimezone = (date: Date): Date => {
  const timezoneOffsetHours = -(new Date().getTimezoneOffset() / 60);
  const localDate = new Date(date);
  localDate.setHours(date.getHours() - timezoneOffsetHours);
  return localDate;
};