'use client';

import { Ref } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export type CheckboxInputProps<T> = {
  label: string;
  type?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  testId?: string;
  keyValue: keyof T;
  options: T[];
  keyExtractor: (option: T) => string;
  renderOption: (option: T) => React.ReactNode;
};

function CheckboxInput<T>(
  props: CheckboxInputProps<T> & {
    name: string;
    value: T[] | undefined | null;
    onChange: (value: T[]) => void;
    onBlur: () => void;
    ref?: Ref<HTMLDivElement | null>;
  },
) {
  const value = props.value ?? [];

  const toggle = (option: T) => {
    const key = option[props.keyValue];
    const isExist = value.map((v) => v[props.keyValue]).includes(key);
    const newValue = isExist
      ? value.filter((v) => v[props.keyValue] !== key)
      : [...value, option];
    props.onChange(newValue);
  };

  return (
    <fieldset data-testid={props.testId} className="border-none p-0 m-0">
      <legend
        className="text-sm font-medium text-[var(--color-foreground)] mb-1"
        data-testid={`${props.testId}-label`}
      >
        {props.label}
      </legend>
      <div ref={props.ref} className="flex flex-col gap-2">
        {props.options.map((option) => {
          const key = props.keyExtractor(option);
          const checked = value
            .map((v) => v[props.keyValue])
            .includes(option[props.keyValue]);
          return (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`${props.name}-${key}`}
                checked={checked}
                onCheckedChange={() => toggle(option)}
                disabled={props.disabled || props.readOnly}
                name={props.name}
                data-testid={`${props.testId}-${key}`}
              />
              <Label htmlFor={`${props.name}-${key}`}>
                {props.renderOption(option)}
              </Label>
            </div>
          );
        })}
      </div>
      {!!props.error && (
        <p
          className="text-xs text-[var(--color-warn)] mt-1"
          data-testid={`${props.testId}-error`}
        >
          {props.error}
        </p>
      )}
    </fieldset>
  );
}

function FormCheckboxInput<
  TFieldValues extends FieldValues = FieldValues,
  T = unknown,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: CheckboxInputProps<T> &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <CheckboxInput<T>
          {...field}
          label={props.label}
          autoFocus={props.autoFocus}
          type={props.type}
          error={fieldState.error?.message}
          disabled={props.disabled}
          readOnly={props.readOnly}
          testId={props.testId}
          options={props.options}
          keyValue={props.keyValue}
          keyExtractor={props.keyExtractor}
          renderOption={props.renderOption}
        />
      )}
    />
  );
}

export default FormCheckboxInput;
