import { Link } from 'react-router-dom';
import { submissionService } from '@/services/submission.service';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import {
  Package,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

export function AdminDashboardPage() {
  const { data: stats, loading: statsLoading } = useApi(
    () => submissionService.getAdminStats(),
    []
  );

  const quickActions = [
    {
      title: 'Gerenciar Dispositivos',
      description: 'Adicionar, editar ou remover dispositivos do catálogo',
      icon: Package,
      href: '/admin/devices',
      color: 'bg-blue-500'
    },
    {
      title: 'Avaliar Submissões',
      description: 'Processar e avaliar submissões pendentes',
      icon: Clock,
      href: '/admin/evaluations',
      color: 'bg-yellow-500',
      badge: stats?.pendingEvaluations
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar e administrar contas de usuários',
      icon: Users,
      href: '/admin/users',
      color: 'bg-green-500'
    },
    {
      title: 'Configurações',
      description: 'Políticas de preços e configurações do sistema',
      icon: AlertTriangle,
      href: '/admin/settings',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-lg py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Painel Administrativo
          </h1>
          <p className="text-gray-600">
            Visão geral do sistema e gerenciamento de operações
          </p>
        </div>

        {/* Stats Overview */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <Loading size="sm" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Dispositivos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalDevices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingEvaluations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Submissões</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Link
                      key={index}
                      to={action.href}
                      className="relative p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${action.color.replace('bg-', 'bg-').replace('-500', '-100')}`}>
                          <action.icon className={`h-6 w-6 ${action.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {action.description}
                          </p>
                        </div>
                        {action.badge && (
                          <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {action.badge}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {stats && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Status das Avaliações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-900">Pendentes</p>
                          <p className="text-sm text-yellow-700">Aguardando avaliação</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-yellow-900">
                        {stats.pendingEvaluations}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">Aprovadas</p>
                          <p className="text-sm text-green-700">Avaliações concluídas</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-green-900">
                        {stats.approvedEvaluations}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-900">Rejeitadas</p>
                          <p className="text-sm text-red-700">Não aprovadas</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-red-900">
                        {stats.rejectedEvaluations}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button className="w-full" asChild>
                      <Link to="/admin/evaluations">
                        Ver Todas as Avaliações
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Devices */}
            {stats?.topDevices && (
              <Card>
                <CardHeader>
                  <CardTitle>Dispositivos Populares</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topDevices.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.device.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.device.brand}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {item.submissionCount}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link to="/admin/devices">Ver Todos</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Sistema Online</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">API Funcionando</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Base de Dados OK</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.monthlySubmissions && (
                  <div className="space-y-3">
                    {stats.monthlySubmissions.slice(-3).map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{month.month}</span>
                        <span className="text-sm font-medium text-gray-900">{month.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
