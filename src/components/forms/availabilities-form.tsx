import React, { useState, ChangeEvent, MouseEvent, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventInput } from "@/interfaces/types";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import FormCancelButton from "../buttons/form-cancel-btn";
import FormSubmitButton from "../buttons/form-submit-btn";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  availabilitiesFormSchema,
  TAvailabilitiesForm,
} from "@/lib/validations/availabilities-form-validations";
import { useAuth } from "@/context/AuthContext";

interface AvailabilityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    description: string;
    coachId: string;
    clientId: string;
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
  }) => Promise<void>;
  event?: Omit<EventInput, "fee"> | null;
  isLoading?: boolean;
}

const today = new Date();
const formattedDate = today.toLocaleDateString("en-CA"); // YYYY-MM-DD format

const startTimeToday = new Date(today.setHours(8, 0, 0, 0))
  .toLocaleTimeString("en-US", { hour12: false })
  .substring(0, 5); // "08:00"

const endTimeToday = new Date(today.setHours(9, 0, 0, 0))
  .toLocaleTimeString("en-US", { hour12: false })
  .substring(0, 5); // "09:00"

export default function AvailabilitiesForm({
  isOpen,
  onClose,
  onSave,
  event,
  isLoading,
}: AvailabilityFormProps) {
  // const [title, setTitle] = useState("");
  // const [description, setDescription] = useState("");
  // const [date, setDate] = useState(formattedDate);
  // const [isBackgroundEvent, setIsBackgroundEvent] = useState(true);
  // const [startTime, setStartTime] = useState(startTimeToday);
  // const [endTime, setEndTime] = useState(endTimeToday);
  // const [isRecurring, setIsRecurring] = useState(false);
  // const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  // const [startRecur, setStartRecur] = useState(formattedDate);
  // const [endRecur, setEndRecur] = useState(formattedDate);

  const { user } = useAuth();
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
  } = useForm<TAvailabilitiesForm>({
    resolver: zodResolver(availabilitiesFormSchema),
    defaultValues: {
      title: "",
      description: "",
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
    },
  });

  const isRecurring = watch("isRecurring");
  const date = watch("date");

  // useEffect(() => {
  //   if (event) {
  //     setTitle(event.title || "");
  //     setDescription(event.description || "");
  //     setIsBackgroundEvent(event.isBackgroundEvent || false);
  //     setDate(
  //       event.startDate
  //         ? event.startDate.toLocaleDateString("en-CA") // Formats date as YYYY-MM-DD in local time
  //         : ""
  //     );
  //     setStartTime(
  //       event.start
  //         ? event.start
  //             .toLocaleTimeString("en-US", { hour12: false })
  //             .substring(0, 5)
  //         : ""
  //     );
  //     setEndTime(
  //       event.end
  //         ? event.end
  //             .toLocaleTimeString("en-US", { hour12: false })
  //             .substring(0, 5)
  //         : ""
  //     );
  //     if (event.recurrence) {
  //       setIsRecurring(true);
  //       setDaysOfWeek(event.recurrence.daysOfWeek || []);
  //       setStartRecur(event.recurrence.startRecur || "");
  //       setEndRecur(event.recurrence.endRecur || "");
  //     }
  //   }
  // }, [event]);

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setValue("date", selectedDate);

    if (isRecurring) {
      setValue("startRecur", selectedDate);
    }
  };

  // const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
  //   e.preventDefault();

  //   const eventData = {
  //     title,
  //     description,
  //     isBackgroundEvent,
  //     date,
  //     startTime,
  //     endTime,
  //     recurrence: isRecurring
  //       ? {
  //           daysOfWeek,
  //           startTime,
  //           endTime,
  //           startRecur,
  //           endRecur,
  //         }
  //       : undefined,
  //   };

  //   console.log("Event passed from availability dialog", eventData);
  //   console.log("date from availability dialog", eventData.date);
  //   console.log("start time from availability dialog", eventData.startTime);
  //   console.log("end time from availability dialog", eventData.endTime);
  //   onSave(eventData);
  //   handleClose();
  // };

  const resetValues = () => {
    setValue("title", "");
    setValue("description", "");
    setValue("date", formattedDate);
    setValue("startTime", startTimeToday);
    setValue("endTime", endTimeToday);
    setValue("isRecurring", false);
    setValue("daysOfWeek", []);
    setValue("startRecur", formattedDate);
    setValue("endRecur", formattedDate);
  };

  const handleClose = () => {
    resetValues();
    onClose();
  };

  const handleFormSubmitted = () => {
    resetValues();
  };

  return (
    <form
      className="space-y-4"
      action={async () => {
        const isValid = await trigger();
        if (!isValid) {
          console.log("The error is", errors);
          return;
        }

        const formValues = getValues();
        console.log("Form values:", formValues);

        const eventData = {
          title: formValues.title || "",
          description: formValues.description || "",
          clientId: "",
          coachId: user?.uid || "",
          isBackgroundEvent: true,
          date: formValues.date!,
          startTime: formValues.startTime!,
          endTime: formValues.endTime!,
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

        console.log("Event passed from availability dialog", eventData);

        try {
          // Wait for the onSave action to complete
          await onSave(eventData);
          console.log("onSave finished successfully, closing dialog");
          handleClose();
        } catch (error) {
          console.error("Error in onSave:", error);
          // Optional: Show an error toast or message
        }
      }}
    >
      <div>
        <Label
          className="block text-sm font-medium text-gray-700"
          htmlFor="title"
        >
          Title
        </Label>
        <Input
          id="title"
          {...register("title")}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setValue("title", e.target.value)
          }
          className="text-base input-no-zoom"
        />
        {errors.title && (
          <p className="text-destructive text-xs">{errors.title.message}</p>
        )}
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
          className="text-base input-no-zoom"
        />
        {errors.description && (
          <p className="text-destructive text-xs">
            {errors.description.message}
          </p>
        )}
      </div>
      {/* <div className="space-y-2">
        <Label
          className="block text-sm font-medium text-gray-700"
          htmlFor="isBackgroundEvent"
        >
          Availability Event
        </Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isBackgroundEvent"
            {...register("isBackgroundEvent")}
            checked={isBackgroundEvent}
            onCheckedChange={(checked) =>
              setValue(
                "isBackgroundEvent",
                checked !== "indeterminate" && checked
              )
            }
          />
          <Label
            htmlFor="isBackgroundEvent"
            className="text-sm font-medium text-gray-700"
          >
            Is Availability Event
          </Label>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Will show on calendar as background / Available time
        </p>
      </div> */}

      <div className="space-y-2">
        <Label
          className="block text-sm font-medium text-gray-700"
          htmlFor="recurringEvent"
        >
          Recurring Event
        </Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recurringEvent"
            {...register("isRecurring")}
            checked={isRecurring}
            onCheckedChange={(checked: any) =>
              setValue("isRecurring", checked !== "indeterminate" && checked)
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
          aria-autocomplete="none"
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
            <p className="text-destructive text-xs">{errors.endTime.message}</p>
          )}
        </div>
      </div>

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

      <div className="flex flex-col space-y-2 pt-5 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2">
        <FormCancelButton onClick={handleClose}>Cancel</FormCancelButton>
        {/* <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button> */}
        <FormSubmitButton isLoading={isLoading}>Save</FormSubmitButton>
        {/* <Button variant="rebusPro" onClick={handleSave} disabled={isLoading}>
          Save
        </Button> */}
      </div>
    </form>
  );
}
