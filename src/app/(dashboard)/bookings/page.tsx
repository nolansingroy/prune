import { Metadata } from "next";

import BookingsListviewPage from "./_components/bookings-listview-page";

export const metadata: Metadata = {
  title: "Dashboard : Bookings",
};

export default function Page() {
  return <BookingsListviewPage />;
}
