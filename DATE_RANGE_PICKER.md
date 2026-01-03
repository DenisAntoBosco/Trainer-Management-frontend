# Date Range Picker Component

## AWS-Style Date Range Selection

A calendar component that allows selecting start and end dates in a single calendar view, similar to AWS CloudWatch logs.

## Features

✅ **Single Calendar View** - Select both start and end dates in one calendar
✅ **Visual Range Highlighting** - Selected date range is highlighted
✅ **Intuitive Flow**:
  1. Click first date → becomes start date
  2. Click second date → becomes end date
  3. Range between dates is highlighted
✅ **Auto-Swap** - If end date is before start date, automatically swaps them
✅ **Clear/Cancel/Apply** buttons
✅ **Formatted Display** - Shows "MMM dd, yyyy - MMM dd, yyyy"

## Usage

### Basic Example

```tsx
import DateRangePicker from '@/components/ui/date-range-picker';

function MyComponent() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleDateChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
    console.log('Date range:', start, end);
  };

  return (
    <DateRangePicker
      startDate={startDate}
      endDate={endDate}
      onDateChange={handleDateChange}
      placeholder="Select date range"
    />
  );
}
```

### In Forms (Add Project/Engagement)

```tsx
// In AddProjectModal.tsx or AddEngagementModal.tsx
import DateRangePicker from '@/components/ui/date-range-picker';

// Replace separate date inputs with:
<div className="space-y-2">
  <Label>Project Duration</Label>
  <DateRangePicker
    startDate={formData.startDate}
    endDate={formData.endDate}
    onDateChange={(start, end) => {
      setFormData({
        ...formData,
        startDate: start,
        endDate: end,
      });
    }}
    placeholder="Select project dates"
    className="w-full"
  />
</div>
```

### In Filters

```tsx
// In ProjectsPage.tsx or ReportsPage.tsx
<DateRangePicker
  startDate={filterStartDate}
  endDate={filterEndDate}
  onDateChange={(start, end) => {
    setFilterStartDate(start);
    setFilterEndDate(end);
    // Apply filters
  }}
  placeholder="Filter by date range"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `startDate` | `Date \| undefined` | No | Currently selected start date |
| `endDate` | `Date \| undefined` | No | Currently selected end date |
| `onDateChange` | `(start, end) => void` | Yes | Callback when dates are applied |
| `placeholder` | `string` | No | Placeholder text (default: "Select date range") |
| `className` | `string` | No | Additional CSS classes |

## User Flow

1. **Click button** → Calendar opens with "Select start date" prompt
2. **Click date (e.g., 12th)** → Date is highlighted, prompt changes to "Select end date"
3. **Click another date (e.g., 18th)** → Range 12-18 is highlighted in blue
4. **Click Apply** → Dates are saved and calendar closes
5. **Button shows** → "Dec 12, 2025 - Dec 18, 2025"

## Visual States

- **Start Date**: Dark blue background, rounded left
- **End Date**: Dark blue background, rounded right
- **Range Between**: Light blue background
- **Selecting**: Shows current selection state in header

## Installation

If `date-fns` is not installed:

```bash
npm install date-fns
```

## Where to Use

### 1. Add Project Modal
Replace separate start/end date inputs with single date range picker

### 2. Add Engagement Modal
Replace separate start/end date inputs with single date range picker

### 3. Reports Page
Add date range filter for attendance/allocation reports

### 4. Calendar Page
Filter events by date range

### 5. Attendance Page
Filter attendance records by date range

## Example: Replace in AddProjectModal

**Before:**
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Start Date</Label>
    <Input type="date" />
  </div>
  <div>
    <Label>End Date</Label>
    <Input type="date" />
  </div>
</div>
```

**After:**
```tsx
<div>
  <Label>Project Duration</Label>
  <DateRangePicker
    startDate={startDate}
    endDate={endDate}
    onDateChange={(start, end) => {
      setStartDate(start);
      setEndDate(end);
    }}
  />
</div>
```

## Benefits

✅ **Better UX** - Single click flow instead of two separate inputs
✅ **Visual Feedback** - See the range as you select
✅ **Prevents Errors** - Auto-swaps if end < start
✅ **Consistent** - Same pattern across all date selections
✅ **Professional** - Matches AWS/modern SaaS UX patterns

## Next Steps

1. Install date-fns if needed: `npm install date-fns`
2. Use the component in modals and filters
3. Replace existing date inputs with DateRangePicker
4. Test the selection flow

The component is ready to use! Just import and replace existing date inputs.
