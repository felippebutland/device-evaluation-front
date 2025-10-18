import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-lg py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configurações
          </h1>
          <p className="text-gray-600">
            Políticas de preços e configurações do sistema
          </p>
        </div>

        <Card className="text-center p-12">
          <CardContent>
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
