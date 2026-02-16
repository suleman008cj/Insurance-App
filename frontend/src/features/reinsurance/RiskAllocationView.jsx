import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Table, Alert } from 'react-bootstrap';
import { api } from '../../services/apiClient';
import Loader from '../../shared/Loader';

const formatMoney = (n) => (n == null ? '–' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n));

export default function RiskAllocationView() {
  const { policyId } = useParams();
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/risk-allocations/policy/${policyId}`)
      .then(setAllocation)
      .catch((e) => {
        if (e.status === 404) setAllocation(null);
        else setError(e.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [policyId]);

  const recalculate = async () => {
    setRecalcLoading(true);
    setError('');
    try {
      const res = await api.post(`/risk-allocations/policy/${policyId}/recalculate`);
      setAllocation(res.allocation || null);
      if (res.message) setError(res.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setRecalcLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button as={Link} to={`/policies/${policyId}`} variant="outline-secondary" size="sm">← Back to policy</Button>
        <Button variant="primary" size="sm" disabled={recalcLoading} onClick={recalculate}>
          {recalcLoading ? 'Recalculating…' : 'Recalculate'}
        </Button>
      </div>
      <h1 className="page-heading">Risk allocation</h1>
      {error && <Alert variant="info" className="py-2 small">{error}</Alert>}
      {!allocation ? (
        <Card>
          <Card.Body className="text-center text-muted py-4">
            No risk allocation for this policy (e.g. sum insured below threshold or no active treaties).
          </Card.Body>
        </Card>
      ) : (
        <>
          <Card className="mb-3">
            <Card.Header className="bg-transparent fw-semibold">Allocation summary</Card.Header>
            <Card.Body>
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="p-3 rounded border bg-light">
                    <small className="text-muted d-block">Retained (insurer)</small>
                    <span className="fw-bold fs-5">{formatMoney(allocation.retainedAmount)}</span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 rounded border bg-light">
                    <small className="text-muted d-block">Ceded (reinsurers)</small>
                    <span className="fw-bold fs-5">
                      {formatMoney((allocation.allocations || []).reduce((s, a) => s + (a.allocatedAmount || 0), 0))}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 rounded border bg-light">
                    <small className="text-muted d-block">Total exposure</small>
                    <span className="fw-bold fs-5">
                      {formatMoney((allocation.retainedAmount || 0) + (allocation.allocations || []).reduce((s, a) => s + (a.allocatedAmount || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
              <p className="small text-muted mb-0 mt-2">Calculated at {allocation.calculatedAt ? new Date(allocation.calculatedAt).toLocaleString() : '–'}</p>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header className="bg-transparent fw-semibold">Allocation table</Card.Header>
            <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Reinsurer</th>
                  <th>Treaty</th>
                  <th>Allocated amount</th>
                  <th>Share %</th>
                </tr>
              </thead>
              <tbody>
                {(allocation.allocations || []).map((a, i) => (
                  <tr key={i}>
                    <td>{a.reinsurerId?.name || a.reinsurerId?.code || a.reinsurerId || '–'}</td>
                    <td>{a.treatyId?.treatyName || a.treatyId || '–'}</td>
                    <td>{formatMoney(a.allocatedAmount)}</td>
                    <td>{a.allocatedPercentage != null ? `${a.allocatedPercentage}%` : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
}
