'use client';

import { Ref } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type SelectInputProps<T extends object> = {
  label: string;
  type?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  testId?: string;
  keyValue: keyof T;
  options: T[];
  size?: 'small' | 'medium';
  renderOption: (option: T) => React.ReactNode;
};

function SelectInput<T extends object>(
  props: SelectInputProps<T> & {
    name: string;
    value: T | undefined | null;
    onChange: (value: T) => void;
    onBlur: () => void;
    ref?: Ref<HTMLDivElement | null>;
  },
) {
  const selectId = `select-${props.name}`;
  const selectedKey = props.value?.[props.keyValue]?.toString() ?? '';

  return (
    <div className="flex flex-col gap-1 w-full">
      <Label htmlFor={selectId}>{props.label}</Label>
      <Select
        value={selectedKey}
        onValueChange={(val) => {
          const newValue = props.options.find(
            (option) => option[props.keyValue]?.toString() === val,
          );
          if (!newValue) return;
          props.onChange(newValue);
        }}
        disabled={props.disabled || props.readOnly}
      >
        <SelectTrigger
          id={selectId}
          data-testid={props.testId}
          onBlur={props.onBlur}
          className={props.error ? 'border-[var(--color-warn)]' : ''}
        >
          <SelectValue>
            {props.value ? props.renderOption(props.value) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem
              key={option[props.keyValue]?.toString()}
              value={option[props.keyValue]?.toString() ?? ''}
            >
              {props.renderOption(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

function FormSelectInput<
  TFieldValues extends FieldValues = FieldValues,
  T extends object = object,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: SelectInputProps<T> &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <SelectInput<T>
          {...field}
          label={props.label}
          autoFocus={props.autoFocus}
          type={props.type}
          error={fieldState.error?.message}
          disabled={props.disabled}
          readOnly={props.readOnly}
          testId={props.testId}
          options={props.options}
          renderOption={props.renderOption}
          keyValue={props.keyValue}
          size={props.size}
        />
      )}
    />
  );
}

export default FormSelectInput;
