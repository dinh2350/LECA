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
import { X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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

function AvatarInput(props: AvatarInputProps) {
  const { onChange } = props;
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const fetchFileUpload = useFileUploadService();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsLoading(true);
      const { status, data } = await fetchFileUpload(acceptedFiles[0]);
      if (status === HTTP_CODES_ENUM.CREATED) {
        onChange(data.file);
      }
      setIsLoading(false);
    },
    [fetchFileUpload, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/jpg': [],
      'image/webp': [],
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 2,
    disabled: isLoading || props.disabled,
  });

  const removeAvatarHandle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-md border border-dashed border-[var(--color-border)] p-4 mt-2 cursor-pointer transition-colors hover:border-[var(--color-foreground)]',
        props.disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      {isDragActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-md">
          <p className="text-white font-bold text-lg">
            {t('common:formInputs.avatarInput.dropzoneText')}
          </p>
        </div>
      )}

      <div className="relative w-24 h-24 group">
        <Avatar className="w-24 h-24">
          <AvatarImage src={props.value?.path} />
          <AvatarFallback className="bg-[var(--color-border)]" />
        </Avatar>
        {props.value && (
          <button
            type="button"
            onClick={removeAvatarHandle}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove avatar"
          >
            <X className="w-10 h-10 text-white" />
          </button>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading}
        data-testid={props.testId}
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading
          ? t('common:loading')
          : t('common:formInputs.avatarInput.selectFile')}
        <input {...getInputProps()} />
      </Button>

      <p className="text-sm text-[var(--color-muted)]">
        {t('common:formInputs.avatarInput.dragAndDrop')}
      </p>

      {props.error && (
        <p className="text-xs text-[var(--color-warn)]">{props.error}</p>
      )}
    </div>
  );
}

function FormAvatarInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Pick<ControllerProps<TFieldValues, TName>, 'name' | 'defaultValue'> & {
    disabled?: boolean;
    testId?: string;
  },
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <AvatarInput
          onChange={field.onChange}
          onBlur={field.onBlur}
          value={field.value}
          error={fieldState.error?.message}
          disabled={props.disabled}
          testId={props.testId}
        />
      )}
    />
  );
}

export default FormAvatarInput;
