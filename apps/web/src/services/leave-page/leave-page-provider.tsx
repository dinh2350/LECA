'use client';

import { PropsWithChildren, useContext, useMemo, useState } from 'react';
import {
  LeavePageActionsContext,
  LeavePageContext,
  LeavePageContextParamsType,
  LeavePageInfoContext,
  LeavePageModalContext,
} from './leave-page-context';
// Need for leave page logic
// eslint-disable-next-line no-restricted-imports
import NextLink from 'next/link';
import { useTranslation } from '../i18n/client';
import { Button } from '@/components/ui/button';

function Provider(props: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const [leavePage, setLeavePage] = useState<LeavePageContextParamsType>(null);
  const [leavePageCounter, setIsLeavePage] = useState(0);

  const contextModalValue = useMemo(
    () => ({
      isOpen,
    }),
    [isOpen],
  );

  const contextValue = useMemo(
    () => ({
      isLeavePage: leavePageCounter !== 0,
    }),
    [leavePageCounter],
  );

  const contextInfoValue = useMemo(
    () => ({
      leavePage,
    }),
    [leavePage],
  );

  const contextActionsValue = useMemo(
    () => ({
      trackLeavePage: () => {
        setIsLeavePage((prevValue) => prevValue + 1);
      },
      setLeavePage: (params: LeavePageContextParamsType) => {
        setLeavePage(params);
      },
      untrackLeavePage: () => {
        setLeavePage(null);
        setIsLeavePage((prevValue) => prevValue - 1);
      },
      openModal: () => {
        setIsOpen(true);
      },
      closeModal: () => {
        setIsOpen(false);
      },
    }),
    [],
  );

  return (
    <LeavePageContext.Provider value={contextValue}>
      <LeavePageModalContext.Provider value={contextModalValue}>
        <LeavePageActionsContext.Provider value={contextActionsValue}>
          <LeavePageInfoContext.Provider value={contextInfoValue}>
            {props.children}
          </LeavePageInfoContext.Provider>
        </LeavePageActionsContext.Provider>
      </LeavePageModalContext.Provider>
    </LeavePageContext.Provider>
  );
}

function Modal() {
  const { t } = useTranslation('common');
  const { isOpen } = useContext(LeavePageModalContext);
  const { leavePage } = useContext(LeavePageInfoContext);
  const { closeModal } = useContext(LeavePageActionsContext);

  const href = (leavePage?.push ?? leavePage?.replace) || '';

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-dialog-title"
      aria-describedby="leave-dialog-description"
      data-testid="want-to-leave-modal"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      <div className="relative z-10 max-w-sm w-full mx-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
        <h2
          id="leave-dialog-title"
          className="text-base font-semibold text-[var(--color-foreground)] mb-2"
        >
          {t('common:leavePage.title')}
        </h2>
        <p
          id="leave-dialog-description"
          className="text-sm text-[var(--color-foreground)]/70 mb-6"
        >
          {t('common:leavePage.message')}
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={closeModal}
            autoFocus
            data-testid="stay"
          >
            {t('common:leavePage.stay')}
          </Button>
          <Button
            variant="ghost"
            onClick={closeModal}
            asChild
            data-testid="leave"
          >
            <NextLink href={href} replace={!!leavePage?.replace}>
              {t('common:leavePage.leave')}
            </NextLink>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LeavePageProvider(props: PropsWithChildren) {
  return (
    <Provider>
      {props.children}
      <Modal />
    </Provider>
  );
}
