import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Search, Filter, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';
import type { Transfer, Asset, Base } from '../types';
import { useAuth } from '../hooks/useAuth';

const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transfersData, assetsData, basesData] = await Promise.all([
        api.getTransfers(),
        api.getAssets(),
        api.getBases()
      ]);
      setTransfers(transfersData);
      setAssets(assetsData);
      setBases(basesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.assetId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.fromBaseId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.toBaseId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateTransferStatus = async (transferId: string, status: string, notes?: string) => {
    try {
      await api.updateTransferStatus(transferId, { status, notes });
      loadData();
    } catch (error) {
      console.error('Failed to update transfer status:', error);
    }
  };

  const AddTransferModal: React.FC = () => {
    const [formData, setFormData] = useState({
      assetId: '',
      fromBaseId: user?.base?._id || '',
      toBaseId: '',
      quantity: 1,
      reason: '',
      priority: 'Medium',
      notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await api.createTransfer(formData);
        setShowAddModal(false);
        loadData();
        setFormData({
          assetId: '',
          fromBaseId: user?.base?._id || '',
          toBaseId: '',
          quantity: 1,
          reason: '',
          priority: 'Medium',
          notes: ''
        });
      } catch (error) {
        console.error('Failed to create transfer:', error);
      }
    };

    const availableAssets = assets.filter(asset => 
      asset.baseId._id === formData.fromBaseId && asset.closingBalance > 0
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Request Asset Transfer</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Base *
                </label>
                <select
                  required
                  value={formData.fromBaseId}
                  onChange={(e) => setFormData({ ...formData, fromBaseId: e.target.value, assetId: '' })}
                  disabled={user?.role !== 'Admin'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  {bases.map(base => (
                    <option key={base._id} value={base._id}>{base.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Base *
                </label>
                <select
                  required
                  value={formData.toBaseId}
                  onChange={(e) => setFormData({ ...formData, toBaseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Destination Base</option>
                  {bases.filter(base => base._id !== formData.fromBaseId).map(base => (
                    <option key={base._id} value={base._id}>{base.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset *
                </label>
                <select
                  required
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Asset</option>
                  {availableAssets.map(asset => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name} (Available: {asset.closingBalance})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={availableAssets.find(a => a._id === formData.assetId)?.closingBalance || 1}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Transfer *
              </label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Operational requirement, Equipment shortage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Request Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ArrowLeftRight className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transfer Management</h1>
            <p className="text-gray-600">Manage asset transfers between bases</p>
          </div>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Base Commander') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Request Transfer</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transfers</p>
              <p className="text-2xl font-bold text-gray-900">{transfers.length}</p>
            </div>
            <ArrowLeftRight className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {transfers.filter(t => t.status === 'Pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-gray-900">
                {transfers.filter(t => t.status === 'In Transit').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {transfers.filter(t => t.status === 'Completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset & Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransfers.map((transfer) => (
                <tr key={transfer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transfer.reason}
                      </div>
                      <div className="text-sm text-gray-500">
                        Requested: {new Date(transfer.requestDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        By: {transfer.requestedBy.username}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transfer.assetId.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Quantity: {transfer.quantity}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{transfer.fromBaseId.name}</span>
                      <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{transfer.toBaseId.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transfer.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                      transfer.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                      transfer.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transfer.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transfer.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      transfer.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                      transfer.status === 'Approved' ? 'bg-purple-100 text-purple-800' :
                      transfer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transfer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {transfer.status === 'Pending' && (user?.role === 'Admin' || user?.role === 'Base Commander') && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateTransferStatus(transfer._id, 'Approved')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve Transfer"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateTransferStatus(transfer._id, 'Rejected', 'Transfer rejected')}
                          className="text-red-600 hover:text-red-900"
                          title="Reject Transfer"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {transfer.status === 'Approved' && (user?.role === 'Admin' || user?.role === 'Base Commander') && (
                      <button
                        onClick={() => updateTransferStatus(transfer._id, 'In Transit')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Mark In Transit"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                    )}
                    {transfer.status === 'In Transit' && (user?.role === 'Admin' || user?.role === 'Base Commander') && (
                      <button
                        onClick={() => updateTransferStatus(transfer._id, 'Completed')}
                        className="text-green-600 hover:text-green-900"
                        title="Mark Completed"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <AddTransferModal />}
    </div>
  );
};

export default Transfers;