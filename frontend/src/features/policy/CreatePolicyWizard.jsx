import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button, Stack, ProgressBar } from 'react-bootstrap';
import { api } from '../../services/apiClient';

const STEPS = ['General', 'Coverage', 'Review'];
const LOB = ['HEALTH', 'MOTOR', 'LIFE', 'PROPERTY'];
const INSURED_TYPE = ['INDIVIDUAL', 'CORPORATE'];

export default function CreatePolicyWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    insuredName: '',
    insuredType: 'INDIVIDUAL',
    lineOfBusiness: 'HEALTH',
    sumInsured: '',
    premium: '',
    retentionLimit: '',
    effectiveFrom: '',
    effectiveTo: '',
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/policies', {
        insuredName: form.insuredName,
        insuredType: form.insuredType,
        lineOfBusiness: form.lineOfBusiness,
        sumInsured: Number(form.sumInsured),
        premium: Number(form.premium),
        retentionLimit: form.retentionLimit ? Number(form.retentionLimit) : undefined,
        effectiveFrom: form.effectiveFrom || undefined,
        effectiveTo: form.effectiveTo || undefined,
      });
      navigate(`/policies/${res.policy._id}`);
    } catch (err) {
      setError(err.body?.message || err.message || 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button as={Link} to="/policies" variant="outline-secondary" size="sm" className="mb-3">← Back to policies</Button>
      <h1 className="page-heading">New policy – {STEPS[step]}</h1>
      <ProgressBar now={((step + 1) / STEPS.length) * 100} className="mb-4" style={{ height: 6, backgroundColor: 'var(--card-border)' }} />
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {step === 0 && (
              <Stack gap={3}>
                <Form.Group>
                  <Form.Label>Insured name *</Form.Label>
                  <Form.Control value={form.insuredName} onChange={(e) => update('insuredName', e.target.value)} required />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Insured type</Form.Label>
                  <Form.Select value={form.insuredType} onChange={(e) => update('insuredType', e.target.value)}>
                    {INSURED_TYPE.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Line of business</Form.Label>
                  <Form.Select value={form.lineOfBusiness} onChange={(e) => update('lineOfBusiness', e.target.value)}>
                    {LOB.map((l) => <option key={l} value={l}>{l}</option>)}
                  </Form.Select>
                </Form.Group>
              </Stack>
            )}
            {step === 1 && (
              <Stack gap={3}>
                <Form.Group>
                  <Form.Label>Sum insured (₹) *</Form.Label>
                  <Form.Control type="number" min={1} value={form.sumInsured} onChange={(e) => update('sumInsured', e.target.value)} required />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Premium (₹) *</Form.Label>
                  <Form.Control type="number" min={0} step={0.01} value={form.premium} onChange={(e) => update('premium', e.target.value)} required />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Retention limit (₹)</Form.Label>
                  <Form.Control type="number" min={0} value={form.retentionLimit} onChange={(e) => update('retentionLimit', e.target.value)} />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Effective from</Form.Label>
                  <Form.Control type="date" value={form.effectiveFrom} onChange={(e) => update('effectiveFrom', e.target.value)} />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Effective to</Form.Label>
                  <Form.Control type="date" value={form.effectiveTo} onChange={(e) => update('effectiveTo', e.target.value)} />
                </Form.Group>
              </Stack>
            )}
            {step === 2 && (
              <div className="small">
                <p className="mb-1"><strong>Insured:</strong> {form.insuredName} ({form.insuredType})</p>
                <p className="mb-1"><strong>LOB:</strong> {form.lineOfBusiness}</p>
                <p className="mb-1"><strong>Sum insured:</strong> ₹{form.sumInsured}</p>
                <p className="mb-1"><strong>Premium:</strong> ₹{form.premium}</p>
                <p className="mb-0"><strong>Effective:</strong> {form.effectiveFrom || '–'} to {form.effectiveTo || '–'}</p>
              </div>
            )}
            {error && <div className="text-danger small mt-2">{error}</div>}
            <Stack direction="horizontal" gap={2} className="mt-4">
              {step > 0 && <Button type="button" variant="outline-secondary" onClick={() => setStep((s) => s - 1)}>Previous</Button>}
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Creating…' : step < STEPS.length - 1 ? 'Next' : 'Create policy'}
              </Button>
            </Stack>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
}
