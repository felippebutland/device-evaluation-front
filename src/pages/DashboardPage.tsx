import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { submissionService } from '@/services/submission.service';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SubmissionCard } from '@/components/common/SubmissionCard';
import { CardSkeleton } from '@/components/ui/Loading';
import {
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

import { useMemo } from 'react';

export function DashboardPage() {
  const { user } = useAuth();

  const { data: submissionsData, loading: submissionsLoading } = useApi(
    () => submissionService.getMySubmissions(1, 5),
    []
  );

  const submissions = submissionsData?.data || [];
  const meta = submissionsData?.meta;

  // Calculate stats
  const stats = useMemo(() => {
    if (!submissions.length) {
      return {
        total: 0,
        pending: 0,
        underEvaluation: 0,
        approved: 0,
        rejected: 0
      };
    }

    return {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      underEvaluation: submissions.filter(s => s.status === 'under_evaluation').length,
      approved: submissions.filter(s => s.status === 'approved').length,
      rejected: submissions.filter(s => s.status === 'rejected').length
    };
  }, [submissions]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-lg py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bem-vindo, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie suas submissões e acompanhe o progresso das avaliações
              </p>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button asChild>
                <Link to="/submit-device">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Submissão
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/catalog">Ver Catálogo</Link>
              </Button>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden mt-4 flex space-x-2">
            <Button size="sm" className="flex-1" asChild>
              <Link to="/submit-device">
                <Plus className="mr-2 h-4 w-4" />
                Nova Submissão
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="flex-1" asChild>
              <Link to="/catalog">Ver Catálogo</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{meta?.total || stats.total}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Submissions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Submissões Recentes</span>
                  </CardTitle>
                  {submissions.length > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/my-submissions">
                        Ver Todas
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {submissionsLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <CardSkeleton key={index} />
                    ))}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma submissão ainda
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Comece submetendo seu primeiro dispositivo para avaliação
                    </p>
                    <Button asChild>
                      <Link to="/catalog">
                        <Plus className="mr-2 h-4 w-4" />
                        Primeira Submissão
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {submissions.slice(0, 3).map((submission) => (
                      <SubmissionCard key={submission.id} submission={submission} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button size="sm" className="w-full" asChild>
                  <Link to="/submit-device">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Submissão
                  </Link>
                </Button>

                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link to="/track">
                    <Package className="mr-2 h-4 w-4" />
                    Rastrear Submissão
                  </Link>
                </Button>

                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link to="/catalog">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Ver Preços
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Minha Conta</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome</label>
                  <p className="text-gray-900">{user?.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Conta</label>
                  <p className="text-gray-900 capitalize">{user?.role === 'user' ? 'Usuário' : 'Administrador'}</p>
                </div>

                <Button size="sm" variant="outline" className="w-full">
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Dicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    • Mantenha seu dispositivo limpo para obter melhor avaliação
                  </p>
                  <p>
                    • Inclua todos os acessórios originais quando possível
                  </p>
                  <p>
                    • Descreva detalhadamente qualquer defeito ou problema
                  </p>
                  <p>
                    • Verifique seu email regularmente para atualizações
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
