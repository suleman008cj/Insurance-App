import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const labels = {
  '/': 'Dashboard',
  '/policies': 'Policies',
  '/policies/new': 'New Policy',
  '/claims': 'Claims',
  '/claims/new': 'New Claim',
  '/treaties': 'Treaties',
  '/admin/users': 'Users',
};

function getBreadcrumb(pathname, match) {
  if (pathname === match) return labels[match] || match.slice(1);
  if (pathname.startsWith(match + '/')) {
    const rest = pathname.slice(match.length + 1);
    const id = rest.split('/')[0];
    if (match === '/policies' && id !== 'new') return `Policy ${id}`;
    if (match === '/claims' && id !== 'new') return `Claim ${id}`;
    if (match === '/policies' && rest.startsWith('new')) return 'New Policy';
    return id;
  }
  return null;
}

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const pathname = location.pathname;

  let breadcrumbLabel = 'Dashboard';
  let breadcrumbPath = '/';
  for (const path of Object.keys(labels).sort((a, b) => b.length - a.length)) {
    const part = getBreadcrumb(pathname, path);
    if (part) {
      breadcrumbLabel = path === '/' ? part : `${labels[path] || path} / ${part}`;
      breadcrumbPath = path;
      break;
    }
  }
  if (pathname.includes('/allocations')) breadcrumbLabel = 'Risk Allocation';

  return (
    <div className="d-flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom" style={{ minHeight: 56, borderColor: 'var(--card-border)' }}>
      <Breadcrumb className="mb-0">
        <Breadcrumb.Item active style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {breadcrumbLabel}
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className="d-flex align-items-center gap-2">
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {user?.username} <span className="text-uppercase" style={{ fontSize: '0.75rem' }}>({user?.role?.replace('_', ' ')})</span>
        </span>
        <Button variant="outline-secondary" size="sm" onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </Button>
      </div>
    </div>
  );
}
