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
import { EventInput } from "../interfaces/types"; // Adjust the import path as needed

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
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "Th" },
  { value: 5, label: "F" },
  { value: 6, label: "Sa" },
  { value: 0, label: "Su" },
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

  const removeUndefinedFields = (obj: any) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
  };

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const eventData = {
      title,
      description,
      location,
      isBackgroundEvent,
      startTime,
      endTime,
      recurrence: isRecurring
        ? removeUndefinedFields({
            daysOfWeek,
            startTime,
            endTime,
            startRecur,
            endRecur,
          })
        : undefined,
    };

    console.log("Event Data to Save:", eventData);
    onSave(eventData);
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
              Notes
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
          <div className="space-y-2">
            <Label className="block text-sm font-medium text-gray-700">
              Availability Event
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isBackgroundEvent}
                onCheckedChange={handleBackgroundChange}
                id="backgroundEventCheckbox"
              />
              <Label
                htmlFor="backgroundEventCheckbox"
                className="text-sm font-medium text-gray-700"
              >
                Is Availability Event
              </Label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Will show on calendar as background / Available time
            </p>
          </div>
          {/* <div>
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
          </div> */}
          {/* <div>
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
          </div> */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <Label className="text-sm font-medium text-gray-700">
                Start Time
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setStartTime(e.target.value)
                }
                className="w-32 px-2 py-2 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex flex-col">
              <Label className="text-sm font-medium text-gray-700">
                End Time
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEndTime(e.target.value)
                }
                className="w-32 px-2 py-2 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
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
                <div className="flex space-x-2">
                  {daysOfWeekOptions.map((day) => (
                    <div key={day.value} className="flex flex-col items-center">
                      <Checkbox
                        checked={daysOfWeek.includes(day.value)}
                        onCheckedChange={(checked) =>
                          handleDaysOfWeekChange(checked, day.value)
                        }
                      />
                      <Label className="mt-1">{day.label}</Label>
                    </div>
                  ))}
                </div>
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
