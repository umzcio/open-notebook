'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Play, Trash2 } from 'lucide-react'
import { Transformation } from '@/lib/types/transformations'
import { useDeleteTransformation } from '@/lib/hooks/use-transformations'
import { useTranslation } from '@/lib/hooks/use-translation'
import { TryPanel } from './TryPanel'

interface TransformationCardProps {
  transformation: Transformation
  onEdit?: () => void
}

/**
 * One transformation: name, what it does, and the actions in place.
 * "Try" opens an inline runner under the row — no separate playground tab.
 */
export function TransformationCard({ transformation, onEdit }: TransformationCardProps) {
  const { t } = useTranslation()
  const [tryOpen, setTryOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteTransformation = useDeleteTransformation()

  const handleDelete = () => {
    deleteTransformation.mutate(transformation.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <button className="flex-1 text-left min-w-0" onClick={onEdit} title={t('common.edit')}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{transformation.name}</span>
              {transformation.apply_default && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                  {t('common.default')}
                </Badge>
              )}
            </div>
            {transformation.description && (
              <p className="text-xs text-muted-foreground truncate">{transformation.description}</p>
            )}
          </button>
          <div className="flex items-center shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-xs ${tryOpen ? '' : 'text-muted-foreground'}`}
              onClick={() => setTryOpen(o => !o)}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              {t('simpleTransformations.try')}
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={onEdit}
              >
                {t('common.edit')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
              title={t('common.delete')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {tryOpen && <TryPanel transformation={transformation} />}
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('sources.delete')}
        description={t('transformations.deleteConfirm')}
        confirmText={t('common.delete')}
        confirmVariant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteTransformation.isPending}
      />
    </>
  )
}
