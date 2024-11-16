import { Metadata } from "next";
import PageContainer from "@/components/layout/page-container";

import BookingsView from "./bookings-view";

export default function BookingsListviewPage() {
  return (
    <PageContainer scrollable>
      <BookingsView />
    </PageContainer>
  );
}
