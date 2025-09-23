import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere di almeno 6 caratteri'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn(data.email, data.password);
    } catch (err: any) {
      setError(err.message || 'Errore durante il login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-gaming flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="card-gaming border-neon-primary/20">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CardTitle className="text-3xl font-display text-neon-primary mb-2">
                MBS Planner
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Accedi al tuo account per continuare
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@azienda.com"
                  {...register('email')}
                  className={errors.email ? 'border-neon-danger' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-neon-danger">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={errors.password ? 'border-neon-danger' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-neon-danger">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-neon-danger/10 border border-neon-danger/20 rounded-lg"
                >
                  <p className="text-sm text-neon-danger">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full btn-neon"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          <p>MBS Planner v1.0.0</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

