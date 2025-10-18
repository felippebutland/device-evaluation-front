import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { Shield, Clock, DollarSign, Users } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRegisterSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  const benefits = [
    {
      icon: Shield,
      title: 'Processo Seguro',
      description: 'Suas informações protegidas com criptografia'
    },
    {
      icon: Clock,
      title: 'Economia de Tempo',
      description: 'Submissões futuras mais rápidas e fáceis'
    },
    {
      icon: DollarSign,
      title: 'Melhores Ofertas',
      description: 'Acesso a promoções exclusivas para membros'
    },
    {
      icon: Users,
      title: 'Suporte Prioritário',
      description: 'Atendimento personalizado e suporte dedicado'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Form */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                DeviceHub
              </Link>
              <p className="mt-2 text-gray-600">
                Crie sua conta gratuita e comece a vender
              </p>
            </div>

            {/* Register Form */}
            <RegisterForm onSuccess={handleRegisterSuccess} />

            {/* Additional Links */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">ou</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Quer apenas rastrear uma submissão?{' '}
                  <Link
                    to="/track"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Rastrear agora
                  </Link>
                </p>

                <p className="text-sm text-gray-600">
                  Quer vender sem criar conta?{' '}
                  <Link
                    to="/catalog"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Submeter anonimamente
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Benefits */}
        <div className="bg-blue-600 text-white p-12 flex items-center">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold mb-6">
              Junte-se a milhares de usuários satisfeitos
            </h2>

            <p className="text-xl text-blue-100 mb-8">
              Venda seus dispositivos com segurança, transparência e os melhores preços do mercado.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <benefit.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-blue-100 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-700/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>Já temos mais de</span>
                <span className="font-bold text-xl">15.000+</span>
              </div>
              <p className="text-blue-100 text-xs mt-1">clientes satisfeitos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
