import { Badge } from 'react-bootstrap';

export default function StatusBadge({ status }) {
  const k = (status || '').toLowerCase().replace(/\s/g, '_');
  const customClass = ['draft', 'active', 'suspended', 'expired', 'submitted', 'in_review', 'approved', 'rejected', 'settled'].includes(k)
    ? `bg-${k}`
    : null;
  return (
    <Badge bg={customClass ? undefined : 'secondary'} className={customClass || ''}>
      {status || '–'}
    </Badge>
  );
}
