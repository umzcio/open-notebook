'use client'

import { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslation } from '@/lib/hooks/use-translation'
import { useDeleteCredential } from '@/lib/hooks/use-credentials'
import { Credential } from '@/lib/api/credentials'

export function DeleteConnectionDialog({
  open,
  onOpenChange,
  credential,
  allCredentials,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  credential: Credential
  allCredentials: Credential[]
}) {
  const { t } = useTranslation()
  const deleteCredential = useDeleteCredential()
  const [migrateToId, setMigrateToId] = useState<string>('')

  const otherCredentials = allCredentials.filter(
    c => c.id !== credential.id && c.provider === credential.provider
  )

  const handleDelete = () => {
    const options = credential.model_count > 0
      ? migrateToId
        ? { migrate_to: migrateToId }
        : { delete_models: true }
      : undefined
    deleteCredential.mutate(
      { credentialId: credential.id, options },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('apiKeys.deleteConfig')}</DialogTitle>
          <DialogDescription>
            {t('apiKeys.deleteConfigConfirm').replace('{name}', credential.name)}
          </DialogDescription>
        </DialogHeader>

        {credential.model_count > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('simpleModels.deleteWithModels').replace('{count}', String(credential.model_count))}
              {otherCredentials.length > 0 && (
                <div className="mt-2">
                  <Label>{t('simpleModels.migrateModelsTo')}</Label>
                  <Select value={migrateToId} onValueChange={setMigrateToId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t('simpleModels.keepModelsPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {otherCredentials.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCredential.isPending}
          >
            {deleteCredential.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {credential.model_count > 0 && migrateToId
              ? t('simpleModels.migrateAndDelete')
              : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
