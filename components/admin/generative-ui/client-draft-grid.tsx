'use client';

import { useState } from 'react';
import { useActions } from '@ai-sdk/rsc';
import { DraftGrid } from './draft-grid';
import { ConfirmationCard } from './confirmation-card';
import { StatusCard } from './status-card';
import { ProgressCard } from './progress-card';
import type { ProductDraft } from '@/lib/agents/v2/schemas';
import type { AgentContext } from '@/lib/agents/v2/schemas';

interface ClientDraftGridProps {
  drafts: ProductDraft[];
  context: AgentContext;
}

type ApprovalState =
  | { phase: 'grid' }
  | { phase: 'confirming'; draftIds: string[] }
  | { phase: 'persisting' }
  | { phase: 'done'; success: boolean; message: string };

/**
 * ClientDraftGrid bridges server-streamed UI and the DraftGrid display component.
 * Handles the full approve/edit/discard flow with ConfirmationCard gate.
 */
export function ClientDraftGrid({ drafts, context }: ClientDraftGridProps) {
  const { confirmAndPersistDrafts, discardDraftsAction, updateDraftAction } = useActions();
  const [approvalState, setApprovalState] = useState<ApprovalState>({ phase: 'grid' });
  const [currentDrafts, setCurrentDrafts] = useState(drafts);
  const locale = context.locale as 'en' | 'ar';

  const handleApprove = (draftIds: string[]) => {
    setApprovalState({ phase: 'confirming', draftIds });
  };

  const handleConfirm = async (draftIds: string[]) => {
    setApprovalState({ phase: 'persisting' });

    const result = await confirmAndPersistDrafts(draftIds, context);

    setApprovalState({
      phase: 'done',
      success: result.success,
      message: result.message || result.error || '',
    });
  };

  const handleCancel = () => {
    setApprovalState({ phase: 'grid' });
  };

  const handleDiscard = async (draftIds: string[]) => {
    const result = await discardDraftsAction(draftIds);
    if (result.success) {
      setCurrentDrafts((prev) => prev.filter((d: any) => !draftIds.includes(d.draft_id)));
    }
  };

  const handleEdit = async (draftId: string, field: string) => {
    const result = await updateDraftAction(draftId, { [field]: '' });
    if (result.success && result.draft) {
      setCurrentDrafts((prev: any[]) =>
        prev.map((d) => (d.draft_id === draftId ? { ...d, ...result.draft } : d))
      );
    }
  };

  if (approvalState.phase === 'confirming') {
    return (
      <ConfirmationCard
        action="create_products"
        description={
          locale === 'ar'
            ? `هل تريد إنشاء ${approvalState.draftIds.length} منتج(ات) في متجرك؟`
            : `Create ${approvalState.draftIds.length} product(s) in your store?`
        }
        draftIds={approvalState.draftIds}
        totalProducts={approvalState.draftIds.length}
        locale={locale}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  if (approvalState.phase === 'persisting') {
    return (
      <ProgressCard
        status="processing"
        message={locale === 'ar' ? 'جاري حفظ المنتجات...' : 'Saving products...'}
        locale={locale}
      />
    );
  }

  if (approvalState.phase === 'done') {
    return (
      <StatusCard
        success={approvalState.success}
        title={
          approvalState.success
            ? locale === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully'
            : locale === 'ar' ? 'فشل الحفظ' : 'Save Failed'
        }
        message={approvalState.message}
        locale={locale}
      />
    );
  }

  return (
    <DraftGrid
      drafts={currentDrafts as any}
      locale={locale}
      onApprove={handleApprove}
      onEdit={handleEdit}
      onDiscard={handleDiscard}
    />
  );
}
