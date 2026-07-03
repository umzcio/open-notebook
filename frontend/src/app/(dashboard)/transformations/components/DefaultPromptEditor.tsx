'use client'

import { useState, useEffect, useId } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useDefaultPrompt, useUpdateDefaultPrompt } from '@/lib/hooks/use-transformations'
import { useTranslation } from '@/lib/hooks/use-translation'

/**
 * Instructions prepended to every transformation prompt. A quiet fold-out
 * row, not a headline feature.
 */
export function DefaultPromptEditor() {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const { data: defaultPrompt, isLoading } = useDefaultPrompt()
  const updateDefaultPrompt = useUpdateDefaultPrompt()
  const { t } = useTranslation()
  const textareaId = useId()

  useEffect(() => {
    if (defaultPrompt) {
      setPrompt(defaultPrompt.transformation_instructions || '')
    }
  }, [defaultPrompt])

  const isDirty = prompt !== (defaultPrompt?.transformation_instructions || '')

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            {t('simpleTransformations.sharedInstructions')}
            <span className="text-muted-foreground/70">— {t('simpleTransformations.sharedInstructionsDesc')}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 border-t px-4 py-3">
            <Label htmlFor={textareaId} className="sr-only">
              {t('transformations.defaultPrompt')}
            </Label>
            <Textarea
              id={textareaId}
              name="default-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('transformations.defaultPromptPlaceholder')}
              className="min-h-[160px] font-mono text-sm"
              disabled={isLoading}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => updateDefaultPrompt.mutate({ transformation_instructions: prompt })}
                disabled={isLoading || !isDirty || updateDefaultPrompt.isPending}
              >
                {updateDefaultPrompt.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
