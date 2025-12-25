import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreateBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (board: { name: string; description?: string }) => Promise<void>
}

export default function CreateBoardDialog({
  open,
  onOpenChange,
  onSave,
}: CreateBoardDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      const boardData: { name: string; description?: string } = {
        name: name.trim(),
      }
      if (description.trim()) {
        boardData.description = description.trim()
      }
      try {
        await onSave(boardData)
        onOpenChange(false)
      } catch (error) {
        console.error('Error in CreateBoardDialog:', error)
      }
    }
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>Создать доску</DialogTitle>
          <DialogDescription>
            Заполните информацию о новой доске
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">Название доски</Label>
              <Input
                id="board-name"
                placeholder="Введите название доски"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-description">Описание</Label>
              <Textarea
                id="board-description"
                placeholder="Введите описание доски (необязательно)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

