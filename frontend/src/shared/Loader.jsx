import { Spinner, Stack } from 'react-bootstrap';

export default function Loader() {
  return (
    <Stack direction="horizontal" gap={2} className="justify-content-center py-5">
      <Spinner animation="border" variant="primary" style={{ color: 'var(--accent)' }} />
      <span className="text-muted">Loading…</span>
    </Stack>
  );
}
