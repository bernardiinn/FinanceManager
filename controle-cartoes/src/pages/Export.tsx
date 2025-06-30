/**
 * Export Page - Data backup and export functionality
 */

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  FileDown as FileExport, 
  FileSpreadsheet as FileCsv, 
  FileCode,
  CloudDownload,
  CloudUpload,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FormGroup, Label, Input } from '../components/ui/Form';
import { useBackup, useAppData } from '../hooks';
import { useToast } from '../components/Toast';
import { unifiedDatabaseService } from '../services/unifiedDatabaseService';
import type { Pessoa } from '../types';

interface ExportOptionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const ExportOption: React.FC<ExportOptionProps> = ({
  title,
  description,
  icon,
  color,
  onClick,
  disabled = false,
  loading = false,
}) => (
  <Card hover={!disabled} clickable={!disabled} onClick={disabled ? undefined : onClick}>
    <Card.Body>
      <div className="flex items-start gap-4">
        <div style={{ color, fontSize: '2rem' }} className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">{title}</h4>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          loading={loading}
        >
          {loading ? 'Exportando...' : 'Exportar'}
        </Button>
      </div>
    </Card.Body>
  </Card>
);

export default function Export() {
  const { pessoas } = useAppData();
  const { addToast } = useToast();
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 5 * 1024 * 1024 }); // 5MB default
  
  const { exportData, importData, exportCSV, isExporting, isImporting } = useBackup();

  // Get storage info from database
  useEffect(() => {
    const getStorageInfo = async () => {
      try {
        const stats = await unifiedDatabaseService.getStorageStats();
        setStorageInfo({
          used: stats.databaseSize || 0,
          total: 5 * 1024 * 1024 // 5MB
        });
      } catch (error) {
        console.warn('Failed to get storage info:', error);
      }
    };
    getStorageInfo();
  }, []);

  const handleExportJSON = async () => {
    try {
      const success = await exportData();
      if (success) {
        addToast({ type: 'success', title: 'Dados exportados com sucesso!' });
      } else {
        addToast({ type: 'error', title: 'Erro ao exportar dados' });
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Erro ao exportar dados' });
    }
  };

  const handleExportCSV = () => {
    try {
      const success = exportCSV(pessoas || []);
      if (success) {
        addToast({ type: 'success', title: 'Relatório CSV exportado com sucesso!' });
      } else {
        addToast({ type: 'error', title: 'Erro ao exportar relatório CSV' });
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Erro ao exportar relatório CSV' });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const success = await importData(file);
      if (success) {
        addToast({ type: 'success', title: 'Dados importados com sucesso! Recarregue a página para ver as alterações.' });
      } else {
        addToast({ type: 'error', title: 'Erro ao importar dados. Verifique se o arquivo está no formato correto.' });
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Erro ao importar dados. Verifique se o arquivo está no formato correto.' });
    }
    
    // Clear the input
    event.target.value = '';
  };

  // Calculate storage usage percentage
  const storageUsagePercent = (storageInfo.used / storageInfo.total) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Exportar e Importar</h1>
        <p className="text-muted">
          Faça backup dos seus dados ou importe informações de outros dispositivos
        </p>
      </div>

      {/* Status Messages */}
      {importStatus.type && (
        <div className={`alert ${importStatus.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <div className="flex items-center gap-2">
            {importStatus.type === 'success' ? (
              <CheckCircle />
            ) : (
              <AlertTriangle />
            )}
            {importStatus.message}
          </div>
        </div>
      )}

      {/* Storage Usage */}
      <Card>
        <Card.Header title="Uso do Armazenamento Local" />
        <Card.Body>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Espaço Utilizado</span>
                <span className="text-sm text-muted">
                  {(storageInfo.used / 1024).toFixed(2)} KB de ~5 MB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(storageUsagePercent, 100)}%`,
                    backgroundColor: storageUsagePercent > 80 
                      ? 'var(--color-danger)' 
                      : storageUsagePercent > 60 
                        ? 'var(--color-warning)' 
                        : 'var(--color-success)',
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{pessoas?.length || 0}</p>
                <p className="text-sm text-muted">Pessoas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">
                  {pessoas?.reduce((sum, p) => sum + (p?.cartoes?.length || 0), 0) || 0}
                </p>
                <p className="text-sm text-muted">Cartões</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">
                  {(storageInfo.used / 1024).toFixed(0)} KB
                </p>
                <p className="text-sm text-muted">Dados Armazenados</p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Export Options */}
      <Card>
        <Card.Header title="Opções de Exportação" />
        <Card.Body>
          <div className="space-y-4">
            <ExportOption
              title="Backup Completo (JSON)"
              description="Exporta todos os dados incluindo configurações e temas para backup completo"
              icon={<FileCode />}
              color="var(--color-primary)"
              onClick={handleExportJSON}
              loading={isExporting}
              disabled={!pessoas || pessoas.length === 0}
            />
            
            <ExportOption
              title="Relatório Financeiro (CSV)"
              description="Exporta uma planilha com dados financeiros para análise externa"
              icon={<FileCsv />}
              color="var(--color-success)"
              onClick={handleExportCSV}
              disabled={!pessoas || pessoas.length === 0}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Import Section */}
      <Card>
        <Card.Header title="Importar Dados" />
        <Card.Body>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Atenção</h4>
                <p className="text-sm text-yellow-700">
                  A importação irá <strong>substituir todos os dados atuais</strong>. 
                  Recomendamos fazer um backup antes de importar novos dados.
                </p>
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="import-file">
                Selecionar arquivo de backup (JSON)
              </Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileImport}
                disabled={isImporting}
              />
              {isImporting && (
                <p className="text-sm text-muted mt-2">
                  Importando dados...
                </p>
              )}
            </FormGroup>

            <div className="flex gap-4">
              <div className="flex-1 p-4 border border-dashed border-gray-300 rounded-lg text-center">
                <CloudUpload size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted">
                  Arraste um arquivo JSON aqui ou use o botão acima
                </p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Instructions */}
      <Card>
        <Card.Header title="Como usar" />
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Download className="text-primary" />
                Exportação
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Backup JSON:</strong> Use para transferir dados entre dispositivos</li>
                <li>• <strong>CSV:</strong> Abra no Excel/Sheets para análises</li>
                <li>• <strong>Automático:</strong> Dados são salvos automaticamente no navegador</li>
                <li>• <strong>Recomendação:</strong> Faça backup mensalmente</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Upload className="text-success" />
                Importação
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Formato:</strong> Apenas arquivos JSON de backup</li>
                <li>• <strong>Cuidado:</strong> Substitui todos os dados atuais</li>
                <li>• <strong>Compatibilidade:</strong> Funciona entre diferentes dispositivos</li>
                <li>• <strong>Segurança:</strong> Dados permanecem no seu dispositivo</li>
              </ul>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <Card>
        <Card.Header title="Ações Rápidas" />
        <Card.Body>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              icon={<Download />}
              onClick={handleExportJSON}
              disabled={!pessoas || pessoas.length === 0}
            >
              Backup Rápido
            </Button>
            <Button
              variant="secondary"
              icon={<FileCsv />}
              onClick={handleExportCSV}
              disabled={!pessoas || pessoas.length === 0}
            >
              Relatório CSV
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
                  try {
                    await unifiedDatabaseService.clearAllData();
                    window.location.reload();
                  } catch (error) {
                    addToast({ type: 'error', title: 'Erro ao limpar dados' });
                  }
                }
              }}
            >
              Limpar Dados
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
