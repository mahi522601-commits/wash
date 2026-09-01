import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import { formatDateTime } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { History, Search, RefreshCw } from 'lucide-react';

export const AdminActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getLogs(100);
      setLogs(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="emerald">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="royal">UPDATE</Badge>;
      case 'STATUS_CHANGE':
        return <Badge variant="brand">STATUS</Badge>;
      case 'DELETE':
        return <Badge variant="rose">DELETE</Badge>;
      case 'LOGIN':
        return <Badge variant="purple">LOGIN</Badge>;
      default:
        return <Badge variant="slate">{action}</Badge>;
    }
  };

  const filtered = logs.filter(
    (l) =>
      !searchQuery ||
      l.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      title: 'Action Type',
      key: 'action',
      render: (val) => getActionBadge(val),
    },
    {
      title: 'Entity & Target',
      key: 'entity',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm">{val}: </span>
          <span className="text-xs text-slate-700">{row.entityName}</span>
        </div>
      ),
    },
    {
      title: 'Changed By User',
      key: 'user',
      render: (user) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-900">{user?.displayName || user?.email}</div>
          <div className="text-[10px] text-slate-400 font-mono">{user?.email}</div>
        </div>
      ),
    },
    {
      title: 'Timestamp',
      key: 'timestamp',
      render: (val) => (
        <span className="text-xs text-slate-500 font-mono">{formatDateTime(val)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Administrative Activity Audit Log"
        subtitle="Immutable audit trail of all platform mutations, price alterations, order transitions, and staff modifications (Requirement #40)."
      >
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadLogs}>
          Refresh Logs
        </Button>
      </AdminPageHeader>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-brand-500"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={filtered}
        isLoading={loading}
        emptyMessage="No activity logs recorded yet."
      />
    </div>
  );
};
