'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/hooks/use-translation'
import { useCredential, useTestCredential } from '@/lib/hooks/use-credentials'
import { Credential } from '@/lib/api/credentials'
import { PROVIDER_DISPLAY_NAMES } from './provider-meta'
import { ConnectionDialog } from './ConnectionDialog'
import { DeleteConnectionDialog } from './DeleteConnectionDialog'

/**
 * Flat list of configured connections. One row each: status, where it points,
 * how many models it feeds, and inline test/edit/remove. Providers without a
 * connection don't appear — they live in the add dialog.
 */
export function Connections({
  credentials,
  encryptionReady,
}: {
  credentials: Credential[]
  encryptionReady: boolean
}) {
  const { t } = useTranslation()
  const { testCredential, isPending: isTestPending, testResults } = useTestCredential()
  const [testingId, setTestingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Credential | null>(null)

  // The list endpoint omits decrypted fields; fetch the full record for editing.
  const { data: editCredential } = useCredential(editId ?? '')

  const sorted = useMemo(
    () =>
      [...credentials].sort((a, b) => {
        const pa = PROVIDER_DISPLAY_NAMES[a.provider] || a.provider
        const pb = PROVIDER_DISPLAY_NAMES[b.provider] || b.provider
        return pa.localeCompare(pb) || a.name.localeCompare(b.name)
      }),
    [credentials]
  )

  const handleTest = (id: string) => {
    setTestingId(id)
    testCredential(id)
  }

  const detailFor = (cred: Credential) => {
    const parts: string[] = []
    if (cred.base_url) parts.push(cred.base_url)
    else if (cred.endpoint) parts.push(cred.endpoint)
    else if (cred.project) parts.push(cred.project)
    else if (cred.has_api_key) parts.push(t('simpleModels.apiKeySet'))
    if (cred.num_ctx) parts.push(`ctx ${cred.num_ctx}`)
    return parts.join(' · ')
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('simpleModels.connections')}</CardTitle>
        <CardDescription>{t('simpleModels.connectionsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {sorted.map(cred => {
            const providerName = PROVIDER_DISPLAY_NAMES[cred.provider] || cred.provider
            const testResult = testResults[cred.id]
            const broken = !!cred.decryption_error
            const failed = broken || testResult?.success === false
            const healthy = !failed && (testResult?.success || cred.model_count > 0)
            const showName = cred.name && cred.name !== providerName

            return (
              <div key={cred.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      failed ? 'bg-destructive' : healthy ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                    }`}
                    aria-hidden
                  />
                  <span className="text-sm font-medium w-32 shrink-0 truncate">{providerName}</span>
                  <span className="text-xs text-muted-foreground font-mono truncate flex-1 min-w-0">
                    {showName && <span className="font-sans">{cred.name} · </span>}
                    {detailFor(cred)}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {t('simpleModels.modelCount').replace('{count}', String(cred.model_count))}
                  </span>
                  <span className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() => handleTest(cred.id)}
                      disabled={broken || (isTestPending && testingId === cred.id)}
                    >
                      {isTestPending && testingId === cred.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : t('simpleModels.test')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() => setEditId(cred.id)}
                      disabled={broken}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(cred)}
                    >
                      {t('common.remove')}
                    </Button>
                  </span>
                </div>
                {broken && (
                  <p className="mt-1.5 ml-5 flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {t('apiKeys.decryptionErrorDescription')}
                  </p>
                )}
                {!broken && testResult && (
                  <p
                    className={`mt-1.5 ml-5 flex items-center gap-1.5 text-xs ${
                      testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    }`}
                  >
                    {testResult.success ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                    {testResult.success ? t('simpleModels.connected') : testResult.message}
                  </p>
                )}
              </div>
            )
          })}
          {sorted.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              {t('simpleModels.noConnections')}
            </p>
          )}
        </div>
        <div className="border-t px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setAddOpen(true)}
            disabled={!encryptionReady}
          >
            <Plus className="h-4 w-4" />
            {t('simpleModels.addConnection')}
          </Button>
        </div>
      </CardContent>

      <ConnectionDialog open={addOpen} onOpenChange={setAddOpen} />
      {editId && (
        <ConnectionDialog
          open={!!editId}
          onOpenChange={open => { if (!open) setEditId(null) }}
          credential={editCredential || credentials.find(c => c.id === editId)}
        />
      )}
      {deleteTarget && (
        <DeleteConnectionDialog
          open={!!deleteTarget}
          onOpenChange={open => { if (!open) setDeleteTarget(null) }}
          credential={deleteTarget}
          allCredentials={credentials}
        />
      )}
    </Card>
  )
}
