import React, { useState, ChangeEvent, MouseEvent } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    isBackgroundEvent: boolean;
    startTime: string;
    endTime: string;
  }) => void;
}

const EventFormDialog: React.FC<EventFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [isBackgroundEvent, setIsBackgroundEvent] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onSave({
      title,
      isBackgroundEvent,
      startTime,
      endTime,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Availability</DialogTitle>
          <DialogDescription>
            add your availability to the calendar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Availablity Title
            </Label>
            <Input
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Background Event
            </Label>
            <div>
              <Checkbox
                checked={isBackgroundEvent}
                onCheckedChange={(checked) =>
                  setIsBackgroundEvent(checked as boolean)
                }
              />
            </div>
          </div>
          {isBackgroundEvent && (
            <>
              <div>
                <Label className="block text-sm font-medium text-gray-700">
                  Start Time
                </Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setStartTime(e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700">
                  End Time
                </Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEndTime(e.target.value)
                  }
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;
