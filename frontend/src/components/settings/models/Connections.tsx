'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Loader2, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useTranslation } from '@/lib/hooks/use-translation'
import { useCredential, useTestCredential } from '@/lib/hooks/use-credentials'
import { useProviders } from '@/lib/hooks/use-providers'
import { Credential } from '@/lib/api/credentials'
import { CredentialFormDialog, DeleteCredentialDialog } from '@/components/settings'

/**
 * Flat list of configured connections. One row each: status, where it points,
 * how many models it feeds, and inline test/edit/remove. Providers without a
 * connection live in the add dialog, driven by the backend provider registry.
 */
export function Connections({
  credentials,
  encryptionReady,
}: {
  credentials: Credential[]
  encryptionReady: boolean
}) {
  const { t } = useTranslation()
  const { data: providers } = useProviders()
  const { testCredential, isPending: isTestPending, testResults } = useTestCredential()
  const [testingId, setTestingId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addProvider, setAddProvider] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Credential | null>(null)

  // The list endpoint omits decrypted fields; fetch the full record for editing.
  const { data: editCredential } = useCredential(editId ?? '')

  const providerName = (p: string) => providers?.find(x => x.name === p)?.display_name ?? p
  const modalityLabels: Record<string, string> = {
    language: t('simpleModels.chat'),
    embedding: t('simpleModels.embedding'),
    text_to_speech: t('simpleModels.voice'),
    speech_to_text: t('simpleModels.transcription'),
  }
  const modalityLabel = (m: string) => modalityLabels[m] ?? m

  const sorted = useMemo(
    () =>
      [...credentials].sort((a, b) => {
        const pa = providerName(a.provider)
        const pb = providerName(b.provider)
        return pa.localeCompare(pb) || a.name.localeCompare(b.name)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- providerName is stable per providers fetch
    [credentials, providers]
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
            const pName = providerName(cred.provider)
            const testResult = testResults[cred.id]
            const broken = !!cred.decryption_error
            const failed = broken || testResult?.success === false
            const healthy = !failed && (testResult?.success || cred.model_count > 0)
            const showName = cred.name && cred.name !== pName

            return (
              <div key={cred.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      failed ? 'bg-destructive' : healthy ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                    }`}
                    aria-hidden
                  />
                  <span className="text-sm font-medium w-32 shrink-0 truncate">{pName}</span>
                  <span className="text-xs text-muted-foreground font-mono truncate flex-1 min-w-0">
                    {showName && <span className="font-sans">{cred.name} · </span>}
                    {detailFor(cred)}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {t('simpleModels.modelCount', { count: cred.model_count })}
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
            onClick={() => setPickerOpen(true)}
            disabled={!encryptionReady}
          >
            <Plus className="h-4 w-4" />
            {t('simpleModels.addConnection')}
          </Button>
        </div>
      </CardContent>

      {/* Step 1: pick a provider (registry-driven) */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('simpleModels.chooseProvider')}</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder={t('simpleModels.searchProviders')} />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>{t('simpleModels.noProviderFound')}</CommandEmpty>
              <CommandGroup>
                {(providers ?? []).map(p => (
                  <CommandItem
                    key={p.name}
                    value={p.display_name}
                    onSelect={() => {
                      setPickerOpen(false)
                      setAddProvider(p.name)
                    }}
                  >
                    <span>{p.display_name}</span>
                    <span className="ml-auto flex gap-1">
                      {p.modalities.map(m => (
                        <Badge key={m} variant="secondary" className="text-[10px] px-1 py-0">
                          {modalityLabel(m)}
                        </Badge>
                      ))}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Step 2: the credential form (shared with upstream) */}
      {addProvider && (
        <CredentialFormDialog
          open={!!addProvider}
          onOpenChange={open => { if (!open) setAddProvider(null) }}
          provider={addProvider}
        />
      )}
      {editId && (
        <CredentialFormDialog
          open={!!editId}
          onOpenChange={open => { if (!open) setEditId(null) }}
          provider={(editCredential || credentials.find(c => c.id === editId))?.provider ?? ''}
          credential={editCredential || credentials.find(c => c.id === editId)}
        />
      )}
      {deleteTarget && (
        <DeleteCredentialDialog
          open={!!deleteTarget}
          onOpenChange={open => { if (!open) setDeleteTarget(null) }}
          credential={deleteTarget}
          allCredentials={credentials}
        />
      )}
    </Card>
  )
}
