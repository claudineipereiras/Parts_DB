import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Map as MapIcon, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import Pagination from '../components/Pagination';

const Diagrams = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  
  const [diagram, setDiagram] = useState(null);
  const [diagramFile, setDiagramFile] = useState(null);
  
  const [mappedParts, setMappedParts] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  
  const [mapNumber, setMapNumber] = useState('');
  const [mapPartId, setMapPartId] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [mappedParts.length, selectedModel]);

  useEffect(() => {
    if (selectedModel) {
      loadModelData(selectedModel);
    } else {
      setDiagram(null);
      setMappedParts([]);
      setAvailableParts([]);
    }
  }, [selectedModel]);

  const fetchModels = async () => {
    try {
      const res = await api.get('/options/models');
      setModels(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadModelData = async (modelId) => {
    try {
      const [diagRes, partsRes] = await Promise.all([
        api.get(`/diagrams?id_escooter=${modelId}`),
        api.get(`/parts?id_model=${modelId}`)
      ]);
      
      setAvailableParts(partsRes.data);
      const fetchedDiagram = diagRes.data;
      setDiagram(fetchedDiagram);
      
      if (fetchedDiagram) {
        loadMappedParts(fetchedDiagram.id);
      } else {
        setMappedParts([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMappedParts = async (diagramId) => {
    try {
      const res = await api.get(`/diagrams/${diagramId}/parts`);
      setMappedParts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDiagram = async (e) => {
    e.preventDefault();
    if (!diagramFile || !selectedModel) return;
    
    const data = new FormData();
    data.append('id_escooter', selectedModel);
    data.append('diagram_picture', diagramFile);

    try {
      await api.post('/diagrams', data);
      setDiagramFile(null);
      loadModelData(selectedModel);
    } catch (err) {
      alert('Error uploading diagram');
    }
  };

  const handleMapPart = async (e) => {
    e.preventDefault();
    if (!diagram || !mapNumber || !mapPartId) return;

    try {
      await api.post(`/diagrams/${diagram.id}/parts`, {
        id_part: mapPartId,
        diagram_number: mapNumber
      });
      setMapNumber('');
      setMapPartId('');
      loadMappedParts(diagram.id);
    } catch (err) {
      alert('Error mapping part');
    }
  };

  const handleUnmapPart = async (id_part) => {
    if (!window.confirm('Remove this part from the diagram?')) return;
    try {
      await api.delete(`/diagrams/${diagram.id}/parts/${id_part}`);
      loadMappedParts(diagram.id);
    } catch (err) {
      alert('Error unmapping part');
    }
  };

  const totalPages = Math.ceil(mappedParts.length / itemsPerPage);
  const currentMappedParts = mappedParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* Header & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Diagrams Module</h2>
        <div style={{ width: '300px' }}>
          <select 
            className="input-field" 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="">Select an Escooter Model</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.brand_name} - {m.model}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedModel ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <MapIcon size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            Please select an Escooter Model to view or upload its diagram.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, gap: '24px', minHeight: 0 }}>
          
          {/* Left Panel: Diagram Viewer */}
          <div style={{ flex: '6', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '600', backgroundColor: 'var(--bg-main)' }}>
              Schematic View
            </div>
            <div style={{ flex: 1, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', backgroundColor: '#f8fafc' }}>
              {diagram ? (
                <img 
                  src={`http://localhost:5000/uploads/diagrams/${diagram.diagram_picture}`} 
                  alt="Escooter Diagram" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }} 
                />
              ) : (
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                  <ImageIcon size={48} style={{ opacity: 0.3, margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                  <h3 style={{ marginBottom: '8px' }}>No Diagram Available</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Upload a schematic image for this model to start mapping parts.
                  </p>
                  <form onSubmit={handleUploadDiagram} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="input-field" 
                      style={{ padding: '9px' }}
                      required
                      onChange={e => setDiagramFile(e.target.files[0])}
                    />
                    <button type="submit" className="btn-primary" disabled={!diagramFile}>Upload Diagram</button>
                  </form>
                </div>
              )}
            </div>
            {/* If diagram exists, allow overwriting */}
            {diagram && (
               <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Update Image:</span>
                  <input type="file" accept="image/*" style={{ fontSize: '0.85rem' }} onChange={e => setDiagramFile(e.target.files[0])} />
                  {diagramFile && <button onClick={handleUploadDiagram} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.85rem' }}>Upload</button>}
               </div>
            )}
          </div>

          {/* Right Panel: Part Mapping List */}
          <div style={{ flex: '4', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '600', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LinkIcon size={18} /> Mapped Parts
            </div>
            
            {/* Inline Mapping Form */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', backgroundColor: '#f0f9ff' }}>
              <form onSubmit={handleMapPart} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="# on image" 
                  className="input-field" 
                  style={{ width: '100px' }} 
                  required
                  value={mapNumber}
                  onChange={e => setMapNumber(e.target.value)}
                  disabled={!diagram}
                />
                <select 
                  className="input-field" 
                  style={{ flex: 1 }} 
                  required
                  value={mapPartId}
                  onChange={e => setMapPartId(e.target.value)}
                  disabled={!diagram}
                >
                  <option value="">Select Part...</option>
                  {availableParts.map(p => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.description}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary" style={{ padding: '0 16px' }} disabled={!diagram}>Map</button>
              </form>
              {!diagram && <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '8px' }}>Please upload a diagram first to map parts.</div>}
            </div>

            {/* Mapped Parts Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', width: '60px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>SKU</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Description</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {currentMappedParts.map(item => (
                    <tr key={item.id_part} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', backgroundColor: '#f1f5f9' }}>{item.diagram_number}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>{item.sku}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.description}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => handleUnmapPart(item.id_part)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {mappedParts.length === 0 && diagram && (
                    <tr>
                      <td colSpan="4" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No parts mapped yet. Use the form above to link a part to a number on the diagram.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {mappedParts.length > 0 && diagram && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default Diagrams;
