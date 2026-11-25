'use client'

import { useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'
import { useDismissibleWarning } from '@/lib/hooks/use-dismissible-warning'
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
  const defaultKeyWarning = useDismissibleWarning(
    'open-notebook-default-encryption-key-warning',
    credentialStatus?.encryption_key_is_default ?? false
  )

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
            <h1 className="font-display text-2xl font-bold tracking-tight">{t('simpleModels.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('simpleModels.subtitle')}</p>
          </div>

          {/* Encryption warning */}
          {!encryptionReady && (
            <Alert className="border-destructive/30 bg-destructive-tint">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-destructive">{t('apiKeys.encryptionRequired')}</AlertTitle>
              <AlertDescription className="text-destructive">
                <code className="text-xs bg-destructive-tint px-1 py-0.5 rounded">
                  {t('apiKeys.encryptionRequiredDescription')}
                </code>
              </AlertDescription>
            </Alert>
          )}

          {/* Default encryption key warning (upstream security banner) */}
          {credentialStatus?.encryption_key_is_default && !defaultKeyWarning.dismissed && (
            <Alert className="border-warn/30 bg-warn-tint">
              <ShieldAlert className="h-4 w-4 text-warn" />
              <AlertTitle className="flex items-center justify-between gap-3 text-warn">
                {t('securityWarnings.defaultKeyTitle')}
                <button
                  type="button"
                  aria-label={t('common.close')}
                  onClick={defaultKeyWarning.dismiss}
                  className="rounded-sm opacity-70 hover:opacity-100"
                >
                  ×
                </button>
              </AlertTitle>
              <AlertDescription className="text-warn">
                {t('securityWarnings.defaultKeyDescription')}{' '}
                <a
                  href="https://github.com/lfnovo/open-notebook/blob/main/docs/5-CONFIGURATION/security.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {t('securityWarnings.securityGuide')}
                </a>
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
