'use client';

import * as React from 'react';
import { Ref } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ValueDateType = Date | null | undefined;

export type TimePickerFieldProps = {
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  label: string;
  testId?: string;
  error?: string;
  defaultValue?: ValueDateType;
  format?: string;
  minTime?: Date | undefined;
  maxTime?: Date | undefined;
  timeSteps?:
    | { hours?: number; minutes?: number; seconds?: number }
    | undefined;
};

function TimePickerInput(
  props: TimePickerFieldProps & {
    name: string;
    value: ValueDateType;
    onChange: (value: ValueDateType) => void;
    onBlur: () => void;
    ref?: Ref<HTMLDivElement | null>;
  },
) {
  const inputId = `time-picker-${props.name}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      props.onChange(null);
      return;
    }
    const base = props.value ? new Date(props.value) : new Date();
    base.setHours(hours, minutes, 0, 0);
    props.onChange(base);
  };

  const timeValue = props.value ? format(props.value, 'HH:mm') : '';

  const minValue = props.minTime ? format(props.minTime, 'HH:mm') : undefined;
  const maxValue = props.maxTime ? format(props.maxTime, 'HH:mm') : undefined;

  return (
    <div ref={props.ref} className="flex flex-col gap-1 w-full">
      <Label htmlFor={inputId}>{props.label}</Label>
      <Input
        id={inputId}
        type="time"
        value={timeValue}
        onChange={handleChange}
        onBlur={props.onBlur}
        autoFocus={props.autoFocus}
        disabled={props.disabled}
        readOnly={props.readOnly}
        min={minValue}
        max={maxValue}
        data-testid={props.testId}
        className={cn(props.error && 'border-[var(--color-warn)]')}
      />
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

function FormTimePickerInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: TimePickerFieldProps &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => {
        return (
          <TimePickerInput
            {...field}
            defaultValue={props.defaultValue}
            autoFocus={props.autoFocus}
            label={props.label}
            disabled={props.disabled}
            readOnly={props.readOnly}
            testId={props.testId}
            format={props.format}
            error={fieldState.error?.message}
            minTime={props.minTime}
            maxTime={props.maxTime}
            timeSteps={props.timeSteps}
          />
        );
      }}
    />
  );
}

export default FormTimePickerInput;
