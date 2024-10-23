import { EventContentArg } from "@fullcalendar/core";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import React from "react";

const renderContent = (eventInfo: EventContentArg, tippyInstances: Map<string, any>) => {
  const { isBackgroundEvent, clientName, title, description, paid, type } =
    eventInfo.event.extendedProps;

  const backgroundColor = eventInfo.backgroundColor || "#000000";
  const viewType = eventInfo.view.type;
  const isMonthView = viewType.includes("dayGridMonth");

  const renderMonthViewEvent = () => {
    const defaultStartTimeUTC = new Date(eventInfo.event.startStr);
    const timezoneOffsetHours = -(new Date().getTimezoneOffset() / 60);
    const defaultStartTimeLocal = new Date(defaultStartTimeUTC);
    defaultStartTimeLocal.setHours(
      defaultStartTimeUTC.getHours() - timezoneOffsetHours
    );

    const formattedStartTime = defaultStartTimeLocal.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );

    return (
      <div className="flex gap-1 items-center w-full overflow-hidden">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor }}
        ></div>
        <div className="flex items-center truncate w-full">
          <span className="text-xs">{formattedStartTime}</span>
          <span className="text-xs truncate ml-2">{clientName}</span>
        </div>
      </div>
    );
  };

  const renderDefaultEvent = () => (
    <div>
      <span
        className="underline"
        ref={(el) => {
          if (el) {
            const existingInstance = tippyInstances.get(eventInfo.event.id);
            if (existingInstance) {
              existingInstance.destroy();
            }

            const tippyInstance = tippy(el, {
              trigger: "mouseenter",
              touch: "hold",
              allowHTML: true,
              content: `
                <div class="tippy-content">
                  <p class="${paid ? "paid-status" : "unpaid-status"}">
                    <strong>${paid ? "Paid" : "Unpaid"}</strong>
                  </p>
                  <p><strong>Notes:</strong> ${description}</p>
                </div>
              `,
              theme: "custom",
            });

            tippyInstances.set(eventInfo.event.id, tippyInstance);
          }
        }}
      >
        <span className="flex items-center truncate w-full">
          {clientName || "No name"}
        </span>
      </span>
    </div>
  );

  if (isMonthView && !isBackgroundEvent) {
    return renderMonthViewEvent();
  }

  return renderDefaultEvent();
};

export default renderContent;