'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import {
  useCreateScenarioService,
  CreateScenarioPhrasePayload,
} from '@/services/api/services/scenarios';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Constants ─────────────────────────────────────────────────

const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const SITUATION_TYPES = [
  { value: 'everyday', label: '🌍 Everyday' },
  { value: 'work', label: '💼 Work' },
];

// ─── Phrase row ────────────────────────────────────────────────

type PhraseRowProps = {
  index: number;
  phrase: CreateScenarioPhrasePayload;
  onChange: (index: number, updated: CreateScenarioPhrasePayload) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
};

function PhraseRow({
  index,
  phrase,
  onChange,
  onRemove,
  canRemove,
}: PhraseRowProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-white/40">
          Phrase {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      <Input
        placeholder='Key phrase (e.g. "I&apos;d like to make an appointment")'
        value={phrase.phrase}
        onChange={(e) => onChange(index, { ...phrase, phrase: e.target.value })}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
      />
      <Input
        placeholder="Example sentence using the phrase"
        value={phrase.exampleSentence}
        onChange={(e) =>
          onChange(index, { ...phrase, exampleSentence: e.target.value })
        }
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
      />
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-white/30 self-center mr-1">
          Difficulty:
        </span>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() =>
              onChange(index, {
                ...phrase,
                difficulty: phrase.difficulty === d ? undefined : d,
              })
            }
            className={`rounded-full border px-2 py-0.5 text-xs font-medium transition-all ${
              phrase.difficulty === d
                ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/60'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white/70">
        {label}
        {required && <span className="ml-1 text-amber-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Page content ──────────────────────────────────────────────

function ScenarioSubmitPageContent() {
  const router = useRouter();
  const language = useLanguage();
  const createScenario = useCreateScenarioService();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiRole, setAiRole] = useState('');
  const [context, setContext] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [situationType, setSituationType] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [phrases, setPhrases] = useState<CreateScenarioPhrasePayload[]>([
    { phrase: '', exampleSentence: '' },
    { phrase: '', exampleSentence: '' },
    { phrase: '', exampleSentence: '' },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (title.trim().length < 5)
      e.title = 'Title must be at least 5 characters.';
    if (aiRole.trim().length < 5)
      e.aiRole = 'AI role must be at least 5 characters.';
    if (context.trim().length < 10)
      e.context = 'Context must be at least 10 characters.';
    if (!difficulty) e.difficulty = 'Select a difficulty level.';
    if (!situationType) e.situationType = 'Select a category.';
    const validPhrases = phrases.filter(
      (p) => p.phrase.trim() && p.exampleSentence.trim(),
    );
    if (validPhrases.length < 1)
      e.phrases = 'Add at least one complete key phrase.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const validPhrases = phrases.filter(
        (p) => p.phrase.trim() && p.exampleSentence.trim(),
      );
      const res = await createScenario({
        title: title.trim(),
        description: description.trim() || undefined,
        aiRole: aiRole.trim(),
        context: context.trim(),
        difficulty,
        situationType,
        tags: tags.length > 0 ? tags : undefined,
        phrases: validPhrases,
      });
      if (res.status === HTTP_CODES_ENUM.CREATED) {
        setSubmitted(true);
      } else {
        setErrors({ submit: 'Submission failed. Please try again.' });
      }
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  function updatePhrase(index: number, updated: CreateScenarioPhrasePayload) {
    setPhrases((prev) => prev.map((p, i) => (i === index ? updated : p)));
  }

  function removePhrase(index: number) {
    setPhrases((prev) => prev.filter((_, i) => i !== index));
  }

  function addPhrase() {
    if (phrases.length < 20) {
      setPhrases((prev) => [...prev, { phrase: '', exampleSentence: '' }]);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center max-w-md">
          <p className="text-4xl mb-4">✅</p>
          <h2 className="text-xl font-bold text-white mb-2">
            Scenario submitted!
          </h2>
          <p className="text-white/60 text-sm mb-6">
            Your scenario is now in the review queue. Once approved by an admin,
            it will appear in the library.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              onClick={() => router.push(`/${language}/scenarios`)}
            >
              Browse library
            </Button>
            <Button
              variant="outline"
              className="border-white/10 text-white/60"
              onClick={() => {
                setSubmitted(false);
                setTitle('');
                setDescription('');
                setAiRole('');
                setContext('');
                setDifficulty('');
                setSituationType('');
                setTagsInput('');
                setPhrases([
                  { phrase: '', exampleSentence: '' },
                  { phrase: '', exampleSentence: '' },
                  { phrase: '', exampleSentence: '' },
                ]);
              }}
            >
              Submit another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-16 md:px-8 max-w-2xl mx-auto">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push(`/${language}/scenarios`)}
        className="mb-8 flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        ← Scenario library
      </button>

      <div className="mb-8">
        <p className="text-xs font-mono tracking-widest text-amber-400/70 mb-3">
          {'// CONTRIBUTE'}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Submit a scenario
        </h1>
        <p className="text-white/50 text-base">
          Share a conversation scenario with the LECA community. Submissions are
          reviewed before being published.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Title */}
        <Field label="Title" required error={errors.title}>
          <Input
            placeholder="e.g. Job Interview at a Tech Company"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            placeholder="Optional short description of the scenario…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={2}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-amber-500/40 resize-none"
          />
        </Field>

        {/* Category + difficulty row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category" required error={errors.situationType}>
            <div className="flex gap-2">
              {SITUATION_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSituationType(value)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                    situationType === value
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                      : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Difficulty" required error={errors.difficulty}>
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
                    difficulty === d
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                      : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* AI role */}
        <Field label="AI Role" required error={errors.aiRole}>
          <Input
            placeholder="e.g. You are a hiring manager at a software company"
            value={aiRole}
            onChange={(e) => setAiRole(e.target.value)}
            maxLength={500}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </Field>

        {/* Context */}
        <Field label="Conversation Context" required error={errors.context}>
          <textarea
            placeholder="Describe the setting, the learner's goal, and any background the AI needs…"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-amber-500/40 resize-none"
          />
        </Field>

        {/* Tags */}
        <Field label="Tags (comma-separated)">
          <Input
            placeholder="e.g. interview, formal, business"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </Field>

        {/* Key phrases */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">
              Key Phrases <span className="text-amber-400">*</span>
            </label>
            <span className="text-xs text-white/30 font-mono">
              {phrases.length}/20
            </span>
          </div>
          {errors.phrases && (
            <p className="text-xs text-red-400">{errors.phrases}</p>
          )}
          {phrases.map((phrase, i) => (
            <PhraseRow
              key={i}
              index={i}
              phrase={phrase}
              onChange={updatePhrase}
              onRemove={removePhrase}
              canRemove={phrases.length > 1}
            />
          ))}
          {phrases.length < 20 && (
            <button
              type="button"
              onClick={addPhrase}
              className="rounded-xl border border-dashed border-white/10 py-3 text-sm text-white/30 hover:border-white/20 hover:text-white/50 transition-all"
            >
              + Add phrase
            </button>
          )}
        </div>

        {/* Submit error */}
        {errors.submit && (
          <p className="text-sm text-red-400">{errors.submit}</p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          size="lg"
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </Button>
      </form>
    </div>
  );
}

export default withPageRequiredAuth(ScenarioSubmitPageContent);
