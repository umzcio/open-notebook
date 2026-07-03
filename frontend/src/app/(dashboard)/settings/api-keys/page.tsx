'use client'

import { useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/use-translation'
import { useModels, useModelDefaults } from '@/lib/hooks/use-models'
import { useCredentials, useCredentialStatus, useEnvStatus } from '@/lib/hooks/use-credentials'
import { MigrationBanner } from '@/components/settings'
import { YourModels } from '@/components/settings/models/YourModels'
import { Connections } from '@/components/settings/models/Connections'

export default function ModelsPage() {
  const { t } = useTranslation()

  const { data: credentials, isLoading: credentialsLoading } = useCredentials()
  const { data: models, isLoading: modelsLoading } = useModels()
  const { data: defaults, isLoading: defaultsLoading } = useModelDefaults()
  const { data: credentialStatus } = useCredentialStatus()
  const { data: envStatus } = useEnvStatus()

  const encryptionReady = credentialStatus?.encryption_configured ?? true

  // Providers with env keys that haven't been migrated into credentials yet
  const providersToMigrate = useMemo(() => {
    if (!envStatus || !credentialStatus) return []
    const providers: string[] = []
    for (const provider in envStatus) {
      if (envStatus[provider] && credentialStatus.source[provider] === 'environment') {
        providers.push(provider)
      }
    }
    return providers
  }, [envStatus, credentialStatus])

  const isLoading = credentialsLoading || modelsLoading || defaultsLoading

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">{t('simpleModels.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('simpleModels.subtitle')}</p>
          </div>

          {/* Encryption warning */}
          {!encryptionReady && (
            <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
              <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-200">{t('apiKeys.encryptionRequired')}</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                <code className="text-xs bg-red-100 dark:bg-red-900/30 px-1 py-0.5 rounded">
                  {t('apiKeys.encryptionRequiredDescription')}
                </code>
              </AlertDescription>
            </Alert>
          )}

          {/* Migration banner */}
          {encryptionReady && <MigrationBanner providersToMigrate={providersToMigrate} />}

          {/* Model slots */}
          {models && defaults && credentials && (
            <YourModels models={models} defaults={defaults} credentials={credentials} />
          )}

          {/* Connections */}
          <Connections credentials={credentials || []} encryptionReady={encryptionReady} />

          {/* Help link */}
          <div className="pt-2">
            <a
              href="https://github.com/lfnovo/open-notebook/blob/main/docs/5-CONFIGURATION/ai-providers.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {t('apiKeys.learnMore')}
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
