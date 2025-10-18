import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock } from 'lucide-react';

export function EvaluationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-lg py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciar Avaliações
          </h1>
          <p className="text-gray-600">
            Processar e avaliar submissões de dispositivos
          </p>
        </div>

        <Card className="text-center p-12">
          <CardContent>
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Página em Desenvolvimento
            </h3>
            <p className="text-gray-600 mb-6">
              Esta funcionalidade está sendo desenvolvida
            </p>
            <Button>Em Breve</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
