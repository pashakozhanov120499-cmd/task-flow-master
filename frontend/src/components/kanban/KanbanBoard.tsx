import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { moveTask, updateTask, createTask, deleteTask, fetchBoard } from '@/store/slices/boardsSlice'
import type { Task } from '@/store/slices/boardsSlice'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useState, useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import AddColumnDialog from './AddColumnDialog'
import TaskDialog from './TaskDialog'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { columnsAPI, type Column } from '@/services/api'

interface KanbanBoardProps {
  boardId: string
}

export default function KanbanBoard({ boardId }: KanbanBoardProps) {
  const dispatch = useAppDispatch()
  const { boards } = useAppSelector((state) => state.boards)
  const board = boards.find((b) => b.id === boardId)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [columnsLoading, setColumnsLoading] = useState(true)
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [deleteColumnDialogOpen, setDeleteColumnDialogOpen] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useWebSocket(boardId)

  useEffect(() => {
    const loadColumns = async () => {
      try {
        setColumnsLoading(true)
        const loadedColumns = await columnsAPI.getByBoardId(boardId)
        setColumns(loadedColumns)
      } catch (error) {
        console.error('Failed to load columns:', error)
      } finally {
        setColumnsLoading(false)
      }
    }

    if (boardId) {
      loadColumns()
    }
  }, [boardId])

  if (!board) {
    return <div>Доска не найдена</div>
  }

  if (columnsLoading) {
    return <div>Загрузка колонок...</div>
  }

  const handleDragStart = (event: { active: { id: string | number } }) => {
    const { active } = event
    const task = board.tasks.find((t) => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const columnId = over.id as string

    const targetColumn = columns.find((col) => col.id === columnId)
    if (targetColumn) {
      const result = await dispatch(moveTask({ taskId, newStatus: targetColumn.status_id, boardId }))
      if (moveTask.fulfilled.match(result)) {
        dispatch(fetchBoard(boardId))
      }
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsTaskDialogOpen(true)
  }

  const handleTaskSave = async (updates: Partial<Task>) => {
    if (selectedTask) {
      const result = await dispatch(updateTask({
        boardId,
        taskId: selectedTask.id,
        updates,
      }))
      if (updateTask.fulfilled.match(result)) {
        setIsTaskDialogOpen(false)
        setSelectedTask(null)
        dispatch(fetchBoard(boardId))
      }
    } else {
      const result = await dispatch(createTask({
        boardId,
        task: updates as Omit<Task, 'id'>,
      }))
      if (createTask.fulfilled.match(result)) {
        setIsTaskDialogOpen(false)
        setSelectedTask(null)
        dispatch(fetchBoard(boardId))
      }
    }
  }

  const handleCreateTask = () => {
    setSelectedTask(null)
    setIsTaskDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    const result = await dispatch(deleteTask({ taskId, boardId }))
    if (deleteTask.fulfilled.match(result)) {
      dispatch(fetchBoard(boardId))
    }
  }

  const handleAddColumn = async (name: string) => {
    try {
      const statusId = `column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const position = columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 0

      await columnsAPI.create({
        board_id: boardId,
        title: name,
        status_id: statusId,
        position,
      })

      const loadedColumns = await columnsAPI.getByBoardId(boardId)
      setColumns(loadedColumns)
    } catch (error) {
      console.error('Failed to create column:', error)
      alert(`Ошибка создания колонки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleDeleteColumnClick = (columnId: string) => {
    setColumnToDelete(columnId)
    setDeleteColumnDialogOpen(true)
  }

  const handleConfirmDeleteColumn = async () => {
    if (!columnToDelete) return

    const column = columns.find(c => c.id === columnToDelete)
    if (!column) return

    const tasksInColumn = board.tasks.filter(t => t.status === column.status_id)
    if (tasksInColumn.length > 0) {
      alert(`Невозможно удалить колонку: в ней есть задачи (${tasksInColumn.length}). Переместите задачи в другие колонки перед удалением.`)
      setColumnToDelete(null)
      setDeleteColumnDialogOpen(false)
      return
    }

    try {
      await columnsAPI.delete(columnToDelete)
      
      const loadedColumns = await columnsAPI.getByBoardId(boardId)
      setColumns(loadedColumns)
      
      setColumnToDelete(null)
      setDeleteColumnDialogOpen(false)
    } catch (error) {
      console.error('Failed to delete column:', error)
      alert(`Ошибка удаления колонки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const getTasksByStatus = (statusId: string) => {
    return board.tasks.filter((task) => task.status === statusId)
  }

  const firstColumn = columns.length > 0 ? columns[0] : null

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setIsAddColumnDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить колонку
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.status_id)}
              onTaskClick={handleTaskClick}
              onCreateTask={firstColumn && column.id === firstColumn.id ? handleCreateTask : undefined}
              onDelete={handleDeleteColumnClick}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-50">
              <KanbanCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <AddColumnDialog
        open={isAddColumnDialogOpen}
        onOpenChange={setIsAddColumnDialogOpen}
        onAddColumn={handleAddColumn}
      />
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={selectedTask}
        onSave={handleTaskSave}
        onDelete={handleDeleteTask}
        defaultStatus={firstColumn?.status_id || 'plan'}
      />
      <ConfirmDialog
        open={deleteColumnDialogOpen}
        onOpenChange={setDeleteColumnDialogOpen}
        title="Удалить колонку?"
        description="Вы уверены, что хотите удалить эту колонку? Это действие нельзя отменить. Убедитесь, что в колонке нет задач."
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleConfirmDeleteColumn}
        variant="destructive"
      />
    </>
  )
}

