"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

export default function Calendar() {
  function output() {
    console.log("Hello, Calendar Page!");
  }

  return (
    <>
      <div>
        <h1>Hello, Calendar Page!</h1>
      </div>
      <div>
        <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth" />
      </div>
    </>
  );
}
