"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { EventInput } from "@/interfaces/types";

import CalendarForm from "../forms/calendar-form";

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    type: string;
    typeId: string;
    fee: number;
    clientId: string;
    clientName: string;
    description: string;
    // location: string;
    isBackgroundEvent: boolean;
    date?: string;
    startTime: string;
    endTime: string;
    paid: boolean;
    recurrence?: {
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      startRecur: string;
      endRecur: string;
    };
  }) => void;
  showDateSelector?: boolean;
  event?: EventInput | null;
  editAll?: boolean;
  isLoading?: boolean;
}

// const presetLocations = [
//   { value: "Kraken 1", label: "Kraken 1" },
//   { value: "Kraken 2", label: "Kraken 2" },
//   { value: "Kraken 3", label: "Kraken 3" },
//   { value: "location4", label: "Location 4" },
//   { value: "location5", label: "Location 5" },
// ];

const EventFormDialog: React.FC<EventFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  showDateSelector = true,
  event,
  editAll = false,
  isLoading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-content overflow-y-auto max-h-full h-full overflow-x-auto w-11/12 sm:max-w-md sm:max-h-[80vh] sm:h-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <CalendarForm
          showDateSelector={showDateSelector}
          event={event}
          onClose={onClose}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;
