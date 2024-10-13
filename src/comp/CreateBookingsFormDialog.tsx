// dialgog in Bookings Tab

import React, {
  useState,
  ChangeEvent,
  MouseEvent,
  useEffect,
  useCallback,
} from "react";
import { auth } from "../../firebase";
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

interface CreateBookingsFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    fee: number;
    clientId: string;
    clientName: string;
    description: string;
    location: string;
    isBackgroundEvent: boolean; // Automatically false for regular bookings
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

const presetLocations = ["Kraken 1", "Kraken 2", "Kraken 3"];

const CreateBookingsFormDialog: React.FC<CreateBookingsFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  showDateSelector = false,
  event,
  editAll = true,
}) => {
  // const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startRecur, setStartRecur] = useState("");
  const [endRecur, setEndRecur] = useState("");
  // Location state
  const [location, setLocation] = useState("");
  // Booking type state
  const [bookingsPopoverOpen, setBookingsPopoverOpen] = useState(false);
  const [bookingType, setBookingType] = useState("");
  const [bookingTypes, setBookingTypes] = useState<
    { value: string; label: string; fee: number }[]
  >([]);
  const [filteredBookings, setFilteredBookings] = useState<
    { value: string; label: string; fee: number }[]
  >([]);
  const [bookingFee, setBookingFee] = useState<string>("");

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

  useEffect(() => {
    if (event) {
      // setTitle(event.title || "");
      setDescription(event.description || "");
      setLocation(event.location || "");
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
  }, [event, isOpen]);

  const fetchBookings = useCallback(async () => {
    if (auth.currentUser) {
      // Fetching booking types from Firestore
      const types = await fetchBookingTypes(auth.currentUser.uid);
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
      // console.log("Booking types from firebase:", types);
    }
  }, [auth.currentUser]);

  const fetchAllClients = useCallback(async () => {
    if (auth.currentUser) {
      // Fetching clients from Firestore
      const clients = await fetchClients(auth.currentUser.uid);
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
  }, [auth.currentUser]);

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
    e.preventDefault();

    const eventData = {
      title: bookingType,
      fee: parseFloat(bookingFee),
      clientId: clientId || "",
      clientName: client || "",
      description,
      location,
      isBackgroundEvent: false, // Always false for regular bookings
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
    // setTitle("");
    setDescription("");
    setLocation("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setIsRecurring(false); // Reset to false to avoid unintended recurring events
    setDaysOfWeek([]);
    setStartRecur("");
    setEndRecur("");
    setBookingType("");
    setBookingFee("");
    setClient("");
    setClientId("");
    onClose();
  };

  // booking type functions

  const handleBookingTypeSelect = (value: string, fee: number) => {
    setBookingType(value);
    setBookingFee(fee.toString());
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
      setBookingsPopoverOpen(false);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create New Booking
            {/* {editAll ? "Edit All Instances" : "Edit Booking"} */}
          </DialogTitle>
          {/* <DialogDescription>
            Edit this booking event
            {editAll
              ? "Edit all instances of this recurring booking"
              : "Edit this booking"}
          </DialogDescription> */}
        </DialogHeader>
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
                    className="w-[200px] justify-between"
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
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No clients found.</CommandEmpty>
                      <CommandGroup>
                        {filteredClients.map((cli) => (
                          <CommandItem
                            key={cli.value}
                            value={cli.value}
                            onSelect={() => {
                              handleClientSelect(cli.value, cli.docId); // Set location
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
          {/* <div>
            <Label className="block text-sm font-medium text-gray-700">
              Booking Title
            </Label>
            <Input
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
            />
          </div> */}
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
            <Select value={location} onValueChange={setLocation}>
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
              Recurring Booking
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isRecurring}
                onCheckedChange={(checked) =>
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

          {showDateSelector && (
            <div>
              <Label className="block text-sm font-medium text-gray-700">
                Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDate(e.target.value)
                }
              />
            </div>
          )}

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

export default CreateBookingsFormDialog;
