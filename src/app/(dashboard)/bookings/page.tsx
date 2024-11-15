import { Metadata } from "next";
import PageContainer from "@/components/layout/page-container";

import BookingsView from "./_components/bookings-view";

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <BookingsView />
    </PageContainer>
  );
}
