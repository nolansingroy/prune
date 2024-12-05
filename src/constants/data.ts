import { NavItem } from "@/interfaces/navItems";

export const navItems: NavItem[] = [
  {
    title: "Calendar",
    url: "/calendar",
    icon: "calendar",
    isActive: false,
    items: [], // Empty array as there are no child items for Dashboard
  },
  {
    title: "Availability",
    url: "/availability",
    icon: "user",
    isActive: false,
    items: [], // No child items
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: "bookings",
    isActive: false,
    items: [], // No child items
  },
  {
    title: "Settings",
    url: "#", // Placeholder as there is no direct link for the parent
    icon: "settings",
    isActive: true,

    items: [
      {
        title: "Profile",
        url: "/profile",
        icon: "userPen",
      },
      {
        title: "Booking Types",
        url: "/bookingtypes",
        icon: "login",
      },
      {
        title: "Clients",
        url: "/clients",
        icon: "sun",
      },
    ],
  },
  {
    title: "Admin",
    url: "#", // Placeholder as there is no direct link for the parent
    icon: "userPen",
    isActive: false,

    items: [
      {
        title: "Impersonate",
        url: "/impersonate",
        icon: "userPen",
      },
    ],
  },
  // {
  //   title: "Kanban",
  //   url: "/dashboard/kanban",
  //   icon: "kanban",
  //   isActive: false,
  //   items: [], // No child items
  // },
];

// List of major timezones
export const timezones = [
  "Pacific/Midway",
  "America/Adak",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Atlantic/Azores",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const cloudFunctionBaseURLTesting =
  "http://127.0.0.1:5001/prune-94ad9/us-central1/";
const cloudFunctionBaseURLProduction =
  "https://us-central1-prune-94ad9.cloudfunctions.net/";

export const cloudFunctions = {
  recurringBookingsTest: `${cloudFunctionBaseURLTesting}createRecurringBookingInstances`,
  recurringBookingsProd: `${cloudFunctionBaseURLProduction}createRecurringBookingInstances`,
  recurringAvailabilitiesTest: `${cloudFunctionBaseURLTesting}createRecurringAvailabilityInstances`,
  recurringAvailabilitiesProd: `${cloudFunctionBaseURLProduction}createRecurringAvailabilityInstances`,
};
