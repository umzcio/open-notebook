'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Wand2 } from 'lucide-react'
import { TransformationCard } from './TransformationCard'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Transformation } from '@/lib/types/transformations'
import { TransformationEditorDialog } from './TransformationEditorDialog'
import { useTranslation } from '@/lib/hooks/use-translation'

interface TransformationsListProps {
  transformations: Transformation[] | undefined
  isLoading: boolean
}

export function TransformationsList({ transformations, isLoading }: TransformationsListProps) {
  const { t } = useTranslation()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTransformation, setEditingTransformation] = useState<Transformation | undefined>()

  const handleOpenEditor = (trans?: Transformation) => {
    setEditingTransformation(trans)
    setEditorOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <>
      {!transformations || transformations.length === 0 ? (
        <EmptyState
          icon={Wand2}
          title={t('transformations.noTransformations')}
          description={t('transformations.createOne')}
          action={
            <Button onClick={() => handleOpenEditor()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('transformations.createNew')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {transformations.map(transformation => (
            <TransformationCard
              key={transformation.id}
              transformation={transformation}
              onEdit={() => handleOpenEditor(transformation)}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => handleOpenEditor()}
          >
            <Plus className="h-4 w-4" />
            {t('transformations.createNew')}
          </Button>
        </div>
      )}

      <TransformationEditorDialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) {
            setEditingTransformation(undefined)
          }
        }}
        transformation={editingTransformation}
      />
    </>
  )
}
