import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from './StatusBadge';
import { formatDate, formatPrice } from '@/utils/helpers';
import { Eye, Package, Calendar, Hash } from 'lucide-react';
import type { DeviceSubmission } from '@/types';

interface SubmissionCardProps {
  submission: DeviceSubmission;
  showActions?: boolean;
}

export function SubmissionCard({ submission, showActions = true }: SubmissionCardProps) {
  const {
    id,
    trackingCode,
    device,
    reportedCondition,
    preferredSaleMode,
    status,
    createdAt,
    evaluation
  } = submission;

  const conditionLabels = {
    excellent: 'Excelente',
    good: 'Boa',
    fair: 'Regular',
    poor: 'Ruim',
    damaged: 'Danificado'
  };

  const saleModeLabels = {
    sale: 'Venda',
    exchange: 'Troca'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>{device?.name || 'Dispositivo'}</span>
          </CardTitle>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Hash className="h-4 w-4" />
            <span>{trackingCode}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Device Info */}
        {device && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Informações do Dispositivo</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Marca:</span>
                <span className="ml-1 font-medium">{device.brand}</span>
              </div>
              <div>
                <span className="text-gray-600">Modelo:</span>
                <span className="ml-1 font-medium">{device.model}</span>
              </div>
              <div>
                <span className="text-gray-600">Condição Reportada:</span>
                <span className="ml-1 font-medium">{conditionLabels[reportedCondition]}</span>
              </div>
              <div>
                <span className="text-gray-600">Modalidade:</span>
                <span className="ml-1 font-medium">{saleModeLabels[preferredSaleMode]}</span>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Info */}
        {evaluation && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Avaliação</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-1 font-medium ${
                  evaluation.status === 'approved' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {evaluation.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                </span>
              </div>

              {evaluation.status === 'approved' && evaluation.finalPrice && (
                <div>
                  <span className="text-gray-600">Preço Final:</span>
                  <span className="ml-1 font-semibold text-green-600">
                    {formatPrice(evaluation.finalPrice)}
                  </span>
                </div>
              )}

              {evaluation.adminNotes && (
                <div>
                  <span className="text-gray-600">Observações:</span>
                  <p className="mt-1 text-gray-700 text-xs bg-gray-50 p-2 rounded">
                    {evaluation.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progresso:</span>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  ['pending', 'under_evaluation', 'approved', 'rejected'].includes(status) 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <div className={`w-2 h-2 rounded-full ${
                  ['under_evaluation', 'approved', 'rejected'].includes(status) 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <div className={`w-2 h-2 rounded-full ${
                  ['approved', 'rejected'].includes(status) 
                    ? (status === 'approved' ? 'bg-green-500' : 'bg-red-500') 
                    : 'bg-gray-300'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1"
              >
                <Link to={`/submission/${id}`} className="flex items-center justify-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>Ver Detalhes</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1"
              >
                <Link to={`/track?code=${trackingCode}`} className="flex items-center justify-center space-x-1">
                  <Hash className="h-4 w-4" />
                  <span>Rastrear</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for admin lists
export function SubmissionCardCompact({ submission }: { submission: DeviceSubmission }) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">
            {submission.device?.name || 'Dispositivo'}
          </h4>
          <p className="text-sm text-gray-600">
            {submission.trackingCode} • {formatDate(submission.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <StatusBadge status={submission.status} />
        <Button size="sm" variant="outline" asChild>
          <Link to={`/admin/submissions/${submission.id}`}>
            Ver
          </Link>
        </Button>
      </div>
    </div>
  );
}
