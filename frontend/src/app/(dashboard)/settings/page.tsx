'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SettingsForm } from './components/SettingsForm'
import { useTranslation } from '@/lib/hooks/use-translation'

export default function SettingsPage() {
  const { t } = useTranslation()

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t('navigation.settings')}</h1>
            <p className="text-muted-foreground mt-1">{t('simpleSettings.subtitle')}</p>
          </div>
          <SettingsForm />
        </div>
      </div>
    </AppShell>
  )
}
