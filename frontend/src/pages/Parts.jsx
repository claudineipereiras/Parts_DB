import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import Pagination from '../components/Pagination';

const Parts = () => {
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null, sku: '', description: '', id_make: '', id_model: '', status: 'Active'
  });
  const [photoFile, setPhotoFile] = useState(null);

  // Bulk Import State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkSuccess, setBulkSuccess] = useState('');

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setBulkErrors([]);
    setBulkSuccess('');
    
    const data = new FormData();
    data.append('file', csvFile);

    try {
      const res = await api.post('/parts/bulk', data);
      setBulkSuccess(res.data.message);
      if (selectedModel) fetchParts(selectedModel);
      setCsvFile(null);
      e.target.reset();
    } catch (err) {
      if (err.response?.data?.errors) {
        setBulkErrors(err.response.data.errors);
      } else {
        setBulkErrors([err.response?.data?.message || 'Error uploading CSV']);
      }
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (selectedModel) {
      fetchParts(selectedModel);
    } else {
      setParts([]);
      setSelectedPart(null);
    }
  }, [selectedModel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [parts.length, selectedModel]);

  const fetchOptions = async () => {
    try {
      const [modelsRes, brandsRes] = await Promise.all([
        api.get('/options/models'),
        api.get('/options/brands')
      ]);
      setModels(modelsRes.data);
      setBrands(brandsRes.data);
    } catch (err) {
      console.error('Error fetching options', err);
    }
  };

  const fetchParts = async (modelId) => {
    try {
      const res = await api.get(`/parts?id_model=${modelId}`);
      setParts(res.data);
    } catch (err) {
      console.error('Error fetching parts', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this part?')) return;
    try {
      await api.delete(`/parts/${id}`);
      fetchParts(selectedModel);
      if (selectedPart?.id === id) setSelectedPart(null);
    } catch (err) {
      alert('Error deleting part');
    }
  };

  const openModal = (part = null) => {
    if (part) {
      setIsEditing(true);
      setFormData({
        id: part.id,
        sku: part.sku,
        description: part.description,
        id_make: part.id_make || '',
        id_model: part.id_model || '',
        status: part.status
      });
    } else {
      setIsEditing(false);
      setFormData({
        id: null, sku: '', description: '', id_make: '', id_model: selectedModel || '', status: 'Active'
      });
    }
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('sku', formData.sku);
    data.append('description', formData.description);
    data.append('id_make', formData.id_make);
    data.append('id_model', formData.id_model);
    data.append('status', formData.status);
    if (photoFile) {
      data.append('photo', photoFile);
    }

    try {
      if (isEditing) {
        await api.put(`/parts/${formData.id}`, data);
      } else {
        await api.post('/parts', data);
      }
      setShowModal(false);
      if (selectedModel) fetchParts(selectedModel);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving part');
    }
  };

  const totalPages = Math.ceil(parts.length / itemsPerPage);
  const currentParts = parts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', height: '100%', gap: '24px' }}>
      
      {/* Main Parts Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Parts Management</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => { setBulkErrors([]); setBulkSuccess(''); setShowBulkModal(true); }} className="btn-secondary">
              Import Bulk CSV
            </button>
            <button onClick={() => openModal()} className="btn-primary">
              <Plus size={18} /> Add Part
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
          <select 
            className="input-field" 
            style={{ maxWidth: '300px' }}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="">Select an Escooter Model to view parts</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.brand_name} - {m.model}</option>
            ))}
          </select>
        </div>

        {/* Parts Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', border: '1px solid var(--border)', flex: 1 }}>
          {!selectedModel ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Please select a model from the dropdown above to load parts.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)' }}>SKU</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)' }}>Description</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentParts.map(part => (
                  <tr 
                    key={part.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border)', 
                      cursor: 'pointer',
                      backgroundColor: selectedPart?.id === part.id ? '#f0f9ff' : 'transparent'
                    }}
                    onClick={() => setSelectedPart(part)}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{part.sku}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{part.description}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '500',
                        backgroundColor: part.status === 'Active' ? '#d1fae5' : '#fee2e2',
                        color: part.status === 'Active' ? '#065f46' : '#991b1b'
                      }}>
                        {part.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(part); }} 
                          style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0284c7' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(part.id); }} 
                          style={{ padding: '6px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {parts.length === 0 && selectedModel && (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No parts found for this model.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {selectedModel && parts.length > 0 && (
             <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </div>
      </div>

      {/* Right Photo Panel */}
      <div style={{ width: '320px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '600' }}>
          Part Photo
        </div>
        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {selectedPart ? (
            <>
              {selectedPart.photo_path ? (
                <img 
                  src={`http://localhost:5000/uploads/${selectedPart.photo_path}`} 
                  alt={selectedPart.sku} 
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} 
                />
              ) : (
                <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <ImageIcon size={48} opacity={0.5} />
                  <span>No photo available</span>
                </div>
              )}
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.1rem' }}>{selectedPart.sku}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{selectedPart.description}</p>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              Select a part from the list to view its photo.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>{isEditing ? 'Edit Part' : 'Add New Part'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input required type="text" className="input-field" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea required className="input-field" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Brand</label>
                  <select className="input-field" value={formData.id_make} onChange={e => setFormData({...formData, id_make: e.target.value})}>
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Model</label>
                  <select className="input-field" value={formData.id_model} onChange={e => setFormData({...formData, id_model: e.target.value})}>
                    <option value="">Select Model</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.model}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Status</label>
                  <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Photo Upload</label>
                  <input type="file" className="input-field" style={{ padding: '9px' }} accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Part</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Modal */}
      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Import Bulk Parts via CSV</h3>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong>Format Requirement:</strong><br/>
              Your CSV file must be comma-separated with the exact following header row:<br/>
              <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '8px' }}>
                sku,description,make,model,status
              </code><br/>
              <br/>
              <em>Note: The `make` and `model` columns must exactly match the existing Brand and Escooter Model names in the system.</em>
            </div>

            {bulkSuccess && (
              <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                {bulkSuccess}
              </div>
            )}

            {bulkErrors.length > 0 && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', maxHeight: '150px', overflowY: 'auto' }}>
                <strong>Validation Errors:</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  {bulkErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <form onSubmit={handleBulkSubmit}>
              <div className="form-group">
                <label className="form-label">Upload CSV File</label>
                <input required type="file" accept=".csv" className="input-field" style={{ padding: '9px' }} onChange={e => setCsvFile(e.target.files[0])} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowBulkModal(false); setBulkErrors([]); setBulkSuccess(''); }}>Close</button>
                <button type="submit" className="btn-primary" disabled={!csvFile}>Upload & Process</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Parts;
