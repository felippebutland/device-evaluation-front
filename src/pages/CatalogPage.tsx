import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { deviceService } from '@/services/device.service';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { DeviceCard } from '@/components/common/DeviceCard';
import { CardSkeleton } from '@/components/ui/Loading';
import { Search, Filter, X } from 'lucide-react';
import { debounce } from '@/utils/helpers';
import type { DeviceFilters } from '@/types';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<DeviceFilters>({
    name: searchParams.get('name') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    page: Number(searchParams.get('page')) || 1,
    limit: 12
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: devicesData, loading, error, refetch } = useApi(
    () => deviceService.getPublicDevices(filters),
    [filters]
  );

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((newFilters: DeviceFilters) => {
      setFilters(newFilters);
    }, 500),
    []
  );

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && key !== 'limit') {
        params.set(key, value.toString());
      }
    });

    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key: keyof DeviceFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };

    if (key === 'name') {
      debouncedSearch(newFilters);
    } else {
      setFilters(newFilters);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters: DeviceFilters = {
      name: '',
      brand: '',
      minPrice: undefined,
      maxPrice: undefined,
      page: 1,
      limit: 12
    };
    setFilters(clearedFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const brands = useMemo(() => {
    if (!devicesData?.data) return [];
    const brandSet = new Set(devicesData.data.map(device => device.brand));
    return Array.from(brandSet).sort();
  }, [devicesData]);

  const hasActiveFilters = filters.name || filters.brand || filters.minPrice || filters.maxPrice;

  if (error) {
    return (
      <div className="container-lg py-20">
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Erro ao carregar dispositivos
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => refetch()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-lg py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Catálogo de Dispositivos
          </h1>
          <p className="text-lg text-gray-600">
            Encontre seu dispositivo e descubra quanto vale
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou modelo..."
                    value={filters.name || ''}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:w-auto"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {[filters.name, filters.brand, filters.minPrice, filters.maxPrice]
                      .filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Brand Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <select
                      value={filters.brand || ''}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Todas as marcas</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Mínimo
                    </label>
                    <Input
                      type="number"
                      placeholder="R$ 0"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Máximo
                    </label>
                    <Input
                      type="number"
                      placeholder="R$ 10.000"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : devicesData?.data?.length === 0 ? (
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
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {devicesData?.meta ? (
                  `Mostrando ${((devicesData.meta.page - 1) * devicesData.meta.limit) + 1}-${Math.min(devicesData.meta.page * devicesData.meta.limit, devicesData.meta.total)} de ${devicesData.meta.total} dispositivos`
                ) : (
                  `${devicesData?.data?.length || 0} dispositivos encontrados`
                )}
              </p>
            </div>

            {/* Device Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {devicesData?.data?.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>

            {/* Pagination */}
            {devicesData?.meta && devicesData.meta.pages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  disabled={devicesData.meta.page <= 1}
                  onClick={() => handlePageChange(devicesData.meta.page - 1)}
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
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  disabled={devicesData.meta.page >= devicesData.meta.pages}
                  onClick={() => handlePageChange(devicesData.meta.page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
