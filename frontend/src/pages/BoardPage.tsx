import { useParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setCurrentBoard, fetchBoard } from '@/store/slices/boardsSlice'
import { useEffect } from 'react'
import KanbanBoard from '@/components/kanban/KanbanBoard'

export default function BoardPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { boards, loading } = useAppSelector((state) => state.boards)
  const board = boards.find((b) => b.id === id)

  useEffect(() => {
    if (id) {
      dispatch(setCurrentBoard(id))
      dispatch(fetchBoard(id))
    }
  }, [id, dispatch])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Доска не найдена</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{board.name}</h1>
        {board.description && (
          <p className="text-muted-foreground mt-1">{board.description}</p>
        )}
      </div>
      <KanbanBoard boardId={board.id} />
    </div>
  )
}

