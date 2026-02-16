import { useState, useEffect } from 'react';
import { Card, Alert, Button, Modal, Form, Stack } from 'react-bootstrap';
import { api } from '../../services/apiClient';
import Loader from '../../shared/Loader';
import DataTable from '../../shared/DataTable';

const ROLES = ['UNDERWRITER', 'CLAIMS_ADJUSTER', 'REINSURANCE_MANAGER', 'ADMIN'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'UNDERWRITER', status: 'ACTIVE' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadUsers = () => {
    api.get('/users')
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setError('');
    setFormData({ username: '', email: '', password: '', role: 'UNDERWRITER', status: 'ACTIVE' });
    setShowCreate(true);
  };

  const openEdit = (user) => {
    setError('');
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.role || 'UNDERWRITER',
      status: user.status || 'ACTIVE',
    });
    setShowEdit(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    try {
      await api.post('/users/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        status: formData.status,
      });
      setShowCreate(false);
      loadUsers();
    } catch (err) {
      setError(err.body?.message || err.message || 'Failed to create user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitLoading(true);
    setError('');
    try {
      const body = { username: formData.username, email: formData.email, role: formData.role, status: formData.status };
      if (formData.password) body.password = formData.password;
      await api.patch(`/users/${editingUser._id}`, body);
      setShowEdit(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setError(err.body?.message || err.message || 'Failed to update user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <Button variant="outline-primary" size="sm" onClick={() => openEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <Stack direction="horizontal" className="mb-3 flex-wrap" gap={2}>
        <h1 className="page-heading mb-0 me-auto">Users</h1>
        <Button variant="primary" onClick={openCreate}>Create user</Button>
      </Stack>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {loading ? <Loader /> : (
        <Card>
          <Card.Body className="p-0">
            <DataTable columns={columns} data={Array.isArray(users) ? users : []} keyField="_id" emptyMessage="No users" />
          </Card.Body>
        </Card>
      )}

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create user</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username *</Form.Label>
              <Form.Control value={formData.username} onChange={(e) => setFormData((f) => ({ ...f, username: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control type="email" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password *</Form.Label>
              <Form.Control type="password" value={formData.password} onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select value={formData.role} onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value }))}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitLoading}>{submitLoading ? 'Creating…' : 'Create'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEdit} onHide={() => { setShowEdit(false); setEditingUser(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit user</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username *</Form.Label>
              <Form.Control value={formData.username} onChange={(e) => setFormData((f) => ({ ...f, username: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control type="email" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New password (leave blank to keep)</Form.Label>
              <Form.Control type="password" value={formData.password} onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))} placeholder="Optional" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select value={formData.role} onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value }))}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value }))}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => { setShowEdit(false); setEditingUser(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitLoading}>{submitLoading ? 'Updating…' : 'Update'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
