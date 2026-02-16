import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Form, Button, Stack, Row, Col, Alert } from 'react-bootstrap';
import { api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../shared/Loader';
import StatusBadge from '../../shared/StatusBadge';

const formatMoney = (n) => (n == null ? '–' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '–');

const NEXT_STATUS = {
  SUBMITTED: ['IN_REVIEW'],
  IN_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['SETTLED'],
  REJECTED: [],
  SETTLED: [],
};

export default function ClaimDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  const canAdjust = ['CLAIMS_ADJUSTER', 'ADMIN'].includes(user?.role);
  const nextOptions = NEXT_STATUS[claim?.status] || [];

  useEffect(() => {
    api.get(`/claims/${id}`)
      .then((c) => {
        setClaim(c);
        setApprovedAmount(c.approvedAmount != null ? String(c.approvedAmount) : (c.claimAmount != null ? String(c.claimAmount) : ''));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setActionLoading(true);
    setError('');
    try {
      const body = { status: newStatus };
      if (remarks) body.remarks = remarks;
      if (newStatus === 'APPROVED' || newStatus === 'SETTLED') body.approvedAmount = approvedAmount ? Number(approvedAmount) : claim.claimAmount;
      const res = await api.patch(`/claims/${id}/status`, body);
      setClaim(res.claim);
      setNewStatus('');
    } catch (err) {
      setError(err.body?.message || err.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error && !claim) return <Alert variant="danger">{error}</Alert>;
  if (!claim) return null;

  const displaySteps = claim.status === 'REJECTED'
    ? ['SUBMITTED', 'IN_REVIEW', 'REJECTED']
    : ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'SETTLED'];

  const fields = [
    ['Status', <StatusBadge status={claim.status} />],
    ['Policy', claim.policyId?.policyNumber ? <Link to={`/policies/${claim.policyId._id || claim.policyId}`} className="text-decoration-none" style={{ color: 'var(--accent)' }}>{claim.policyId.policyNumber}</Link> : claim.policyId],
    ['Claim amount', formatMoney(claim.claimAmount)],
    ['Approved amount', formatMoney(claim.approvedAmount)],
    ['Incident date', formatDate(claim.incidentDate)],
    ['Reported date', formatDate(claim.reportedDate)],
    ['Handled by', claim.handledBy?.username || '–'],
    ['Remarks', claim.remarks || '–'],
  ];

  return (
    <>
      <Button as={Link} to="/claims" variant="outline-secondary" size="sm" className="mb-3">← Back to claims</Button>
      <h1 className="page-heading">{claim.claimNumber}</h1>
      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
      <Card className="mb-3">
        <Card.Header className="bg-transparent fw-semibold">Claim lifecycle</Card.Header>
        <Card.Body className="pt-2">
          <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3">
            {displaySteps.map((step, i) => {
              const stepIndex = displaySteps.indexOf(step);
              const currentIndex = displaySteps.indexOf(claim.status);
              const reached = currentIndex >= stepIndex;
              const isRejected = step === 'REJECTED';
              return (
                <div key={step} className="d-flex align-items-center">
                  <span
                    className={`badge ${reached ? 'bg-primary' : 'bg-secondary'} opacity-75`}
                    style={reached ? { backgroundColor: isRejected ? 'var(--danger)' : 'var(--accent)' } : {}}
                  >
                    {step.replace('_', ' ')}
                  </span>
                  {i < displaySteps.length - 1 && <span className="text-muted mx-1">→</span>}
                </div>
              );
            })}
          </div>
          <p className="small text-muted mt-2 mb-0">Created {claim.createdAt ? new Date(claim.createdAt).toLocaleString() : '–'} · Updated {claim.updatedAt ? new Date(claim.updatedAt).toLocaleString() : '–'}</p>
        </Card.Body>
      </Card>
      <Card className="mb-3">
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
      {canAdjust && nextOptions.length > 0 && (
        <Card>
          <Card.Header className="bg-transparent fw-semibold">Update status</Card.Header>
          <Card.Body>
            <Form onSubmit={handleStatusUpdate}>
              <Form.Group className="mb-3">
                <Form.Label>New status</Form.Label>
                <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required>
                  <option value="">Select…</option>
                  {nextOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </Form.Group>
              {(newStatus === 'APPROVED' || newStatus === 'SETTLED') && (
                <Form.Group className="mb-3">
                  <Form.Label>Approved amount (₹)</Form.Label>
                  <Form.Control type="number" min={0} value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Remarks</Form.Label>
                <Form.Control as="textarea" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </Form.Group>
              <Button type="submit" variant="primary" disabled={actionLoading}>{actionLoading ? 'Updating…' : 'Update'}</Button>
            </Form>
          </Card.Body>
        </Card>
      )}
    </>
  );
}
