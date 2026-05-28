# MUI → shadcn/ui + Tailwind: Phase 2 (Form Components) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 14 MUI form component implementations with shadcn/ui primitives + Tailwind CSS, keeping each component's external TypeScript API identical so no call-sites change.

**Architecture:** Each form component is a self-contained directory under `src/components/form/`. The internal implementation is swapped from MUI to shadcn, but the exported `FormXxx` React-Hook-Form `<Controller>`-wrapper keeps its exact same props interface. Call-sites in pages do not need to change until Phase 3. Each task is independently mergeable. Storybook stories are updated alongside the component — never in a separate task.

**Prerequisites:** Phase 0+1 complete (`apps/web/components.json` exists, Tailwind running, shadcn CLI available, `react-day-picker` and `@tiptap/*` already installed).

**Tech Stack:** Next.js 16, shadcn/ui (New York style), Tailwind CSS v4, react-hook-form, react-day-picker v9, @tiptap/react, lucide-react, react-dropzone (kept), react-virtuoso (kept), pnpm

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/form/text-input/form-text-input.tsx` | Rewrite | MUI TextField → shadcn Input + Label |
| `src/components/form/text-input/form-text-input.stories.tsx` | Modify | Remove MUI decorator |
| `src/components/form/select/form-select.tsx` | Rewrite | MUI Select → shadcn Select |
| `src/components/form/select/form-select.stories.tsx` | Modify | Update story |
| `src/components/form/select-extended/form-select-extended.tsx` | Rewrite | MUI List+Virtuoso dropdown → shadcn Popover + Command + Virtuoso |
| `src/components/form/select-extended/form-select-extended.stories.tsx` | Modify | Update story |
| `src/components/form/multiple-select/form-multiple-select.tsx` | Rewrite | MUI Select multiple → shadcn Command + Popover (multi) |
| `src/components/form/multiple-select/form-multiple-select.stories.tsx` | Modify | Update story |
| `src/components/form/multiple-select-extended/form-multiple-select-extended.tsx` | Rewrite | MUI List+Virtuoso multi → shadcn Command + Popover + Virtuoso (multi+search) |
| `src/components/form/multiple-select-extended/form-multiple-select-extended.stories.tsx` | Modify | Update story |
| `src/components/form/autocomplete/form-autocomplete.tsx` | Rewrite | MUI Autocomplete → shadcn Combobox (Command + Popover) |
| `src/components/form/autocomplete/form-autocomplete.stories.tsx` | Modify | Update story |
| `src/components/form/checkbox/form-checkbox.tsx` | Rewrite | MUI Checkbox group → shadcn Checkbox (multi-select) |
| `src/components/form/checkbox/form-checkbox.stories.tsx` | Modify | Update story |
| `src/components/form/checkbox-boolean/form-checkbox-boolean.tsx` | Rewrite | MUI Checkbox → shadcn Checkbox (boolean) |
| `src/components/form/checkbox-boolean/form-checkbox-boolean.stories.tsx` | Modify | Update story |
| `src/components/form/radio-group/form-radio-group.tsx` | Rewrite | MUI RadioGroup → shadcn RadioGroup |
| `src/components/form/radio-group/form-radio-group.stories.tsx` | Modify | Update story |
| `src/components/form/switch/form-switch.tsx` | Rewrite | MUI Switch group → shadcn Switch (multi-option) |
| `src/components/form/switch/form-switch.stories.tsx` | Modify | Update story |
| `src/components/form/avatar-input/form-avatar-input.tsx` | Rewrite | MUI Avatar + Emotion styled → shadcn Avatar + Tailwind + react-dropzone |
| `src/components/form/avatar-input/form-avatar-input.stories.tsx` | Modify | Update story |
| `src/components/form/image-picker/image-picker.tsx` | Rewrite | MUI ImageList + Emotion → Tailwind + react-dropzone |
| `src/components/form/image-picker/image-picker.stories.tsx` | Modify | Update story |
| `src/components/form/multiple-image-picker/multiple-image-picker.tsx` | Rewrite | MUI ImageList multi + Emotion → Tailwind + react-dropzone |
| `src/components/form/multiple-image-picker/multiple-image-picker.stories.tsx` | Modify | Update story |
| `src/components/form/date-pickers/date-picker.tsx` | Rewrite | @mui/x-date-pickers DatePicker → react-day-picker + shadcn Popover |
| `src/components/form/date-pickers/date-time-picker.tsx` | Rewrite | @mui/x-date-pickers DateTimePicker → react-day-picker + shadcn Popover + time input |
| `src/components/form/date-pickers/time-picker.tsx` | Rewrite | @mui/x-date-pickers TimePicker → shadcn Popover + time input |
| `src/components/form/date-pickers/helper.ts` | Keep | Locale map — no changes needed |
| `src/components/form/date-pickers/date-picker.stories.tsx` | Modify | Update story |
| `src/components/form/date-pickers/date-time-picker.stories.tsx` | Modify | Update story |
| `src/components/form/date-pickers/time-picker.stories.tsx` | Modify | Update story |
| `src/components/ui/input.tsx` | Create (shadcn) | shadcn Input primitive |
| `src/components/ui/label.tsx` | Create (shadcn) | shadcn Label primitive |
| `src/components/ui/select.tsx` | Create (shadcn) | shadcn Select primitive |
| `src/components/ui/popover.tsx` | Create (shadcn) | shadcn Popover primitive |
| `src/components/ui/command.tsx` | Create (shadcn) | shadcn Command (cmdk) primitive |
| `src/components/ui/checkbox.tsx` | Create (shadcn) | shadcn Checkbox primitive |
| `src/components/ui/radio-group.tsx` | Create (shadcn) | shadcn RadioGroup primitive |
| `src/components/ui/switch.tsx` | Create (shadcn) | shadcn Switch primitive |
| `src/components/ui/calendar.tsx` | Create (shadcn) | shadcn Calendar (react-day-picker wrapper) |

---

## Task 1: Install shadcn primitives for Phase 2

Install all shadcn primitives needed across Phase 2 in one batch to avoid repeated CLI calls.

- [ ] **Step 1: Install shadcn form primitives**

```bash
cd apps/web && pnpm dlx shadcn@latest add input label select popover command checkbox radio-group switch calendar
```

This creates files in `src/components/ui/`: `input.tsx`, `label.tsx`, `select.tsx`, `popover.tsx`, `command.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `calendar.tsx`.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/
git commit -m "feat(web): install shadcn primitives for phase 2 form components"
```

---

## Task 2: FormTextInput

**API kept identical:** same props interface, same `FormTextInput` default export.

**Files:**
- Rewrite: `src/components/form/text-input/form-text-input.tsx`
- Modify: `src/components/form/text-input/form-text-input.stories.tsx`

- [ ] **Step 1: Rewrite form-text-input.tsx**

Replace the entire file with:

```tsx
'use client';

import React, { ChangeEvent, Ref, useState } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  multiline?: boolean;
  minRows?: number;
  maxRows?: number;
  size?: 'small' | 'medium';
};

function TextInput(
  props: TextInputProps & {
    name: string;
    value: string;
    onChange: (value: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
    ref?: Ref<HTMLInputElement | null>;
  },
) {
  const [isShowPassword, setIsShowPassword] = useState(false);
  const isPassword = props.type === 'password';
  const inputType = isPassword ? (isShowPassword ? 'text' : 'password') : props.type;

  const inputClassName = cn(
    'font-mono bg-[--color-surface] border-[--color-border] text-[--color-foreground]',
    'placeholder:text-[--color-muted] focus-visible:ring-[--color-accent]',
    props.error && 'border-[--color-warn] focus-visible:ring-[--color-warn]',
    props.size === 'small' ? 'h-8 text-xs' : 'h-10 text-sm',
  );

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label
        htmlFor={props.name}
        className="font-mono text-xs text-[--color-muted-foreground]"
      >
        {props.label}
      </Label>
      {props.multiline ? (
        <textarea
          id={props.name}
          name={props.name}
          value={props.value}
          onChange={props.onChange as (e: ChangeEvent<HTMLTextAreaElement>) => void}
          onBlur={props.onBlur}
          disabled={props.disabled}
          readOnly={props.readOnly}
          autoFocus={props.autoFocus}
          autoComplete={props.autoComplete}
          data-testid={props.testId}
          rows={props.minRows ?? 3}
          className={cn(
            inputClassName,
            'min-h-[80px] resize-y rounded-md border px-3 py-2 w-full',
          )}
        />
      ) : (
        <div className="relative w-full">
          <Input
            ref={props.ref}
            id={props.name}
            name={props.name}
            type={inputType}
            value={props.value}
            onChange={props.onChange as (e: ChangeEvent<HTMLInputElement>) => void}
            onBlur={props.onBlur}
            disabled={props.disabled}
            readOnly={props.readOnly}
            autoFocus={props.autoFocus}
            autoComplete={props.autoComplete}
            data-testid={props.testId}
            className={cn(inputClassName, isPassword && 'pr-10')}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[--color-muted] hover:text-[--color-foreground]"
            >
              {isShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      )}
      {!!props.error && (
        <p
          className="font-mono text-xs text-[--color-warn]"
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
  props: TextInputProps &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <TextInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormTextInput;
```

- [ ] **Step 2: Update stories — remove MUI import**

Open `form-text-input.stories.tsx`. Remove any `@mui/*` imports. Ensure the story wraps with `<FormProvider>` from `react-hook-form` (if it already does this pattern, keep it).

- [ ] **Step 3: Verify Storybook renders**

```bash
cd apps/web && pnpm sb
```

Open the TextInput story. Should render with dark monospace styling.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/form/text-input/
git commit -m "feat(web): replace MUI TextField with shadcn Input in FormTextInput"
```

---

## Task 3: FormSelect

**API kept identical:** `SelectInputProps<T>` + `FormSelectInput` export.

**Files:**
- Rewrite: `src/components/form/select/form-select.tsx`
- Modify: `src/components/form/select/form-select.stories.tsx`

- [ ] **Step 1: Rewrite form-select.tsx**

```tsx
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
import { cn } from '@/lib/utils';

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
    ref?: Ref<HTMLButtonElement | null>;
  },
) {
  const currentValue = props.value?.[props.keyValue]?.toString() ?? '';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label
        htmlFor={`select-${props.name}`}
        className="font-mono text-xs text-[--color-muted-foreground]"
      >
        {props.label}
      </Label>
      <Select
        value={currentValue}
        onValueChange={(val) => {
          const newValue = props.options.find(
            (o) => o[props.keyValue]?.toString() === val,
          );
          if (newValue) props.onChange(newValue);
        }}
        disabled={props.disabled}
      >
        <SelectTrigger
          ref={props.ref}
          id={`select-${props.name}`}
          data-testid={props.testId}
          className={cn(
            'font-mono bg-[--color-surface] border-[--color-border] text-[--color-foreground]',
            props.error && 'border-[--color-warn]',
            props.size === 'small' ? 'h-8 text-xs' : 'h-10 text-sm',
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[--color-surface] border-[--color-border] font-mono">
          {props.options.map((option) => (
            <SelectItem
              key={option[props.keyValue]?.toString()}
              value={option[props.keyValue]?.toString() ?? ''}
              className="text-[--color-foreground] focus:bg-[--color-bg] focus:text-[--color-accent]"
            >
              {props.renderOption(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!!props.error && (
        <p
          className="font-mono text-xs text-[--color-warn]"
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
        <SelectInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormSelectInput;
```

- [ ] **Step 2: Update stories**

Remove MUI imports from `form-select.stories.tsx`.

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/form/select/
git commit -m "feat(web): replace MUI Select with shadcn Select in FormSelectInput"
```

---

## Task 4: FormAutocomplete

Uses shadcn Combobox pattern: `Command` inside `Popover`.

**Files:**
- Rewrite: `src/components/form/autocomplete/form-autocomplete.tsx`
- Modify: `src/components/form/autocomplete/form-autocomplete.stories.tsx`

- [ ] **Step 1: Rewrite form-autocomplete.tsx**

```tsx
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    ref?: Ref<HTMLButtonElement | null>;
  },
) {
  const [open, setOpen] = useState(false);
  const displayValue = props.value ? props.getOptionLabel(props.value) : '';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label className="font-mono text-xs text-[--color-muted-foreground]">
        {props.label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={props.ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={props.disabled}
            data-testid={props.testId}
            className={cn(
              'w-full justify-between font-mono bg-[--color-surface] border-[--color-border] text-[--color-foreground] hover:bg-[--color-bg]',
              !displayValue && 'text-[--color-muted]',
              props.error && 'border-[--color-warn]',
              props.size === 'small' ? 'h-8 text-xs' : 'h-10 text-sm',
            )}
          >
            {displayValue || props.label}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-[--color-surface] border-[--color-border]">
          <Command className="bg-[--color-surface]">
            <CommandInput
              placeholder={`Search ${props.label}...`}
              className="font-mono text-xs text-[--color-foreground]"
            />
            <CommandList>
              <CommandEmpty className="font-mono text-xs text-[--color-muted] py-4 text-center">
                No results.
              </CommandEmpty>
              <CommandGroup>
                {props.options.map((option, idx) => (
                  <CommandItem
                    key={idx}
                    value={props.getOptionLabel(option)}
                    onSelect={() => {
                      props.onChange(option);
                      props.onBlur();
                      setOpen(false);
                    }}
                    className="font-mono text-xs text-[--color-foreground] aria-selected:bg-[--color-bg] aria-selected:text-[--color-accent]"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 text-[--color-accent]',
                        props.value && props.getOptionLabel(props.value) === props.getOptionLabel(option)
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    {props.renderOption(option)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
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
        <AutocompleteInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormAutocompleteInput;
```

- [ ] **Step 2: Update stories**

Remove MUI imports from `form-autocomplete.stories.tsx`.

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/form/autocomplete/
git commit -m "feat(web): replace MUI Autocomplete with shadcn Combobox in FormAutocompleteInput"
```

---

## Task 5: FormMultipleSelect

Uses `Command` + `Popover` with multi-selection checkmarks.

**Files:**
- Rewrite: `src/components/form/multiple-select/form-multiple-select.tsx`
- Modify: `src/components/form/multiple-select/form-multiple-select.stories.tsx`

- [ ] **Step 1: Rewrite form-multiple-select.tsx**

```tsx
'use client';

import { Ref, useState } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    ref?: Ref<HTMLButtonElement | null>;
  },
) {
  const [open, setOpen] = useState(false);
  const selected = props.value ?? [];

  const toggle = (option: T) => {
    const key = option[props.keyValue];
    const exists = selected.some((s) => s[props.keyValue] === key);
    props.onChange(
      exists ? selected.filter((s) => s[props.keyValue] !== key) : [...selected, option],
    );
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label className="font-mono text-xs text-[--color-muted-foreground]">
        {props.label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={props.ref}
            variant="outline"
            role="combobox"
            disabled={props.disabled}
            data-testid={props.testId}
            className={cn(
              'w-full justify-between font-mono bg-[--color-surface] border-[--color-border] text-[--color-foreground] hover:bg-[--color-bg]',
              props.error && 'border-[--color-warn]',
            )}
          >
            <span className="truncate">
              {selected.length > 0 ? props.renderValue(selected) : props.label}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-[--color-surface] border-[--color-border]">
          <Command className="bg-[--color-surface]">
            <CommandList>
              <CommandEmpty className="font-mono text-xs text-[--color-muted] py-4 text-center">
                No options.
              </CommandEmpty>
              <CommandGroup>
                {props.options.map((option, idx) => {
                  const isSelected = selected.some(
                    (s) => s[props.keyValue] === option[props.keyValue],
                  );
                  return (
                    <CommandItem
                      key={idx}
                      onSelect={() => toggle(option)}
                      className="font-mono text-xs text-[--color-foreground] aria-selected:bg-[--color-bg]"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 text-[--color-accent]',
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
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
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
        <MultipleSelectInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormMultipleSelectInput;
```

- [ ] **Step 2: Update stories**

Remove MUI imports from `form-multiple-select.stories.tsx`.

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/form/multiple-select/
git commit -m "feat(web): replace MUI MultipleSelect with shadcn Command+Popover"
```

---

## Task 6: FormSelectExtended + FormMultipleSelectExtended

These two components use `react-virtuoso` for virtual scrolling inside a dropdown. We keep `react-virtuoso`'s `Virtuoso` component for the list but replace the MUI shell with shadcn Popover + Tailwind.

**Files:**
- Rewrite: `src/components/form/select-extended/form-select-extended.tsx`
- Modify: `src/components/form/select-extended/form-select-extended.stories.tsx`
- Rewrite: `src/components/form/multiple-select-extended/form-multiple-select-extended.tsx`
- Modify: `src/components/form/multiple-select-extended/form-multiple-select-extended.stories.tsx`

- [ ] **Step 1: Rewrite form-select-extended.tsx**

The component supports an optional `isSearchable` variant. Replace entirely:

```tsx
'use client';

import React, { Ref, useState, useRef } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Virtuoso } from 'react-virtuoso';
import { ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type SelectExtendedInputProps<T extends object> = {
  label: string;
  error?: string;
  testId?: string;
  disabled?: boolean;
  options: T[];
  renderSelected: (option: T) => React.ReactNode;
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

function SelectExtendedInput<T extends object>(
  props: SelectExtendedInputProps<T> & {
    name: string;
    value: T | undefined | null;
    onChange: (value: T) => void;
    onBlur: () => void;
    ref?: Ref<HTMLButtonElement | null>;
  },
) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label className="font-mono text-xs text-[--color-muted-foreground]">
        {props.label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={props.ref}
            variant="outline"
            role="combobox"
            disabled={props.disabled}
            data-testid={props.testId}
            className={cn(
              'w-full justify-between font-mono bg-[--color-surface] border-[--color-border] text-[--color-foreground] hover:bg-[--color-bg]',
              !props.value && 'text-[--color-muted]',
              props.error && 'border-[--color-warn]',
            )}
          >
            <span className="truncate">
              {props.value ? props.renderSelected(props.value) : props.label}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-[--color-surface] border-[--color-border]" align="start">
          <div className="flex flex-col">
            {props.isSearchable && (
              <div className="p-2 border-b border-[--color-border]">
                <Input
                  placeholder={props.searchPlaceholder}
                  value={props.search}
                  onChange={(e) => props.onSearchChange(e.target.value)}
                  className="h-8 font-mono text-xs bg-[--color-bg] border-[--color-border] text-[--color-foreground]"
                />
              </div>
            )}
            <Virtuoso
              style={{ height: Math.min(props.options.length * 40, 240) }}
              data={props.options}
              endReached={props.onEndReached}
              itemContent={(_, option) => (
                <button
                  type="button"
                  key={props.keyExtractor(option)}
                  onClick={() => {
                    props.onChange(option);
                    props.onBlur();
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left font-mono text-xs text-[--color-foreground] hover:bg-[--color-bg] hover:text-[--color-accent] transition-colors',
                    props.value && props.keyExtractor(props.value) === props.keyExtractor(option) &&
                      'text-[--color-accent] bg-[--color-bg]',
                  )}
                >
                  {props.renderOption(option)}
                </button>
              )}
            />
          </div>
        </PopoverContent>
      </Popover>
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
          {props.error}
        </p>
      )}
    </div>
  );
}

function FormSelectExtendedInput<
  TFieldValues extends FieldValues = FieldValues,
  T extends object = object,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: SelectExtendedInputProps<T> &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <SelectExtendedInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormSelectExtendedInput;
```

- [ ] **Step 2: Rewrite form-multiple-select-extended.tsx**

Follow the same Popover+Virtuoso pattern as above but with multi-selection (check marks, toggle behavior). Mirror the `MultipleSelectInput` toggle logic from Task 5, with Virtuoso replacing CommandList.

- [ ] **Step 3: Update both stories files**

Remove all MUI imports.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/form/select-extended/ apps/web/src/components/form/multiple-select-extended/
git commit -m "feat(web): replace MUI extended selects with shadcn Popover+Virtuoso"
```

---

## Task 7: FormCheckbox + FormCheckboxBoolean

**Files:**
- Rewrite: `src/components/form/checkbox/form-checkbox.tsx`
- Modify: `src/components/form/checkbox/form-checkbox.stories.tsx`
- Rewrite: `src/components/form/checkbox-boolean/form-checkbox-boolean.tsx`
- Modify: `src/components/form/checkbox-boolean/form-checkbox-boolean.stories.tsx`

- [ ] **Step 1: Rewrite form-checkbox.tsx (multi-option group)**

```tsx
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
import { cn } from '@/lib/utils';

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
    const exists = value.some((v) => v[props.keyValue] === key);
    props.onChange(
      exists ? value.filter((v) => v[props.keyValue] !== key) : [...value, option],
    );
  };

  return (
    <div ref={props.ref} className="flex flex-col gap-2" data-testid={props.testId}>
      <span className="font-mono text-xs text-[--color-muted-foreground]">{props.label}</span>
      <div className="flex flex-col gap-2">
        {props.options.map((option) => {
          const key = props.keyExtractor(option);
          const checked = value.some((v) => v[props.keyValue]?.toString() === key);
          return (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`${props.name}-${key}`}
                checked={checked}
                disabled={props.disabled}
                onCheckedChange={() => {
                  toggle(option);
                  props.onBlur();
                }}
                className={cn(
                  'border-[--color-border] data-[state=checked]:bg-[--color-accent] data-[state=checked]:border-[--color-accent]',
                )}
              />
              <Label
                htmlFor={`${props.name}-${key}`}
                className="font-mono text-xs text-[--color-foreground] cursor-pointer"
              >
                {props.renderOption(option)}
              </Label>
            </div>
          );
        })}
      </div>
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
          {props.error}
        </p>
      )}
    </div>
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
        <CheckboxInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormCheckboxInput;
```

- [ ] **Step 2: Rewrite form-checkbox-boolean.tsx**

```tsx
'use client';

import { ChangeEvent, Ref } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
    ref?: Ref<HTMLButtonElement | null>;
  },
) {
  const checked = props.value ?? false;

  return (
    <div className="flex flex-col gap-1.5" data-testid={props.testId}>
      <div className="flex items-center gap-2">
        <Checkbox
          ref={props.ref}
          id={props.name}
          checked={checked}
          disabled={props.disabled}
          onCheckedChange={(val) => {
            props.onChange(Boolean(val));
            props.onBlur();
          }}
          className={cn(
            'border-[--color-border] data-[state=checked]:bg-[--color-accent] data-[state=checked]:border-[--color-accent]',
          )}
        />
        <Label
          htmlFor={props.name}
          className="font-mono text-xs text-[--color-foreground] cursor-pointer"
        >
          {props.label}
        </Label>
      </div>
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
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
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormCheckboxBooleanInput;
```

- [ ] **Step 3: Update both stories**

Remove MUI imports.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/form/checkbox/ apps/web/src/components/form/checkbox-boolean/
git commit -m "feat(web): replace MUI Checkbox with shadcn Checkbox"
```

---

## Task 8: FormRadioGroup + FormSwitch

**Files:**
- Rewrite: `src/components/form/radio-group/form-radio-group.tsx`
- Modify: `src/components/form/radio-group/form-radio-group.stories.tsx`
- Rewrite: `src/components/form/switch/form-switch.tsx`
- Modify: `src/components/form/switch/form-switch.stories.tsx`

- [ ] **Step 1: Rewrite form-radio-group.tsx**

```tsx
'use client';

import { Ref, ReactNode } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type RadioInputProps<T> = {
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
  renderOption: (option: T) => ReactNode;
};

function RadioInput<T>(
  props: RadioInputProps<T> & {
    name: string;
    value: T | undefined | null;
    onChange: (value: T) => void;
    onBlur: () => void;
    ref?: Ref<HTMLDivElement | null>;
  },
) {
  const currentKey = props.value?.[props.keyValue]?.toString() ?? '';

  return (
    <div ref={props.ref} className="flex flex-col gap-2" data-testid={props.testId}>
      <span className="font-mono text-xs text-[--color-muted-foreground]">{props.label}</span>
      <RadioGroup
        value={currentKey}
        disabled={props.disabled}
        onValueChange={(val) => {
          const option = props.options.find((o) => props.keyExtractor(o) === val);
          if (option) {
            props.onChange(option);
            props.onBlur();
          }
        }}
        className="flex flex-col gap-2"
      >
        {props.options.map((option) => {
          const key = props.keyExtractor(option);
          return (
            <div key={key} className="flex items-center gap-2">
              <RadioGroupItem
                value={key}
                id={`${props.name}-${key}`}
                className="border-[--color-border] text-[--color-accent]"
              />
              <Label
                htmlFor={`${props.name}-${key}`}
                className="font-mono text-xs text-[--color-foreground] cursor-pointer"
              >
                {props.renderOption(option)}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
          {props.error}
        </p>
      )}
    </div>
  );
}

function FormRadioInput<
  TFieldValues extends FieldValues = FieldValues,
  T = unknown,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: RadioInputProps<T> &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <RadioInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormRadioInput;
```

- [ ] **Step 2: Rewrite form-switch.tsx**

The `Switch` in the original codebase is a multi-option group (not a boolean toggle). Each option has its own shadcn `Switch`:

```tsx
'use client';

import { Ref } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type SwitchInputProps<T> = {
  label: string;
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

function SwitchInput<T>(
  props: SwitchInputProps<T> & {
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
    const exists = value.some((v) => v[props.keyValue] === key);
    props.onChange(
      exists ? value.filter((v) => v[props.keyValue] !== key) : [...value, option],
    );
    props.onBlur();
  };

  return (
    <div ref={props.ref} className="flex flex-col gap-2" data-testid={props.testId}>
      <span className="font-mono text-xs text-[--color-muted-foreground]">{props.label}</span>
      <div className="flex flex-col gap-3">
        {props.options.map((option) => {
          const key = props.keyExtractor(option);
          const checked = value.some((v) => v[props.keyValue]?.toString() === key);
          return (
            <div key={key} className="flex items-center justify-between">
              <Label
                htmlFor={`${props.name}-${key}`}
                className="font-mono text-xs text-[--color-foreground] cursor-pointer"
              >
                {props.renderOption(option)}
              </Label>
              <Switch
                id={`${props.name}-${key}`}
                checked={checked}
                disabled={props.disabled}
                onCheckedChange={() => toggle(option)}
                className="data-[state=checked]:bg-[--color-accent]"
              />
            </div>
          );
        })}
      </div>
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
          {props.error}
        </p>
      )}
    </div>
  );
}

function FormSwitchInput<
  TFieldValues extends FieldValues = FieldValues,
  T = unknown,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: SwitchInputProps<T> &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <SwitchInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormSwitchInput;
```

- [ ] **Step 3: Update both stories**

Remove MUI imports.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/form/radio-group/ apps/web/src/components/form/switch/
git commit -m "feat(web): replace MUI RadioGroup and Switch with shadcn primitives"
```

---

## Task 9: FormAvatarInput

Keeps `react-dropzone` for file drop. Replaces MUI `Avatar`, `Box`, `Button`, Emotion styled containers with Tailwind.

**Files:**
- Rewrite: `src/components/form/avatar-input/form-avatar-input.tsx`
- Modify: `src/components/form/avatar-input/form-avatar-input.stories.tsx`

- [ ] **Step 1: Rewrite form-avatar-input.tsx**

```tsx
'use client';

import { useFileUploadService } from '@/services/api/services/files';
import { FileEntity } from '@/services/api/types/file-entity';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { X, Upload, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AvatarInputProps = {
  error?: string;
  onChange: (value: FileEntity | null) => void;
  onBlur: () => void;
  value?: FileEntity;
  disabled?: boolean;
  testId?: string;
};

export function AvatarInput(props: AvatarInputProps) {
  const { t } = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(false);
  const fetchFileUpload = useFileUploadService();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data, status } = await fetchFileUpload(formData);
        if (status === HTTP_CODES_ENUM.CREATED) {
          props.onChange(data);
        }
      } finally {
        setIsLoading(false);
        props.onBlur();
      }
    },
    [fetchFileUpload, props],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: props.disabled || isLoading,
  });

  return (
    <div className="flex flex-col items-center gap-3" data-testid={props.testId}>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center gap-3 p-4 mt-2 border border-dashed rounded-lg cursor-pointer transition-colors',
          'border-[--color-border] hover:border-[--color-accent]',
          isDragActive && 'border-[--color-accent] bg-[--color-surface]',
          props.disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input {...getInputProps()} />
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={props.value?.path} />
            <AvatarFallback className="bg-[--color-surface] text-[--color-muted]">
              <User className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[--color-bg]/70">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
            </div>
          )}
        </div>
        <span className="font-mono text-xs text-[--color-muted]">
          {isDragActive ? 'Drop image here' : 'Click or drag to upload avatar'}
        </span>
      </div>
      {props.value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => props.onChange(null)}
          className="font-mono text-xs text-[--color-warn] hover:text-[--color-warn] hover:bg-transparent"
        >
          <X className="h-3 w-3 mr-1" />
          Remove
        </Button>
      )}
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]">{props.error}</p>
      )}
    </div>
  );
}

function FormAvatarInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Omit<AvatarInputProps, 'onChange' | 'onBlur' | 'value'> &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <AvatarInput
          {...props}
          onChange={field.onChange}
          onBlur={field.onBlur}
          value={field.value}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormAvatarInput;
```

- [ ] **Step 2: Update stories**

Remove MUI + Emotion imports from `form-avatar-input.stories.tsx`.

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/form/avatar-input/
git commit -m "feat(web): replace MUI AvatarInput with shadcn Avatar + Tailwind dropzone"
```

---

## Task 10: ImagePicker + MultipleImagePicker

Both keep `react-dropzone`. Replace MUI `ImageList`, `ImageListItem`, `Box`, Emotion styled wrappers with Tailwind.

**Files:**
- Rewrite: `src/components/form/image-picker/image-picker.tsx`
- Modify: `src/components/form/image-picker/image-picker.stories.tsx`
- Rewrite: `src/components/form/multiple-image-picker/multiple-image-picker.tsx`
- Modify: `src/components/form/multiple-image-picker/multiple-image-picker.stories.tsx`

- [ ] **Step 1: Rewrite image-picker.tsx**

```tsx
'use client';

import { useFileUploadService } from '@/services/api/services/files';
import { FileEntity } from '@/services/api/types/file-entity';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ImagePickerProps = {
  error?: string;
  onChange: (value: FileEntity | null) => void;
  onBlur: () => void;
  value?: FileEntity;
  disabled?: boolean;
  testId?: string;
  label?: React.ReactNode;
};

export function ImagePicker(props: ImagePickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fetchFileUpload = useFileUploadService();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data, status } = await fetchFileUpload(formData);
        if (status === HTTP_CODES_ENUM.CREATED) {
          props.onChange(data);
        }
      } finally {
        setIsLoading(false);
        props.onBlur();
      }
    },
    [fetchFileUpload, props],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: props.disabled || isLoading,
  });

  return (
    <div className="flex flex-col gap-2" data-testid={props.testId}>
      {props.label && (
        <span className="font-mono text-xs text-[--color-muted-foreground]">{props.label}</span>
      )}
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center gap-3 p-4 border border-dashed rounded-lg cursor-pointer transition-colors',
          'border-[--color-border] hover:border-[--color-accent]',
          isDragActive && 'border-[--color-accent] bg-[--color-surface]',
          props.disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input {...getInputProps()} />
        {props.value ? (
          <div className="relative">
            <img
              src={props.value.path}
              alt="Picked"
              className="max-h-48 max-w-full rounded object-contain"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded bg-[--color-bg]/70">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
              </div>
            )}
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
            ) : (
              <ImagePlus className="h-8 w-8 text-[--color-muted]" />
            )}
            <span className="font-mono text-xs text-[--color-muted]">
              {isDragActive ? 'Drop image here' : 'Click or drag to upload image'}
            </span>
          </>
        )}
      </div>
      {props.value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => props.onChange(null)}
          className="font-mono text-xs text-[--color-warn] hover:text-[--color-warn] hover:bg-transparent self-start"
        >
          <X className="h-3 w-3 mr-1" />
          Remove
        </Button>
      )}
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]">{props.error}</p>
      )}
    </div>
  );
}

function FormImagePicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Omit<ImagePickerProps, 'onChange' | 'onBlur' | 'value'> &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <ImagePicker
          {...props}
          onChange={field.onChange}
          onBlur={field.onBlur}
          value={field.value}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormImagePicker;
```

- [ ] **Step 2: Rewrite multiple-image-picker.tsx**

Follow the same Tailwind dropzone pattern, but accept `FileEntity[]` value and display a CSS grid of thumbnails instead of a single image. Allow individual removal via an X button per image.

- [ ] **Step 3: Update both stories**

Remove MUI imports.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/form/image-picker/ apps/web/src/components/form/multiple-image-picker/
git commit -m "feat(web): replace MUI ImagePicker with Tailwind dropzone"
```

---

## Task 11: DatePicker

Replaces `@mui/x-date-pickers` with `react-day-picker` + shadcn `Popover` + shadcn `Calendar`.

**Files:**
- Rewrite: `src/components/form/date-pickers/date-picker.tsx`
- Modify: `src/components/form/date-pickers/date-picker.stories.tsx`

- [ ] **Step 1: Rewrite date-picker.tsx**

```tsx
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  },
) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', props.className)}>
      <Label className="font-mono text-xs text-[--color-muted-foreground]">
        {props.label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-testid={props.testId}
            disabled={props.disabled}
            className={cn(
              'w-full justify-start font-mono text-sm bg-[--color-surface] border-[--color-border] text-[--color-foreground] hover:bg-[--color-bg]',
              !props.value && 'text-[--color-muted]',
              props.error && 'border-[--color-warn]',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-[--color-muted]" />
            {props.value ? format(props.value, 'PPP') : props.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[--color-surface] border-[--color-border]" align="start">
          <Calendar
            mode="single"
            selected={props.value ?? undefined}
            onSelect={(date) => {
              props.onChange(date ?? null);
              props.onBlur();
              setOpen(false);
            }}
            disabled={props.disabled}
            fromDate={props.minDate}
            toDate={props.maxDate}
            autoFocus={props.autoFocus}
            className="font-mono text-xs text-[--color-foreground]"
          />
        </PopoverContent>
      </Popover>
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
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
      render={({ field, fieldState }) => (
        <DatePickerInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormDatePickerInput;
```

Note: `react-day-picker` v9 uses `fromDate`/`toDate` for min/max. The `views` prop from MUI is dropped — `react-day-picker` does not have an equivalent. If `views` was used to restrict to month/year only, use `captionLayout="dropdown"` instead.

- [ ] **Step 2: Update stories**

Remove MUI + AdapterDateFns imports.

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/form/date-pickers/date-picker.tsx apps/web/src/components/form/date-pickers/date-picker.stories.tsx
git commit -m "feat(web): replace @mui/x-date-pickers DatePicker with react-day-picker"
```

---

## Task 12: DateTimePicker

Combines `react-day-picker` calendar with a time input (`<input type="time">`).

**Files:**
- Rewrite: `src/components/form/date-pickers/date-time-picker.tsx`
- Modify: `src/components/form/date-pickers/date-time-picker.stories.tsx`

- [ ] **Step 1: Rewrite date-time-picker.tsx**

```tsx
'use client';

import * as React from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ValueDateType = Date | null | undefined;

export type DateTimePickerFieldProps = {
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

function DateTimePickerInput(
  props: DateTimePickerFieldProps & {
    name: string;
    value: ValueDateType;
    onChange: (value: ValueDateType) => void;
    onBlur: () => void;
  },
) {
  const [open, setOpen] = React.useState(false);
  const timeValue = props.value ? format(props.value, 'HH:mm') : '';

  const handleDaySelect = (date: Date | undefined) => {
    if (!date) { props.onChange(null); return; }
    const base = props.value ?? new Date();
    const updated = setMinutes(setHours(date, base.getHours()), base.getMinutes());
    props.onChange(updated);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const base = props.value ?? new Date();
    props.onChange(setMinutes(setHours(base, hours), minutes));
    props.onBlur();
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', props.className)}>
      <Label className="font-mono text-xs text-[--color-muted-foreground]">{props.label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-testid={props.testId}
            disabled={props.disabled}
            className={cn(
              'w-full justify-start font-mono text-sm bg-[--color-surface] border-[--color-border] text-[--color-foreground] hover:bg-[--color-bg]',
              !props.value && 'text-[--color-muted]',
              props.error && 'border-[--color-warn]',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-[--color-muted]" />
            {props.value ? format(props.value, 'PPP HH:mm') : props.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[--color-surface] border-[--color-border]" align="start">
          <Calendar
            mode="single"
            selected={props.value ?? undefined}
            onSelect={handleDaySelect}
            disabled={props.disabled}
            fromDate={props.minDate}
            toDate={props.maxDate}
            autoFocus={props.autoFocus}
            className="font-mono text-xs text-[--color-foreground]"
          />
          <div className="flex items-center gap-2 border-t border-[--color-border] p-3">
            <Clock className="h-4 w-4 text-[--color-muted]" />
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              disabled={props.disabled}
              className="font-mono text-xs bg-transparent text-[--color-foreground] border-none outline-none"
            />
          </div>
        </PopoverContent>
      </Popover>
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
          {props.error}
        </p>
      )}
    </div>
  );
}

function FormDateTimePickerInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: DateTimePickerFieldProps &
    Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'>,
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <DateTimePickerInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormDateTimePickerInput;
```

- [ ] **Step 2: Update stories**

Remove MUI imports.

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/form/date-pickers/date-time-picker.tsx apps/web/src/components/form/date-pickers/date-time-picker.stories.tsx
git commit -m "feat(web): replace @mui/x-date-pickers DateTimePicker with react-day-picker + time input"
```

---

## Task 13: TimePicker

A Popover with only a time input — no calendar.

**Files:**
- Rewrite: `src/components/form/date-pickers/time-picker.tsx`
- Modify: `src/components/form/date-pickers/time-picker.stories.tsx`

- [ ] **Step 1: Rewrite time-picker.tsx**

```tsx
'use client';

import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { Clock } from 'lucide-react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ValueDateType = Date | null | undefined;

export type TimePickerFieldProps = {
  disabled?: boolean;
  className?: string;
  readOnly?: boolean;
  label: string;
  testId?: string;
  error?: string;
  defaultValue?: ValueDateType;
};

function TimePickerInput(
  props: TimePickerFieldProps & {
    name: string;
    value: ValueDateType;
    onChange: (value: ValueDateType) => void;
    onBlur: () => void;
  },
) {
  const [open, setOpen] = React.useState(false);
  const timeString = props.value && isValid(props.value)
    ? format(props.value, 'HH:mm')
    : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parse(e.target.value, 'HH:mm', new Date());
    props.onChange(isValid(parsed) ? parsed : null);
    props.onBlur();
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', props.className)}>
      <Label className="font-mono text-xs text-[--color-muted-foreground]">{props.label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-testid={props.testId}
            disabled={props.disabled}
            className={cn(
              'w-full justify-start font-mono text-sm bg-[--color-surface] border-[--color-border] text-[--color-foreground] hover:bg-[--color-bg]',
              !props.value && 'text-[--color-muted]',
              props.error && 'border-[--color-warn]',
            )}
          >
            <Clock className="mr-2 h-4 w-4 text-[--color-muted]" />
            {timeString || props.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 bg-[--color-surface] border-[--color-border] p-4" align="start">
          <div className="flex flex-col gap-2">
            <Label className="font-mono text-xs text-[--color-muted-foreground]">Time</Label>
            <input
              type="time"
              value={timeString}
              onChange={handleChange}
              disabled={props.disabled}
              autoFocus
              className="font-mono text-sm bg-[--color-bg] border border-[--color-border] rounded px-2 py-1 text-[--color-foreground] outline-none focus:border-[--color-accent]"
            />
          </div>
        </PopoverContent>
      </Popover>
      {!!props.error && (
        <p className="font-mono text-xs text-[--color-warn]" data-testid={`${props.testId}-error`}>
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
      render={({ field, fieldState }) => (
        <TimePickerInput
          {...props}
          {...field}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default FormTimePickerInput;
```

- [ ] **Step 2: Update stories**

Remove MUI imports.

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/form/date-pickers/time-picker.tsx apps/web/src/components/form/date-pickers/time-picker.stories.tsx
git commit -m "feat(web): replace @mui/x-date-pickers TimePicker with Tailwind time input"
```

---

## Task 14: Uninstall @mui/x-date-pickers + verify no remaining usage

- [ ] **Step 1: Confirm no remaining @mui/x-date-pickers imports**

```bash
grep -r "@mui/x-date-pickers" apps/web/src --include="*.ts" --include="*.tsx"
```

Expected: no results.

- [ ] **Step 2: Uninstall @mui/x-date-pickers**

```bash
cd apps/web && pnpm remove @mui/x-date-pickers
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Run Storybook to verify all form stories work**

```bash
cd apps/web && pnpm sb
```

All form component stories should render with the dark monospace design.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): uninstall @mui/x-date-pickers — phase 2 form components complete"
```

---

## Next Steps

- **Phase 3 plan:** `docs/superpowers/plans/2026-05-25-mui-to-shadcn-phase3-pages-cleanup.md`
  - Migrate all pages to use Phase 1+2 components
  - Remove MUI ThemeProvider, Emotion registry
  - Uninstall all `@mui/*` and `@emotion/*` packages
