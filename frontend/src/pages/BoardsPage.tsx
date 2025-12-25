import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { fetchBoards, createBoard, deleteBoard } from '@/store/slices/boardsSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import CreateBoardDialog from '@/components/kanban/CreateBoardDialog'
import ConfirmDialog from '@/components/ui/confirm-dialog'

export default function BoardsPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { boards, loading } = useAppSelector((state) => state.boards)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchBoards())
  }, [dispatch])

  const handleCreateBoard = async (board: { name: string; description?: string }) => {
    try {
      const result = await dispatch(createBoard(board))
      if (createBoard.fulfilled.match(result)) {
        navigate(`/boards/${result.payload.id}`)
      } else if (createBoard.rejected.match(result)) {
        console.error('Failed to create board:', result.error)
        alert(`Ошибка создания доски: ${result.error.message || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Failed to create board:', error)
      alert(`Ошибка создания доски: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleDeleteBoardClick = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setBoardToDelete(boardId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!boardToDelete) return

    try {
      const result = await dispatch(deleteBoard(boardToDelete))
      if (deleteBoard.rejected.match(result)) {
        alert(`Ошибка удаления доски: ${result.error.message || 'Неизвестная ошибка'}`)
      }
      setBoardToDelete(null)
    } catch (error) {
      console.error('Failed to delete board:', error)
      alert(`Ошибка удаления доски: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Мои доски</h1>
          <p className="text-muted-foreground mt-1">Управляйте своими проектами</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Создать доску
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
          <Card
            key={board.id}
            className="cursor-pointer hover:shadow-lg transition-shadow relative"
            onClick={() => navigate(`/boards/${board.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{board.name}</CardTitle>
                  {board.description && (
                    <CardDescription>{board.description}</CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDeleteBoardClick(board.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Задач: {board.tasks?.length || 0}
              </p>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
      <CreateBoardDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateBoard}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить доску?"
        description="Вы уверены, что хотите удалить эту доску? Все задачи будут удалены. Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  )
}

