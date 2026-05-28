'use client';

import { Ref, useState } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type MultipleSelectInputProps<T extends object> = {
  label: string;
  type?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  testId?: string;
  keyValue: keyof T;
  options: T[];
  renderValue: (option: T[]) => React.ReactNode;
  renderOption: (option: T) => React.ReactNode;
};

function MultipleSelectInput<T extends object>(
  props: MultipleSelectInputProps<T> & {
    name: string;
    value: T[] | undefined | null;
    onChange: (value: T[]) => void;
    onBlur: () => void;
    ref?: Ref<HTMLDivElement | null>;
  },
) {
  const [open, setOpen] = useState(false);
  const selected = props.value ?? [];
  const labelId = `multiple-select-label-${props.name}`;

  const toggle = (option: T) => {
    const key = option[props.keyValue];
    const exists = selected.some((s) => s[props.keyValue] === key);
    if (exists) {
      props.onChange(selected.filter((s) => s[props.keyValue] !== key));
    } else {
      props.onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <Label htmlFor={labelId}>{props.label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={labelId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={props.disabled || props.readOnly}
            data-testid={props.testId}
            className={cn(
              'w-full justify-between font-normal h-auto min-h-9',
              props.error && 'border-[var(--color-warn)]',
            )}
          >
            <div className="flex flex-wrap gap-1 flex-1 text-left">
              {selected.length > 0 ? (
                props.renderValue(selected)
              ) : (
                <span className="text-[var(--color-muted)]">{props.label}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No options.</CommandEmpty>
              <CommandGroup>
                {props.options.map((option) => {
                  const key = option[props.keyValue]?.toString() ?? '';
                  const isSelected = selected.some(
                    (s) => s[props.keyValue]?.toString() === key,
                  );
                  return (
                    <CommandItem
                      key={key}
                      value={key}
                      onSelect={() => toggle(option)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {props.renderOption(option)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
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

function FormMultipleSelectInput<
  TFieldValues extends FieldValues = FieldValues,
  T extends object = object,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: MultipleSelectInputProps<T> &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <MultipleSelectInput<T>
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
          renderValue={props.renderValue}
          keyValue={props.keyValue}
        />
      )}
    />
  );
}

export default FormMultipleSelectInput;
