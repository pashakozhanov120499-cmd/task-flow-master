import { useLocation, useParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb'

export default function Breadcrumbs() {
  const location = useLocation()
  const params = useParams<{ id: string }>()
  const { boards } = useAppSelector((state) => state.boards)

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname
    const items: BreadcrumbItem[] = []

    items.push({ label: 'Главная', href: '/boards' })

    if (path === '/boards') {
      items.push({ label: 'Доски' })
    } else if (path.startsWith('/boards/') && params.id) {
      items.push({ label: 'Доски', href: '/boards' })
      const board = boards.find((b) => b.id === params.id)
      if (board) {
        items.push({ label: board.name })
      } else {
        items.push({ label: 'Доска' })
      }
    } else if (path === '/tasks') {
      items.push({ label: 'Задачи' })
    } else if (path === '/profile') {
      items.push({ label: 'Профиль' })
    }

    return items
  }

  const breadcrumbItems = generateBreadcrumbs()

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <div className="border-b bg-card px-4 py-3">
      <div className="container mx-auto">
        <Breadcrumb items={breadcrumbItems} />
      </div>
    </div>
  )
}

