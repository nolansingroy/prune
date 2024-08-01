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
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";

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
    recurrence?: {
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      startRecur: string;
      endRecur: string;
    };
  }) => void;
}

const daysOfWeekOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

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
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startRecur, setStartRecur] = useState("");
  const [endRecur, setEndRecur] = useState("");

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
      recurrence: isRecurring
        ? {
            daysOfWeek,
            startTime,
            endTime,
            startRecur,
            endRecur,
          }
        : undefined,
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
    setIsRecurring(false);
    setDaysOfWeek([]);
    setStartRecur("");
    setEndRecur("");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

  const handleDaysOfWeekChange = (checked: CheckedState, value: number) => {
    setDaysOfWeek((prev) =>
      checked ? [...prev, value] : prev.filter((d) => d !== value)
    );
  };

  const handleCheckedChange = (checked: CheckedState) => {
    if (checked !== "indeterminate") {
      setIsRecurring(checked);
    }
  };

  const handleBackgroundChange = (checked: CheckedState) => {
    if (checked !== "indeterminate") {
      setIsBackgroundEvent(checked);
    }
  };

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
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Background Event
            </Label>
            <Checkbox
              checked={isBackgroundEvent}
              onCheckedChange={handleBackgroundChange}
            >
              Is Background Event
            </Checkbox>
          </div>
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
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Recurring Event
            </Label>
            <Checkbox
              checked={isRecurring}
              onCheckedChange={handleCheckedChange}
            >
              Is Recurring Event
            </Checkbox>
          </div>
          {isRecurring && (
            <>
              <div>
                <Label className="block text-sm font-medium text-gray-700">
                  Days of Week
                </Label>
                {daysOfWeekOptions.map((day) => (
                  <Checkbox
                    key={day.value}
                    checked={daysOfWeek.includes(day.value)}
                    onCheckedChange={(checked) =>
                      handleDaysOfWeekChange(checked, day.value)
                    }
                  >
                    {day.label}
                  </Checkbox>
                ))}
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700">
                  Start Recurrence
                </Label>
                <Input
                  type="date"
                  value={startRecur}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setStartRecur(e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700">
                  End Recurrence
                </Label>
                <Input
                  type="date"
                  value={endRecur}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEndRecur(e.target.value)
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
