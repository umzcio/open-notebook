'use client'

import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { ChevronsUpDown, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useTranslation } from '@/lib/hooks/use-translation'
import { useCreateModel } from '@/lib/hooks/use-models'
import { credentialsApi, Credential } from '@/lib/api/credentials'
import { Model } from '@/lib/types/models'
import { useProviders } from '@/lib/hooks/use-providers'

type ModelType = Model['type']

/**
 * One searchable combobox for a model slot. Lists every model the user's
 * connections offer for the given type — registered ones and ones discovered
 * live from the provider. Picking an unregistered model registers it
 * transparently before selecting it.
 */
export function ModelPicker({
  modelType,
  value,
  models,
  credentials,
  clearable = false,
  placeholder,
  missing = false,
  onSelect,
}: {
  modelType: ModelType
  value?: string | null
  models: Model[]
  credentials: Credential[]
  clearable?: boolean
  placeholder: string
  missing?: boolean
  onSelect: (modelId: string | null) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const createModel = useCreateModel()
  const [registeringKey, setRegisteringKey] = useState<string | null>(null)
  const { data: providers } = useProviders()
  const providerName = (p: string) => providers?.find(x => x.name === p)?.display_name ?? p

  const eligibleCredentials = useMemo(
    () =>
      credentials.filter(
        c => c.modalities.includes(modelType) && !c.decryption_error
      ),
    [credentials, modelType]
  )

  // Discovery is lazy (only while the picker is open) and cached per credential.
  const discoverQueries = useQueries({
    queries: eligibleCredentials.map(c => ({
      queryKey: ['credentials', c.id, 'discover'],
      queryFn: () => credentialsApi.discover(c.id),
      enabled: open,
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  })

  const registeredForType = useMemo(
    () => models.filter(m => m.type === modelType),
    [models, modelType]
  )

  const selectedModel = value ? models.find(m => m.id === value) : undefined

  const groups = eligibleCredentials.map((cred, i) => {
    const registered = registeredForType.filter(m => m.credential === cred.id)
    const registeredNames = new Set(registered.map(m => m.name))
    const discovery = discoverQueries[i]
    const discovered = (discovery.data?.discovered ?? []).filter(
      d =>
        !registeredNames.has(d.name) &&
        (!d.model_type || d.model_type === modelType)
    )
    return { cred, registered, discovered, isDiscovering: discovery.isFetching }
  })

  const anyDiscovering = groups.some(g => g.isDiscovering)

  const handlePickRegistered = (model: Model) => {
    setOpen(false)
    if (model.id !== value) onSelect(model.id)
  }

  const handlePickUnregistered = (cred: Credential, name: string) => {
    const key = `${cred.id}:${name}`
    setRegisteringKey(key)
    createModel.mutate(
      { name, provider: cred.provider, type: modelType, credential: cred.id },
      {
        onSuccess: model => {
          setRegisteringKey(null)
          setOpen(false)
          onSelect(model.id)
        },
        onError: () => setRegisteringKey(null),
      }
    )
  }

  const trimmedQuery = query.trim()
  const hasExactMatch = groups.some(
    g =>
      g.registered.some(m => m.name === trimmedQuery) ||
      g.discovered.some(d => d.name === trimmedQuery)
  )

  return (
    <div className="flex items-center gap-1 min-w-0">
      <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setQuery('') }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between font-normal min-w-0 ${
              missing && !selectedModel
                ? 'border-dashed border-amber-500 text-amber-600 dark:text-amber-400 hover:text-amber-700'
                : !selectedModel
                  ? 'text-muted-foreground'
                  : ''
            }`}
          >
            <span className="truncate">
              {selectedModel ? (
                <>
                  {selectedModel.name}
                  <span className="text-muted-foreground ml-1.5 text-xs">
                    · {providerName(selectedModel.provider)}
                  </span>
                </>
              ) : (
                placeholder
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t('simpleModels.searchModels')}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {anyDiscovering ? (
                  <span className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('simpleModels.discovering')}
                  </span>
                ) : (
                  t('simpleModels.noModels')
                )}
              </CommandEmpty>
              {groups.map(({ cred, registered, discovered, isDiscovering }) => {
                const pName = providerName(cred.provider)
                const sameProviderCount = eligibleCredentials.filter(c => c.provider === cred.provider).length
                const heading = sameProviderCount > 1 ? `${pName} · ${cred.name}` : pName
                if (registered.length === 0 && discovered.length === 0 && !isDiscovering) return null
                return (
                  <CommandGroup key={cred.id} heading={heading}>
                    {registered.map(model => (
                      <CommandItem
                        key={model.id}
                        value={`${model.name} ${pName}`}
                        onSelect={() => handlePickRegistered(model)}
                        className={model.id === value ? 'font-medium' : ''}
                      >
                        <span className="truncate">{model.name}</span>
                        {model.id === value && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {t('simpleModels.current')}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                    {discovered.map(d => {
                      const key = `${cred.id}:${d.name}`
                      return (
                        <CommandItem
                          key={key}
                          value={`${d.name} ${pName}`}
                          onSelect={() => handlePickUnregistered(cred, d.name)}
                          disabled={registeringKey !== null}
                        >
                          <span className="truncate">{d.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                            {registeringKey === key && <Loader2 className="h-3 w-3 animate-spin" />}
                          </span>
                        </CommandItem>
                      )
                    })}
                    {isDiscovering && (
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t('simpleModels.discovering')}
                      </div>
                    )}
                  </CommandGroup>
                )
              })}
              {/* Type a name the provider didn't list (fine-tunes, aliases, …) */}
              {trimmedQuery && !hasExactMatch &&
                eligibleCredentials.map(cred => {
                  const pName = providerName(cred.provider)
                  const key = `custom:${cred.id}`
                  return (
                    <CommandItem
                      key={key}
                      value={`${trimmedQuery} ${pName} custom`}
                      onSelect={() => handlePickUnregistered(cred, trimmedQuery)}
                      disabled={registeringKey !== null}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {t('simpleModels.useCustom', { name: trimmedQuery })}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">{pName}</span>
                    </CommandItem>
                  )
                })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {clearable && selectedModel && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onSelect(null)}
          title={t('simpleModels.clear')}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
