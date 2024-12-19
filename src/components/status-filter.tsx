import * as React from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EventInput } from "@/interfaces/event";

const statuses = [
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "unpaid",
    label: "Unpaid",
  },
];

interface StatusFilterProps {
  value: string;
  setValue: (value: string) => void;
  filterEvents: (
    label: string,
    eventsToFilter: EventInput[],
    status: string,
    dateRange: { from: Date; to: Date },
    search: string
  ) => void;
  selectedLabel: string;
  allEvents: EventInput[];
  selectedDateRange: { from: Date; to: Date };
  search: string;
}

export function StatusFilter({
  value,
  setValue,
  filterEvents,
  selectedLabel,
  allEvents,
  selectedDateRange,
  search,
}: StatusFilterProps) {
  const [open, setOpen] = React.useState(false);

  const handleReset = () => {
    setValue("");
    filterEvents(selectedLabel, allEvents, "", selectedDateRange, search);
    setOpen(false);
  };

  const handleSelect = (currentValue: string) => {
    setValue(currentValue);
    filterEvents(
      selectedLabel,
      allEvents,
      currentValue,
      selectedDateRange,
      search
    );
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? statuses.find((status) => status.value === value)?.label
            : "Select a status..."}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search status..." className="h-9" />
          <CommandEmpty>No status found.</CommandEmpty>
          <CommandGroup>
            {statuses.map((status) => (
              <CommandItem
                key={status.value}
                value={status.value}
                onSelect={() => handleSelect(status.value)}
              >
                {status.label}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === status.value ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
          {/* Reset Button */}
          <div className="border-t px-1 py-2">
            <Button
              variant="expandIcon"
              className="w-full h-1/2"
              onClick={handleReset}
            >
              Reset Filter
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
