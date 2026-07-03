'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useTranslation } from '@/lib/hooks/use-translation'
import { useUpdateModelDefaults, useAutoAssignDefaults } from '@/lib/hooks/use-models'
import { EmbeddingModelChangeDialog } from '@/components/settings/EmbeddingModelChangeDialog'
import { Credential } from '@/lib/api/credentials'
import { Model, ModelDefaults } from '@/lib/types/models'
import { ModelType } from './provider-meta'
import { ModelPicker } from './ModelPicker'

interface SlotConfig {
  key: keyof ModelDefaults
  label: string
  description: string
  modelType: ModelType
  required?: boolean
  placeholder: string
}

/**
 * The four model slots that matter (plus an advanced fold-out for the three
 * language-model overrides). Setting Chat also fills any empty advanced slots
 * so a fresh setup works end-to-end with one pick per row.
 */
export function YourModels({
  models,
  defaults,
  credentials,
}: {
  models: Model[]
  defaults: ModelDefaults
  credentials: Credential[]
}) {
  const { t } = useTranslation()
  const updateDefaults = useUpdateModelDefaults()
  const autoAssign = useAutoAssignDefaults()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [pendingEmbedding, setPendingEmbedding] = useState<string | null>(null)

  const primarySlots: SlotConfig[] = [
    {
      key: 'default_chat_model',
      label: t('simpleModels.chat'),
      description: t('simpleModels.chatDesc'),
      modelType: 'language',
      required: true,
      placeholder: t('simpleModels.chooseModel'),
    },
    {
      key: 'default_embedding_model',
      label: t('simpleModels.embedding'),
      description: t('simpleModels.embeddingDesc'),
      modelType: 'embedding',
      required: true,
      placeholder: t('simpleModels.chooseModel'),
    },
    {
      key: 'default_text_to_speech_model',
      label: t('simpleModels.voice'),
      description: t('simpleModels.voiceDesc'),
      modelType: 'text_to_speech',
      placeholder: t('simpleModels.chooseVoiceModel'),
    },
    {
      key: 'default_speech_to_text_model',
      label: t('simpleModels.transcription'),
      description: t('simpleModels.transcriptionDesc'),
      modelType: 'speech_to_text',
      placeholder: t('simpleModels.chooseTranscriptionModel'),
    },
  ]

  const advancedSlots: SlotConfig[] = [
    {
      key: 'default_transformation_model',
      label: t('models.transformationModelLabel'),
      description: t('models.transformationModelDesc'),
      modelType: 'language',
      placeholder: t('simpleModels.followsChat'),
    },
    {
      key: 'default_tools_model',
      label: t('models.toolsModelLabel'),
      description: t('models.toolsModelDesc'),
      modelType: 'language',
      placeholder: t('simpleModels.followsChat'),
    },
    {
      key: 'large_context_model',
      label: t('models.largeContextModelLabel'),
      description: t('models.largeContextModelDesc'),
      modelType: 'language',
      placeholder: t('simpleModels.followsChat'),
    },
  ]

  const handleSelect = (slot: SlotConfig, modelId: string | null) => {
    if (slot.key === 'default_embedding_model' && defaults.default_embedding_model && modelId && modelId !== defaults.default_embedding_model) {
      setPendingEmbedding(modelId)
      return
    }
    const payload: Partial<ModelDefaults> = { [slot.key]: modelId }
    // Chat carries the advanced language slots along until they're set explicitly.
    if (slot.key === 'default_chat_model' && modelId) {
      if (!defaults.default_transformation_model) payload.default_transformation_model = modelId
      if (!defaults.default_tools_model) payload.default_tools_model = modelId
    }
    updateDefaults.mutate(payload)
  }

  const isSlotMissing = (slot: SlotConfig) => {
    if (!slot.required) return false
    const value = defaults[slot.key]
    if (!value) return true
    return !models.some(m => m.id === value && m.type === slot.modelType)
  }

  const renderSlot = (slot: SlotConfig) => (
    <div
      key={slot.key}
      className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-x-4 gap-y-1 px-4 py-3"
    >
      <div>
        <div className="text-sm font-medium">{slot.label}</div>
        <div className="text-xs text-muted-foreground">{slot.description}</div>
      </div>
      <ModelPicker
        modelType={slot.modelType}
        value={defaults[slot.key]}
        models={models}
        credentials={credentials}
        clearable={!slot.required}
        placeholder={slot.placeholder}
        missing={isSlotMissing(slot)}
        onSelect={id => handleSelect(slot, id)}
      />
    </div>
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">{t('simpleModels.yourModels')}</CardTitle>
            <CardDescription>{t('simpleModels.yourModelsDesc')}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => autoAssign.mutate()}
            disabled={autoAssign.isPending}
            className="shrink-0 gap-1.5"
          >
            {autoAssign.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Wand2 className="h-3.5 w-3.5" />}
            {t('models.autoAssign')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {primarySlots.map(renderSlot)}
        </div>
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-1.5 border-t px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              {t('navigation.advanced')}
              <span className="text-muted-foreground/70">— {t('simpleModels.advancedHint')}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="divide-y border-t">
              {advancedSlots.map(renderSlot)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      <EmbeddingModelChangeDialog
        open={pendingEmbedding !== null}
        onOpenChange={open => { if (!open) setPendingEmbedding(null) }}
        onConfirm={() => {
          if (pendingEmbedding) {
            updateDefaults.mutate({ default_embedding_model: pendingEmbedding })
            setPendingEmbedding(null)
          }
        }}
        oldModelName={defaults.default_embedding_model ? models.find(m => m.id === defaults.default_embedding_model)?.name : undefined}
        newModelName={pendingEmbedding ? models.find(m => m.id === pendingEmbedding)?.name : undefined}
      />
    </Card>
  )
}
