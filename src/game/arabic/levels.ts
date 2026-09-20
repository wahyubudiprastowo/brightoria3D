/**
 * levels.ts — Generator soal dinamis dari curriculum.ts (Patch 25).
 *
 * Tidak berubah secara fungsional dari Patch 22-24 — dibangun ulang
 * karena sandbox sempat ter-reset. Export `arabicLevels` TETAP
 * dipertahankan (dibutuhkan App.tsx).
 */

import { curriculum, type ArabicWord, type CurriculumLesson } from './curriculum';

export type QuestionKind = 'word-to-meaning' | 'meaning-to-word' | 'dialogue-response';

export interface GeneratedQuestion {
  id: string;
  kind: QuestionKind;
  prompt: string;
  promptSub?: string;
  promptEmoji?: string;
  options: string[];
  optionEmojis?: (string | null)[];
  correctIndex: number;
  wordId: string;
  explanation: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractorWords(pool: ArabicWord[], exclude: ArabicWord, count: number): ArabicWord[] {
  const candidates = pool.filter((w) => w.id !== exclude.id);
  return shuffle(candidates).slice(0, count);
}

function generateVocabSession(lesson: CurriculumLesson, sessionSize = 8): GeneratedQuestion[] {
  const words = lesson.words ?? [];
  if (words.length === 0) return [];

  const count = Math.min(sessionSize, words.length * 2);
  const pool = shuffle([...words, ...words]).slice(0, count);

  return pool.map((word, idx) => {
    const isWordToMeaning = idx % 2 === 0;
    const distractorWords = pickDistractorWords(words, word, 2);

    if (isWordToMeaning) {
      const options = shuffle([word.meaning, ...distractorWords.map((d) => d.meaning)]);
      return {
        id: `${word.id}-q${idx}`,
        kind: 'word-to-meaning' as QuestionKind,
        prompt: word.arabic,
        promptSub: word.translit,
        promptEmoji: word.emoji,
        options,
        correctIndex: options.indexOf(word.meaning),
        wordId: word.id,
        explanation: `${word.arabic} (${word.translit}) artinya "${word.meaning}".`,
      };
    }

    const allChoiceWords = shuffle([word, ...distractorWords]);
    const options = allChoiceWords.map((w) => `${w.arabic}||${w.translit}`);
    const optionEmojis = allChoiceWords.map((w) => w.emoji);
    return {
      id: `${word.id}-q${idx}`,
      kind: 'meaning-to-word' as QuestionKind,
      prompt: word.meaning,
      promptEmoji: word.emoji,
      options,
      optionEmojis,
      correctIndex: allChoiceWords.findIndex((w) => w.id === word.id),
      wordId: word.id,
      explanation: `"${word.meaning}" dalam Bahasa Arab adalah ${word.arabic} (${word.translit}).`,
    };
  });
}

function generateDialogueSession(lesson: CurriculumLesson): GeneratedQuestion[] {
  const dialogues = lesson.dialogues ?? [];
  if (dialogues.length === 0) return [];

  const allAnswers = dialogues.map((d) => `${d.answer.arabic}||${d.answer.translit}`);

  return shuffle(dialogues).map((exchange, idx) => {
    const correctLabel = `${exchange.answer.arabic}||${exchange.answer.translit}`;
    const distractors = shuffle(allAnswers.filter((a) => a !== correctLabel)).slice(0, 2);
    const options = shuffle([correctLabel, ...distractors]);
    return {
      id: `${exchange.id}-q${idx}`,
      kind: 'dialogue-response' as QuestionKind,
      prompt: exchange.question.arabic,
      promptSub: `${exchange.question.translit} — "${exchange.question.meaning}"`,
      options,
      correctIndex: options.indexOf(correctLabel),
      wordId: exchange.id,
      explanation: `Jawaban yang tepat: ${exchange.answer.arabic} (${exchange.answer.translit}) — "${exchange.answer.meaning}".`,
    };
  });
}

export function generateSession(lessonId: string): GeneratedQuestion[] {
  const lesson = curriculum.find((l) => l.id === lessonId);
  if (!lesson) return [];
  return lesson.kind === 'dialogue' ? generateDialogueSession(lesson) : generateVocabSession(lesson);
}

export function getWordById(id: string): ArabicWord | undefined {
  for (const lesson of curriculum) {
    const found = lesson.words?.find((w) => w.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getTotalWordCount(): number {
  return curriculum.reduce((sum, l) => sum + (l.words?.length ?? l.dialogues?.length ?? 0), 0);
}

/** WAJIB dipertahankan — dibutuhkan App.tsx (arabicLevels.length). */
export const arabicLevels = curriculum;

export { curriculum };
