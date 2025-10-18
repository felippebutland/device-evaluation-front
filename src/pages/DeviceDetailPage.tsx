import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { deviceService } from '@/services/device.service';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { SubmissionForm } from '@/components/forms/SubmissionForm';
import { LoadingPage } from '@/components/ui/Loading';
import { Badge } from '@/components/common/StatusBadge';
import { formatPrice } from '@/utils/helpers';
import {
  Package,
  DollarSign,
  Clock,
  Shield,
  ArrowLeft,
  Send,
  Info
} from 'lucide-react';

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  const { data: device, loading, error } = useApi(
    () => deviceService.getPublicDeviceById(id!),
    [id]
  );

  const handleSubmissionSuccess = (trackingCode: string) => {
    setShowSubmissionModal(false);
    navigate(`/track?code=${trackingCode}`);
  };

  if (loading) {
    return <LoadingPage text="Carregando detalhes do dispositivo..." />;
  }

  if (error || !device) {
    return (
      <div className="container-lg py-20">
        <Card className="text-center p-8">
          <CardContent>
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Dispositivo não encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              O dispositivo que você está procurando não existe ou foi removido.
            </p>
            <Button asChild>
              <Link to="/catalog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Catálogo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-lg py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Device Image and Basic Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Device Image Placeholder */}
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>

                  {/* Device Info */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="info">{device.brand}</Badge>
                        {device.active && <Badge variant="success">Disponível</Badge>}
                      </div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {device.name}
                      </h1>
                      <p className="text-lg text-gray-600">Modelo: {device.model}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-2xl font-bold text-green-600">
                          A partir de {formatPrice(device.basePrice)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Info className="h-4 w-4" />
                        <span>Preço pode variar conforme condição do dispositivo</span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => setShowSubmissionModal(true)}
                      >
                        <Send className="mr-2 h-5 w-5" />
                        Submeter para Avaliação
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/track">Rastrear Submissão</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/catalog">Ver Mais Dispositivos</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            {device.specifications && Object.keys(device.specifications).length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Especificações Técnicas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(device.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}:
                        </span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Process Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Processo de Avaliação</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Submissão</h4>
                      <p className="text-sm text-gray-600">
                        Envie as informações do seu dispositivo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Avaliação</h4>
                      <p className="text-sm text-gray-600">
                        Nossa equipe avalia seu dispositivo em até 48h
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Oferta</h4>
                      <p className="text-sm text-gray-600">
                        Receba nossa melhor oferta baseada na condição
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Opções de Pagamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Modalidade Venda</h4>
                    <div className="text-sm text-green-700 mt-1 space-y-1">
                      <p>• 7 dias: Desconto R$ 250</p>
                      <p>• 10 dias: Desconto R$ 100</p>
                      <p>• 30 dias: Valor integral</p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Modalidade Troca</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Valor integral mantido para troca por outro dispositivo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Segurança</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Processo 100% seguro</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Avaliação transparente</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Pagamento garantido</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Suporte dedicado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submission Modal */}
        <Modal
          isOpen={showSubmissionModal}
          onClose={() => setShowSubmissionModal(false)}
          size="lg"
          title="Submeter Dispositivo para Avaliação"
        >
          <ModalContent>
            <SubmissionForm
              device={device}
              onSuccess={handleSubmissionSuccess}
              onCancel={() => setShowSubmissionModal(false)}
            />
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
