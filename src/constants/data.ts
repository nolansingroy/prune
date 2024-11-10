import { NavItem } from "@/interfaces/navItems";

export const navItems: NavItem[] = [
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: "calendar",
    isActive: false,
    items: [], // Empty array as there are no child items for Dashboard
  },
  {
    title: "Availability",
    url: "/dashboard/availability",
    icon: "user",
    isActive: false,
    items: [], // No child items
  },
  {
    title: "Bookings",
    url: "/dashboard/bookings",
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
        url: "/dashboard/profile",
        icon: "userPen",
      },
      {
        title: "Booking Types",
        url: "/dashboard/bookingtypes",
        icon: "login",
      },
      {
        title: "Clients",
        url: "/dashboard/clients",
        icon: "sun",
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
