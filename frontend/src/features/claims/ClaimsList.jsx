import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Form, Button, ButtonGroup, Stack } from 'react-bootstrap';
import { api } from '../../services/apiClient';
import Loader from '../../shared/Loader';
import StatusBadge from '../../shared/StatusBadge';
import DataTable from '../../shared/DataTable';

const formatMoney = (n) => (n == null ? '–' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n));

export default function ClaimsList() {
  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (status) params.set('status', status);
    api.get(`/claims?${params}`)
      .then((res) => {
        setClaims(res.claims || []);
        setTotal(res.total || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, status]);

  const columns = [
    { key: 'claimNumber', label: 'Claim #', render: (v, row) => <Link to={`/claims/${row._id}`} className="text-decoration-none fw-semibold" style={{ color: 'var(--accent)' }}>{v}</Link> },
    { key: 'policyId', label: 'Policy', render: (v) => v?.policyNumber || v || '–' },
    { key: 'claimAmount', label: 'Amount', render: (v) => formatMoney(v) },
    { key: 'approvedAmount', label: 'Approved', render: (v) => formatMoney(v) },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <>
      <Stack direction="horizontal" className="mb-3 flex-wrap" gap={2}>
        <h1 className="page-heading mb-0 me-auto">Claims</h1>
        <Button as={Link} to="/claims/new" variant="primary">New claim</Button>
      </Stack>
      <Stack direction="horizontal" gap={2} className="mb-3 align-items-center">
        <Form.Label className="mb-0 text-muted small">Status:</Form.Label>
        <Form.Select size="sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">All</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="IN_REVIEW">In review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SETTLED">Settled</option>
        </Form.Select>
      </Stack>
      {error && <div className="text-danger small mb-2">{error}</div>}
      {loading ? <Loader /> : (
        <>
          <Card>
            <Card.Body className="p-0">
              <DataTable columns={columns} data={claims} keyField="_id" emptyMessage="No claims" />
            </Card.Body>
          </Card>
          {total > 20 && (
            <ButtonGroup size="sm" className="mt-2">
              <Button variant="outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline-secondary" disabled className="px-3">Page {page}</Button>
              <Button variant="outline-secondary" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </ButtonGroup>
          )}
        </>
      )}
    </>
  );
}
