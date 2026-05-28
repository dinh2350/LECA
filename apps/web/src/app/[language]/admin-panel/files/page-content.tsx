'use client';

import { RoleEnum } from '@/services/api/types/role';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useTranslation } from '@/services/i18n/client';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileListItem,
  useDeleteFileService,
  useFileUploadService,
  useGetFilesService,
} from '@/services/api/services/files';
import useConfirmDialog from '@/components/confirm-dialog/use-confirm-dialog';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import {
  File as FileIcon,
  FileText,
  Image,
  Trash2,
  Upload,
} from 'lucide-react';
import { useSnackbar } from '@/hooks/use-snackbar';

const filesQueryKey = ['admin-files'] as const;

type FilterType = 'all' | 'images' | 'documents' | 'other';
type FileCategory = 'images' | 'documents' | 'other';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('application/pdf') || mimeType.startsWith('text/'))
    return 'documents';
  return 'other';
}

function matchesFilter(item: FileListItem, filter: FilterType): boolean {
  if (filter === 'all') return true;
  return getFileCategory(item.mimeType) === filter;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const category = getFileCategory(mimeType);
  if (category === 'images') return <Image className="h-8 w-8 text-blue-400" />;
  if (category === 'documents')
    return <FileText className="h-8 w-8 text-orange-400" />;
  return <FileIcon className="h-8 w-8 text-[var(--color-muted)]" />;
}

function FileCard({
  item,
  onDelete,
}: {
  item: FileListItem;
  onDelete: (item: FileListItem) => void;
}) {
  const { t } = useTranslation('admin-panel-files');
  const isImage = item.mimeType.startsWith('image/');

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="h-20 flex items-center justify-center bg-[var(--color-border)]/20">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.path}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileTypeIcon mimeType={item.mimeType} />
        )}
      </div>
      <div className="p-2">
        <p
          className="text-xs text-[var(--color-foreground)] truncate"
          title={item.name}
        >
          {item.name}
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          {formatFileSize(item.size)}
        </p>
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-[var(--color-warn)] hover:text-[var(--color-warn)]"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {t('actions.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FileManager() {
  const { t } = useTranslation('admin-panel-files');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { confirmDialog } = useConfirmDialog();
  const getFiles = useGetFilesService();
  const deleteFile = useDeleteFileService();
  const uploadFile = useFileUploadService();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading, isError } = useQuery({
    queryKey: filesQueryKey,
    queryFn: async () => {
      const result = await getFiles();
      if (result.status === HTTP_CODES_ENUM.OK) return result.data.data;
      enqueueSnackbar(t('alerts.fetchError'), { variant: 'error' });
      throw new Error('Failed to fetch files');
    },
  });

  const files = useMemo(
    () => (data ?? []).filter((f) => matchesFilter(f, filter)),
    [data, filter],
  );

  const onDrop = useCallback(
    async (acceptedFiles: globalThis.File[]) => {
      setIsUploading(true);
      try {
        for (const file of acceptedFiles) {
          const result = await uploadFile(file);
          if (result.status !== HTTP_CODES_ENUM.CREATED) {
            enqueueSnackbar(t('alerts.uploadError'), { variant: 'error' });
          }
        }
        await queryClient.invalidateQueries({ queryKey: filesQueryKey });
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile, queryClient, enqueueSnackbar, t],
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    disabled: isUploading,
  });

  const handleDelete = useCallback(
    async (item: FileListItem) => {
      const confirmed = await confirmDialog({
        title: t('confirm.delete.title'),
        message: t('confirm.delete.message'),
      });
      if (!confirmed) return;
      const result = await deleteFile({ id: item.id });
      if (
        result.status === HTTP_CODES_ENUM.NO_CONTENT ||
        result.status === HTTP_CODES_ENUM.OK
      ) {
        await queryClient.invalidateQueries({ queryKey: filesQueryKey });
      } else {
        enqueueSnackbar(t('alerts.deleteError'), { variant: 'error' });
      }
    },
    [confirmDialog, deleteFile, queryClient, t, enqueueSnackbar],
  );

  const filterTabs = useMemo(
    () =>
      [
        { key: 'all', label: t('filter.all') },
        { key: 'images', label: t('filter.images') },
        { key: 'documents', label: t('filter.documents') },
        { key: 'other', label: t('filter.other') },
      ] as const,
    [t],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            {t('title')}
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {t('description')}
          </p>
        </div>
        <Button onClick={open} disabled={isUploading}>
          <Upload className="h-4 w-4 mr-2" />
          {t('upload')}
        </Button>
      </div>

      <div className="flex gap-1 border-b border-[var(--color-border)] mb-6">
        {filterTabs.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === f.key
                ? 'border-[var(--color-accent)] text-[var(--color-foreground)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Hidden input always mounted so open() works regardless of load/error state */}
      <input {...getInputProps()} />

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-muted)]">
          {t('common:loading')}
        </div>
      ) : isError ? (
        <p className="text-center text-sm text-destructive py-8">
          {t('alerts.fetchError')}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">
              {t('empty')}
            </p>
          )}
          {files.map((file) => (
            <FileCard key={file.id} item={file} onDelete={handleDelete} />
          ))}
          <div
            {...getRootProps()}
            className="rounded-lg border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center p-4 hover:border-[var(--color-accent)] transition-colors min-h-[120px] cursor-default"
          >
            <Upload className="h-6 w-6 text-[var(--color-muted)] mb-2" />
            <p className="text-xs text-[var(--color-muted)] text-center">
              {t('dropzone')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(FileManager, { roles: [RoleEnum.ADMIN] });
