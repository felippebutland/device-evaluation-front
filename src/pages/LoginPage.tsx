import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/forms/LoginForm';
import { Card, CardContent } from '@/components/ui/Card';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const from = '/admin/devices';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <p className="mt-2 text-gray-600">
            Entre na sua conta para gerenciar suas submissões
          </p>
        </div>

        {/* Login Form */}
        <LoginForm onSuccess={handleLoginSuccess} />

        {/* Additional Links */}
        {/*<div className="text-center space-y-4">*/}
        {/*  <div className="relative">*/}
        {/*    <div className="absolute inset-0 flex items-center">*/}
        {/*      <div className="w-full border-t border-gray-300" />*/}
        {/*    </div>*/}
        {/*    <div className="relative flex justify-center text-sm">*/}
        {/*      <span className="px-2 bg-gray-50 text-gray-500">ou</span>*/}
        {/*    </div>*/}
        {/*  </div>*/}

        {/*  <div className="space-y-2">*/}
        {/*    <p className="text-sm text-gray-600">*/}
        {/*      Quer apenas rastrear uma submissão?{' '}*/}
        {/*      <Link*/}
        {/*        to="/track"*/}
        {/*        className="font-medium text-blue-600 hover:text-blue-500"*/}
        {/*      >*/}
        {/*        Rastrear agora*/}
        {/*      </Link>*/}
        {/*    </p>*/}

        {/*    <p className="text-sm text-gray-600">*/}
        {/*      Quer vender um dispositivo sem criar conta?{' '}*/}
        {/*      <Link*/}
        {/*        to="/catalog"*/}
        {/*        className="font-medium text-blue-600 hover:text-blue-500"*/}
        {/*      >*/}
        {/*        Submeter anonimamente*/}
        {/*      </Link>*/}
        {/*    </p>*/}
        {/*  </div>*/}
        {/*</div>*/}

        {/*/!* Benefits *!/*/}
        {/*<Card className="mt-8">*/}
        {/*  <CardContent className="p-6">*/}
        {/*    <h3 className="font-medium text-gray-900 mb-4">*/}
        {/*      Vantagens de ter uma conta:*/}
        {/*    </h3>*/}
        {/*    <ul className="space-y-2 text-sm text-gray-600">*/}
        {/*      <li className="flex items-center space-x-2">*/}
        {/*        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />*/}
        {/*        <span>Acompanhe todas as suas submissões em um só lugar</span>*/}
        {/*      </li>*/}
        {/*      <li className="flex items-center space-x-2">*/}
        {/*        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />*/}
        {/*        <span>Receba notificações sobre o status das avaliações</span>*/}
        {/*      </li>*/}
        {/*      <li className="flex items-center space-x-2">*/}
        {/*        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />*/}
        {/*        <span>Histórico completo de transações</span>*/}
        {/*      </li>*/}
        {/*      <li className="flex items-center space-x-2">*/}
        {/*        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />*/}
        {/*        <span>Processo de submissão mais rápido</span>*/}
        {/*      </li>*/}
        {/*    </ul>*/}
        {/*  </CardContent>*/}
        {/*</Card>*/}
      </div>
    </div>
  );
}
