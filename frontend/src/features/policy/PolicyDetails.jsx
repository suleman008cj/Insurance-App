import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Stack, Row, Col, Alert } from 'react-bootstrap';
import { api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../shared/Loader';
import StatusBadge from '../../shared/StatusBadge';

const formatMoney = (n) => (n == null ? '–' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '–');

export default function PolicyDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const canApprove = ['UNDERWRITER', 'ADMIN'].includes(user?.role);

  useEffect(() => {
    api.get(`/policies/${id}`)
      .then(setPolicy)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const doAction = async (action) => {
    setActionLoading(true);
    try {
      await api.post(`/policies/${id}/${action}`);
      const updated = await api.get(`/policies/${id}`);
      setPolicy(updated);
    } catch (e) {
      setError(e.body?.message || e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error && !policy) return <Alert variant="danger">{error}</Alert>;
  if (!policy) return null;

  const fields = [
    ['Status', <StatusBadge status={policy.status} />],
    ['Insured', policy.insuredName],
    ['Type', policy.insuredType],
    ['Line of business', policy.lineOfBusiness],
    ['Sum insured', formatMoney(policy.sumInsured)],
    ['Premium', formatMoney(policy.premium)],
    ['Retention limit', formatMoney(policy.retentionLimit)],
    ['Effective from', formatDate(policy.effectiveFrom)],
    ['Effective to', formatDate(policy.effectiveTo)],
    ['Created by', policy.createdBy?.username || '–'],
    ['Approved by', policy.approvedBy?.username || '–'],
  ];

  return (
    <>
      <Stack direction="horizontal" className="mb-3 flex-wrap" gap={2}>
        <h1 className="page-heading mb-0 me-auto">{policy.policyNumber}</h1>
        <Button as={Link} to="/policies" variant="outline-secondary" size="sm">Back to list</Button>
        <Button as={Link} to={`/policies/${id}/allocations`} variant="outline-secondary" size="sm">Risk allocation</Button>
        {canApprove && policy.status === 'DRAFT' && (
          <>
            <Button variant="primary" size="sm" disabled={actionLoading} onClick={() => doAction('approve')}>Approve</Button>
            <Button variant="danger" size="sm" disabled={actionLoading} onClick={() => doAction('reject')}>Reject</Button>
          </>
        )}
        {canApprove && policy.status === 'ACTIVE' && (
          <Button variant="outline-warning" size="sm" disabled={actionLoading} onClick={() => doAction('suspend')}>Suspend</Button>
        )}
      </Stack>
      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
      <Card>
        <Card.Body>
          <Row xs={1} md={2}>
            {fields.map(([label, value]) => (
              <Col key={label} className="mb-2">
                <small className="text-muted d-block">{label}</small>
                <span>{value}</span>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </>
  );
}
