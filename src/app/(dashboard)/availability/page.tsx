import { Metadata } from "next";
import AvailabilityListviewPage from "./_components/availability-listview-page";

export const metadata = {
  title: "Dashboard : Availabitities",
};

export default function Page() {
  return <AvailabilityListviewPage />;
}
