'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useSettings, useUpdateSettings } from '@/lib/hooks/use-settings'
import { useCapabilities } from '@/lib/hooks/use-capabilities'
import { useDismissibleWarning } from '@/lib/hooks/use-dismissible-warning'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useTranslation } from '@/lib/hooks/use-translation'
import { SettingsResponse } from '@/lib/types/api'

type SelectKey =
  | 'default_content_processing_engine_doc'
  | 'default_content_processing_engine_url'
  | 'default_embedding_option'
  | 'auto_delete_files'

interface SelectRow {
  key: SelectKey
  label: string
  description: string
  options: { value: string; label: string; disabled?: boolean }[]
  hint?: string
  help: string
}

type VisionKey = 'docling_vision_url' | 'docling_vision_model' | 'docling_vision_prompt'

/** A text setting that saves when you leave the field, if it changed. */
function SaveOnBlurField({
  id,
  label,
  saved,
  multiline,
  placeholder,
  disabled,
  onSave,
}: {
  id: string
  label: string
  saved: string
  multiline?: boolean
  placeholder?: string
  disabled?: boolean
  onSave: (value: string) => void
}) {
  const [value, setValue] = useState(saved)
  useEffect(() => { setValue(saved) }, [saved])
  const commit = () => { if (value !== saved) onSave(value) }
  const Field = multiline ? Textarea : Input
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-x-4 gap-y-1">
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground sm:pt-2.5">{label}</Label>
      <Field
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value)}
        onBlur={commit}
        placeholder={placeholder}
        disabled={disabled}
        className="text-sm"
        {...(multiline ? { rows: 2 } : {})}
      />
    </div>
  )
}

/**
 * A handful of settings, one row each. Changes apply immediately — the
 * backend accepts partial updates. Engines whose opt-in runtime isn't
 * installed are disabled with an env-var hint (fail closed if the
 * capabilities probe errors, mirroring upstream).
 */
export function SettingsForm() {
  const { t } = useTranslation()
  const { data: settings, isLoading, error } = useSettings()
  const { data: capabilities, isError: capabilitiesError } = useCapabilities()
  const updateSettings = useUpdateSettings()
  const [helpOpen, setHelpOpen] = useState(false)
  const authRequired = useAuthStore(state => state.authRequired)
  const authWarning = useDismissibleWarning(
    'open-notebook-no-password-warning',
    authRequired === false
  )

  const doclingAvailable = capabilities?.docling_available ?? !capabilitiesError
  const crawl4aiAvailable = capabilities?.crawl4ai_available ?? !capabilitiesError

  const rows: SelectRow[] = [
    {
      key: 'default_content_processing_engine_doc',
      label: t('simpleSettings.documents'),
      description: t('simpleSettings.documentsDesc'),
      options: [
        { value: 'auto', label: t('settings.autoRecommended') },
        { value: 'docling', label: t('settings.docling'), disabled: !doclingAvailable },
        { value: 'simple', label: t('settings.simple') },
      ],
      hint: doclingAvailable ? undefined : t('settings.enableDoclingHint'),
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
        { value: 'crawl4ai', label: t('settings.crawl4ai'), disabled: !crawl4aiAvailable },
        { value: 'simple', label: t('settings.simple') },
      ],
      hint: crawl4aiAvailable ? undefined : t('settings.enableCrawl4aiHint'),
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

  const doclingToggles: { key: 'docling_ocr' | 'docling_formulas' | 'docling_vision'; label: string; fallback: boolean }[] = [
    { key: 'docling_ocr', label: t('settings.ocrEnabled'), fallback: true },
    { key: 'docling_formulas', label: t('settings.formulasEnabled'), fallback: false },
    { key: 'docling_vision', label: t('settings.visionEnabled'), fallback: false },
  ]

  const visionFields: { key: VisionKey; label: string; help: string; multiline?: boolean; placeholder?: string }[] = [
    { key: 'docling_vision_url', label: t('settings.visionUrl'), help: t('settings.visionUrlHelp'), placeholder: 'http://localhost:1234/v1/chat/completions' },
    { key: 'docling_vision_model', label: t('settings.visionModel'), help: t('settings.visionModelHelp') },
    { key: 'docling_vision_prompt', label: t('settings.visionPrompt'), help: t('settings.visionPromptHelp'), multiline: true },
  ]
  const visionOn = doclingAvailable && (settings?.docling_vision ?? false)

  const helpEntries: { label: string; help: string }[] = [
    ...rows.map(r => ({ label: r.label, help: r.help })),
    ...(doclingAvailable
      ? [
          { label: t('settings.ocrEnabled'), help: t('settings.ocrHelp') },
          { label: t('settings.formulasEnabled'), help: t('settings.formulasHelp') },
          { label: t('settings.visionEnabled'), help: t('settings.visionHelp') },
        ]
      : []),
    ...(visionOn ? visionFields.map(f => ({ label: f.label, help: f.help })) : []),
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
    <div className="space-y-6">
    {authRequired === false && !authWarning.dismissed && (
      <Alert className="max-w-3xl border-warn/30 bg-warn-tint">
        <AlertTitle className="flex items-center justify-between gap-3 text-warn">
          {t('securityWarnings.noPasswordTitle')}
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={authWarning.dismiss}
            className="rounded-sm opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </AlertTitle>
        <AlertDescription className="text-warn">
          {t('securityWarnings.noPasswordDescription')}
        </AlertDescription>
      </Alert>
    )}
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
                {row.hint && <div className="text-xs text-muted-foreground/70 mt-0.5">{row.hint}</div>}
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
                    <SelectItem key={o.value} value={o.value} disabled={o.disabled}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {doclingAvailable && (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3">
              <div>
                <div className="text-sm font-medium">{t('simpleSettings.doclingExtras')}</div>
                <div className="text-xs text-muted-foreground">{t('simpleSettings.doclingExtrasDesc')}</div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {doclingToggles.map(toggle => (
                  <div key={toggle.key} className="flex items-center gap-1.5">
                    <Checkbox
                      id={toggle.key}
                      checked={settings?.[toggle.key] ?? toggle.fallback}
                      onCheckedChange={checked =>
                        updateSettings.mutate({ [toggle.key]: checked === true } as Partial<SettingsResponse>)
                      }
                      disabled={updateSettings.isPending}
                    />
                    <Label htmlFor={toggle.key} className="text-xs font-normal cursor-pointer">
                      {toggle.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {visionOn && (
            <div className="space-y-2 px-4 py-3">
              {visionFields.map(f => (
                <SaveOnBlurField
                  key={f.key}
                  id={f.key}
                  label={f.label}
                  saved={settings?.[f.key] ?? ''}
                  multiline={f.multiline}
                  placeholder={f.placeholder}
                  disabled={updateSettings.isPending}
                  onSave={v => updateSettings.mutate({ [f.key]: v } as Partial<SettingsResponse>)}
                />
              ))}
            </div>
          )}
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
              {helpEntries.map(entry => (
                <div key={entry.label}>
                  <dt className="font-medium text-foreground">{entry.label}</dt>
                  <dd className="mt-0.5">{entry.help}</dd>
                </div>
              ))}
            </dl>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
    </div>
  )
}
