export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Base Commander' | 'Logistics Officer';
  base?: Base;
  lastLogin?: string;
}

export interface Base {
  _id: string;
  name: string;
  location: string;
  code: string;
  commanderId?: string;
  isActive: boolean;
}

export interface Asset {
  _id: string;
  name: string;
  type: 'Weapon' | 'Vehicle' | 'Ammunition' | 'Equipment' | 'Supplies';
  category: string;
  model?: string;
  serialNumber?: string;
  baseId: Base;
  openingBalance: number;
  closingBalance: number;
  unit: string;
  status: 'Active' | 'Maintenance' | 'Decommissioned';
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  _id: string;
  assetId: Asset;
  baseId: Base;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  purchaseOrderNumber: string;
  purchaseDate: string;
  deliveryDate?: string;
  status: 'Ordered' | 'Delivered' | 'Cancelled';
  notes?: string;
  createdBy: User;
  createdAt: string;
}

export interface Transfer {
  _id: string;
  assetId: Asset;
  fromBaseId: Base;
  toBaseId: Base;
  quantity: number;
  reason: string;
  requestDate: string;
  approvalDate?: string;
  transferDate?: string;
  status: 'Pending' | 'Approved' | 'In Transit' | 'Completed' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  notes?: string;
  requestedBy: User;
  approvedBy?: User;
  createdAt: string;
}

export interface Assignment {
  _id: string;
  assetId: Asset;
  baseId: Base;
  personnelId: string;
  personnelName: string;
  rank: string;
  unit: string;
  quantity: number;
  assignmentDate: string;
  returnDate?: string;
  expendedDate?: string;
  status: 'Assigned' | 'Returned' | 'Expended' | 'Lost' | 'Damaged';
  purpose: string;
  notes?: string;
  assignedBy: User;
  createdAt: string;
}

export interface DashboardMetrics {
  overview: {
    totalAssets: number;
    activeAssignments: number;
    pendingTransfers: number;
    lowStockCount: number;
  };
  assetsByType: Array<{
    _id: string;
    count: number;
    totalValue: number;
  }>;
  recentTransfers: Transfer[];
  lowStockAssets: Asset[];
}

export interface AuditLog {
  _id: string;
  userId: User;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: string;
}