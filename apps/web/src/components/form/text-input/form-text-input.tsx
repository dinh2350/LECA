'use client';
import { Eye, EyeOff } from 'lucide-react';
import React, { ChangeEvent, Ref, useState } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TextInputProps = {
  label: string;
  type?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  testId?: string;
  autoComplete?: string;
  inputComponent?: React.ElementType;
  multiline?: boolean;
  minRows?: number;
  maxRows?: number;
  size?: 'small' | 'medium';
};

function TextInput(
  props: TextInputProps & {
    name: string;
    value: string;
    onChange: (
      value: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void;
    onBlur: () => void;
    ref?: Ref<HTMLInputElement | null>;
  },
) {
  const [isShowPassword, setIsShowPassword] = useState(false);
  const inputId = `input-${props.name}`;

  const inputType =
    props.type === 'password' && isShowPassword ? 'text' : props.type;

  return (
    <div className="flex flex-col gap-1 w-full">
      <Label htmlFor={inputId}>{props.label}</Label>
      <div className="relative">
        {props.multiline ? (
          <textarea
            id={inputId}
            name={props.name}
            value={props.value}
            onChange={
              props.onChange as React.ChangeEventHandler<HTMLTextAreaElement>
            }
            onBlur={props.onBlur}
            autoFocus={props.autoFocus}
            disabled={props.disabled}
            readOnly={props.readOnly}
            autoComplete={props.autoComplete}
            data-testid={props.testId}
            rows={props.minRows ?? 3}
            className={cn(
              'flex min-h-[80px] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50',
              props.error && 'border-[var(--color-warn)]',
            )}
          />
        ) : (
          <Input
            ref={props.ref as Ref<HTMLInputElement>}
            id={inputId}
            name={props.name}
            value={props.value}
            onChange={
              props.onChange as React.ChangeEventHandler<HTMLInputElement>
            }
            onBlur={props.onBlur}
            autoFocus={props.autoFocus}
            type={inputType}
            disabled={props.disabled}
            readOnly={props.readOnly}
            autoComplete={props.autoComplete}
            data-testid={props.testId}
            className={cn(
              props.error && 'border-[var(--color-warn)]',
              props.type === 'password' && 'pr-10',
              props.size === 'small' && 'h-8 text-xs',
            )}
          />
        )}
        {props.type === 'password' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setIsShowPassword((s) => !s)}
            aria-label="Toggle password visibility"
            tabIndex={-1}
          >
            {isShowPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {props.error && (
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

function FormTextInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'> &
    TextInputProps,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <TextInput
          {...field}
          label={props.label}
          autoFocus={props.autoFocus}
          type={props.type}
          error={fieldState.error?.message}
          disabled={props.disabled}
          readOnly={props.readOnly}
          testId={props.testId}
          multiline={props.multiline}
          minRows={props.minRows}
          maxRows={props.maxRows}
          inputComponent={props.inputComponent}
          size={props.size}
        />
      )}
    />
  );
}

export default FormTextInput;
