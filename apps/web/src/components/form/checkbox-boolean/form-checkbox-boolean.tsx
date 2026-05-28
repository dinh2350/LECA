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

export type CheckboxBooleanInputProps = {
  label: string;
  type?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  testId?: string;
};

function CheckboxBooleanInput(
  props: CheckboxBooleanInputProps & {
    name: string;
    value: boolean | null;
    onChange: (value: boolean) => void;
    onBlur: () => void;
    ref?: Ref<HTMLDivElement | null>;
  },
) {
  const value = props.value ?? false;
  const checkboxId = `${props.name}-checkbox`;

  return (
    <div
      ref={props.ref}
      className="flex flex-col gap-1"
      data-testid={props.testId}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id={checkboxId}
          checked={value}
          onCheckedChange={(checked) => props.onChange(!!checked)}
          disabled={props.disabled || props.readOnly}
          name={props.name}
          data-testid={`${props.testId}-checkbox`}
          onBlur={props.onBlur}
        />
        <Label htmlFor={checkboxId}>{props.label}</Label>
      </div>
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

function FormCheckboxBooleanInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: CheckboxBooleanInputProps &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <CheckboxBooleanInput
          {...field}
          label={props.label}
          autoFocus={props.autoFocus}
          type={props.type}
          error={fieldState.error?.message}
          disabled={props.disabled}
          readOnly={props.readOnly}
          testId={props.testId}
        />
      )}
    />
  );
}

export default FormCheckboxBooleanInput;
