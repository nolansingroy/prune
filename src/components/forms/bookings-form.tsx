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
import { EventInput } from "@/interfaces/event";
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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  bookingsFormSchema,
  TBookingsForm,
} from "@/lib/validations/bookings-form-validations";
import { useForm, Controller } from "react-hook-form";
import { Client } from "@/interfaces/clients";

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
      client?: Client;
      clientId: string;
      clientName: string;
      clientPhone: string;
      coachId: string;
      description: string;
      isBackgroundEvent: boolean;
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
  let actionType = editAll ? "edit" : "add";
  const { user } = useAuth();
  const [bookingColor, setBookingColor] = useState<string>("");
  const [originalEventId, setOriginalEventId] = useState<string>("");
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

  // clients state
  const [clientsPopoverOpen, setClientsPopoverOpen] = useState(false);
  // The follwoing state variable will only be used to push the client object to the event object
  const [firestoreClients, setFirestoreClients] = useState<Client[]>([]);
  const [clients, setClients] = useState<
    { value: string; label: string; docId: string; phone: string }[]
  >([]);
  const [filteredClients, setFilteredClients] = useState<
    { value: string; label: string; docId: string; phone: string }[]
  >([]);
  const [clientId, setClientId] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");

  const {
    register,
    setValue,
    reset,
    trigger,
    // getValues responsable for getting the form values
    getValues,
    control,
    watch,
    formState: { isSubmitting, errors },
    handleSubmit,
  } = useForm<TBookingsForm>({
    resolver: zodResolver(bookingsFormSchema),
    defaultValues: {
      title: event?.title ? event.title : "",
      description: event ? event.description : "",
      date: event?.startDate
        ? event.startDate.toLocaleDateString("en-CA") // Formats date as YYYY-MM-DD in local time
        : formattedDate,
      startTime: event?.start
        ? event.start
            .toLocaleTimeString("en-US", { hour12: false })
            .substring(0, 5)
        : startTimeToday,
      endTime: event?.end
        ? event.end
            .toLocaleTimeString("en-US", { hour12: false })
            .substring(0, 5)
        : endTimeToday,
      isRecurring: false,
      daysOfWeek: [],
      startRecur: event?.startDate
        ? event.startDate.toISOString().split("T")[0]
        : formattedDate,
      endRecur: formattedDate,
      paid: event?.paid ? event.paid : false,
      fee: event?.fee ? event.fee.toString() : "",
      clientName: event?.clientName ? event.clientName : "",
    },
  });

  const paid = watch("paid");
  const isRecurring = watch("isRecurring");
  const date = watch("date");

  // useEffect(() => {
  //   console.log("firestore clients:", firestoreClients);
  // }, [clientName]);

  useEffect(() => {
    if (event) {
      setOriginalEventId(event._def?.extendedProps?.originalEventId || "");
      setClientId(event.clientId || "");
      setBookingType(event.type || "");
      setTypeId(event.typeId || "");
    }
  }, [event, isOpen, originalEventId]);

  // handle startRecur change when date changes
  useEffect(() => {
    setValue("startRecur", date);
  }, [date, setValue]);

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
          fee: type.fee!,
          color: type.color,
          docId: type.docId!,
        });
      });
      setBookingTypes(presetBookings);
      setFilteredBookings(presetBookings);
    }
  }, [user]);

  const fetchAllClients = useCallback(async () => {
    if (user) {
      // Fetching clients from Firestore
      const clients = await fetchClients(user.uid);
      setFirestoreClients(clients);
      let presetClients: {
        value: string;
        label: string;
        docId: string;
        phone: string;
      }[] = [];
      clients.forEach((cli) => {
        presetClients.push({
          phone: cli.intPhoneNumber,
          value: cli.firstName + " " + cli.lastName,
          label: cli.firstName + " " + cli.lastName,
          docId: cli.docId!,
        });
      });
      setClients(presetClients);
      setFilteredClients(presetClients);
      console.log("Clients from firebase:", clients);
    }
  }, [user]);

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
    const clientName = watch("clientName");
    if (clientName === "") {
      setFilteredClients(clients); // Reset to full list when input is cleared
    } else {
      setFilteredClients(
        clients.filter((cli) =>
          cli.label.toLowerCase().includes(clientName!.toLowerCase())
        )
      );
    }
  }, [watch, clients]);

  const resetValues = () => {
    setValue("description", "");
    setValue("date", formattedDate);
    setValue("startTime", startTimeToday);
    setValue("endTime", endTimeToday);
    setValue("isRecurring", false);
    setValue("daysOfWeek", []);
    setValue("startRecur", formattedDate);
    setValue("endRecur", formattedDate);
    setBookingType("");
    setTypeId("");
    setValue("fee", "");
    setValue("clientName", "");
    setClientId("");
    setValue("paid", false);
    setClientPhone("");
    setFirestoreClients([]);
  };

  const handleClose = () => {
    resetValues();
    onClose();
  };

  const handleFormSubmitted = () => {
    resetValues();
  };

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
    setValue("fee", fee.toString());
    setBookingColor(color);
    setBookingsPopoverOpen(false);
  };

  const handelBookingTypeInputChange = (value: string) => {
    setBookingType(value);
    setValue("fee", "");

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
      handleBookingTypeSelect(bookingType, 0, "", "");
    }
    setClientsPopoverOpen(false);
  };

  // Fee input functions
  const handleBookingFeeInputChange = (value: string) => {
    setValue("fee", value);
  };

  // client functions

  const handleClientSelect = (value: string, docId: string, phone: string) => {
    console.log("Client id selected:", docId);
    console.log("Client selected:", value);
    setValue("clientName", value);
    setClientId(docId);
    setClientPhone(phone);
    setClientsPopoverOpen(false);
  };

  const handleClientInputChange = (value: string) => {
    setValue("clientName", value);

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
      handleClientSelect(watch("clientName")!, "", "");
      // close the popover
      setClientsPopoverOpen(false);
    }
  };

  // handle the case where the user clicks outside the popover and typed a client name that is not in the list and clicked outside the popover
  const handlePopoverClose = () => {
    if (!filteredClients.find((cli) => cli.value === watch("clientName"))) {
      handleClientSelect(watch("clientName")!, "", ""); // Set the client with the typed name if it's not in the list
    }
    setClientsPopoverOpen(false);
  };

  // handle the date change
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setValue("date", selectedDate);

    // If the event is recurring, set the start recurrence date to the selected date
    if (isRecurring) {
      setValue("startRecur", selectedDate);
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
      <form
        className="space-y-3"
        action={async () => {
          const isValid = await trigger();
          if (!isValid) {
            console.log("The error is", errors);
            return;
          }

          const formValues = getValues();
          console.log("Form values:", formValues);

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
            fee: parseFloat(formValues.fee!) || 0,
            client:
              firestoreClients.find(
                (cli) =>
                  cli.fullName?.trim().toLowerCase() ===
                  formValues.clientName?.trim().toLowerCase()
              ) || undefined,
            clientId: clientId || "",
            clientName: formValues.clientName || "",
            clientPhone: clientPhone || "",
            coachId: user?.uid || "",
            description: formValues.description || "",
            isBackgroundEvent: false, // Always false for regular bookings
            date: showDateSelector ? formValues.date : undefined,
            startTime: formValues.startTime!,
            endTime: formValues.endTime!,
            paid: formValues.paid!,
            recurrence: isRecurring
              ? {
                  daysOfWeek: formValues.daysOfWeek!,
                  startTime: formValues.startTime!,
                  endTime: formValues.endTime!,
                  startRecur: formValues.startRecur!,
                  endRecur: formValues.endRecur!,
                }
              : undefined,
          };

          // here you can handle any update case you want

          const updatedEventData = getUpdatedValues(
            originalEvent,
            newEventData
          );

          const eventData = eventId
            ? editAll
              ? newEventData // Update all fields
              : updatedEventData // Update only changed fields
            : newEventData; // Create new event

          console.log("Event passed from bookings dialog", eventData);
          console.log("date from bookings dialog", eventData.date);
          console.log("start time from bookings dialog", eventData.startTime);
          console.log("end time from bookings dialog", eventData.endTime);

          try {
            await onSave(eventData, event?.id);
            console.log("onSave finished successfully, closing dialog");

            // if the actionType is add, then close the dialog else do nothing because the edit dialog will be closed by the parent component
            if (actionType === "add") {
              handleClose();
            }
          } catch (error) {
            console.error("Error in onSave:", error);
          }
        }}
      >
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label
                className="block text-sm font-medium text-gray-700"
                htmlFor="client"
              >
                Select or type in Client{" "}
                <span className="text-destructive">*</span>
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
                    id="client"
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientsPopoverOpen}
                    className="w-[200px] justify-between text-base input-no-zoom" // Apply custom class
                    onClick={() => setClientsPopoverOpen(!clientsPopoverOpen)} // Toggle popover on click
                  >
                    {watch("clientName")
                      ? filteredClients.find(
                          (cli) => cli.value === watch("clientName")
                        )?.label || watch("clientName")
                      : "Select client..."}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 popover-above-modal">
                  <Command>
                    <CommandInput
                      placeholder="Search clients..."
                      value={watch("clientName")}
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
                              handleClientSelect(
                                cli.value,
                                cli.docId,
                                cli.phone
                              );
                              setClientsPopoverOpen(false);
                            }}
                          >
                            {cli.label}
                            <CheckIcon
                              className={`ml-auto h-4 w-4 ${
                                watch("clientName") === cli.value
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
              {errors.clientName && (
                <p className="text-destructive text-xs">
                  {errors.clientName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                className="block text-sm font-medium text-gray-700"
                htmlFor="paid"
              >
                Payment Status
              </Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {paid ? "Paid" : "Unpaid"}
                </span>
                <Switch
                  id="paid"
                  {...register("paid")}
                  checked={paid}
                  onChange={() => setValue("paid", !paid)}
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
              <Label
                className="block text-sm font-medium text-gray-700"
                htmlFor="bookingType"
              >
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
                    id="bookingType"
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
              <Label
                className="block text-sm font-medium text-gray-700"
                htmlFor="fee"
              >
                Fee
              </Label>
              <Input
                id="fee"
                type="number"
                {...register("fee")}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleBookingFeeInputChange(e.target.value)
                }
                className="text-base input-no-zoom" // Apply custom class
              />
            </div>
          </div>

          <div>
            <Label
              className="block text-sm font-medium text-gray-700"
              htmlFor="description"
            >
              Notes
            </Label>
            <Input
              id="description"
              {...register("description")}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setValue("description", e.target.value)
              }
              className="text-base input-no-zoom" // Apply custom class
            />
            {errors.description && (
              <p className="text-destructive text-xs">
                {errors.description.message}
              </p>
            )}
          </div>

          {!editAll && (
            <div className="space-y-2">
              <Label
                className="block text-sm font-medium text-gray-700"
                htmlFor="recurringEvent"
              >
                Recurring Booking
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurringEvent"
                  {...register("isRecurring")}
                  checked={isRecurring}
                  onCheckedChange={(checked: any) =>
                    setValue(
                      "isRecurring",
                      checked !== "indeterminate" && checked
                    )
                  }
                />
                <Label
                  htmlFor="recurringEvent"
                  className="text-sm font-medium text-gray-700"
                >
                  Is Recurring
                </Label>
              </div>
            </div>
          )}

          <div>
            <Label
              className="block text-sm font-medium text-gray-700"
              htmlFor="date"
            >
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              {...register("date")}
              onChange={handleDateChange}
              className="px-2 py-2 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-base input-no-zoom"
            />
            {errors.date && (
              <p className="text-destructive text-xs">{errors.date.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <Label
                className="text-sm font-medium text-gray-700"
                htmlFor="startTime"
              >
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startTime"
                {...register("startTime")}
                type="time"
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setValue("startTime", e.target.value)
                }
                className="w-32 px-2 py-2 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-base input-no-zoom"
              />
              {errors.startTime && (
                <p className="text-destructive text-xs">
                  {errors.startTime.message}
                </p>
              )}
            </div>
            <div className="flex flex-col">
              <Label
                className="text-sm font-medium text-gray-700"
                htmlFor="endTime"
              >
                End Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endTime"
                {...register("endTime")}
                type="time"
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setValue("endTime", e.target.value)
                }
                className="w-32 px-2 py-2 text-center rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-base input-no-zoom"
              />

              {errors.endTime && (
                <p className="text-destructive text-xs">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {isRecurring && !editAll && (
            <>
              <div>
                <Label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="daysOfWeek"
                >
                  Days of Week
                </Label>
                <div className="flex space-x-2">
                  <Controller
                    name="daysOfWeek"
                    control={control}
                    render={({ field }) => (
                      <>
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <div key={day} className="flex flex-col items-center">
                            <Checkbox
                              checked={field.value?.includes(day) ?? false}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  checked
                                    ? [...(field.value || []), day]
                                    : (field.value || []).filter(
                                        (d: number) => d !== day
                                      )
                                )
                              }
                            />
                            <Label className="mt-1">
                              {["Su", "M", "T", "W", "Th", "F", "Sa"][day]}
                            </Label>
                          </div>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="flex flex-col">
                  <Label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="startRecur"
                  >
                    Start Recurrence <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startRecur"
                    type="date"
                    {...register("startRecur")}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setValue("startRecur", e.target.value)
                    }
                    disabled
                    className="text-base input-no-zoom" // Apply custom class
                  />
                  {errors.startRecur && (
                    <p className="text-destructive text-xs">
                      {errors.startRecur.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col">
                  <Label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="endRecur"
                  >
                    End Recurrence <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endRecur"
                    type="date"
                    {...register("endRecur")}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setValue("endRecur", e.target.value)
                    }
                    className="text-base input-no-zoom" // Apply custom class
                  />
                  {errors.endRecur && (
                    <p className="text-destructive text-xs">
                      {errors.endRecur.message}
                    </p>
                  )}
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
                  isLoading={isLoading}
                  className={cn(
                    event.recurrence || originalEventId
                      ? "sm:text-sm sm:p-2"
                      : ""
                  )}
                >
                  Delete booking
                </FormDeleteButton>
              </div>

              {(event.recurrence || originalEventId) && (
                <FormDeleteSeriesButton
                  isLoading={isLoading}
                  onClick={() => handleDeleteSeries(event?.id || "")}
                  className={cn(
                    event.recurrence || originalEventId
                      ? "sm:text-sm sm:p-2"
                      : ""
                  )}
                >
                  Delete series
                </FormDeleteSeriesButton>
              )}
            </div>
          )}
          <div className="flex flex-col-reverse space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 gap-2 sm:gap-0">
            <FormCancelButton onClick={handleClose} isLoading={isLoading}>
              Cancel
            </FormCancelButton>
            <FormSubmitButton isLoading={isLoading}>Save</FormSubmitButton>
          </div>
        </div>
      </form>
    </>
  );
}
