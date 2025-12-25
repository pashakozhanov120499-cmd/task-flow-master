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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import type { Task } from '@/store/slices/boardsSlice'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onSave: (task: Partial<Task>) => void
  onDelete?: (taskId: string) => void
  defaultStatus?: string
}

export default function TaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
  onDelete,
  defaultStatus,
}: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | ''>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setPriority(task.priority || '')
    } else {
      setTitle('')
      setDescription('')
      setPriority('')
    }
  }, [task, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      if (task) {
        onSave({
          id: task.id,
          title: title.trim(),
          description: description.trim(),
          priority: priority || undefined,
        })
      } else {
        onSave({
          title: title.trim(),
          description: description.trim(),
          priority: priority || undefined,
          status: defaultStatus || 'plan',
        })
      }
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (task && onDelete) {
      onDelete(task.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>{task ? 'Редактировать задачу' : 'Создать задачу'}</DialogTitle>
          <DialogDescription>
            {task ? 'Измените информацию о задаче' : 'Заполните информацию о новой задаче'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Название задачи</Label>
              <Input
                id="task-title"
                placeholder="Введите название задачи"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Описание</Label>
              <Textarea
                id="task-description"
                placeholder="Введите описание задачи"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority">Критичность</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}>
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Выберите критичность" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <div className="flex items-center justify-between w-full">
              {task && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  className="mr-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить задачу?"
        description="Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </Dialog>
  )
}

