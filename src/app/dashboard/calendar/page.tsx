import React from "react";
import Calendar from "./_components/full-calendar";
import PageContainer from "@/components/layout/page-container";

export default function CalendarPage() {
  return (
    <PageContainer className="md:px-2" scrollable={true}>
      <Calendar />
    </PageContainer>
  );
}
