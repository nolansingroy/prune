import React, { useState, ChangeEvent, MouseEvent, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventInput } from "@/interfaces/types";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AvailabilitiesForm from "../forms/availabilities-form";

interface AvailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    description: string;
    isBackgroundEvent: boolean;
    date?: string;
    startTime: string;
    endTime: string;
    recurrence?: {
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      startRecur: string;
      endRecur: string;
    };
  }) => Promise<void>;
  event?: Omit<EventInput, "fee"> | null;
  isLoading?: boolean;
}

const AvailabilityDialog: React.FC<AvailabilityDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  isLoading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-y-auto max-h-full h-full overflow-x-auto w-11/12 sm:max-w-md sm:max-h-[80vh] sm:h-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Edit Availability" : "New Availability"}
          </DialogTitle>
          <DialogDescription>
            {event
              ? "Edit this availability event"
              : "Create a new availability event"}
          </DialogDescription>
        </DialogHeader>
        <AvailabilitiesForm
          isOpen={isOpen}
          onClose={onClose}
          onSave={onSave}
          event={event}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilityDialog;
