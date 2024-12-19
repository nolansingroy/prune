// dialgog in Bookings Tab
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { EventInput } from "@/interfaces/event";

import BookingsForm from "../forms/bookings-form";

interface CreateBookingsFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (eventId: string, action: string) => void;
  onSave: (
    eventData: {
      id?: string;
      title: string;
      type: string;
      typeId: string;
      fee: number;
      clientId: string;
      clientName: string;
      coachId: string;
      description: string;
      // location: string;
      isBackgroundEvent: boolean; // Automatically false for regular bookings
      originalEventId: string;
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
    },
    eventId?: string
  ) => Promise<void>;
  showDateSelector?: boolean;
  event?: EventInput | null;
  editAll?: boolean;
  eventId?: string;
  isLoading?: boolean;
}

const CreateBookingsFormDialog: React.FC<CreateBookingsFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  showDateSelector = true,
  event,
  editAll,
  eventId,
  isLoading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-y-auto max-h-full h-full overflow-x-auto w-11/12 sm:max-w-md sm:max-h-[80vh] sm:h-auto">
        <BookingsForm
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
          event={event}
          editAll={editAll}
          eventId={eventId}
          isLoading={isLoading}
          showDateSelector={showDateSelector}
          isOpen={isOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateBookingsFormDialog;
