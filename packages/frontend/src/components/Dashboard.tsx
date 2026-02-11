// packages/frontend/src/components/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar,
  TrendingUp,
  FileText,
  Settings,
  Hash,
  ChevronRight,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

interface Topic {
  id: string;
  name: string;
  keywords: string[];
  isActive: boolean;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  scheduledFor?: string;
  publishedAt?: string;
  hashtags: string[];
  newsItem?: {
    title: string;
    url: string;
  };
}

interface Analytics {
  postsPublished: number;
  totalImpressions: number;
  totalReactions: number;
  engagementRate: number;
}

export const Dashboard: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: topics, isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get('/topics');
      return response.data;
    },
  });

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data;
    },
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await api.get('/analytics/summary');
      return response.data;
    },
  });

  // Mutations
  const toggleTopicMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.patch(`/topics/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Estadísticas calculadas
  const stats = {
    totalTopics: topics?.length || 0,
    activeTopics: topics?.filter(t => t.isActive).length || 0,
    scheduledPosts: posts?.filter(p => p.status === 'SCHEDULED').length || 0,
    publishedToday: posts?.filter(p => {
      if (!p.publishedAt) return false;
      const today = new Date().toDateString();
      return new Date(p.publishedAt).toDateString() === today;
    }).length || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle className="w-4 h-4" />;
      case 'SCHEDULED': return <Clock className="w-4 h-4" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (topicsLoading || postsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                LinkedIn Automation
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Automatiza tus publicaciones con IA
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Settings className="w-4 h-4" />
              Configuración
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Posts Hoy"
            value={stats.publishedToday}
            icon={<FileText className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Programados"
            value={stats.scheduledPosts}
            icon={<Clock className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Tópicos Activos"
            value={stats.activeTopics}
            icon={<Hash className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Engagement"
            value={analytics?.engagementRate.toFixed(1) + '%' || '0%'}
            icon={<TrendingUp className="w-6 h-6" />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topics Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Tópicos
                  </h2>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    + Nuevo
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {topics?.map(topic => (
                  <div
                    key={topic.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedTopic === topic.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedTopic(topic.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {topic.name}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {topic.keywords.slice(0, 3).map((keyword, i) => (
                            <span
                              key={i}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {topic.keywords.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{topic.keywords.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTopicMutation.mutate({
                            id: topic.id,
                            isActive: topic.isActive,
                          });
                        }}
                        className={`ml-3 ${
                          topic.isActive
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 hover:text-gray-500'
                        }`}
                      >
                        {topic.isActive ? (
                          <Play className="w-5 h-5" fill="currentColor" />
                        ) : (
                          <Pause className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Posts List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Posts Recientes
                  </h2>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors">
                    <FileText className="w-4 h-4" />
                    Crear Post
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {posts?.slice(0, 10).map(post => (
                  <div key={post.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              post.status
                            )}`}
                          >
                            {getStatusIcon(post.status)}
                            {post.status}
                          </span>
                          {post.scheduledFor && (
                            <span className="text-xs text-gray-500">
                              {new Date(post.scheduledFor).toLocaleString('es-ES', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-3 mb-2">
                          {post.content}
                        </p>
                        {post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-xs text-blue-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {post.newsItem && (
                          <a
                            href={post.newsItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-gray-700 mt-2 inline-block"
                          >
                            📰 {post.newsItem.title}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePostMutation.mutate(post.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para las tarjetas de estadísticas
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
