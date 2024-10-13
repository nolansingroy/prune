// dialgog in Calendar Tab

"use client";
import React, {
  useState,
  ChangeEvent,
  MouseEvent,
  useEffect,
  useCallback,
} from "react";
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
import { Switch } from "@headlessui/react";
import { BookingTypes } from "@/interfaces/bookingTypes";
import { fetchBookingTypes } from "@/lib/converters/bookingTypes";
import { useFirebaseAuth } from "@/services/authService";
import { B } from "@fullcalendar/core/internal-common";

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    fee: number;
    description: string;
    location: string;
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
  showDateSelector = true,
  event,
  editAll = true,
}) => {
  const { authUser } = useFirebaseAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [isBackgroundEvent, setIsBackgroundEvent] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startRecur, setStartRecur] = useState("");
  const [endRecur, setEndRecur] = useState("");
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState(presetLocations);
  const [paid, setPaid] = useState(false); // Defaults to false (Unpaid)
  const [bookingsPopoverOpen, setBookingsPopoverOpen] = useState(false);
  const [bookingType, setBookingType] = useState("");
  const [bookingTypes, setBookingTypes] = useState<
    { value: string; label: string; fee: number }[]
  >([]);
  const [filteredBookings, setFilteredBookings] = useState<
    { value: string; label: string; fee: number }[]
  >([]);
  const [bookingFee, setBookingFee] = useState<string>("");

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setLocation(event.location || "");
      setIsBackgroundEvent(event.isBackgroundEvent || true);
      setPaid(event.paid || false);
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

  const fetchBookings = useCallback(async () => {
    if (authUser) {
      // Fetching booking types from Firestore
      const types = await fetchBookingTypes(authUser.uid);
      let presetBookings: { value: string; label: string; fee: number }[] = [];
      types.forEach((type) => {
        presetBookings.push({
          value: type.name,
          label: type.name,
          fee: type.fee,
        });
      });
      setBookingTypes(presetBookings);
      setFilteredBookings(presetBookings);
      console.log("Booking types from firebase:", types);
    }
  }, [authUser]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Update filtered bookings when bookingType changes
  useEffect(() => {
    if (bookingType === "") {
      setFilteredBookings(bookingTypes); // Reset to full list when input is cleared
    } else {
      setFilteredBookings(
        bookingTypes.filter((book) =>
          book.label.toLowerCase().includes(bookingType.toLowerCase())
        )
      );
    }
  }, [bookingType, bookingTypes]);

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const eventData = {
      title: isBackgroundEvent ? title : bookingType,

      fee: !isBackgroundEvent ? parseInt(bookingFee) : 0,
      description,
      location,
      isBackgroundEvent,
      date: showDateSelector ? date : undefined,
      startTime,
      endTime,
      paid,
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

    console.log("Event data to passed from dialoge:", eventData);
    onSave(eventData);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setDate("");
    setIsBackgroundEvent(true);
    setStartTime("");
    setEndTime("");
    setIsRecurring(false); // Reset to false to avoid unintended recurring events
    setDaysOfWeek([]);
    setStartRecur("");
    setEndRecur("");
    setBookingType("");
    setBookingFee("");
    onClose();
  };

  const handleLocationSelect = (currentValue: string) => {
    setLocation(currentValue);
    setLocationPopoverOpen(false);
  };

  const handleBookingTypeSelect = (value: string, fee: number) => {
    setBookingType(value);
    setBookingFee(fee.toString());
    setBookingsPopoverOpen(false); // Close the popover after selection
  };

  const handleLocationInputChange = (value: string) => {
    setLocation(value);

    const filtered = presetLocations.filter((loc) =>
      loc.label.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredLocations(filtered);
  };

  const handelBookingTypeInputChange = (value: string) => {
    setBookingType(value);
    setBookingFee("");

    const filtered = filteredBookings.filter((book) =>
      book.label.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredBookings(filtered);
  };

  const handleLocationInputKeyPress = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      setLocationPopoverOpen(false);
    }
  };

  const handelBookingTypeInputKeyPress = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      setBookingsPopoverOpen(false);
    }
  };

  const handleBookingFeeInputChange = (value: string) => {
    setBookingFee(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="modal-content">
        <DialogHeader>
          <DialogTitle>
            {editAll
              ? "Edit All Instances"
              : isBackgroundEvent
              ? "Create Availability"
              : "Create Booking"}
          </DialogTitle>
          {/* <DialogDescription>
            {editAll
              ? "Edit all instances of this recurring event"
              : isBackgroundEvent
              ? "Edit this availability event"
              : "Edit this booking event"}
          </DialogDescription> */}
        </DialogHeader>

        {/* Event Type Toggle (Create Availability / Create Booking) */}
        <div className="space-y-2">
          <Label className="block text-sm font-medium text-gray-700">
            Event Type
          </Label>
          <div className="space-y-2">
            {/* <p className="mt-2 text-sm text-gray-500">
              Select to set the event as Availability or Booking.
            </p> */}
            <div className="flex items-center">
              <input
                type="radio"
                name="eventType"
                value="availability"
                checked={isBackgroundEvent}
                onChange={() => setIsBackgroundEvent(true)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Create Availability
              </span>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                name="eventType"
                value="booking"
                checked={!isBackgroundEvent}
                onChange={() => setIsBackgroundEvent(false)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Create Booking
              </span>
            </div>
          </div>
        </div>

        {/* Payment Status Toggle - Conditionally Rendered */}
        {!isBackgroundEvent && (
          <div className="space-y-2">
            <Label className="block text-sm font-medium text-gray-700">
              Payment Status
            </Label>
            {/* <p className="mt-2 text-sm text-gray-500">
              Toggle to set the event as Paid or Unpaid.
            </p> */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {paid ? "Paid" : "Unpaid"}
              </span>
              <Switch
                checked={paid}
                onChange={setPaid}
                className={`${
                  paid ? "bg-blue-600" : "bg-gray-200"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
              >
                <span
                  className={`${
                    paid ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform bg-white rounded-full transition-transform`}
                />
              </Switch>
            </div>
          </div>
        )}

        {/* Booking type select - Conditionally Rendered */}
        {!isBackgroundEvent && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="block text-sm font-medium text-gray-700">
                Select or type in Custom Booking Type
              </Label>
              <Popover
                open={bookingsPopoverOpen}
                onOpenChange={setBookingsPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={bookingsPopoverOpen}
                    className="w-[200px] justify-between"
                    onClick={() => setBookingsPopoverOpen(!bookingsPopoverOpen)} // Toggle popover on click
                  >
                    {bookingType
                      ? filteredBookings.find(
                          (book) => book.value === bookingType
                        )?.label || bookingType
                      : "Select booking type..."}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 popover-above-modal">
                  <Command>
                    <CommandInput
                      placeholder="Search types..."
                      value={bookingType}
                      onValueChange={handelBookingTypeInputChange}
                      onKeyDown={handelBookingTypeInputKeyPress} // Handle keyboard input
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No types found.</CommandEmpty>
                      <CommandGroup>
                        {filteredBookings.map((book) => (
                          <CommandItem
                            key={book.value}
                            value={book.value}
                            onSelect={() => {
                              handleBookingTypeSelect(book.value, book.fee); // Set location
                              setBookingsPopoverOpen(false); // Close the popover after selection
                            }}
                          >
                            {book.label}
                            <CheckIcon
                              className={`ml-auto h-4 w-4 ${
                                bookingType === book.value
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

            {/* Booking Fee Input */}
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-gray-700">
                Fee
              </Label>
              <Input
                type="number"
                value={bookingFee || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleBookingFeeInputChange(e.target.value)
                }
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Title Input */}
          {isBackgroundEvent && (
            <div className="space-y-2">
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
          )}
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
            <Popover
              open={locationPopoverOpen}
              onOpenChange={setLocationPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={locationPopoverOpen}
                  className="w-[200px] justify-between"
                  onClick={() => setLocationPopoverOpen(!open)} // Toggle popover on click
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
                            setLocationPopoverOpen(false); // Close the popover after selection
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

          {/* Recurring Event Toggle (Single Event / Recurring Event) */}
          <div className="space-y-2">
            <Label className="block text-sm font-medium text-gray-700">
              Recurring Event
            </Label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="recurringEvent"
                  value="single"
                  checked={!isRecurring}
                  onChange={() => setIsRecurring(false)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Single Event
                </span>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="recurringEvent"
                  value="recurring"
                  checked={isRecurring}
                  onChange={() => setIsRecurring(true)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Recurring Event
                </span>
              </div>
            </div>
          </div>

          {/* Conditional Rendering for Recurring Event */}
          {isRecurring && (
            <>
              <div>
                <Label className="block text-sm font-medium text-gray-700">
                  Days of Week
                </Label>
                <div className="flex space-x-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div key={day} className="flex flex-col items-center">
                      <Checkbox
                        checked={daysOfWeek.includes(day)}
                        onCheckedChange={(checked) =>
                          setDaysOfWeek((prev) =>
                            checked
                              ? [...prev, day]
                              : prev.filter((d) => d !== day)
                          )
                        }
                      />
                      <Label className="mt-1">
                        {["Su", "M", "T", "W", "Th", "F", "Sa"][day]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="flex flex-col">
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
                <div className="flex flex-col">
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
              </div>
            </>
          )}

          {/* Date and Time Inputs */}
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
