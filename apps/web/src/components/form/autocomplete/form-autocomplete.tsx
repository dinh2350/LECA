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
  CommandInput,
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

export type AutocompleteInputProps<T> = {
  label: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  testId?: string;
  size?: 'small' | 'medium';
  value: T | null;
  options: T[];
  renderOption: (option: T) => React.ReactNode;
  getOptionLabel: (option: T) => string;
};

function AutocompleteInput<T>(
  props: AutocompleteInputProps<T> & {
    name: string;
    value: T | undefined | null;
    onChange: (value: T) => void;
    onBlur: () => void;
    ref?: Ref<HTMLDivElement | null>;
  },
) {
  const [open, setOpen] = useState(false);
  const labelId = `autocomplete-label-${props.name}`;
  const selectedLabel = props.value ? props.getOptionLabel(props.value) : '';

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
              'w-full justify-between font-normal',
              !props.value && 'text-[var(--color-muted)]',
              props.error && 'border-[var(--color-warn)]',
              props.size === 'small' && 'h-8 text-xs',
            )}
          >
            {selectedLabel || props.label}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${props.label}...`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {props.options.map((option, index) => {
                  const optLabel = props.getOptionLabel(option);
                  const isSelected = props.value
                    ? props.getOptionLabel(props.value) === optLabel
                    : false;
                  return (
                    <CommandItem
                      key={index}
                      value={optLabel}
                      onSelect={() => {
                        props.onChange(option);
                        setOpen(false);
                      }}
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

function FormAutocompleteInput<
  TFieldValues extends FieldValues = FieldValues,
  T = unknown,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: AutocompleteInputProps<T> &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <AutocompleteInput<T>
          {...field}
          label={props.label}
          autoFocus={props.autoFocus}
          error={fieldState.error?.message}
          disabled={props.disabled}
          readOnly={props.readOnly}
          testId={props.testId}
          options={props.options}
          renderOption={props.renderOption}
          getOptionLabel={props.getOptionLabel}
          size={props.size}
          value={props.value}
        />
      )}
    />
  );
}

export default FormAutocompleteInput;
