import { NavLink } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/policies', label: 'Policies' },
  { to: '/claims', label: 'Claims' },
  { to: '/treaties', label: 'Treaties' },
  { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <aside className="sidebar-wrap">
      <div className="sidebar-brand">Insurance Portal</div>
      <Nav className="sidebar-nav flex-column">
        {nav.map((item) => {
          if (item.roles && (!role || !item.roles.includes(role))) return null;
          return (
            <Nav.Link
              key={item.to}
              as={NavLink}
              to={item.to}
              end={item.to === '/'}
            >
              {item.label}
            </Nav.Link>
          );
        })}
      </Nav>
    </aside>
  );
}
