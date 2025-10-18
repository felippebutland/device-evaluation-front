import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceService } from '@/services/device.service';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { DeviceCard, DeviceCardCompact } from '@/components/common/DeviceCard';
import { SubmissionForm } from '@/components/forms/SubmissionForm';
import { CardSkeleton } from '@/components/ui/Loading';
import { Search, Package, ArrowLeft, Filter } from 'lucide-react';
import { debounce } from '@/utils/helpers';
import type { Device, DeviceFilters } from '@/types';

export function SubmitDevicePage() {
  const navigate = useNavigate();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [filters, setFilters] = useState<DeviceFilters>({
    name: '',
    brand: '',
    page: 1,
    limit: 12
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: devicesData, loading, error } = useApi(
    () => deviceService.getPublicDevices(filters),
    [filters]
  );

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      setFilters(prev => ({ ...prev, name: searchTerm, page: 1 }));
    }, 500),
    []
  );

  const handleSearch = (value: string) => {
    debouncedSearch(value);
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    setShowSubmissionModal(true);
  };

  const handleSubmissionSuccess = (trackingCode: string) => {
    setShowSubmissionModal(false);
    navigate(`/track?code=${trackingCode}`);
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      brand: '',
      page: 1,
      limit: 12
    });
  };

  const brands = useMemo(() => {
    if (!devicesData?.data) return [];
    const brandSet = new Set(devicesData.data.map(device => device.brand));
    return Array.from(brandSet).sort();
  }, [devicesData]);

  const hasActiveFilters = filters.name || filters.brand;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-lg py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Visualização:</span>
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md border-l border-gray-300 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Lista
                </button>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Submeter Dispositivo
          </h1>
          <p className="text-gray-600">
            Selecione seu dispositivo no catálogo e inicie o processo de avaliação
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar dispositivo..."
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Brand Filter */}
              <div className="w-full lg:w-48">
                <select
                  value={filters.brand || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value, page: 1 }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todas as marcas</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Filtros ativos</span>
                </div>
                <Button size="sm" variant="outline" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Como funciona:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Encontre e selecione seu dispositivo na lista abaixo</li>
                  <li>2. Preencha as informações sobre a condição do dispositivo</li>
                  <li>3. Receba um código de rastreamento para acompanhar o processo</li>
                  <li>4. Aguarde nossa equipe entrar em contato com a avaliação</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Selection */}
        {loading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <Card className="text-center p-8">
            <CardContent>
              <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Erro ao carregar dispositivos
              </h3>
              <p className="text-gray-600">{error}</p>
            </CardContent>
          </Card>
        ) : !devicesData?.data?.length ? (
          <Card className="text-center p-12">
            <CardContent>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum dispositivo encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Tente ajustar os filtros ou fazer uma nova busca
              </p>
              {hasActiveFilters && (
                <Button onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                {devicesData.data.length} dispositivos disponíveis
                {hasActiveFilters && ' (filtrados)'}
              </p>
            </div>

            {/* Device Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {devicesData.data.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    showActions={false}
                    onSelect={handleDeviceSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {devicesData.data.map((device) => (
                  <DeviceCardCompact
                    key={device.id}
                    device={device}
                    onSelect={handleDeviceSelect}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {devicesData.meta && devicesData.meta.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  disabled={devicesData.meta.page <= 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: devicesData.meta.page - 1 }))}
                >
                  Anterior
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, devicesData.meta.pages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === devicesData.meta.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, page: pageNumber }))}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  disabled={devicesData.meta.page >= devicesData.meta.pages}
                  onClick={() => setFilters(prev => ({ ...prev, page: devicesData.meta.page + 1 }))}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}

        {/* Submission Modal */}
        {selectedDevice && (
          <Modal
            isOpen={showSubmissionModal}
            onClose={() => setShowSubmissionModal(false)}
            size="xl"
            title="Submeter Dispositivo"
          >
            <ModalContent>
              <SubmissionForm
                device={selectedDevice}
                onSuccess={handleSubmissionSuccess}
                onCancel={() => setShowSubmissionModal(false)}
              />
            </ModalContent>
          </Modal>
        )}
      </div>
    </div>
  );
}
