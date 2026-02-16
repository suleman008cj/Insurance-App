import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button } from 'react-bootstrap';
import { api } from '../../services/apiClient';

export default function ClaimCreateForm() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [policyId, setPolicyId] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadPolicies, setLoadPolicies] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/policies?status=ACTIVE&limit=500')
      .then((res) => setPolicies(res.policies || []))
      .catch(() => setPolicies([]))
      .finally(() => setLoadPolicies(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/claims', {
        policyId,
        claimAmount: Number(claimAmount),
        incidentDate: incidentDate || undefined,
        reportedDate: reportedDate || undefined,
        remarks: remarks || undefined,
      });
      if (res.fraudFlags?.length) setError(`Claim created. Fraud flags: ${res.fraudFlags.join(', ')}`);
      navigate(`/claims/${res.claim._id}`);
    } catch (err) {
      setError(err.body?.message || err.message || 'Failed to create claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button as={Link} to="/claims" variant="outline-secondary" size="sm" className="mb-3">← Back to claims</Button>
      <h1 className="page-heading">New claim</h1>
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Policy *</Form.Label>
              <Form.Select value={policyId} onChange={(e) => setPolicyId(e.target.value)} required disabled={loadPolicies}>
                <option value="">Select policy</option>
                {policies.map((p) => (
                  <option key={p._id} value={p._id}>{p.policyNumber} – {p.insuredName} (₹{p.sumInsured?.toLocaleString()})</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Claim amount (₹) *</Form.Label>
              <Form.Control type="number" min={0} step={0.01} value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Incident date</Form.Label>
              <Form.Control type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reported date</Form.Label>
              <Form.Control type="date" value={reportedDate} onChange={(e) => setReportedDate(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control as="textarea" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </Form.Group>
            {error && <div className="text-danger small mb-2">{error}</div>}
            <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Creating…' : 'Create claim'}</Button>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
}
