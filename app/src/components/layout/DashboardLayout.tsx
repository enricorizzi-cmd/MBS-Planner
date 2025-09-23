import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  UserCheck, 
  Calendar, 
  List, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Anagrafiche',
    icon: Users,
    children: [
      { name: 'Studenti', href: '/anagrafiche/studenti', icon: Users },
      { name: 'Aziende', href: '/anagrafiche/aziende', icon: Building2 },
      { name: 'Supervisori', href: '/anagrafiche/supervisori', icon: UserCheck },
    ],
  },
  {
    name: 'Programmazione',
    icon: Calendar,
    children: [
      { name: 'Lista', href: '/programmazione/lista', icon: List },
      { name: 'Disposizione', href: '/programmazione/disposizione', icon: Calendar },
      { name: 'Calendario', href: '/programmazione/calendario', icon: Calendar },
    ],
  },
  {
    name: 'Impostazioni',
    icon: Settings,
    children: [
      { name: 'Utenti', href: '/impostazioni/utenti', icon: Users },
      { name: 'Settings', href: '/impostazioni/settings', icon: Settings },
    ],
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border lg:hidden"
            >
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-dark-card border-r border-dark-border px-6 pb-4">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-dark-border bg-dark-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* User menu */}
              <div className="flex items-center gap-x-2">
                <div className="flex items-center gap-x-2 text-sm">
                  <User className="h-4 w-4 text-neon-primary" />
                  <span className="text-foreground">{user?.profile?.name}</span>
                  {isAdmin && (
                    <span className="px-2 py-1 text-xs bg-neon-primary/20 text-neon-primary rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, isAdmin } = useAuth();

  return (
    <>
      <div className="flex h-16 shrink-0 items-center">
        <h1 className="text-xl font-display font-bold text-neon-primary">
          MBS Planner
        </h1>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.children ? (
                    <div>
                      <div className="group flex gap-x-3 rounded-xl p-2 text-sm leading-6 font-semibold text-muted-foreground">
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </div>
                      <ul className="mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <a
                              href={child.href}
                              className="group flex gap-x-3 rounded-xl p-2 text-sm leading-6 text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                              <child.icon className="h-5 w-5 shrink-0" />
                              {child.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <a
                      href={item.href}
                      className="group flex gap-x-3 rounded-xl p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </li>
          
          <li className="mt-auto">
            <div className="p-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-x-2">
                <User className="h-4 w-4" />
                <span>{user?.profile?.name}</span>
              </div>
              <div className="mt-1">{user?.profile?.email}</div>
              {isAdmin && (
                <div className="mt-1 text-neon-primary">Ruolo: Admin</div>
              )}
            </div>
          </li>
        </ul>
      </nav>
    </>
  );
}

