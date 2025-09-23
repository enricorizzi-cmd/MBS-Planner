import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve essere di almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere di almeno 6 caratteri'),
  confirmPassword: z.string().min(6, 'Conferma password richiesta'),
  role: z.enum(['project_manager', 'amministrazione', 'titolare']),
  partner_id: z.string().uuid('Seleziona un partner'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

interface Partner {
  id: string;
  name: string;
}

interface RegistrationFormProps {
  onBackToLogin: () => void;
}

export function RegistrationForm({ onBackToLogin }: RegistrationFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const { signUp } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch('/api/auth/partners');
        if (!response.ok) {
          throw new Error('Errore nel caricamento dei partner');
        }
        const data = await response.json();
        setPartners(data);
      } catch (err) {
        setError('Errore nel caricamento dei partner');
      } finally {
        setLoadingPartners(false);
      }
    };

    fetchPartners();
  }, []);

  const seedPartner = async () => {
    try {
      setSeeding(true);
      setError(null);
      const res = await fetch('/api/auth/partners/seed', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Errore nella creazione del partner di test');
      }
      // Refresh partner list
      const partnersRes = await fetch('/api/auth/partners');
      const partnersData = await partnersRes.json();
      setPartners(partnersData);
    } catch (e: any) {
      setError(e.message || 'Errore nella creazione del partner di test');
    } finally {
      setSeeding(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUp(data.email, data.password, data.name, data.role, data.partner_id);
      
      if (result.isFirstUser) {
        alert('Registrazione completata! Sei il primo utente e hai ricevuto il ruolo di amministratore.');
      } else {
        alert('Registrazione completata! Puoi ora effettuare il login.');
      }
      
      onBackToLogin();
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPartners) {
    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center p-4">
        <Card className="card-gaming border-neon-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                Registrazione
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Crea un nuovo account per accedere
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Mario Rossi"
                  {...register('name')}
                  className={errors.name ? 'border-neon-danger' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-neon-danger">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mario.rossi@azienda.com"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Conferma password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-neon-danger' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-neon-danger">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Ruolo</Label>
                <Select
                  id="role"
                  {...register('role')}
                  className={errors.role ? 'border-neon-danger' : ''}
                >
                  <option value="">Seleziona un ruolo</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="amministrazione">Amministrazione</option>
                  <option value="titolare">Titolare</option>
                </Select>
                {errors.role && (
                  <p className="text-sm text-neon-danger">{errors.role.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="partner_id">Partner</Label>
                <Select
                  id="partner_id"
                  {...register('partner_id')}
                  className={errors.partner_id ? 'border-neon-danger' : ''}
                >
                  <option value="">Seleziona un partner</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </Select>
                {errors.partner_id && (
                  <p className="text-sm text-neon-danger">{errors.partner_id.message}</p>
                )}
                {partners.length === 0 && (
                  <div className="mt-2">
                    <Button type="button" size="sm" variant="secondary" onClick={seedPartner} disabled={seeding}>
                      {seeding ? 'Creazione partner...' : 'Crea partner di test'}
                    </Button>
                  </div>
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

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full btn-neon"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onBackToLogin}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Torna al login
                </Button>
              </div>
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
