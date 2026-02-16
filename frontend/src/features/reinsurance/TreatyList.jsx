import { useState, useEffect } from 'react';
import { Card, Alert, Button, Modal, Form, Stack } from 'react-bootstrap';
import { api } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../shared/Loader';
import StatusBadge from '../../shared/StatusBadge';
import DataTable from '../../shared/DataTable';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '–');
const TREATY_TYPES = ['QUOTA_SHARE', 'SURPLUS'];
const LOB_OPTIONS = ['HEALTH', 'MOTOR', 'LIFE', 'PROPERTY'];

export default function TreatyList() {
  const { user } = useAuth();
  const [treaties, setTreaties] = useState([]);
  const [reinsurers, setReinsurers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    treatyName: '',
    treatyType: 'QUOTA_SHARE',
    reinsurerId: '',
    sharePercentage: 0,
    retentionLimit: '',
    treatyLimit: '',
    applicableLOBs: ['HEALTH', 'MOTOR'],
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: '',
    status: 'ACTIVE',
  });

  const canCreateTreaty = user?.role === 'REINSURANCE_MANAGER' || user?.role === 'ADMIN';

  const loadTreaties = () => {
    api.get('/treaties')
      .then(setTreaties)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTreaties();
  }, []);

  useEffect(() => {
    if (showCreate) {
      api.get('/reinsurers').then(setReinsurers).catch(() => setReinsurers([]));
    }
  }, [showCreate]);

  const openCreate = () => {
    setError('');
    setFormData({
      treatyName: '',
      treatyType: 'QUOTA_SHARE',
      reinsurerId: '',
      sharePercentage: 0,
      retentionLimit: '',
      treatyLimit: '',
      applicableLOBs: ['HEALTH', 'MOTOR'],
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: '',
      status: 'ACTIVE',
    });
    setShowCreate(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    try {
      await api.post('/treaties', {
        treatyName: formData.treatyName,
        treatyType: formData.treatyType,
        reinsurerId: formData.reinsurerId,
        sharePercentage: Number(formData.sharePercentage) || 0,
        retentionLimit: formData.retentionLimit ? Number(formData.retentionLimit) : undefined,
        treatyLimit: formData.treatyLimit ? Number(formData.treatyLimit) : undefined,
        applicableLOBs: Array.isArray(formData.applicableLOBs) ? formData.applicableLOBs : ['HEALTH', 'MOTOR'],
        effectiveFrom: formData.effectiveFrom || undefined,
        effectiveTo: formData.effectiveTo || undefined,
        status: formData.status,
      });
      setShowCreate(false);
      loadTreaties();
    } catch (err) {
      setError(err.body?.message || err.message || 'Failed to create treaty');
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleLOB = (lob) => {
    const current = Array.isArray(formData.applicableLOBs) ? formData.applicableLOBs : [];
    const next = current.includes(lob) ? current.filter((x) => x !== lob) : [...current, lob];
    setFormData((f) => ({ ...f, applicableLOBs: next.length ? next : ['HEALTH', 'MOTOR'] }));
  };

  const columns = [
    { key: 'treatyName', label: 'Treaty' },
    { key: 'treatyType', label: 'Type' },
    { key: 'reinsurerId', label: 'Reinsurer', render: (v) => v?.name || v?.code || '–' },
    { key: 'sharePercentage', label: 'Share %', render: (v) => v != null ? `${v}%` : '–' },
    { key: 'treatyLimit', label: 'Limit', render: (v) => v != null ? v.toLocaleString() : '–' },
    { key: 'applicableLOBs', label: 'LOBs', render: (v) => Array.isArray(v) ? v.join(', ') : '–' },
    { key: 'effectiveFrom', label: 'From', render: (v) => formatDate(v) },
    { key: 'effectiveTo', label: 'To', render: (v) => formatDate(v) },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <>
      <Stack direction="horizontal" className="mb-3 flex-wrap" gap={2}>
        <h1 className="page-heading mb-0 me-auto">Treaties</h1>
        {canCreateTreaty && <Button variant="primary" onClick={openCreate}>Create treaty</Button>}
      </Stack>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Loader /> : (
        <Card>
          <Card.Body className="p-0">
            <DataTable columns={columns} data={Array.isArray(treaties) ? treaties : []} keyField="_id" emptyMessage="No treaties" />
          </Card.Body>
        </Card>
      )}

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create treaty</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Treaty name *</Form.Label>
              <Form.Control value={formData.treatyName} onChange={(e) => setFormData((f) => ({ ...f, treatyName: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Treaty type *</Form.Label>
              <Form.Select value={formData.treatyType} onChange={(e) => setFormData((f) => ({ ...f, treatyType: e.target.value }))}>
                {TREATY_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reinsurer *</Form.Label>
              <Form.Select value={formData.reinsurerId} onChange={(e) => setFormData((f) => ({ ...f, reinsurerId: e.target.value }))} required>
                <option value="">Select reinsurer</option>
                {reinsurers.map((r) => <option key={r._id} value={r._id}>{r.name} ({r.code})</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Share %</Form.Label>
              <Form.Control type="number" min={0} max={100} step={0.01} value={formData.sharePercentage} onChange={(e) => setFormData((f) => ({ ...f, sharePercentage: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Retention limit (₹)</Form.Label>
              <Form.Control type="number" min={0} value={formData.retentionLimit} onChange={(e) => setFormData((f) => ({ ...f, retentionLimit: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Treaty limit (₹)</Form.Label>
              <Form.Control type="number" min={0} value={formData.treatyLimit} onChange={(e) => setFormData((f) => ({ ...f, treatyLimit: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Applicable LOBs</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {LOB_OPTIONS.map((lob) => (
                  <Form.Check key={lob} type="checkbox" id={`lob-${lob}`} label={lob} checked={(formData.applicableLOBs || []).includes(lob)} onChange={() => toggleLOB(lob)} />
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Effective from</Form.Label>
              <Form.Control type="date" value={formData.effectiveFrom} onChange={(e) => setFormData((f) => ({ ...f, effectiveFrom: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Effective to</Form.Label>
              <Form.Control type="date" value={formData.effectiveTo} onChange={(e) => setFormData((f) => ({ ...f, effectiveTo: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="EXPIRED">EXPIRED</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitLoading}>{submitLoading ? 'Creating…' : 'Create treaty'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
