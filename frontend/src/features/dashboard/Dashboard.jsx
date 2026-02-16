import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Table, Alert, Stack, Form } from 'react-bootstrap';
import { api } from '../../services/apiClient';
import Loader from '../../shared/Loader';

const formatMoney = (n) => (n == null ? '–' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n));

const LOB_OPTIONS = ['', 'HEALTH', 'MOTOR', 'LIFE', 'PROPERTY'];

export default function Dashboard() {
  const [data, setData] = useState({ exposure: [], claimsRatio: null, distribution: [], trends: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lobFilter, setLobFilter] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/exposure-by-policy-type').catch(() => []),
      api.get('/dashboard/claims-ratio').catch(() => null),
      api.get('/dashboard/reinsurer-risk-distribution').catch(() => []),
      api.get('/dashboard/loss-ratio-trends?months=6').catch(() => []),
    ]).then(([exposure, claimsRatio, distribution, trends]) => {
      setData({
        exposure: Array.isArray(exposure) ? exposure : [],
        claimsRatio,
        distribution: Array.isArray(distribution) ? distribution : [],
        trends: Array.isArray(trends) ? trends : [],
      });
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const filteredExposure = useMemo(() => {
    if (!lobFilter) return data.exposure;
    return data.exposure.filter((x) => x._id === lobFilter);
  }, [data.exposure, lobFilter]);

  const maxExposure = useMemo(() => {
    if (filteredExposure.length === 0) return 1;
    return Math.max(...filteredExposure.map((x) => x.totalExposure || 0), 1);
  }, [filteredExposure]);

  if (loading) return <Loader />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="page-heading mb-0">Dashboard</h1>
        <Form.Select size="sm" value={lobFilter} onChange={(e) => setLobFilter(e.target.value)} style={{ width: 160 }}>
          {LOB_OPTIONS.map((lob) => (
            <option key={lob} value={lob}>{lob || 'All LOBs'}</option>
          ))}
        </Form.Select>
      </div>
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-transparent border-bottom fw-semibold d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>Exposure by policy type</span>
            </Card.Header>
            <Card.Body>
              {filteredExposure.length === 0 ? (
                <p className="text-muted mb-0">No data</p>
              ) : (
                <>
                  <div className="mb-2" style={{ minHeight: 140 }}>
                    {filteredExposure.map((x) => (
                      <div key={x._id} className="mb-2">
                        <div className="d-flex justify-content-between small mb-1">
                          <span>{x._id}</span>
                          <span className="fw-semibold">{formatMoney(x.totalExposure)}</span>
                        </div>
                        <div className="rounded overflow-hidden" style={{ height: 20, backgroundColor: 'var(--card-border)' }}>
                          <div
                            className="h-100 rounded"
                            style={{
                              width: `${Math.round((100 * (x.totalExposure || 0)) / maxExposure)}%`,
                              backgroundColor: 'var(--accent)',
                              minWidth: 4,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Stack gap={1}>
                    {filteredExposure.map((x) => (
                      <div key={x._id} className="d-flex justify-content-between align-items-center py-1">
                        <span>{x._id}</span>
                        <span className="fw-semibold">{formatMoney(x.totalExposure)}</span>
                      </div>
                    ))}
                  </Stack>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header className="bg-transparent border-bottom fw-semibold" style={{ color: 'var(--text-primary)' }}>
              Claims ratio
            </Card.Header>
            <Card.Body>
              {data.claimsRatio ? (
                <>
                  <p className="mb-1 small text-muted">Premium: {formatMoney(data.claimsRatio.totalPremium)} · Claims: {formatMoney(data.claimsRatio.totalClaimsApproved)}</p>
                  <p className="mb-0 fw-bold" style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>{data.claimsRatio.claimsRatioPercent}%</p>
                </>
              ) : (
                <p className="text-muted mb-0">No data</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Card>
        <Card.Header className="bg-transparent border-bottom fw-semibold" style={{ color: 'var(--text-primary)' }}>
          Reinsurer risk distribution
        </Card.Header>
        <Card.Body>
          {data.distribution.length === 0 ? (
            <p className="text-muted mb-0">No allocations yet</p>
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Reinsurer</th>
                  <th>Code</th>
                  <th>Allocated</th>
                  <th>Policies</th>
                </tr>
              </thead>
              <tbody>
                {data.distribution.map((d) => (
                  <tr key={d._id}>
                    <td>{d.reinsurerName || '–'}</td>
                    <td>{d.reinsurerCode || '–'}</td>
                    <td>{formatMoney(d.totalAllocated)}</td>
                    <td>{d.policyCount}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      <Stack direction="horizontal" gap={2} className="mt-3">
        <Link to="/policies" className="text-decoration-none" style={{ color: 'var(--accent)', fontWeight: 500 }}>View policies</Link>
        <span className="text-muted">·</span>
        <Link to="/claims" className="text-decoration-none" style={{ color: 'var(--accent)', fontWeight: 500 }}>View claims</Link>
        <span className="text-muted">·</span>
        <Link to="/treaties" className="text-decoration-none" style={{ color: 'var(--accent)', fontWeight: 500 }}>View treaties</Link>
      </Stack>
    </>
  );
}
