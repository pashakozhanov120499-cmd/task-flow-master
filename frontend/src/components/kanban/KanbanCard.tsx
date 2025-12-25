import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import type { Task } from '@/store/slices/boardsSlice'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  task: Task
  onTaskClick?: (task: Task) => void
}

export default function KanbanCard({ task, onTaskClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-500',
    medium: 'bg-yellow-500/20 text-yellow-500',
    high: 'bg-red-500/20 text-red-500',
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && onTaskClick) {
      e.stopPropagation()
      onTaskClick(task)
    }
  }

  const dragHandlers = {
    ...attributes,
    ...listeners,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...dragHandlers}
      onClick={handleClick}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
        isDragging && "opacity-50"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm">{task.title}</h3>
          {task.priority && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                priorityColors[task.priority]
              )}
            >
              {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        {task.assignee && (
          <div className="text-xs text-muted-foreground">
            Исполнитель: {task.assignee}
          </div>
        )}
      </div>
    </Card>
  )
}

