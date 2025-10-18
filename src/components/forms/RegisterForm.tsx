import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useToastContext } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { registerSchema, type RegisterForm as RegisterFormType } from '@/utils/validation';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const { success, error: showError } = useToastContext();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormType>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormType) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password
      });

      success('Conta criada!', 'Bem-vindo ao DeviceHub');
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta';
      showError('Erro no cadastro', message);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Criar Conta</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('name')}
              type="text"
              label="Nome Completo"
              placeholder="Seu nome"
              error={errors.name?.message}
              autoComplete="name"
            />
          </div>

          <div>
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              autoComplete="email"
            />
          </div>

          <div>
            <div className="relative">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="Senha"
                placeholder="Sua senha"
                error={errors.password?.message}
                autoComplete="new-password"
                helperText="Mínimo 6 caracteres"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="relative">
              <Input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirmar Senha"
                placeholder="Confirme sua senha"
                error={errors.confirmPassword?.message}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-600">
            <p>
              Ao criar uma conta, você concorda com nossos{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-500">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                Política de Privacidade
              </a>
              .
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
          >
            {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Entre aqui
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
