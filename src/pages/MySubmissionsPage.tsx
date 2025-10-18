import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { submissionService } from '@/services/submission.service';
import { usePaginatedApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { SubmissionCard } from '@/components/common/SubmissionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CardSkeleton } from '@/components/ui/Loading';
import {
  Package,
  Search,
  Plus,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { SUBMISSION_STATUSES } from '@/utils/constants';
import type { SubmissionStatus } from '@/types';

export function MySubmissionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | ''>('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const {
    data: submissions,
    loading,
    meta,
    loadMore,
    refresh,
    hasMore
  } = usePaginatedApi(
    (page, limit) => submissionService.getMySubmissions(page, limit),
    12
  );

  // Filter submissions based on search and status
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesSearch = !searchTerm ||
        submission.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.device?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.device?.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || submission.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchTerm, statusFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const hasActiveFilters = searchTerm || statusFilter;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-lg py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Minhas Submissões</h1>
              <p className="text-gray-600 mt-1">
                Acompanhe o status de todos os seus dispositivos submetidos
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={refresh} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button asChild>
                <Link to="/submit-device">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Submissão
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por código ou dispositivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | '')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  {SUBMISSION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                    viewMode === 'card'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md border-l border-gray-300 ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Tabela
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filtros ativos:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Busca: {searchTerm}
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {SUBMISSION_STATUSES.find(s => s.value === statusFilter)?.label}
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        {!loading && submissions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {SUBMISSION_STATUSES.map((status) => {
              const count = submissions.filter(s => s.status === status.value).length;
              return (
                <Card key={status.value}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{status.label}</p>
                        <p className="text-xl font-bold text-gray-900">{count}</p>
                      </div>
                      <StatusBadge status={status.value} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Results */}
        {loading && submissions.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <Card className="text-center p-12">
            <CardContent>
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasActiveFilters ? 'Nenhum resultado encontrado' : 'Nenhuma submissão ainda'}
              </h3>
              <p className="text-gray-600 mb-6">
                {hasActiveFilters
                  ? 'Tente ajustar os filtros para encontrar o que procura'
                  : 'Comece submetendo seu primeiro dispositivo para avaliação'
                }
              </p>
              {hasActiveFilters ? (
                <Button onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/catalog">
                    <Plus className="mr-2 h-4 w-4" />
                    Primeira Submissão
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredSubmissions.length} de {meta?.total || submissions.length} submissões
                {hasActiveFilters && ' (filtradas)'}
              </p>
            </div>

            {viewMode === 'card' ? (
              /* Card View */
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            ) : (
              /* Table View */
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dispositivo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Código
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSubmissions.map((submission) => (
                          <tr key={submission.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {submission.device?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {submission.device?.brand} • {submission.device?.model}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-gray-900">
                              {submission.trackingCode}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={submission.status} />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(submission.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Link
                                to={`/track?code=${submission.trackingCode}`}
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Ver Detalhes
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Load More */}
            {hasMore && !hasActiveFilters && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  loading={loading}
                >
                  {loading ? 'Carregando...' : 'Carregar Mais'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
