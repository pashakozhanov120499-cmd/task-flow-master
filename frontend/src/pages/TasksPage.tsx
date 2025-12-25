import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { createTask, fetchBoards } from '@/store/slices/boardsSlice'
import { tasksAPI } from '@/services/api'
import type { Task } from '@/store/slices/boardsSlice'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import TaskDialog from '@/components/kanban/TaskDialog'

const statusLabels: Record<string, string> = {
  plan: 'План',
  analysis: 'Анализ',
  development: 'Разработка',
  testing: 'Тестирование',
  closed: 'Закрыто',
}

const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

const priorityColors = {
  low: 'bg-blue-500/20 text-blue-500',
  medium: 'bg-yellow-500/20 text-yellow-500',
  high: 'bg-red-500/20 text-red-500',
}

type TaskWithBoard = Task & {
  boardName: string
}

export default function TasksPage() {
  const dispatch = useAppDispatch()
  const { boards } = useAppSelector((state) => state.boards)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [allTasks, setAllTasks] = useState<TaskWithBoard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        if (boards.length === 0) {
          await dispatch(fetchBoards())
        }
        const tasks = await tasksAPI.getAll()
        const boardsMap = new Map(boards.map(b => [b.id, b]))
        const tasksWithBoards = tasks.map((task) => ({
          ...task,
          boardName: boardsMap.get(task.board_id)?.name || 'Неизвестная доска',
        }))
        setAllTasks(tasksWithBoards)
      } catch (error) {
        console.error('Failed to load tasks:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [dispatch, boards])

  const handleCreateTask = () => {
    setSelectedTask(null)
    setIsTaskDialogOpen(true)
  }

  const handleTaskSave = async (updates: Partial<Task>) => {
    if (boards.length > 0) {
      const result = await dispatch(createTask({
        boardId: boards[0].id,
        task: updates as Omit<Task, 'id'>,
      }))
      
      if (createTask.fulfilled.match(result)) {
        try {
          const tasks = await tasksAPI.getAll()
          const boardsMap = new Map(boards.map(b => [b.id, b]))
          const tasksWithBoards = tasks.map((task) => ({
            ...task,
            boardName: boardsMap.get(task.board_id)?.name || 'Неизвестная доска',
          }))
          setAllTasks(tasksWithBoards)
          setIsTaskDialogOpen(false)
          setSelectedTask(null)
        } catch (error) {
          console.error('Failed to reload tasks:', error)
        }
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Задачи</h1>
          <p className="text-muted-foreground mt-1">Все задачи из всех досок</p>
        </div>
        <Button onClick={handleCreateTask}>
          <Plus className="mr-2 h-4 w-4" />
          Создать задачу
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : allTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Нет задач
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Название</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Этап</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Доска</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Приоритет</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Исполнитель</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{task.title}</td>
                    <td className="px-4 py-3 text-sm">{statusLabels[task.status] || task.status}</td>
                    <td className="px-4 py-3 text-sm">{task.boardName}</td>
                    <td className="px-4 py-3 text-sm">
                      {task.priority ? (
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full inline-block",
                            priorityColors[task.priority]
                          )}
                        >
                          {priorityLabels[task.priority]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {task.assignee || <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={selectedTask}
        onSave={handleTaskSave}
        defaultStatus="plan"
      />
    </div>
  )
}

