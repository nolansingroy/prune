import {
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { fetchBookingTypes } from "@/lib/converters/bookingTypes";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { fetchClients } from "@/lib/converters/clients";
import { Switch } from "@headlessui/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import FormDeleteButton from "../buttons/form-delete-btn";
import FormDeleteSeriesButton from "../buttons/form-delete-series-btn";
import FormCancelButton from "../buttons/form-cancel-btn";
import FormSubmitButton from "../buttons/form-submit-btn";

const today = new Date();
const formattedDate = today.toLocaleDateString("en-CA"); // YYYY-MM-DD format

const startTimeToday = new Date(today.setHours(8, 0, 0, 0))
  .toLocaleTimeString("en-US", { hour12: false })
  .substring(0, 5); // "08:00"

const endTimeToday = new Date(today.setHours(9, 0, 0, 0))
  .toLocaleTimeString("en-US", { hour12: false })
  .substring(0, 5); // "09:00"

interface BookingsFormProps {
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
  ) => void;
  showDateSelector?: boolean;
  event?: EventInput | null;
  editAll?: boolean;
  eventId?: string;
  isLoading?: boolean;
}

export default function BookingsForm({
  isOpen,
  onClose,
  onSave,
  onDelete,
  showDateSelector = true,
  event,
  editAll,
  eventId,
  isLoading,
}: BookingsFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(formattedDate);
  const [startTime, setStartTime] = useState(startTimeToday);
  const [endTime, setEndTime] = useState(endTimeToday);
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startRecur, setStartRecur] = useState(formattedDate);
  const [endRecur, setEndRecur] = useState(formattedDate);
  // Location state
  // const [location, setLocation] = useState("");
  // const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  // const [filteredLocations, setFilteredLocations] = useState(presetLocations);
  // Payment status state
  const [paid, setPaid] = useState(false); // Defaults to false (Unpaid)
  // booking fee state
  const [bookingFee, setBookingFee] = useState<string>("");
  // Booking type state
  const [bookingsPopoverOpen, setBookingsPopoverOpen] = useState(false);
  const [bookingType, setBookingType] = useState("");
  const [bookingTypes, setBookingTypes] = useState<
    {
      value: string;
      label: string;
      fee: number;
      color: string;
      docId: string;
    }[]
  >([]);
  const [filteredBookings, setFilteredBookings] = useState<
    {
      value: string;
      label: string;
      fee: number;
      color: string;
      docId: string;
    }[]
  >([]);
  const [typeId, setTypeId] = useState<string>("");
  const [bookingColor, setBookingColor] = useState<string>("");

  // clients state
  const [clientsPopoverOpen, setClientsPopoverOpen] = useState(false);
  const [client, setClient] = useState("");
  const [clients, setClients] = useState<
    { value: string; label: string; docId: string }[]
  >([]);
  const [filteredClients, setFilteredClients] = useState<
    { value: string; label: string; docId: string }[]
  >([]);
  const [clientId, setClientId] = useState<string>("");
  const [originalEventId, setOriginalEventId] = useState<string>("");

  useEffect(() => {
    console.log("Event in CreateBookingsDialog", event);
    console.log("eventId : " + originalEventId);
    if (event) {
      setOriginalEventId(event._def?.extendedProps?.originalEventId || "");
      setTitle(event.title || "");
      setClient(event.clientName || "");
      setClientId(event.clientId || "");
      setBookingType(event.type || "");
      setTypeId(event.typeId || "");
      setDescription(event.description || "");
      setBookingFee(event.fee ? event.fee.toString() : "");
      // setLocation(event.location || "");
      setPaid(event.paid || false);
      setDate(
        event.startDate
          ? event.startDate.toLocaleDateString("en-CA") // Formats date as YYYY-MM-DD in local time
          : ""
      );
      setStartTime(
        event.start
          .toLocaleTimeString("en-US", { hour12: false })
          .substring(0, 5)
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
  }, [event, isOpen]);

  // handle startRecur change when date changes
  useEffect(() => {
    setStartRecur(date);
  }, [date]);

  const fetchBookings = useCallback(async () => {
    if (user) {
      // Fetching booking types from Firestore
      const types = await fetchBookingTypes(user.uid);
      let presetBookings: {
        value: string;
        label: string;
        fee: number;
        color: string;
        docId: string;
      }[] = [];
      types.forEach((type) => {
        presetBookings.push({
          value: type.name,
          label: type.name,
          fee: type.fee,
          color: type.color,
          docId: type.docId!,
        });
      });
      setBookingTypes(presetBookings);
      setFilteredBookings(presetBookings);
      // console.log("Booking types from firebase:", types);
    }
  }, [user]);

  const fetchAllClients = useCallback(async () => {
    if (user) {
      // Fetching clients from Firestore
      const clients = await fetchClients(user.uid);
      let presetClients: { value: string; label: string; docId: string }[] = [];
      clients.forEach((cli) => {
        presetClients.push({
          // value: cli.docId,
          // label: cli.docId,
          value: cli.firstName + " " + cli.lastName,
          label: cli.firstName + " " + cli.lastName,
          docId: cli.docId,
        });
      });
      setClients(presetClients);
      setFilteredClients(presetClients);
      console.log("Clients from firebase:", clients);
    }
  }, [user]);

  // useEffect(() => {
  //   console.log("booking type", bookingType);
  // }, [bookingType]);

  // fetch booking types
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchAllClients();
  }, [fetchAllClients]);

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
      const color = bookingTypes.find((book) => book.value === bookingType);
      setBookingColor(color?.color || "#000000");
    }
  }, [bookingType, bookingTypes]);

  // Update filtered clients when client changes
  useEffect(() => {
    if (client === "") {
      setFilteredClients(clients); // Reset to full list when input is cleared
    } else {
      setFilteredClients(
        clients.filter((cli) =>
          cli.label.toLowerCase().includes(client.toLowerCase())
        )
      );
    }
  }, [client, clients]);

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    console.log("handle Save triggered...");
    e.preventDefault();

    const originalEvent = event || {}; // Use an empty object if event is null

    const getUpdatedValues = (original: any, updated: any) => {
      return Object.keys(updated).reduce((acc, key) => {
        if (updated[key] !== original[key]) {
          acc[key] = updated[key];
        }
        return acc;
      }, {} as any);
    };

    // Initial event data
    let newEventData = {
      id: eventId,
      title: bookingType,
      type: bookingType,
      typeId: typeId || "",
      fee: parseFloat(bookingFee),
      clientId: clientId || "",
      clientName: client || "",
      description: description,
      // location: location,
      isBackgroundEvent: false, // Always false for regular bookings
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

    // here you can handle any update case you want

    const updatedEventData = getUpdatedValues(originalEvent, newEventData);

    const eventData = eventId
      ? editAll
        ? newEventData // Update all fields
        : updatedEventData // Update only changed fields
      : newEventData; // Create new event

    console.log("Event passed from bookings dialog", eventData);
    console.log("date from bookings dialog", eventData.date);
    console.log("start time from bookings dialog", eventData.startTime);
    console.log("end time from bookings dialog", eventData.endTime);

    onSave(eventData, event?.id);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    // setLocation("");
    setDate(formattedDate);
    setStartTime(startTimeToday);
    setEndTime(endTimeToday);
    setIsRecurring(false); // Reset to false to avoid unintended recurring events
    setDaysOfWeek([]);
    setStartRecur(formattedDate);
    setEndRecur(formattedDate);
    setBookingType("");
    setTypeId("");
    setBookingFee("");
    setClient("");
    setClientId("");
    setPaid(false);
    onClose();
  };

  // location functions

  // const handleLocationSelect = (currentValue: string) => {
  //   setLocation(currentValue);
  //   setLocationPopoverOpen(false);
  // };

  // const handleLocationInputChange = (value: string) => {
  //   setLocation(value);

  //   const filtered = presetLocations.filter((loc) =>
  //     loc.label.toLowerCase().includes(value.toLowerCase())
  //   );
  //   setFilteredLocations(filtered);
  // };

  // const handleLocationInputKeyPress = (
  //   event: React.KeyboardEvent<HTMLInputElement>
  // ) => {
  //   if (event.key === "Enter") {
  //     setLocationPopoverOpen(false);
  //   }
  // };

  // booking type functions
  const handleBookingTypeSelect = (
    value: string,
    fee: number,
    color: string,
    docId: string
  ) => {
    console.log("type id selected:", docId);
    console.log("type selected:", value);
    setBookingType(value);
    setTypeId(docId);
    setBookingFee(fee.toString());
    setBookingColor(color);
    setBookingsPopoverOpen(false); // Close the popover after selection
  };

  const handelBookingTypeInputChange = (value: string) => {
    setBookingType(value);
    setBookingFee("");

    const filtered = filteredBookings.filter((book) =>
      book.label.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredBookings(filtered);
  };

  const handelBookingTypeInputKeyPress = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      // handle the case where the user presses enter on a booking type that is not in the list
      handleBookingTypeSelect(bookingType, 0, "", "");
      setBookingsPopoverOpen(false);
    }
  };

  // handle the case where the user clicks outside the popover and typed a client name that is not in the list and clicked outside the popover
  const handlePopoverCloseBooking = () => {
    if (!filteredBookings.find((book) => book.value === bookingType)) {
      handleBookingTypeSelect(bookingType, 0, "", ""); // Set the client with the typed name if it's not in the list
    }
    setClientsPopoverOpen(false);
  };

  // Fee input functions
  const handleBookingFeeInputChange = (value: string) => {
    setBookingFee(value);
  };

  // client functions

  const handleClientSelect = (value: string, docId: string) => {
    console.log("Client id selected:", docId);
    console.log("Client selected:", value);
    setClient(value);
    setClientId(docId);
    setClientsPopoverOpen(false);
  };

  const handleClientInputChange = (value: string) => {
    setClient(value);

    const filtered = clients.filter((cli) =>
      cli.label.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredClients(filtered);
  };

  const handleClientInputKeyPress = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      // handle the case where the user presses enter on a client name that is not in the list
      handleClientSelect(client, "");
      // close the popover
      setClientsPopoverOpen(false);
    }
  };

  // handle the case where the user clicks outside the popover and typed a client name that is not in the list and clicked outside the popover
  const handlePopoverClose = () => {
    if (!filteredClients.find((cli) => cli.value === client)) {
      handleClientSelect(client, ""); // Set the client with the typed name if it's not in the list
    }
    setClientsPopoverOpen(false);
  };

  // handle the date change
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);

    // If the event is recurring, set the start recurrence date to the selected date
    if (isRecurring) {
      setStartRecur(selectedDate);
    }
  };

  // delete a single event
  // create a function to delete a single event by passing the event id to the onDelete

  const handleDeleteSingle = (id: string) => {
    if (onDelete) {
      onDelete(id, "single");
      handleClose;
    }
  };

  // delete a series of events
  // create a function to delete a series of events by passing the original event id to the onDelete

  const handleDeleteSeries = (id: string) => {
    if (onDelete) {
      onDelete(id, "series");
      handleClose;
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-4">
          <DialogTitle>
            {editAll ? "Edit Booking" : "Create Booking"}
          </DialogTitle>
          {editAll && event && (
            <div>
              {!originalEventId && <></>}
              {originalEventId && (
                <Badge
                  className="ml-2 py-0 px-1"
                  style={{
                    backgroundColor: `${bookingColor}33`, // 33 for 20% opacity
                    color: bookingColor,
                  }}
                >
                  {<span className="text-sm font-bold">Series</span>}
                </Badge>
              )}
              {event.recurrence && (
                <Badge
                  className="ml-2 py-0 px-1"
                  style={{
                    backgroundColor: `${bookingColor}33`, // 33 for 20% opacity
                    color: bookingColor,
                  }}
                >
                  {<span className="text-sm font-bold">Series</span>}
                </Badge>
              )}
            </div>
          )}
        </div>
      </DialogHeader>
      <form>
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="block text-sm font-medium text-gray-700">
                Select or type in Client
              </Label>
              <Popover
                open={clientsPopoverOpen}
                onOpenChange={(open) => {
                  if (!open) handlePopoverClose();
                  setClientsPopoverOpen(open);
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientsPopoverOpen}
                    className="w-[200px] justify-between text-base input-no-zoom" // Apply custom class
                    onClick={() => setClientsPopoverOpen(!clientsPopoverOpen)} // Toggle popover on click
                  >
                    {client
                      ? filteredClients.find((cli) => cli.value === client)
                          ?.label || client
                      : "Select client..."}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 popover-above-modal">
                  <Command>
                    <CommandInput
                      placeholder="Search clients..."
                      value={client}
                      onValueChange={handleClientInputChange}
                      onKeyDown={handleClientInputKeyPress} // Handle keyboard input
                      className="h-9 text-base input-no-zoom" // Apply custom class
                    />
                    <CommandList>
                      <CommandEmpty>No clients found.</CommandEmpty>
                      <CommandGroup>
                        {filteredClients.map((cli) => (
                          <CommandItem
                            key={cli.value}
                            value={cli.value}
                            onSelect={() => {
                              handleClientSelect(cli.value, cli.docId);
                              setClientsPopoverOpen(false);
                            }}
                          >
                            {cli.label}
                            <CheckIcon
                              className={`ml-auto h-4 w-4 ${
                                client === cli.value
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
                Payment Status
              </Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {paid ? "Paid" : "Unpaid"}
                </span>
                <Switch
                  checked={paid}
                  onChange={setPaid}
                  className={`${
                    paid ? "bg-rebus-green" : "bg-gray-200"
                  } relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none`}
                >
                  <span
                    className={`${
                      paid ? "translate-x-8" : "translate-x-1"
                    } inline-block h-6 w-6 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="block text-sm font-medium text-gray-700">
                Select or type in Custom Booking Type
              </Label>
              <Popover
                open={bookingsPopoverOpen}
                onOpenChange={(open) => {
                  if (!open) handlePopoverCloseBooking();
                  setBookingsPopoverOpen(open);
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={bookingsPopoverOpen}
                    className="w-[200px] justify-between text-base input-no-zoom" // Apply custom class
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
                      className="h-9 text-base input-no-zoom" // Apply custom class
                    />
                    <CommandList>
                      <CommandEmpty>No types found.</CommandEmpty>
                      <CommandGroup>
                        {filteredBookings.map((book) => (
                          <CommandItem
                            key={book.value}
                            value={book.value}
                            onSelect={() => {
                              handleBookingTypeSelect(
                                book.value,
                                book.fee,
                                book.color,
                                book.docId
                              );
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
                className="text-base input-no-zoom" // Apply custom class
              />
            </div>
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
              className="text-base input-no-zoom" // Apply custom class
            />
          </div>

          {!editAll && (
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-gray-700">
                Recurring Booking
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRecurring}
                  onCheckedChange={(checked: any) =>
                    setIsRecurring(checked !== "indeterminate" && checked)
                  }
                  id="recurringBookingCheckbox"
                />
                <Label
                  htmlFor="recurringBookingCheckbox"
                  className="text-sm font-medium text-gray-700"
                >
                  Is Recurring
                </Label>
              </div>
            </div>
          )}

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Date
            </Label>
            <Input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="text-base input-no-zoom" // Apply custom class
            />
          </div>

          <div className="flex items-center space-x-6">
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
                className="w-32 px-2 py-2 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-base input-no-zoom" // Apply custom class
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
                className="w-32 px-2 py-2 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-base input-no-zoom" // Apply custom class
              />
            </div>
          </div>

          {isRecurring && !editAll && (
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
                        onCheckedChange={(checked: any) =>
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
                    disabled
                    className="text-base input-no-zoom" // Apply custom class
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
                    className="text-base input-no-zoom" // Apply custom class
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <div
          className={cn(
            "flex flex-col-reverse space-y-2 pt-5 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2",
            editAll && event ? "sm:justify-between" : ""
          )}
        >
          {editAll && event && (
            <div
              className={cn(
                "flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2",
                event.recurrence || originalEventId ? "" : "mt-2 sm:mt-0"
              )}
            >
              <div
                className={cn(
                  "flex flex-col",
                  event.recurrence || originalEventId
                    ? "mt-2 sm:mt-0"
                    : "mt-0 sm:mt-0"
                )}
              >
                <FormDeleteButton
                  onClick={() => handleDeleteSingle(event?.id || "")}
                  className={cn(
                    event.recurrence || originalEventId
                      ? "sm:text-sm sm:p-2"
                      : ""
                  )}
                >
                  Delete booking
                </FormDeleteButton>
                {/* <Button
                  variant="destructive"
                  onClick={() => handleDeleteSingle(event?.id || "")}
                  disabled={isLoading}
                  className={cn(
                    event.recurrence || originalEventId
                      ? "sm:text-sm sm:p-2"
                      : ""
                  )}
                >
                  Delete booking
                </Button> */}
              </div>

              {(event.recurrence || originalEventId) && (
                <FormDeleteSeriesButton
                  onClick={() => handleDeleteSeries(event?.id || "")}
                  className={cn(
                    event.recurrence || originalEventId
                      ? "sm:text-sm sm:p-2"
                      : ""
                  )}
                >
                  Delete series
                </FormDeleteSeriesButton>

                // <Button
                //   variant="destructive"
                //   onClick={() => handleDeleteSeries(event?.id || "")}
                //   disabled={isLoading}
                //   className={cn(
                //     event.recurrence || originalEventId
                //       ? "sm:text-sm sm:p-2"
                //       : ""
                //   )}
                // >
                //   Delete series
                // </Button>
              )}
            </div>
          )}
          <div className="flex flex-col-reverse space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 gap-2 sm:gap-0">
            <FormCancelButton onClick={handleClose}>Cancel</FormCancelButton>
            {/* <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button> */}

            <FormSubmitButton>Save</FormSubmitButton>
            {/* <Button
              variant="rebusPro"
              onClick={handleSave}
              disabled={isLoading}
            >
              Save
            </Button> */}
          </div>
        </div>
      </form>
    </>
  );
}