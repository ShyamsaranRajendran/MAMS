import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  ArrowLeftRight, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Shield
} from 'lucide-react';
import { api } from '../utils/api';
import type { DashboardMetrics } from '../types';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-gray-500 py-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p>Unable to load dashboard metrics</p>
      </div>
    );
  }

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    trend?: string;
  }> = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl text-white p-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-10 w-10" />
          <div>
            <h1 className="text-2xl font-bold">Command Center</h1>
            <p className="text-blue-100">Real-time military asset overview</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Assets"
          value={metrics.overview.totalAssets}
          icon={Package}
          color="bg-blue-600"
        />
        <StatCard
          title="Active Assignments"
          value={metrics.overview.activeAssignments}
          icon={Users}
          color="bg-green-600"
        />
        <StatCard
          title="Pending Transfers"
          value={metrics.overview.pendingTransfers}
          icon={ArrowLeftRight}
          color="bg-yellow-600"
        />
        <StatCard
          title="Low Stock Alerts"
          value={metrics.overview.lowStockCount}
          icon={AlertTriangle}
          color="bg-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Asset Distribution
            </h3>
          </div>
          <div className="p-6">
            {metrics.assetsByType.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No assets available</p>
            ) : (
              <div className="space-y-4">
                {metrics.assetsByType.map((type, index) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={type._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${color}`}></div>
                        <span className="text-gray-900 font-medium">{type._id}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">{type.count}</div>
                        <div className="text-sm text-gray-500">units</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ArrowLeftRight className="h-5 w-5 mr-2 text-blue-600" />
              Recent Transfers
            </h3>
          </div>
          <div className="p-6">
            {metrics.recentTransfers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent transfers</p>
            ) : (
              <div className="space-y-4">
                {metrics.recentTransfers.map((transfer) => (
                  <div key={transfer._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{transfer.assetId.name}</p>
                      <p className="text-sm text-gray-500">
                        {transfer.fromBaseId.name} → {transfer.toBaseId.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transfer.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        transfer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {transfer.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {metrics.lowStockAssets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Low Stock Alerts
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.lowStockAssets.map((asset) => (
                <div key={asset._id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      <p className="text-sm text-gray-600">{asset.baseId.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{asset.closingBalance}</p>
                      <p className="text-sm text-gray-500">{asset.unit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;