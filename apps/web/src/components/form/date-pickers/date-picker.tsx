'use client';

import * as React from 'react';
import { Ref, useState } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type ValueDateType = Date | null | undefined;

export type DatePickerFieldProps = {
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  autoFocus?: boolean;
  readOnly?: boolean;
  label: string;
  testId?: string;
  error?: string;
  defaultValue?: ValueDateType;
};

function DatePickerInput(
  props: DatePickerFieldProps & {
    name: string;
    value: ValueDateType;
    onChange: (value: ValueDateType) => void;
    onBlur: () => void;
    ref?: Ref<HTMLDivElement | null>;
  },
) {
  const [open, setOpen] = useState(false);
  const inputId = `date-picker-${props.name}`;

  return (
    <div className="flex flex-col gap-1 w-full" ref={props.ref}>
      <Label htmlFor={inputId}>{props.label}</Label>
      <Popover
        open={open}
        onOpenChange={(o: boolean) => {
          setOpen(o);
          if (!o) props.onBlur();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            variant="outline"
            disabled={props.disabled || props.readOnly}
            data-testid={props.testId}
            className={cn(
              'w-full justify-start text-left font-normal',
              !props.value && 'text-[var(--color-muted)]',
              props.error && 'border-[var(--color-warn)]',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {props.value ? format(props.value, 'PP') : props.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={props.value ?? undefined}
            onSelect={(date) => {
              props.onChange(date ?? null);
              setOpen(false);
            }}
            disabled={(date) => {
              if (props.minDate && date < props.minDate) return true;
              if (props.maxDate && date > props.maxDate) return true;
              return false;
            }}
            autoFocus={props.autoFocus}
            defaultMonth={props.value ?? undefined}
          />
        </PopoverContent>
      </Popover>
      {!!props.error && (
        <p
          className="text-xs text-[var(--color-warn)]"
          data-testid={`${props.testId}-error`}
        >
          {props.error}
        </p>
      )}
    </div>
  );
}

function FormDatePickerInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: DatePickerFieldProps &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => {
        return (
          <DatePickerInput
            {...field}
            defaultValue={props.defaultValue}
            autoFocus={props.autoFocus}
            label={props.label}
            disabled={props.disabled}
            readOnly={props.readOnly}
            testId={props.testId}
            minDate={props.minDate}
            maxDate={props.maxDate}
            error={fieldState.error?.message}
          />
        );
      }}
    />
  );
}

export default FormDatePickerInput;
