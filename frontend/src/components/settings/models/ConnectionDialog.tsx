'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { useCreateCredential, useUpdateCredential } from '@/lib/hooks/use-credentials'
import { Credential, CreateCredentialRequest, UpdateCredentialRequest } from '@/lib/api/credentials'
import {
  ALL_PROVIDERS,
  MODALITY_LABELS,
  PROVIDER_DISPLAY_NAMES,
  PROVIDER_DOCS,
  PROVIDER_MODALITIES,
} from './provider-meta'

/**
 * Add/edit a connection in one dialog. Adding starts with a searchable
 * provider list, then swaps to the credential form; editing goes straight
 * to the form.
 */
export function ConnectionDialog({
  open,
  onOpenChange,
  credential,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  credential?: Credential | null
}) {
  const { t } = useTranslation()
  const [provider, setProvider] = useState<string | null>(credential?.provider ?? null)

  useEffect(() => {
    if (open) setProvider(credential?.provider ?? null)
  }, [open, credential])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {credential
              ? t('apiKeys.editConfig').replace('{provider}', PROVIDER_DISPLAY_NAMES[credential.provider] || credential.provider)
              : provider
                ? t('apiKeys.addConfig').replace('{provider}', PROVIDER_DISPLAY_NAMES[provider] || provider)
                : t('simpleModels.chooseProvider')}
          </DialogTitle>
        </DialogHeader>
        {!provider ? (
          <Command>
            <CommandInput placeholder={t('simpleModels.searchProviders')} />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>{t('simpleModels.noProviderFound')}</CommandEmpty>
              <CommandGroup>
                {ALL_PROVIDERS.map(p => (
                  <CommandItem
                    key={p}
                    value={PROVIDER_DISPLAY_NAMES[p] || p}
                    onSelect={() => setProvider(p)}
                  >
                    <span>{PROVIDER_DISPLAY_NAMES[p] || p}</span>
                    <span className="ml-auto flex gap-1">
                      {(PROVIDER_MODALITIES[p] || []).map(m => (
                        <Badge key={m} variant="secondary" className="text-[10px] px-1 py-0">
                          {MODALITY_LABELS[m]}
                        </Badge>
                      ))}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <CredentialForm
            provider={provider}
            credential={credential}
            onDone={() => onOpenChange(false)}
            onBack={credential ? undefined : () => setProvider(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CredentialForm({
  provider,
  credential,
  onDone,
  onBack,
}: {
  provider: string
  credential?: Credential | null
  onDone: () => void
  onBack?: () => void
}) {
  const { t } = useTranslation()
  const createCredential = useCreateCredential()
  const updateCredential = useUpdateCredential()
  const isEditing = !!credential
  const isSubmitting = createCredential.isPending || updateCredential.isPending

  const isVertex = provider === 'vertex'
  const isOllama = provider === 'ollama'
  const isOpenAICompatible = provider === 'openai_compatible'
  const requiresApiKey = !isVertex && !isOllama && !isOpenAICompatible

  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [project, setProject] = useState('')
  const [location, setLocation] = useState('')
  const [credentialsPath, setCredentialsPath] = useState('')
  const [numCtx, setNumCtx] = useState('')
  const [modalities, setModalities] = useState<string[]>([])

  useEffect(() => {
    if (credential) {
      setName(credential.name || '')
      setBaseUrl(credential.base_url || '')
      setApiKey('')
      setProject(credential.project || '')
      setLocation(credential.location || '')
      setCredentialsPath(credential.credentials_path || '')
      setNumCtx(credential.num_ctx ? String(credential.num_ctx) : '')
      setModalities(credential.modalities || [])
    } else {
      setName(PROVIDER_DISPLAY_NAMES[provider] || provider)
      setBaseUrl('')
      setApiKey('')
      setProject('')
      setLocation('')
      setCredentialsPath('')
      setNumCtx('')
      setModalities(PROVIDER_MODALITIES[provider] || ['language'])
    }
  }, [credential, provider])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const onSuccess = () => onDone()

    if (isEditing && credential) {
      const data: UpdateCredentialRequest = {}
      if (name !== credential.name) data.name = name
      if (apiKey.trim()) data.api_key = apiKey.trim()
      if (baseUrl !== (credential.base_url || '')) data.base_url = baseUrl || undefined
      if (JSON.stringify(modalities) !== JSON.stringify(credential.modalities)) data.modalities = modalities
      if (isVertex) {
        if (project !== (credential.project || '')) data.project = project.trim() || undefined
        if (location !== (credential.location || '')) data.location = location.trim() || undefined
        if (credentialsPath !== (credential.credentials_path || '')) data.credentials_path = credentialsPath.trim() || undefined
      }
      if (isOllama && numCtx !== (credential.num_ctx ? String(credential.num_ctx) : '')) {
        // empty clears the override (0 -> backend resets to default)
        data.num_ctx = numCtx.trim() ? Number(numCtx) : 0
      }
      updateCredential.mutate({ credentialId: credential.id, data }, { onSuccess })
    } else {
      const data: CreateCredentialRequest = {
        name: name || `${PROVIDER_DISPLAY_NAMES[provider] || provider} Config`,
        provider,
        modalities,
        api_key: apiKey.trim() || undefined,
        base_url: baseUrl || undefined,
      }
      if (isVertex) {
        data.project = project.trim() || undefined
        data.location = location.trim() || undefined
        data.credentials_path = credentialsPath.trim() || undefined
      }
      if (isOllama && numCtx.trim()) {
        data.num_ctx = Number(numCtx)
      }
      createCredential.mutate(data, { onSuccess })
    }
  }

  const isValid = isEditing
    ? true
    : isVertex
      ? name.trim() !== '' && project.trim() !== '' && location.trim() !== ''
      : name.trim() !== '' && (!requiresApiKey || apiKey.trim() !== '')

  const docsUrl = PROVIDER_DOCS[provider]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="cred-name">{t('apiKeys.configName')}</Label>
        <input
          id="cred-name"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${PROVIDER_DISPLAY_NAMES[provider] || provider} Production`}
          disabled={isSubmitting}
        />
      </div>

      {/* Vertex fields */}
      {isVertex ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="vertex-project">{t('apiKeys.vertexProject')}</Label>
            <input
              id="vertex-project"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="my-gcp-project"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vertex-location">{t('apiKeys.vertexLocation')}</Label>
            <input
              id="vertex-location"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="us-central1"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vertex-creds">
              {t('apiKeys.vertexCredentials')}
              <span className="text-muted-foreground font-normal ml-1">({t('common.optional')})</span>
            </Label>
            <input
              id="vertex-creds"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={credentialsPath}
              onChange={(e) => setCredentialsPath(e.target.value)}
              placeholder="/path/to/service-account.json"
              disabled={isSubmitting}
            />
          </div>
        </>
      ) : (
        /* API Key */
        <div className="space-y-2">
          <Label htmlFor="api-key">
            {t('models.apiKey')}
            {!requiresApiKey && <span className="text-muted-foreground font-normal ml-1">({t('common.optional')})</span>}
          </Label>
          <div className="relative">
            <input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pr-10"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEditing ? '••••••••••••' : 'sk-...'}
              disabled={isSubmitting}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              tabIndex={-1}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          {isEditing && <p className="text-xs text-muted-foreground">{t('apiKeys.apiKeyEditHint')}</p>}
          {docsUrl && (
            <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
              {t('apiKeys.getApiKey')} &rarr;
            </a>
          )}
        </div>
      )}

      {/* Base URL (non-Vertex) */}
      {!isVertex && (
        <div className="space-y-2">
          <Label htmlFor="base-url" className="text-muted-foreground">{t('apiKeys.baseUrl')}</Label>
          <input
            id="base-url"
            type="url"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={isOllama ? 'http://localhost:11434' : 'https://api.example.com/v1'}
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* num_ctx (Ollama only) */}
      {isOllama && (
        <div className="space-y-2">
          <Label htmlFor="num-ctx" className="text-muted-foreground">
            {t('apiKeys.numCtx')}
            <span className="text-muted-foreground font-normal ml-1">({t('common.optional')})</span>
          </Label>
          <input
            id="num-ctx"
            type="number"
            min={1}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={numCtx}
            onChange={(e) => setNumCtx(e.target.value)}
            placeholder="8192"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">{t('apiKeys.numCtxHint')}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-2 pt-4 border-t">
        <div>
          {onBack && (
            <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
              &larr; {t('common.back')}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEditing ? t('common.save') : t('common.add')}
          </Button>
        </div>
      </div>
    </form>
  )
}
