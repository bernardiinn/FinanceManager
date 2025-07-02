/**
 * Export Page - Data backup and export functionality
 */

import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  CloudUpload,
  HardDrive
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useBackup, useAppData } from '../hooks';
import { useToast } from '../components/Toast';
export default function Export() {
  const { exportData, importData } = useBackup();
  const { pessoas } = useAppData();
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const success = await exportData();
      if (success) {
        addToast({ type: 'success', title: 'Dados exportados com sucesso!' });
      } else {
        addToast({ type: 'error', title: 'Erro ao exportar dados' });
      }
    } catch {
      addToast({ type: 'error', title: 'Erro ao exportar dados' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const success = await importData(data);
        if (success) {
          addToast({ type: 'success', title: 'Dados importados com sucesso!' });
        } else {
          addToast({ type: 'error', title: 'Erro ao importar dados' });
        }
      } catch {
        addToast({ type: 'error', title: 'Arquivo inválido ou corrompido' });
      } finally {
        setIsImporting(false);
        // Reset the input
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Simple storage info for demo purposes
  const storageInfo = { used: pessoas.length * 1024, total: 5 * 1024 * 1024 }; // Rough estimate
  const storagePercentage = (storageInfo.used / storageInfo.total) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Backup e Export</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Storage Usage Card */}
          <Card className="h-fit">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HardDrive size={20} />
                Uso do Armazenamento
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Usado: {formatBytes(storageInfo.used)}</span>
                    <span>Disponível: {formatBytes(storageInfo.total)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {storagePercentage.toFixed(1)}% utilizado
                  </p>
                </div>

                {storagePercentage > 80 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-amber-800 font-medium">Armazenamento quase cheio</p>
                      <p className="text-amber-700">
                        Considere fazer backup e limpar dados antigos.
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p><strong>Total de pessoas:</strong> {pessoas.length}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Export Options Card */}
          <Card className="h-fit">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Download size={20} />
                Exportar Dados
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {/* JSON Export */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-600" size={24} />
                    <div>
                      <h4 className="font-semibold">Backup Completo (JSON)</h4>
                      <p className="text-sm text-gray-600">
                        Exporta todos os dados em formato JSON
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportJSON}
                    disabled={isExporting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isExporting ? 'Exportando...' : 'Exportar'}
                  </button>
                </div>

                {/* CSV Export (Future Feature) */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="text-green-600" size={24} />
                    <div>
                      <h4 className="font-semibold">Planilha CSV</h4>
                      <p className="text-sm text-gray-600">
                        Exporta dados para planilha (em breve)
                      </p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                  >
                    Em breve
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Import Data Card */}
          <Card className="h-fit">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Upload size={20} />
                Importar Dados
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-800 font-medium">Atenção!</p>
                    <p className="text-amber-700">
                      A importação substituirá todos os dados existentes.
                    </p>
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="import-file"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Selecionar arquivo de backup:
                  </label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={isImporting}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {isImporting && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <CloudUpload size={16} className="text-blue-600" />
                    <p className="text-sm text-blue-800">Importando dados...</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Help Card */}
          <Card className="h-fit">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle size={20} />
                Como usar
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Exportar:</h4>
                  <ul className="space-y-1 pl-4">
                    <li>• Clique em "Exportar" para baixar um arquivo JSON</li>
                    <li>• O arquivo contém todos os seus dados</li>
                    <li>• Guarde o arquivo em local seguro</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Importar:</h4>
                  <ul className="space-y-1 pl-4">
                    <li>• Selecione um arquivo JSON de backup</li>
                    <li>• Todos os dados atuais serão substituídos</li>
                    <li>• Certifique-se de ter um backup antes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Dicas:</h4>
                  <ul className="space-y-1 pl-4">
                    <li>• Faça backups regulares dos seus dados</li>
                    <li>• Verifique se o arquivo está correto antes de importar</li>
                    <li>• Mantenha seus backups em local seguro</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
