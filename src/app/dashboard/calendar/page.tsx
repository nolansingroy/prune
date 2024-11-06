import React from "react";
import PageContainer from "@/components/layout/page-container";
import FullCalendarComponent from "./_components/full-calendar";

export default function CalendarPage() {
  return (
    <PageContainer className="md:px-0" scrollable={true}>
      <FullCalendarComponent />
    </PageContainer>
  );
}
