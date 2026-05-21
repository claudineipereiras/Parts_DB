import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Zap, Info } from 'lucide-react';
import Pagination from '../components/Pagination';

const Escooters = () => {
  const [escooters, setEscooters] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedEscooter, setSelectedEscooter] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null, id_brand: '', model: '', description: '', date_launched: '', 
    battery_voltage: '', battery_capacity: '', motor_watt: '', charger_voltage: '', status: 'Active'
  });

  // New Brand State
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [escooters.length]);

  const fetchData = async () => {
    try {
      const [escootersRes, brandsRes] = await Promise.all([
        api.get('/escooters'),
        api.get('/options/brands')
      ]);
      setEscooters(escootersRes.data);
      setBrands(brandsRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Escooter? Parts associated with it will lose their model reference.')) return;
    try {
      await api.delete(`/escooters/${id}`);
      fetchData();
      if (selectedEscooter?.id === id) setSelectedEscooter(null);
    } catch (err) {
      alert('Error deleting Escooter');
    }
  };

  const openModal = (escooter = null) => {
    setShowNewBrand(false);
    setNewBrandName('');
    if (escooter) {
      setIsEditing(true);
      setFormData({
        id: escooter.id,
        id_brand: escooter.id_brand || '',
        model: escooter.model,
        description: escooter.description,
        date_launched: escooter.date_launched ? escooter.date_launched.split('T')[0] : '',
        battery_voltage: escooter.battery_voltage || '',
        battery_capacity: escooter.battery_capacity || '',
        motor_watt: escooter.motor_watt || '',
        charger_voltage: escooter.charger_voltage || '',
        status: escooter.status
      });
    } else {
      setIsEditing(false);
      setFormData({
        id: null, id_brand: '', model: '', description: '', date_launched: '',
        battery_voltage: '', battery_capacity: '', motor_watt: '', charger_voltage: '', status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleCreateBrand = async () => {
    if (!newBrandName) return;
    try {
      const res = await api.post('/brands', { name: newBrandName });
      const newBrand = res.data;
      setBrands([...brands, newBrand]);
      setFormData({ ...formData, id_brand: newBrand.id });
      setShowNewBrand(false);
      setNewBrandName('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating brand');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/escooters/${formData.id}`, formData);
      } else {
        await api.post('/escooters', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving Escooter');
    }
  };

  const totalPages = Math.ceil(escooters.length / itemsPerPage);
  const currentEscooters = escooters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', height: '100%', gap: '24px' }}>
      
      {/* Main Table Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Escooter Management</h2>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus size={18} /> Add Escooter
          </button>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', border: '1px solid var(--border)', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)' }}>Brand</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)' }}>Model</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)' }}>Launch Date</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEscooters.map(item => (
                <tr 
                  key={item.id} 
                  style={{ 
                    borderBottom: '1px solid var(--border)', 
                    cursor: 'pointer',
                    backgroundColor: selectedEscooter?.id === item.id ? '#f0f9ff' : 'transparent'
                  }}
                  onClick={() => setSelectedEscooter(item)}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.brand_name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>{item.model}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.date_launched ? new Date(item.date_launched).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '500',
                      backgroundColor: item.status === 'Active' ? '#d1fae5' : '#fee2e2',
                      color: item.status === 'Active' ? '#065f46' : '#991b1b'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }} style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {escooters.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No escooters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {escooters.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </div>
      </div>

      {/* Right Technical Panel */}
      <div style={{ width: '340px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} className="text-primary" /> Technical Specs
        </div>
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {selectedEscooter ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{selectedEscooter.brand_name} {selectedEscooter.model}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {selectedEscooter.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>BATTERY</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>{selectedEscooter.battery_voltage || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>CAPACITY</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>{selectedEscooter.battery_capacity || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>MOTOR</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>{selectedEscooter.motor_watt || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>CHARGER</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>{selectedEscooter.charger_voltage || '-'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
              <Zap size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
              Select an Escooter from the list to view its technical specifications.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>{isEditing ? 'Edit Escooter' : 'Add New Escooter'}</h3>
            <form onSubmit={handleSubmit}>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Brand</label>
                  {!showNewBrand ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select className="input-field" required value={formData.id_brand} onChange={e => setFormData({...formData, id_brand: e.target.value})}>
                        <option value="">Select Brand</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setShowNewBrand(true)} className="btn-secondary" style={{ padding: '8px 12px' }} title="Create New Brand">
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" className="input-field" placeholder="Brand Name" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} />
                      <button type="button" onClick={handleCreateBrand} className="btn-primary" style={{ padding: '8px 12px' }}>Save</button>
                      <button type="button" onClick={() => setShowNewBrand(false)} className="btn-secondary" style={{ padding: '8px 12px' }}>Cancel</button>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Model</label>
                  <input required type="text" className="input-field" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input-field" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Battery Voltage</label>
                  <input type="text" placeholder="e.g. 48V" className="input-field" value={formData.battery_voltage} onChange={e => setFormData({...formData, battery_voltage: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Battery Capacity</label>
                  <input type="text" placeholder="e.g. 15.3Ah" className="input-field" value={formData.battery_capacity} onChange={e => setFormData({...formData, battery_capacity: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Motor Watt</label>
                  <input type="text" placeholder="e.g. 500W" className="input-field" value={formData.motor_watt} onChange={e => setFormData({...formData, motor_watt: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Charger Voltage</label>
                  <input type="text" placeholder="e.g. 54.6V 2A" className="input-field" value={formData.charger_voltage} onChange={e => setFormData({...formData, charger_voltage: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Launch Date</label>
                  <input type="date" className="input-field" value={formData.date_launched} onChange={e => setFormData({...formData, date_launched: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Status</label>
                  <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Escooter</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Escooters;
