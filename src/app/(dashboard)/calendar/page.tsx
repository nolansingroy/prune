import React from "react";
import PageContainer from "@/components/layout/page-container";
import FullCalendarComponent from "./_components/full-calendar";
import { getDecodedToken } from "@/lib/helpers/tokens";

export default async function CalendarPage() {
  const tokens = await getDecodedToken();
  console.log(tokens);

  return (
    <PageContainer className="md:px-0" scrollable={true}>
      <FullCalendarComponent />
    </PageContainer>
  );
}
