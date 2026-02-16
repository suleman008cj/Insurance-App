import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, Stack, Alert } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';
import AppShell from './layout/AppShell';
import LoginPage from './features/auth/LoginPage';
import Dashboard from './features/dashboard/Dashboard';
import PolicyList from './features/policy/PolicyList';
import PolicyDetails from './features/policy/PolicyDetails';
import CreatePolicyWizard from './features/policy/CreatePolicyWizard';
import ClaimsList from './features/claims/ClaimsList';
import ClaimDetails from './features/claims/ClaimDetails';
import ClaimCreateForm from './features/claims/ClaimCreateForm';
import TreatyList from './features/reinsurance/TreatyList';
import RiskAllocationView from './features/reinsurance/RiskAllocationView';
import UserList from './features/admin/UserList';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <Stack direction="horizontal" gap={2}>
          <Spinner animation="border" size="sm" style={{ color: 'var(--accent)' }} />
          <span className="text-muted">Loading…</span>
        </Stack>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && roles.length && !roles.includes(user.role)) {
    return (
      <div className="content-wrap p-4">
        <Alert variant="warning">Access denied. Required role: {roles.join(' or ')}.</Alert>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="policies" element={<PolicyList />} />
        <Route path="policies/new" element={<ProtectedRoute roles={['UNDERWRITER', 'ADMIN']}><CreatePolicyWizard /></ProtectedRoute>} />
        <Route path="policies/:id" element={<PolicyDetails />} />
        <Route path="claims" element={<ClaimsList />} />
        <Route path="claims/new" element={<ProtectedRoute roles={['CLAIMS_ADJUSTER', 'ADMIN']}><ClaimCreateForm /></ProtectedRoute>} />
        <Route path="claims/:id" element={<ClaimDetails />} />
        <Route path="treaties" element={<TreatyList />} />
        <Route path="policies/:policyId/allocations" element={<RiskAllocationView />} />
        <Route path="admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserList /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
