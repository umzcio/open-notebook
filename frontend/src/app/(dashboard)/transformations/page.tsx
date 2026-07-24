'use client'

import { AppShell } from '@/components/layout/AppShell'
import { DefaultPromptEditor } from './components/DefaultPromptEditor'
import { TransformationsList } from './components/TransformationsList'
import { useTransformations } from '@/lib/hooks/use-transformations'
import { useTranslation } from '@/lib/hooks/use-translation'

export default function TransformationsPage() {
  const { t } = useTranslation()
  const { data: transformations, isLoading } = useTransformations()

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t('transformations.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('simpleTransformations.subtitle')}</p>
          </div>

          <TransformationsList transformations={transformations} isLoading={isLoading} />

          <DefaultPromptEditor />
        </div>
      </div>
    </AppShell>
  )
}
