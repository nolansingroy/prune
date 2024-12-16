"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { EventInput } from "@/interfaces/event";

import CalendarForm from "../forms/calendar-form";
import { Client } from "@/interfaces/clients";

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    type: string;
    typeId: string;
    fee: number;
    client?: Client;
    clientId: string;
    clientName: string;
    clientPhone: string;
    coachId: string;
    description: string;
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
  }) => Promise<void>;
  showDateSelector?: boolean;
  event?: EventInput | null;
  editAll?: boolean;
  isLoading?: boolean;
}

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
          showDateSelector={true}
          event={event}
          onClose={onClose}
          onSave={onSave}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;
