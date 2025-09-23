import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Calendar, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  const stats = [
    {
      name: 'Studenti Totali',
      value: '156',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      name: 'Aziende Partner',
      value: '23',
      change: '+2',
      changeType: 'positive' as const,
      icon: Building2,
    },
    {
      name: 'Programmi Attivi',
      value: '8',
      change: '+1',
      changeType: 'positive' as const,
      icon: Calendar,
    },
    {
      name: 'Tasso di Successo',
      value: '94%',
      change: '+3%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-display font-bold text-neon-primary">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Panoramica generale del sistema MBS Planner
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="card-gaming hover:shadow-neon-primary/10 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-neon-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-display font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-neon-success">{stat.change}</span> rispetto al mese scorso
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="card-gaming">
            <CardHeader>
              <CardTitle className="text-neon-primary">Attività Recente</CardTitle>
              <CardDescription>
                Ultime operazioni effettuate nel sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Nuovo studente aggiunto', user: 'Mario Rossi', time: '2 min fa' },
                  { action: 'Programma aggiornato', user: 'Giulia Bianchi', time: '15 min fa' },
                  { action: 'Azienda registrata', user: 'Admin', time: '1 ora fa' },
                  { action: 'Supervisore assegnato', user: 'Luca Verdi', time: '2 ore fa' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-neon-primary rounded-full" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="card-gaming">
            <CardHeader>
              <CardTitle className="text-neon-primary">Azioni Rapide</CardTitle>
              <CardDescription>
                Accesso veloce alle funzioni principali
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Nuovo Studente', href: '/anagrafiche/studenti', icon: Users },
                  { name: 'Nuova Azienda', href: '/anagrafiche/aziende', icon: Building2 },
                  { name: 'Programma', href: '/programmazione/lista', icon: Calendar },
                  { name: 'Calendario', href: '/programmazione/calendario', icon: Calendar },
                ].map((action) => (
                  <a
                    key={action.name}
                    href={action.href}
                    className="flex flex-col items-center p-4 rounded-xl border border-dark-border hover:border-neon-primary/50 hover:bg-neon-primary/5 transition-all duration-200 group"
                  >
                    <action.icon className="h-6 w-6 text-muted-foreground group-hover:text-neon-primary mb-2" />
                    <span className="text-sm font-medium text-center">{action.name}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

