import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate: Date | undefined, endDate: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  placeholder = 'Select date range',
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!selectingEnd && !tempStartDate) {
      // First click - select start date
      setTempStartDate(date);
      setTempEndDate(undefined);
      setSelectingEnd(true);
    } else if (selectingEnd) {
      // Second click - select end date
      if (tempStartDate && date < tempStartDate) {
        // If end date is before start date, swap them
        setTempEndDate(tempStartDate);
        setTempStartDate(date);
      } else {
        setTempEndDate(date);
      }
      setSelectingEnd(false);
    } else {
      // Reset and start over
      setTempStartDate(date);
      setTempEndDate(undefined);
      setSelectingEnd(true);
    }
  };

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setSelectingEnd(false);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    setSelectingEnd(false);
    onDateChange(undefined, undefined);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
    } else if (startDate) {
      return format(startDate, 'MMM dd, yyyy');
    }
    return placeholder;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !startDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">
            {selectingEnd && tempStartDate
              ? 'Select end date'
              : 'Select start date'}
          </p>
          {tempStartDate && (
            <p className="text-xs text-muted-foreground mt-1">
              {tempEndDate
                ? `${format(tempStartDate, 'MMM dd')} - ${format(tempEndDate, 'MMM dd, yyyy')}`
                : `Start: ${format(tempStartDate, 'MMM dd, yyyy')}`}
            </p>
          )}
        </div>
        <Calendar
          mode="single"
          selected={tempEndDate || tempStartDate}
          onSelect={handleDateSelect}
          disabled={(date) => date < tomorrow}
          initialFocus
          modifiers={{
            start: tempStartDate ? [tempStartDate] : [],
            end: tempEndDate ? [tempEndDate] : [],
            range:
              tempStartDate && tempEndDate
                ? Array.from(
                    { length: Math.ceil((tempEndDate.getTime() - tempStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 },
                    (_, i) => {
                      const date = new Date(tempStartDate);
                      date.setDate(date.getDate() + i);
                      return date;
                    }
                  )
                : [],
          }}
          modifiersClassNames={{
            start: 'bg-primary text-primary-foreground rounded-l-md font-bold',
            end: 'bg-primary text-primary-foreground rounded-r-md font-bold',
            range: 'bg-primary/30 font-semibold',
          }}
        />
        <div className="p-3 border-t flex justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!tempStartDate || !tempEndDate}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
