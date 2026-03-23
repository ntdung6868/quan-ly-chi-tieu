"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {dateRange?.from ? (
          dateRange.to ? (
            <>
              {format(dateRange.from, "dd/MM/yyyy", { locale: vi })} -{" "}
              {format(dateRange.to, "dd/MM/yyyy", { locale: vi })}
            </>
          ) : (
            format(dateRange.from, "dd/MM/yyyy", { locale: vi })
          )
        ) : (
          "Chọn khoảng thời gian"
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={2}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  );
}
