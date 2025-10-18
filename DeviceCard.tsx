import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/utils/helpers';
import { Eye, Package } from 'lucide-react';
import type { Device } from '@/types';

interface DeviceCardProps {
  device: Device;
  showActions?: boolean;
  onSelect?: (device: Device) => void;
}

export function DeviceCard({ device, showActions = true, onSelect }: DeviceCardProps) {
  const { id, name, brand, model, basePrice, specifications } = device;

  const handleSelect = () => {
    if (onSelect) {
      onSelect(device);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      {/* Device Image Placeholder */}

      <CardContent className="flex-1 p-4">
        {/* Device Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {name}
          </h3>

          <div className="text-sm text-gray-600">
            <p><span className="font-medium">Marca:</span> {brand}</p>
            <p><span className="font-medium">Modelo:</span> {model}</p>
          </div>

          {/* Specifications */}
          {specifications && Object.keys(specifications).length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-900">Especificações:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {Object.entries(specifications).slice(0, 3).map(([key, value]) => (
                  <p key={key} className="line-clamp-1">
                    <span className="font-medium capitalize">{key}:</span> {value}
                  </p>
                ))}
                {Object.keys(specifications).length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{Object.keys(specifications).length - 3} mais...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-lg font-semibold text-green-600">
              A partir de {formatPrice(basePrice)}
            </p>
            <p className="text-xs text-gray-500">
              *Preço pode variar conforme condição do dispositivo
            </p>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0 space-y-2">
          <div className="flex space-x-2 w-full">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1"
            >
              <Link to={`/device/${id}`} className="flex items-center justify-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>Ver Detalhes</span>
              </Link>
            </Button>

            {onSelect && (
              <Button
                size="sm"
                onClick={handleSelect}
                className="flex-1"
              >
                Selecionar
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// Compact version for listings
export function DeviceCardCompact({ device, onSelect }: { device: Device; onSelect?: (device: Device) => void }) {
  return (
    <div
      className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => onSelect?.(device)}
    >
      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
        <Package className="h-8 w-8 text-gray-400" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{device.name}</h4>
        <p className="text-sm text-gray-600">{device.brand} • {device.model}</p>
        <p className="text-sm font-medium text-green-600">{formatPrice(device.basePrice)}</p>
      </div>

      {onSelect && (
        <Button size="sm" variant="outline">
          Selecionar
        </Button>
      )}
    </div>
  );
}
