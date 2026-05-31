'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export interface TurnFeedback {
  fluency: number;
  naturalness: number;
  vocabulary: number;
  explanation: string;
}

interface PronunciationFeedbackOverlayProps {
  feedback: TurnFeedback | null;
  transcript: string;
  onClose: () => void;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? '#3CB887' : score >= 60 ? '#F0622A' : '#E85050';
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] text-white/40 w-20 uppercase">
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="font-display text-sm font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function PronunciationFeedbackOverlay({
  feedback,
  transcript,
  onClose,
}: PronunciationFeedbackOverlayProps) {
  return (
    <Sheet
      open={!!feedback}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-6 pb-8"
        style={{ background: 'var(--s2, #1a1512)', border: 'none' }}
      >
        <SheetHeader className="mb-4">
          <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">
            Turn feedback
          </div>
          <SheetTitle className="font-display text-base text-white text-left leading-relaxed">
            &ldquo;{transcript}&rdquo;
          </SheetTitle>
        </SheetHeader>

        {feedback && (
          <div className="space-y-4">
            <div className="space-y-2">
              <ScoreBar label="Fluency" score={feedback.fluency} />
              <ScoreBar label="Natural" score={feedback.naturalness} />
              <ScoreBar label="Vocab" score={feedback.vocabulary} />
            </div>

            <div
              className="px-4 py-3 rounded-xl border"
              style={{
                background: 'var(--s3)',
                borderColor: 'var(--leca-border)',
              }}
            >
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">
                Coach tip
              </p>
              <p className="text-sm text-white/80 leading-relaxed">
                {feedback.explanation}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl border text-sm text-white/60"
              style={{ borderColor: 'var(--leca-border)' }}
            >
              Close
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
