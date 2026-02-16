import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Form, Button, ButtonGroup, Stack } from 'react-bootstrap';
import { api } from '../../services/apiClient';
import Loader from '../../shared/Loader';
import StatusBadge from '../../shared/StatusBadge';
import DataTable from '../../shared/DataTable';

const formatMoney = (n) => (n == null ? '–' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n));

export default function PolicyList() {
  const [policies, setPolicies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (status) params.set('status', status);
    api.get(`/policies?${params}`)
      .then((res) => {
        setPolicies(res.policies || []);
        setTotal(res.total || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, status]);

  const columns = [
    { key: 'policyNumber', label: 'Policy #', render: (v, row) => <Link to={`/policies/${row._id}`} className="text-decoration-none fw-semibold" style={{ color: 'var(--accent)' }}>{v}</Link> },
    { key: 'insuredName', label: 'Insured' },
    { key: 'lineOfBusiness', label: 'LOB' },
    { key: 'sumInsured', label: 'Sum insured', render: (v) => formatMoney(v) },
    { key: 'premium', label: 'Premium', render: (v) => formatMoney(v) },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <>
      <Stack direction="horizontal" className="mb-3 flex-wrap" gap={2}>
        <h1 className="page-heading mb-0 me-auto">Policies</h1>
        <Button as={Link} to="/policies/new" variant="primary">New policy</Button>
      </Stack>
      <Stack direction="horizontal" gap={2} className="mb-3 align-items-center">
        <Form.Label className="mb-0 text-muted small">Status:</Form.Label>
        <Form.Select size="sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">All</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="EXPIRED">Expired</option>
        </Form.Select>
      </Stack>
      {error && <div className="text-danger small mb-2">{error}</div>}
      {loading ? <Loader /> : (
        <>
          <Card>
            <Card.Body className="p-0">
              <DataTable columns={columns} data={policies} keyField="_id" emptyMessage="No policies" />
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
