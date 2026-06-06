import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Building2,
  History,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import Dashboard from './Dashboard';
import Clientes from './Clientes';
import Usuarios from './Usuarios';
import AuditLog from './AuditLog';

type SuperAdminPage = 'dashboard' | 'clientes' | 'usuarios' | 'audit-log';

interface NavItem {
  id: SuperAdminPage;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'clientes', label: 'Clientes', icon: <Building2 className="h-5 w-5" /> },
  { id: 'usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
  { id: 'audit-log', label: 'Audit Log', icon: <History className="h-5 w-5" /> },
];

export default function SuperAdminApp() {
  const [activePage, setActivePage] = useState<SuperAdminPage>('dashboard');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pageTitle: Record<SuperAdminPage, string> = {
    dashboard: 'Dashboard',
    clientes: 'Clientes',
    usuarios: 'Usuários',
    'audit-log': 'Audit Log',
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-2xl">⚡</div>
            <h1 className="text-lg font-bold">MaxiAdmin</h1>
          </div>
          <Badge className="bg-violet-600 text-white">SUPERADMIN</Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activePage === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {activePage === item.id && <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <h2 className="text-xl font-semibold text-slate-900">
            {pageTitle[activePage]}
          </h2>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {activePage === 'dashboard' && <Dashboard />}
            {activePage === 'clientes' && <Clientes />}
            {activePage === 'usuarios' && <Usuarios />}
            {activePage === 'audit-log' && <AuditLog />}
          </div>
        </div>
      </main>
    </div>
  );
}
