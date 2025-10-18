import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submissionService } from '@/services/submission.service';
import { useMutation } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SubmissionCard } from '@/components/common/SubmissionCard';
import { Search, Package, AlertCircle } from 'lucide-react';

export function TrackSubmissionPage() {
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState(searchParams.get('code') || '');

  const {
    data: submission,
    loading,
    error,
    mutate: trackSubmission
  } = useMutation(submissionService.trackSubmission);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    try {
      await trackSubmission(trackingCode.trim().toUpperCase());
    } catch (err) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-lg py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Rastrear Submissão
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Digite o código de rastreamento para acompanhar o status da sua submissão
          </p>
        </div>

        {/* Search Form */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Código de Rastreamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <Input
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="Digite seu código (ex: ABC123456)"
                  className="text-center text-lg font-mono"
                  maxLength={9}
                />
                <p className="text-sm text-gray-500 text-center mt-2">
                  O código foi enviado por email quando você fez a submissão
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={!trackingCode.trim()}
              >
                {loading ? 'Buscando...' : 'Rastrear Submissão'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="p-8">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Submissão não encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Verifique se o código foi digitado corretamente. O código possui
                3 letras seguidas de 6 números (ex: ABC123456).
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <h4 className="font-medium text-blue-900 mb-2">Dicas:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Verifique se todas as letras e números estão corretos</li>
                  <li>• O código não faz distinção entre maiúsculas e minúsculas</li>
                  <li>• Procure o código no email de confirmação</li>
                  <li>• Entre em contato conosco se continuar com problemas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Details */}
        {submission && !loading && (
          <div className="max-w-4xl mx-auto">
            <SubmissionCard submission={submission} showActions={false} />

            {/* Timeline */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Histórico da Submissão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Submissão Recebida</h4>
                      <p className="text-sm text-gray-600">
                        Sua submissão foi recebida e está na fila para avaliação
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(submission.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {submission.status !== 'pending' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Em Avaliação</h4>
                        <p className="text-sm text-gray-600">
                          Nossa equipe está avaliando seu dispositivo
                        </p>
                      </div>
                    </div>
                  )}

                  {['approved', 'rejected'].includes(submission.status) && (
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        submission.status === 'approved' 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          submission.status === 'approved' 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {submission.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {submission.status === 'approved'
                            ? 'Sua submissão foi aprovada! Entraremos em contato.'
                            : 'Sua submissão foi rejeitada. Veja os detalhes acima.'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        {!submission && !loading && (
          <Card className="max-w-2xl mx-auto mt-12">
            <CardHeader>
              <CardTitle>Precisa de Ajuda?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Nova Submissão</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Ainda não submeteu seu dispositivo?
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <a href="/catalog">Começar Agora</a>
                  </Button>
                </div>

                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Suporte</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Problemas com o rastreamento?
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <a href="/contact">Contato</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
