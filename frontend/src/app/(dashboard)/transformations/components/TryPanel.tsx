'use client'

import { useState } from 'react'
import { Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModelSelector } from '@/components/common/ModelSelector'
import { useExecuteTransformation } from '@/lib/hooks/use-transformations'
import { useModelDefaults } from '@/lib/hooks/use-models'
import { useTranslation } from '@/lib/hooks/use-translation'
import { Transformation } from '@/lib/types/transformations'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

/**
 * Inline runner under a transformation card. The transformation is the card
 * it lives in and the model starts at the configured default, so the common
 * case is paste → run.
 */
export function TryPanel({ transformation }: { transformation: Transformation }) {
  const { t } = useTranslation()
  const { data: defaults } = useModelDefaults()
  const [inputText, setInputText] = useState('')
  const [modelOverride, setModelOverride] = useState<string | null>(null)
  const [output, setOutput] = useState('')
  const executeTransformation = useExecuteTransformation()

  const defaultModelId = defaults?.default_transformation_model || defaults?.default_chat_model || ''
  const modelId = modelOverride ?? defaultModelId

  const canExecute = modelId && inputText.trim() && !executeTransformation.isPending

  const handleExecute = async () => {
    if (!canExecute) return
    const result = await executeTransformation.mutateAsync({
      transformation_id: transformation.id,
      input_text: inputText,
      model_id: modelId,
    })
    setOutput(result.output)
  }

  return (
    <div className="space-y-3 border-t bg-muted/30 px-4 py-3">
      <div>
        <Label htmlFor={`try-input-${transformation.id}`} className="text-xs text-muted-foreground">
          {t('transformations.inputLabel')}
        </Label>
        <Textarea
          id={`try-input-${transformation.id}`}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={t('transformations.inputPlaceholder')}
          rows={5}
          className="mt-1 font-mono text-sm bg-background"
        />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-64">
          <ModelSelector
            label={t('transformations.model')}
            name={`try-model-${transformation.id}`}
            modelType="language"
            value={modelId}
            onChange={setModelOverride}
            placeholder={t('transformations.selectModel')}
          />
        </div>
        <Button onClick={handleExecute} disabled={!canExecute} size="sm">
          {executeTransformation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('transformations.running')}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {t('transformations.runTest')}
            </>
          )}
        </Button>
      </div>
      {output && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{t('transformations.outputLabel')}</span>
          <div className="rounded-md border bg-background">
            <ScrollArea className="max-h-[360px]">
              <div className="prose prose-sm max-w-none dark:prose-invert p-4">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto">
                        <table className="min-w-full border-collapse border border-border">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
                    th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
                    td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
                  }}
                >
                  {output}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}
