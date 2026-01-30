'use client';

import { useActions } from 'ai/rsc';
import { QuestionCard } from './question-card';
import type { AgentContext } from '@/lib/agents/v2/schemas';

interface ClientQuestionCardProps {
  question: string;
  options: Array<{ label: string; value: string }>;
  locale?: 'en' | 'ar';
  context: AgentContext;
}

export function ClientQuestionCard({
  question,
  options,
  locale = 'en',
  context,
}: ClientQuestionCardProps) {
  const { submitUserMessage } = useActions();

  const handleSelect = async (values: string[]) => {
    const answer = values.join(', ');
    await submitUserMessage(answer, context);
  };

  return (
    <QuestionCard
      question={question}
      options={options}
      onSelect={handleSelect}
      locale={locale}
    />
  );
}
