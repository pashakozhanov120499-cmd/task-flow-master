import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      id: 'boards',
      label: 'Доски',
      icon: LayoutDashboard,
      path: '/boards',
    },
    {
      id: 'tasks',
      label: 'Задачи',
      icon: CheckSquare,
      path: '/tasks',
    },
  ]

  return (
    <aside className="w-64 border-r bg-card h-full">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

