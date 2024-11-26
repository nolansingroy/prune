"use client";

import { useAuth } from "@/context/AuthContext";
import { EventInput } from "@/interfaces/types";
import { fetchBookingTypes } from "@/lib/converters/bookingTypes";
import { fetchClients } from "@/lib/converters/clients";
import React, { useState, ChangeEvent, useEffect, useCallback } from "react";
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
import { Switch } from "@headlessui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  calendarFormSchema,
  TCalendarForm,
} from "@/lib/validations/calendar-form-validation";
import FormCancelButton from "../buttons/form-cancel-btn";
import FormSubmitButton from "../buttons/form-submit-btn";

type CalendarFormProps = {
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    type: string;
    typeId: string;
    fee: number;
    clientId: string;
    clientName: string;
    description: string;
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
  }) => Promise<void>;
  showDateSelector?: boolean;
  event?: EventInput | null;
  isLoading?: boolean;
};

export default function CalendarForm({
  onClose,
  onSave,
  showDateSelector = true,
  event,
  isLoading,
}: CalendarFormProps) {
  const { user } = useAuth();
  const [bookingsPopoverOpen, setBookingsPopoverOpen] = useState(false);
  const [bookingType, setBookingType] = useState("");
  const [bookingTypes, setBookingTypes] = useState<
    { value: string; label: string; fee: number; docId: string }[]
  >([]);
  const [filteredBookings, setFilteredBookings] = useState<
    { value: string; label: string; fee: number; docId: string }[]
  >([]);
  const [typeId, setTypeId] = useState<string>("");

  // clients state
  const [clientsPopoverOpen, setClientsPopoverOpen] = useState(false);
  // const [client, setClient] = useState("");
  const [clients, setClients] = useState<
    { value: string; label: string; docId: string }[]
  >([]);
  const [filteredClients, setFilteredClients] = useState<
    { value: string; label: string; docId: string }[]
  >([]);
  const [clientId, setClientId] = useState<string>("");

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
  } = useForm<TCalendarForm>({
    resolver: zodResolver(calendarFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: event?.startDate
        ? event.startDate.toLocaleDateString("en-CA") // Formats date as YYYY-MM-DD in local time
        : "",
      isBackgroundEvent: true,
      startTime: event?.start
        ? event.start
            .toLocaleTimeString("en-US", { hour12: false })
            .substring(0, 5)
        : "",
      endTime: event?.end
        ? event.end
            .toLocaleTimeString("en-US", { hour12: false })
            .substring(0, 5)
        : "",
      isRecurring: false,
      daysOfWeek: [],
      startRecur: event?.startDate
        ? event.startDate.toISOString().split("T")[0]
        : "",
      endRecur: "",
      paid: false,
      fee: "",
      clientName: "",
    },
  });

  const isBackgroundEvent = watch("isBackgroundEvent");
  const paid = watch("paid");
  const isRecurring = watch("isRecurring");
  const date = watch("date");

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
        docId: string;
      }[] = [];
      types.forEach((type) => {
        presetBookings.push({
          value: type.name,
          label: type.name,
          fee: type.fee,
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
      let presetClients: { value: string; label: string; docId: string }[] = [];
      clients.forEach((cli) => {
        presetClients.push({
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
    setValue("title", "");
    setValue("description", "");
    setValue("date", "");
    setValue("isBackgroundEvent", true);
    setValue("startTime", "");
    setValue("endTime", "");
    setValue("isRecurring", false);
    setValue("daysOfWeek", []);
    setValue("startRecur", "");
    setValue("endRecur", "");
    setValue("fee", "");
    setValue("paid", false);
    setBookingType("");
    setTypeId("");
    setValue("clientName", "");
    setClientId("");
  };

  const handleCancel = () => {
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
    docId: string
  ) => {
    console.log("type id selected:", docId);
    console.log("type selected:", value);
    setBookingType(value);
    setTypeId(docId);
    setValue("fee", fee.toString());
    setBookingsPopoverOpen(false); // Close the popover after selection
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
      handleBookingTypeSelect(bookingType, 0, "");
      setBookingsPopoverOpen(false);
    }
  };

  // handle the case where the user clicks outside the popover and typed a client name that is not in the list and clicked outside the popover
  const handlePopoverCloseBooking = () => {
    if (!filteredBookings.find((book) => book.value === bookingType)) {
      handleBookingTypeSelect(bookingType, 0, ""); // Set the client with the typed name if it's not in the list
    }
    setClientsPopoverOpen(false);
  };

  // Fee input functions

  const handleBookingFeeInputChange = (value: string) => {
    setValue("fee", value);
  };

  // client functions

  const handleClientSelect = (value: string, docId: string) => {
    console.log("Client id selected:", docId);
    console.log("Client selected:", value);
    setValue("clientName", value);
    setClientId(docId);
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
      handleClientSelect(watch("clientName")!, "");
      // close the popover
      setClientsPopoverOpen(false);
    }
  };

  // handle the case where the user clicks outside the popover and typed a client name that is not in the list and clicked outside the popover
  const handlePopoverCloseClient = () => {
    if (!filteredClients.find((cli) => cli.value === watch("clientName"))) {
      handleClientSelect(watch("clientName")!, ""); // Set the client with the typed name if it's not in the list
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
  return (
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

        const eventData = {
          title: !isBackgroundEvent ? bookingType : formValues.title!,
          type: !isBackgroundEvent ? bookingType : "",
          typeId: !isBackgroundEvent ? typeId : "",
          fee: !isBackgroundEvent ? parseFloat(formValues.fee!) : 0,
          clientId: !isBackgroundEvent ? clientId : "",
          clientName: !isBackgroundEvent ? formValues.clientName! : "",
          description: formValues.description!,
          isBackgroundEvent: formValues.isBackgroundEvent!,
          date: showDateSelector ? formValues.date! : undefined,
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

        console.log("Event data passed from dialog:", eventData);

        try {
          // Wait for the onSave action to complete
          await onSave(eventData);
          console.log("onSave finished successfully, closing dialog");
          // handleFormSubmitted();
        } catch (error) {
          console.error("Error in onSave:", error);
          // Optional: Show an error toast or message
        }
      }}
    >
      {/* Event Type Toggle (Create Availability / Create Booking) */}

      <div className="space-y-2">
        <Label
          className="block text-sm font-medium text-gray-700"
          htmlFor="eventType"
        >
          Event Type
        </Label>

        <div className="space-y-2">
          <div className="flex items-center">
            <Input
              id="eventTypeBooking"
              type="radio"
              value="availability"
              checked={isBackgroundEvent}
              onChange={() => setValue("isBackgroundEvent", true)}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Create Availability
            </span>
          </div>
          <div className="flex items-center">
            <Input
              id="eventTypeAvailability"
              type="radio"
              value="booking"
              checked={!isBackgroundEvent}
              onChange={() => setValue("isBackgroundEvent", false)}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Create Booking
            </span>
          </div>
        </div>
      </div>

      {/* Client and Payment Status  - Conditionally Rendered */}
      {!isBackgroundEvent && (
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
                if (!open) handlePopoverCloseClient();
                setClientsPopoverOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  id="client"
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientsPopoverOpen}
                  className="w-[200px] justify-between text-base input-no-zoom"
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
                    className="h-9 text-base input-no-zoom"
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
        </div>
      )}

      {/* Booking type select - Conditionally Rendered */}
      {!isBackgroundEvent && (
        <div className="space-y-4">
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
                  className="w-[200px] justify-between text-base input-no-zoom"
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
                    className="h-9 text-base input-no-zoom"
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
              className="text-base input-no-zoom"
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Title Input */}
        {isBackgroundEvent && (
          <div className="space-y-2">
            <Label
              className="block text-sm font-medium text-gray-700"
              htmlFor="title"
            >
              Title
            </Label>
            <Input
              id="title"
              {...register("title")}
              // value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setValue("title", e.target.value)
              }
              className="text-base input-no-zoom"
            />
            {errors.title && (
              <p className="text-destructive text-xs">{errors.title.message}</p>
            )}
          </div>
        )}
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
            // value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setValue("description", e.target.value)
            }
            className="text-base input-no-zoom"
          />
          {errors.description && (
            <p className="text-destructive text-xs">
              {errors.description.message}
            </p>
          )}
        </div>
        {/* Recurring Event Toggle (Single Event / Recurring Event) */}
        <div className="space-y-2">
          <Label
            className="block text-sm font-medium text-gray-700"
            htmlFor="recurringEvent"
          >
            Recurring Event
          </Label>
          <div className="space-y-2">
            <div className="flex items-center">
              <Input
                id="recurringEventSingle"
                type="radio"
                // name="recurringEvent"
                value="single"
                checked={!isRecurring}
                onChange={() => setValue("isRecurring", false)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Single Event
              </span>
            </div>
            <div className="flex items-center">
              <Input
                id="recurringEventRecurring"
                type="radio"
                // name="recurringEvent"
                value="recurring"
                checked={isRecurring}
                onChange={() => setValue("isRecurring", true)}
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
                  // value={startRecur}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setValue("startRecur", e.target.value)
                  }
                  disabled
                  className="text-base input-no-zoom"
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
                  // value={endRecur}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setValue("endRecur", e.target.value)
                  }
                  className="text-base input-no-zoom"
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

        {/* Date and Time Inputs */}
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
            // value={date}
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
              // value={startTime}
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
              // value={endTime}
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
      </div>

      <div className="flex flex-col space-y-2 pt-5 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2">
        <FormCancelButton onClick={handleCancel}>Cancel</FormCancelButton>
        <FormSubmitButton>Save</FormSubmitButton>
      </div>
    </form>
  );
}
