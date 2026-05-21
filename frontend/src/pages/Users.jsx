import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, X, Trash2 } from 'lucide-react';
import Pagination from '../components/Pagination';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset page if users change
  useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/users/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const currentUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>User Management</h2>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>ID</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Full Name</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Email</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>#{user.id}</td>
                <td style={{ padding: '16px', fontWeight: '500' }}>{user.full_name}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{user.email}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    backgroundColor: user.status === 'Active' ? '#d1fae5' : user.status === 'Requested' ? '#fef3c7' : '#fee2e2',
                    color: user.status === 'Active' ? '#065f46' : user.status === 'Requested' ? '#92400e' : '#991b1b'
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {user.status === 'Requested' && (
                      <button onClick={() => handleUpdateStatus(user.id, 'Active')} title="Approve" style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: '#d1fae5', color: '#065f46' }}>
                        <Check size={16} />
                      </button>
                    )}
                    {user.status === 'Active' && (
                      <button onClick={() => handleUpdateStatus(user.id, 'Inactive')} title="Deactivate" style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef3c7', color: '#92400e' }}>
                        <X size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(user.id)} title="Delete" style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default Users;
