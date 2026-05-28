'use client';

import React, { useState, useRef, useEffect, useCallback, Ref } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { ItemProps, ListProps, Virtuoso } from 'react-virtuoso';
import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type MultipleSelectExtendedInputProps<T extends object> = {
  label: string;
  error?: string;
  testId?: string;
  disabled?: boolean;
  options: T[];
  renderSelected: (option: T[]) => React.ReactNode;
  renderOption: (option: T) => React.ReactNode;
  keyExtractor: (option: T) => string;
  onEndReached?: () => void;
} & (
  | {
      isSearchable: true;
      searchLabel: string;
      searchPlaceholder: string;
      search: string;
      onSearchChange: (search: string) => void;
    }
  | {
      isSearchable?: false;
    }
);

const VirtuosoComponents = {
  List: function VList({ style, children }: ListProps) {
    return (
      <ul style={{ padding: 0, margin: 0, listStyle: 'none', ...style }}>
        {children}
      </ul>
    );
  },
  Item: ({ children, ...props }: ItemProps<unknown>) => (
    <li style={{ margin: 0 }} {...props}>
      {children}
    </li>
  ),
};

function MultipleSelectExtendedInput<T extends object>(
  props: MultipleSelectExtendedInputProps<T> & {
    name: string;
    value: T[] | null;
    onChange: (value: T[]) => void;
    onBlur: () => void;
    ref?: Ref<HTMLDivElement | null>;
  },
) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputId = `multiple-select-extended-${props.name}`;
  const valueKeys = props.value?.map(props.keyExtractor) ?? [];

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (isOpen) {
      boxRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="flex flex-col gap-1 w-full">
      <Label htmlFor={inputId}>{props.label}</Label>
      <div ref={boxRef}>
        <button
          id={inputId}
          type="button"
          data-testid={props.testId}
          disabled={props.disabled}
          onClick={() => {
            if (props.disabled) return;
            setIsOpen((prev) => !prev);
          }}
          onBlur={props.onBlur}
          className={cn(
            'flex min-h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-sm text-left text-[var(--color-foreground)] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50',
            props.error && 'border-[var(--color-warn)]',
          )}
        >
          {props.value && props.value.length > 0 ? (
            props.renderSelected(props.value)
          ) : (
            <span className="text-[var(--color-muted)]">{props.label}</span>
          )}
        </button>
        {!!props.error && (
          <p
            className="text-xs text-[var(--color-warn)] mt-1"
            data-testid={`${props.testId}-error`}
          >
            {props.error}
          </p>
        )}
      </div>

      {isOpen && (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md overflow-hidden">
          {props.isSearchable && (
            <div className="p-2 border-b border-[var(--color-border)]">
              <Input
                placeholder={props.searchPlaceholder}
                value={props.search}
                onChange={(e) => props.onSearchChange?.(e.target.value)}
                autoFocus
                data-testid={`${props.testId}-search`}
              />
            </div>
          )}
          <Virtuoso
            style={{
              height:
                props.options.length <= 6 ? props.options.length * 48 : 320,
            }}
            data={props.options}
            endReached={props.onEndReached}
            components={VirtuosoComponents}
            itemContent={(_index, item) => {
              const typedItem = item as T;
              const isSelected = valueKeys.includes(
                props.keyExtractor(typedItem),
              );
              return (
                <button
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] transition-colors',
                    isSelected
                      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'text-[var(--color-foreground)]',
                  )}
                  onClick={() => {
                    const newValue = props.value
                      ? isSelected
                        ? props.value.filter(
                            (selectedItem) =>
                              props.keyExtractor(selectedItem) !==
                              props.keyExtractor(typedItem),
                          )
                        : [...props.value, typedItem]
                      : [typedItem];
                    props.onChange(newValue);
                  }}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {props.renderOption(typedItem)}
                </button>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

function FormMultipleSelectExtendedInput<
  TFieldValues extends FieldValues = FieldValues,
  T extends object = object,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'> &
    MultipleSelectExtendedInputProps<T>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <MultipleSelectExtendedInput<T>
          {...field}
          isSearchable={props.isSearchable}
          label={props.label}
          error={fieldState.error?.message}
          disabled={props.disabled}
          testId={props.testId}
          options={props.options}
          renderOption={props.renderOption}
          renderSelected={props.renderSelected}
          keyExtractor={props.keyExtractor}
          search={props.isSearchable ? props.search : ''}
          onSearchChange={
            props.isSearchable ? props.onSearchChange : () => undefined
          }
          onEndReached={props.isSearchable ? props.onEndReached : undefined}
          searchLabel={props.isSearchable ? props.searchLabel : ''}
          searchPlaceholder={props.isSearchable ? props.searchPlaceholder : ''}
        />
      )}
    />
  );
}

export default FormMultipleSelectExtendedInput;
