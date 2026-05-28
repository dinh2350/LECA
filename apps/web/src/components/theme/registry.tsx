'use client';

import React from 'react';

// Emotion CSS registry removed - no longer using MUI/Emotion
export default function StyledJsxRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
