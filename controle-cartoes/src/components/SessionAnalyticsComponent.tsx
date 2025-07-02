import { useState, useEffect } from 'react';

interface SessionActivity {
  action: 'login' | 'logout' | 'heartbeat' | string;
  timestamp: number;
  location?: string;
  device?: string;
}

interface SessionAnalytics {
  currentSession?: {
    startTime: string;
    duration: string;
    location?: string;
    device?: string;
  };
  totalSessions?: number;
  averageSessionDuration?: number;
  longestSession?: number;
  lastLoginDate?: number;
  recentActivity?: SessionActivity[];
}

interface SessionAnalyticsComponentProps {
  getSessionAnalytics: () => SessionAnalytics | null;
}

export default function SessionAnalyticsComponent({ getSessionAnalytics }: SessionAnalyticsComponentProps) {
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);

  useEffect(() => {
    const analyticsData = getSessionAnalytics();
    setAnalytics(analyticsData);
  }, [getSessionAnalytics]);

  if (!analytics) return null;

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Menos de 1 min';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {analytics.totalSessions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total de Sessões</div>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {analytics.averageSessionDuration ? formatDuration(analytics.averageSessionDuration) : 'N/A'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Duração Média</div>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {analytics.longestSession ? formatDuration(analytics.longestSession) : 'N/A'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Maior Sessão</div>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
            {analytics.lastLoginDate ? formatDate(analytics.lastLoginDate).split(' ')[0] : 'Nunca'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Último Login</div>
        </div>
      </div>

      {/* Recent Activity */}
      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Atividade Recente</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analytics.recentActivity.map((activity: SessionActivity, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action === 'login' ? 'bg-green-500' :
                    activity.action === 'logout' ? 'bg-red-500' :
                    activity.action === 'heartbeat' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-gray-900 dark:text-white capitalize">
                    {activity.action === 'login' ? 'Login' :
                     activity.action === 'logout' ? 'Logout' :
                     activity.action === 'heartbeat' ? 'Atividade' :
                     activity.action === 'page_focus' ? 'Foco na Página' :
                     activity.action}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  {formatDate(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
