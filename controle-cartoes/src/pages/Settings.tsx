import { useState, useEffect } from 'react';
import { PageLayout, Card, TwoColumnGrid } from '../components/ui/Layout';
import { Settings as SettingsIcon, Moon, Sun, Download, Upload, Trash2, Bell, Lock, Globe, Shield, Database, Info, Cloud, LogIn, LogOut, Clock, Smartphone, Activity } from 'lucide-react';
import { PrimaryButton } from '../components/ui/FormComponents';
import { FormField } from '../components/ui/Form';
import { useTheme, useSettings, useBackup } from '../hooks';
import { useSession } from '../hooks/useSession';
import { useToast } from '../components/Toast';
import { unifiedDatabaseService } from '../services/unifiedDatabaseService';
import { cloudSyncService } from '../services/cloudSyncService';
import { AuthModal } from '../components/AuthModal';
import SessionAnalyticsComponent from '../components/SessionAnalyticsComponent';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { exportData, importData, clearAllData } = useBackup();
  const { addToast } = useToast();
  const { 
    isAuthenticated, 
    user: currentUser, 
    login, 
    logout, 
    formatTimeRemaining,
    formatSessionDuration,
    timeRemaining,
    sessionDuration,
    deviceInfo,
    lastActivity,
    sessionId,
    getSessionAnalytics,
    isLoading 
  } = useSession();
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAuthSuccess = () => {
    addToast({ 
      type: 'success', 
      title: `Bem-vindo, ${currentUser?.name}!`,
      description: 'Agora você pode sincronizar seus dados entre dispositivos.'
    });
  };

  const handleLogout = async () => {
    await logout();
    addToast({ 
      type: 'success', 
      title: 'Logout realizado com sucesso',
      description: 'Seus dados locais foram preservados.'
    });
  };

  const handleSyncToCloud = async () => {
    if (!isAuthenticated) {
      addToast({ type: 'error', title: 'Faça login para sincronizar dados' });
      return;
    }

    setIsSyncing(true);
    try {
      // Get all local data
      const pessoas = await unifiedDatabaseService.getPessoas();
      
      // Extract cartões from pessoas
      const cartoes: any[] = [];
      pessoas.forEach(pessoa => {
        if (pessoa.cartoes) {
          pessoa.cartoes.forEach(cartao => {
            cartoes.push({
              ...cartao,
              pessoa_id: pessoa.id
            });
          });
        }
      });

      const gastos = await unifiedDatabaseService.getGastos();
      const recorrencias = await unifiedDatabaseService.getRecorrencias();
      const userSettings = await unifiedDatabaseService.getSettings();

      await cloudSyncService.syncToCloud({
        pessoas,
        cartoes,
        gastos,
        recorrencias,
        settings: userSettings
      });

      addToast({ 
        type: 'success', 
        title: 'Dados sincronizados com sucesso!',
        description: 'Seus dados foram enviados para a nuvem.'
      });
    } catch (error: any) {
      addToast({ 
        type: 'error', 
        title: 'Erro ao sincronizar dados',
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromCloud = async () => {
    if (!isAuthenticated) {
      addToast({ type: 'error', title: 'Faça login para sincronizar dados' });
      return;
    }

    setIsSyncing(true);
    try {
      const cloudData = await cloudSyncService.syncFromCloud();
      
      // Update local database with cloud data
      if (cloudData.pessoas) {
        for (const pessoa of cloudData.pessoas) {
          try {
            await unifiedDatabaseService.createPessoa(pessoa);
          } catch (error) {
            console.warn('Failed to import pessoa:', pessoa.nome, error);
          }
        }
      }
      
      if (cloudData.gastos) {
        for (const gasto of cloudData.gastos) {
          try {
            await unifiedDatabaseService.createGasto(gasto);
          } catch (error) {
            console.warn('Failed to import gasto:', gasto.descricao, error);
          }
        }
      }
      
      if (cloudData.recorrencias) {
        for (const recorrencia of cloudData.recorrencias) {
          try {
            await unifiedDatabaseService.createRecorrencia(recorrencia);
          } catch (error) {
            console.warn('Failed to import recorrencia:', recorrencia.nome, error);
          }
        }
      }
      
      if (cloudData.settings) {
        await unifiedDatabaseService.saveSettings(cloudData.settings);
      }

      addToast({ 
        type: 'success', 
        title: 'Dados baixados com sucesso!',
        description: 'Seus dados da nuvem foram sincronizados localmente.'
      });
      
      // Refresh the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      addToast({ 
        type: 'error', 
        title: 'Erro ao baixar dados',
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const success = await importData(data);
          if (success) {
            addToast({ type: 'success', title: 'Dados importados com sucesso!' });
          } else {
            addToast({ type: 'error', title: 'Erro ao importar dados. Verifique se o arquivo está correto.' });
          }
        } catch (error) {
          addToast({ type: 'error', title: 'Erro ao importar dados. Verifique se o arquivo está correto.' });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    try {
      clearAllData();
      setShowClearConfirm(false);
      addToast({ type: 'success', title: 'Todos os dados foram removidos com sucesso' });
    } catch (error) {
      addToast({ type: 'error', title: 'Erro ao limpar dados' });
    }
  };

  // Get database info instead of storage info
  const [databaseInfo, setDatabaseInfo] = useState<any>({
    totalPessoas: 0,
    totalCartoes: 0,
    totalGastos: 0,
    totalRecorrencias: 0,
    storageSize: '0 KB',
    lastBackup: null
  });

  useEffect(() => {
    const loadDatabaseInfo = async () => {
      try {
        const info = await unifiedDatabaseService.getDatabaseInfo();
        setDatabaseInfo({
          totalPessoas: info.total_pessoas || 0,
          totalCartoes: info.total_cartoes || 0,
          totalGastos: info.total_gastos || 0,
          totalRecorrencias: info.total_recorrencias || 0,
          storageSize: 'Database',
          lastBackup: 'See API for backup history'
        });
      } catch (error) {
        console.warn('Failed to load database info:', error);
      }
    };

    loadDatabaseInfo();
  }, []);

  return (
    <PageLayout
      title="Configurações"
      subtitle="Personalize sua experiência e gerencie seus dados"
      icon={<SettingsIcon size={24} />}
    >
      <div className="space-y-6">
        {/* Appearance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aparência</h3>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Tema</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Escolha entre tema claro ou escuro
              </p>
            </div>
            <PrimaryButton 
              variant="outline" 
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={16} className="mr-2" />
                  Modo Claro
                </>
              ) : (
                <>
                  <Moon size={16} className="mr-2" />
                  Modo Escuro
                </>
              )}
            </PrimaryButton>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notificações</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Lembrete de pagamentos</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receber lembretes sobre pagamentos pendentes
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications?.payments || false}
                  onChange={(e) => updateSettings({
                    notifications: {
                      ...settings.notifications,
                      payments: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Relatórios mensais</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receber relatórios mensais por email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications?.reports || false}
                  onChange={(e) => updateSettings({
                    notifications: {
                      ...settings.notifications,
                      reports: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Cloud Sync */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                <Cloud className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sincronização na Nuvem</h3>
            </div>
          </div>
          
          {!isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Sincronize seus dados entre dispositivos
                    </h4>
                    <p className="text-blue-800 dark:text-blue-400 text-sm mb-3">
                      Mantenha seus dados seguros e acessíveis em qualquer lugar. 
                      Faça login ou crie uma conta para começar.
                    </p>
                    <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
                      <li>✓ Acesso aos dados em múltiplos dispositivos</li>
                      <li>✓ Backup automático na nuvem</li>
                      <li>✓ Sincronização em tempo real</li>
                      <li>✓ Dados seguros e criptografados</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <PrimaryButton onClick={() => setShowAuthModal(true)}>
                  <LogIn size={16} className="mr-2" />
                  Fazer Login / Criar Conta
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Session Info */}
              <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-900 dark:text-green-300">
                    Conectado como {currentUser?.name}
                  </span>
                </div>
                <p className="text-green-800 dark:text-green-400 text-sm mb-3">
                  {currentUser?.email}
                </p>
                
                {/* Session Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                  {timeRemaining && (
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Expira em: {formatTimeRemaining()}</span>
                    </div>
                  )}
                  
                  {sessionDuration && (
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                      <Activity className="w-4 h-4" />
                      <span>Ativo há: {formatSessionDuration()}</span>
                    </div>
                  )}
                  
                  {deviceInfo && (
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                      <Smartphone className="w-4 h-4" />
                      <span>{deviceInfo}</span>
                    </div>
                  )}
                  
                  {sessionId && (
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                      <Shield className="w-4 h-4" />
                      <span>ID: {sessionId.slice(-8)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Enviar para nuvem</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sincronizar dados locais para a nuvem
                    </p>
                  </div>
                  <PrimaryButton 
                    variant="outline" 
                    onClick={handleSyncToCloud}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Enviando...
                      </div>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        Enviar
                      </>
                    )}
                  </PrimaryButton>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Baixar da nuvem</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sincronizar dados da nuvem para este dispositivo
                    </p>
                  </div>
                  <PrimaryButton 
                    variant="outline" 
                    onClick={handleSyncFromCloud}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Baixando...
                      </div>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        Baixar
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </div>

              <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <PrimaryButton 
                  variant="outline" 
                  onClick={handleLogout}
                  className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900"
                >
                  <LogOut size={16} className="mr-2" />
                  Fazer Logout
                </PrimaryButton>
              </div>
            </div>
          )}
        </Card>

        {/* Session Analytics - Only show when authenticated */}
        {isAuthenticated && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análise de Sessões</h3>
              </div>
            </div>
            
            <SessionAnalyticsComponent getSessionAnalytics={getSessionAnalytics} />
          </Card>
        )}

        {/* Data Management */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciamento de Dados</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Backup dos dados</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Faça download de todos os seus dados em formato JSON
                </p>
              </div>
              <PrimaryButton 
                variant="outline" 
                onClick={handleExport}
              >
                <Download size={16} className="mr-2" />
                Exportar
              </PrimaryButton>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Restaurar dados</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Importar dados de um backup anterior
                </p>
              </div>
              <label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <PrimaryButton variant="outline" as="span">
                  <Upload size={16} className="mr-2" />
                  Importar
                </PrimaryButton>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-300">Limpar todos os dados</h4>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Remove permanentemente todos os dados do aplicativo
                </p>
              </div>
              <PrimaryButton 
                variant="outline" 
                onClick={() => setShowClearConfirm(true)}
                className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900"
              >
                <Trash2 size={16} className="mr-2" />
                Limpar
              </PrimaryButton>
            </div>
          </div>
        </Card>

        {/* Storage Info */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informações de Armazenamento</h3>
            </div>
          </div>
          
          <TwoColumnGrid>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {databaseInfo.totalPessoas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pessoas</div>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {databaseInfo.totalCartoes}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cartões</div>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {databaseInfo.storageSize}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tamanho dos Dados</div>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {databaseInfo.lastBackup}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Último Backup</div>
            </div>
          </TwoColumnGrid>
        </Card>

        {/* Privacy & Security */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacidade e Segurança</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Proteção por senha</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Exigir senha para acessar o aplicativo
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security?.passwordProtection || false}
                  onChange={(e) => updateSettings({
                    security: {
                      ...settings.security,
                      passwordProtection: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Auto bloqueio</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tempo para bloquear automaticamente
                </p>
              </div>
              <select
                value={settings.security?.autoLockTime || '5'}
                onChange={(e) => updateSettings({
                  security: {
                    ...settings.security,
                    autoLockTime: e.target.value
                  }
                })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={!settings.security?.passwordProtection}
              >
                <option value="1">1 minuto</option>
                <option value="5">5 minutos</option>
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="never">Nunca</option>
              </select>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sobre o App</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-white">Versão:</span>
              <span className="text-gray-600 dark:text-gray-400">1.0.0</span>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-white">Última atualização:</span>
              <span className="text-gray-600 dark:text-gray-400">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-white">Desenvolvido com:</span>
              <span className="text-gray-600 dark:text-gray-400">React + TypeScript + Vite</span>
            </div>
          </div>
        </Card>

        {/* Clear Data Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowClearConfirm(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar Limpeza de Dados</h3>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-300 mb-2">
                      <strong>Atenção!</strong> Esta ação é irreversível.
                    </p>
                    <p className="text-red-800 dark:text-red-400 mb-2">
                      Todos os dados serão permanentemente removidos, incluindo:
                    </p>
                    <ul className="text-red-700 dark:text-red-400 text-sm space-y-1 ml-4">
                      <li>• Todas as pessoas cadastradas</li>
                      <li>• Todos os cartões registrados</li>
                      <li>• Configurações personalizadas</li>
                    </ul>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Certifique-se de ter feito um backup antes de continuar.
                </p>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <PrimaryButton 
                  variant="outline" 
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancelar
                </PrimaryButton>
                <PrimaryButton 
                  onClick={handleClearData}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  <Trash2 size={16} className="mr-2" />
                  Limpar Todos os Dados
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </PageLayout>
  );
}
