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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    description: string;
    location: string;
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
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isBackgroundEvent, setIsBackgroundEvent] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const presetLocations = ["Kraken 1", "Kraken 2", "Kraken 3"];

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onSave({
      title,
      description,
      location,
      isBackgroundEvent,
      startTime,
      endTime,
    });
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setIsBackgroundEvent(true);
    setStartTime("");
    setEndTime("");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Availability</DialogTitle>
          <DialogDescription>
            Add your availability to the calendar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Availability Title
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
              Description
            </Label>
            <Input
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Location
            </Label>
            <Select onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {presetLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button variant="secondary" onClick={handleClose}>
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
