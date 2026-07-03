'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSettings, useUpdateSettings } from '@/lib/hooks/use-settings'
import { useTranslation } from '@/lib/hooks/use-translation'
import { SettingsResponse } from '@/lib/types/api'

type SettingKey =
  | 'default_content_processing_engine_doc'
  | 'default_content_processing_engine_url'
  | 'default_embedding_option'
  | 'auto_delete_files'

interface SettingRow {
  key: SettingKey
  label: string
  description: string
  options: { value: string; label: string }[]
  help: string
}

/**
 * Four settings, four rows. Changes apply immediately — the backend accepts
 * partial updates, so each select saves just its own field.
 */
export function SettingsForm() {
  const { t } = useTranslation()
  const { data: settings, isLoading, error } = useSettings()
  const updateSettings = useUpdateSettings()
  const [helpOpen, setHelpOpen] = useState(false)

  const rows: SettingRow[] = [
    {
      key: 'default_content_processing_engine_doc',
      label: t('simpleSettings.documents'),
      description: t('simpleSettings.documentsDesc'),
      options: [
        { value: 'auto', label: t('settings.autoRecommended') },
        { value: 'docling', label: t('settings.docling') },
        { value: 'simple', label: t('settings.simple') },
      ],
      help: t('settings.docHelp'),
    },
    {
      key: 'default_content_processing_engine_url',
      label: t('simpleSettings.webPages'),
      description: t('simpleSettings.webPagesDesc'),
      options: [
        { value: 'auto', label: t('settings.autoRecommended') },
        { value: 'firecrawl', label: t('settings.firecrawl') },
        { value: 'jina', label: t('settings.jina') },
        { value: 'simple', label: t('settings.simple') },
      ],
      help: t('settings.urlHelp'),
    },
    {
      key: 'default_embedding_option',
      label: t('simpleSettings.embedNewSources'),
      description: t('simpleSettings.embedNewSourcesDesc'),
      options: [
        { value: 'ask', label: t('simpleSettings.askEachTime') },
        { value: 'always', label: t('settings.always') },
        { value: 'never', label: t('settings.never') },
      ],
      help: t('settings.embeddingHelp'),
    },
    {
      key: 'auto_delete_files',
      label: t('simpleSettings.uploadedFiles'),
      description: t('simpleSettings.uploadedFilesDesc'),
      options: [
        { value: 'yes', label: t('simpleSettings.deleteWhenDone') },
        { value: 'no', label: t('simpleSettings.keepForever') },
      ],
      help: t('settings.filesHelp'),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('settings.loadFailed')}</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : t('common.error')}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="max-w-3xl">
      <CardContent className="p-0">
        <div className="divide-y">
          {rows.map(row => (
            <div
              key={row.key}
              className="grid grid-cols-1 sm:grid-cols-[1fr_220px] items-center gap-x-4 gap-y-1 px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium">{row.label}</div>
                <div className="text-xs text-muted-foreground">{row.description}</div>
              </div>
              <Select
                value={(settings?.[row.key] as string) || undefined}
                onValueChange={v => updateSettings.mutate({ [row.key]: v } as Partial<SettingsResponse>)}
                disabled={updateSettings.isPending}
              >
                <SelectTrigger aria-label={row.label}>
                  <SelectValue placeholder={t('simpleSettings.choose')} />
                </SelectTrigger>
                <SelectContent>
                  {row.options.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-1.5 border-t px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
              {t('settings.helpMeChoose')}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <dl className="border-t px-4 py-3 space-y-3 text-xs text-muted-foreground">
              {rows.map(row => (
                <div key={row.key}>
                  <dt className="font-medium text-foreground">{row.label}</dt>
                  <dd className="mt-0.5">{row.help}</dd>
                </div>
              ))}
            </dl>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
