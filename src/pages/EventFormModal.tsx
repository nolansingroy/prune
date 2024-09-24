"use client";
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
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EventInput } from "@/interfaces/types";

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    description: string;
    location: string;
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
  }) => void;
  showDateSelector?: boolean;
  event?: EventInput | null;
  editAll?: boolean;
}

const presetLocations = [
  { value: "Kraken 1", label: "Kraken 1" },
  { value: "Kraken 2", label: "Kraken 2" },
  { value: "Kraken 3", label: "Kraken 3" },
  { value: "location4", label: "Location 4" },
  { value: "location5", label: "Location 5" },
];

const EventFormDialog: React.FC<EventFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  showDateSelector = false,
  event,
  editAll = true,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(""); // Default location
  const [date, setDate] = useState("");
  const [isBackgroundEvent, setIsBackgroundEvent] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startRecur, setStartRecur] = useState("");
  const [endRecur, setEndRecur] = useState("");
  const [open, setOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState(presetLocations);

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setLocation(event.location || "");
      setIsBackgroundEvent(event.isBackgroundEvent || false);
      setDate(
        event.startDate ? event.startDate.toISOString().split("T")[0] : ""
      );
      setStartTime(
        event.start
          ? event.start
              .toLocaleTimeString("en-US", { hour12: false })
              .substring(0, 5)
          : ""
      );
      setEndTime(
        event.end
          ? event.end
              .toLocaleTimeString("en-US", { hour12: false })
              .substring(0, 5)
          : ""
      );
      if (event.recurrence) {
        setIsRecurring(true);
        setDaysOfWeek(event.recurrence.daysOfWeek || []);
        setStartRecur(event.recurrence.startRecur || "");
        setEndRecur(event.recurrence.endRecur || "");
      }
    }
  }, [event]);

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const eventData = {
      title,
      description,
      location,
      isBackgroundEvent,
      date: showDateSelector ? date : undefined,
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
    };

    onSave(eventData);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setLocation(""); // Reset to default location when closed
    setDate("");
    setIsBackgroundEvent(true);
    setStartTime("");
    setEndTime("");
    setIsRecurring(false); // Reset to false to avoid unintended recurring events
    setDaysOfWeek([]);
    setStartRecur("");
    setEndRecur("");
    onClose();
  };

  const handleLocationSelect = (currentValue: string) => {
    setLocation(currentValue);
    setOpen(false);
  };

  const handleLocationInputChange = (value: string) => {
    setLocation(value);

    const filtered = presetLocations.filter((loc) =>
      loc.label.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredLocations(filtered);
  };

  const handleLocationInputKeyPress = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      // When the Enter key is pressed, close the popover and save the input
      setOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="modal-content">
        <DialogHeader>
          <DialogTitle>
            {editAll ? "Edit All Instances" : "Create Availability"}
          </DialogTitle>
          <DialogDescription>
            {editAll
              ? "Edit all instances of this recurring event"
              : "Edit this availability event"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Title
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

          {/* <div>
            <Label className="block text-sm font-medium text-gray-700">
              Location
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                asChild
                className="w-[200px] p-0 popover-above-modal"
              >
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[200px] justify-between pl-4"
                >
                  {location
                    ? presetLocations.find((loc) => loc.value === location)
                        ?.label || location
                    : "Select location..."}
                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 popover-above-modal">
                <Command>
                  <CommandInput
                    placeholder="Search location..."
                    value={location}
                    onValueChange={handleLocationInputChange}
                    onKeyDown={handleLocationInputKeyPress} // Added listener for pressing Enter
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>Press Enter to Add.</CommandEmpty>
                    <CommandGroup>
                      {filteredLocations.map((loc) => (
                        <CommandItem
                          key={loc.value}
                          value={loc.value}
                          onSelect={() => handleLocationSelect(loc.value)}
                        >
                          {loc.label}
                          <CheckIcon
                            className={`ml-auto h-4 w-4 ${
                              location === loc.value
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div> */}

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Location
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[200px] justify-between"
                  onClick={() => setOpen(!open)} // Toggle popover on click
                >
                  {location
                    ? presetLocations.find((loc) => loc.value === location)
                        ?.label || location
                    : "Select location..."}
                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 popover-above-modal">
                <Command>
                  <CommandInput
                    placeholder="Search location..."
                    value={location}
                    onValueChange={handleLocationInputChange}
                    onKeyDown={handleLocationInputKeyPress} // Handle keyboard input
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No locations found.</CommandEmpty>
                    <CommandGroup>
                      {filteredLocations.map((loc) => (
                        <CommandItem
                          key={loc.value}
                          value={loc.value}
                          onSelect={() => {
                            handleLocationSelect(loc.value); // Set location
                            setOpen(false); // Close the popover after selection
                          }}
                        >
                          {loc.label}
                          <CheckIcon
                            className={`ml-auto h-4 w-4 ${
                              location === loc.value
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="block text-sm font-medium text-gray-700">
              Availability Event
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isBackgroundEvent}
                onCheckedChange={(checked) =>
                  setIsBackgroundEvent(checked !== "indeterminate" && checked)
                }
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

          <div className="space-y-2">
            <Label className="block text-sm font-medium text-gray-700">
              Recurring Event
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isRecurring}
                onCheckedChange={(checked) =>
                  setIsRecurring(checked !== "indeterminate" && checked)
                }
                id="recurringEventCheckbox"
              />
              <Label
                htmlFor="recurringEventCheckbox"
                className="text-sm font-medium text-gray-700"
              >
                Is Recurring
              </Label>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDate(e.target.value)
                }
                className="px-2 py-2 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex flex-col">
              <Label className="text-sm font-medium text-gray-700">
                Start Time
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEndTime(e.target.value)
                }
                className="w-32 px-2 py-2 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
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
