import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanCard from './KanbanCard'
import type { Task } from '@/store/slices/boardsSlice'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onCreateTask?: () => void
  onDelete: (columnId: string) => void
}

export default function KanbanColumn({ id, title, tasks, onTaskClick, onCreateTask, onDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const taskIds = tasks.map((t) => t.id)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[280px] rounded-lg border bg-card p-4 flex flex-col",
        isOver && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px] flex-1">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onTaskClick={onTaskClick} />
          ))}
          {tasks.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              Нет задач
            </div>
          )}
        </div>
      </SortableContext>
      {onCreateTask && (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={onCreateTask}
        >
          <Plus className="mr-2 h-4 w-4" />
          Создать задачу
        </Button>
      )}
    </div>
  )
}

