import React from 'react'
import { Sidebar } from './Sidebar'
import { useAppStore } from '../../store/appStore'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main
        className={`transition-all duration-200 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        } min-h-screen`}
      >
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
