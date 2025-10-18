import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Search,
  Shield,
  DollarSign,
  Clock,
  Users,
  ArrowRight,
  Package,
  Star
} from 'lucide-react';

export function HomePage() {
  const features = [
    {
      icon: Shield,
      title: 'Avaliação Segura',
      description: 'Processo transparente e seguro para avaliação dos seus dispositivos'
    },
    {
      icon: DollarSign,
      title: 'Melhor Preço',
      description: 'Oferecemos preços justos baseados na condição real do dispositivo'
    },
    {
      icon: Clock,
      title: 'Processo Rápido',
      description: 'Avaliação em até 48 horas úteis após o recebimento'
    },
    {
      icon: Users,
      title: 'Suporte Dedicado',
      description: 'Equipe especializada para tirar todas as suas dúvidas'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Selecione seu Dispositivo',
      description: 'Encontre seu dispositivo no nosso catálogo e informe as condições'
    },
    {
      number: '02',
      title: 'Envie para Avaliação',
      description: 'Receba um código de rastreamento e envie seu dispositivo'
    },
    {
      number: '03',
      title: 'Avaliação Profissional',
      description: 'Nossa equipe avalia tecnicamente seu dispositivo'
    },
    {
      number: '04',
      title: 'Receba sua Oferta',
      description: 'Aprove a oferta e receba o pagamento ou efetue a troca'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Dispositivos Avaliados' },
    { value: '15K+', label: 'Clientes Satisfeitos' },
    { value: '4.9', label: 'Avaliação Média' },
    { value: '24h', label: 'Tempo Médio' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="container-lg py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
                Venda ou Troque
                <span className="text-yellow-300"> Seus Dispositivos</span>
                <br />
                com Segurança
              </h1>

              <p className="text-xl mb-8 text-blue-100 text-pretty">
                Plataforma líder em avaliação e gestão de dispositivos.
                Processo transparente, preços justos e pagamento garantido.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                >
                  <Link to="/catalog">
                    Ver Dispositivos Aceitos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white text-white hover:bg-white hover:text-gray-900"
                >
                  <Link to="/track">
                    <Search className="mr-2 h-5 w-5" />
                    Rastrear Submissão
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
                    <Package className="h-8 w-8 text-yellow-300 mb-3" />
                    <h3 className="font-semibold mb-2">Smartphones</h3>
                    <p className="text-sm text-blue-100">iPhone, Samsung, Xiaomi</p>
                  </Card>
                  <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 mt-8">
                    <Package className="h-8 w-8 text-yellow-300 mb-3" />
                    <h3 className="font-semibold mb-2">Notebooks</h3>
                    <p className="text-sm text-blue-100">MacBook, Dell, Lenovo</p>
                  </Card>
                </div>
              </div>

              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b">
        <div className="container-lg py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-lg">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher o DeviceHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Oferecemos a melhor experiência em venda e troca de dispositivos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <div className="container-lg">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Processo simples e transparente em 4 passos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-xl font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>

                {/* Arrow connector */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <ArrowRight className="h-6 w-6 text-gray-300 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-lg">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Maria Silva',
                text: 'Processo muito simples e rápido. Recebi um preço justo pelo meu iPhone.',
                rating: 5
              },
              {
                name: 'João Santos',
                text: 'Excelente atendimento e transparência total. Recomendo!',
                rating: 5
              },
              {
                name: 'Ana Costa',
                text: 'Consegui trocar meu notebook antigo por um mais novo. Ótima experiência.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                <div className="font-semibold text-gray-900">{testimonial.name}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container-lg text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para vender ou trocar seu dispositivo?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Junte-se a milhares de clientes satisfeitos e descubra quanto vale seu dispositivo
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Link to="/catalog">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Link to="/register">Criar Conta Gratuita</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
