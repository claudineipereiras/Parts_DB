let currentParts = [];
let editingSku = null;
let optionsData = { scooters: [], models: [] };
let currentPage = 1;
const partsPerPage = 20;

function showImagePopup(src) {
    document.getElementById('imageModalImg').src = src;
    document.getElementById('imageModal').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    loadOptions();
    
    document.getElementById('filterScooter').addEventListener('change', (e) => {
        const scooter = e.target.value;
        const modelSelect = document.getElementById('filterModel');
        modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
        if (scooter) {
            modelSelect.disabled = false;
            const relatedModels = optionsData.models.filter(m => m.scooter === scooter);
            relatedModels.forEach(m => {
                modelSelect.innerHTML += `<option value="${m.model}">${m.model}</option>`;
            });
            loadParts();
        } else {
            modelSelect.disabled = true;
            document.querySelector('#partsTable tbody').innerHTML = '<tr><td colspan="8" style="text-align: center; color: #94a3b8;">Select a scooter to load parts</td></tr>';
        }
    });

    document.getElementById('filterModel').addEventListener('change', loadParts);
    document.getElementById('filterDescription').addEventListener('keyup', debounce(loadParts, 500));

    document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);
    document.getElementById('btnDeletePhoto').addEventListener('click', deletePhoto);
    
    document.getElementById('partForm').addEventListener('submit', savePart);
    
    document.getElementById('btnNew').addEventListener('click', () => {
        resetForm();
        enableForm(true); // new part, sku editable
    });
    
    document.getElementById('btnCancel').addEventListener('click', () => {
        resetForm();
    });

    document.getElementById('csvForm').addEventListener('submit', handleCsvImport);
});

function enableForm(isNew = false) {
    document.getElementById('sku').disabled = !isNew;
    document.getElementById('description').disabled = false;
    document.getElementById('scooter').disabled = false;
    document.getElementById('model').disabled = false;
    document.getElementById('quantity').disabled = false;
    document.getElementById('status').disabled = false;
    document.getElementById('btnSave').disabled = false;
    document.getElementById('btnCancel').disabled = false;
}

function disableForm() {
    document.getElementById('sku').disabled = true;
    document.getElementById('description').disabled = true;
    document.getElementById('scooter').disabled = true;
    document.getElementById('model').disabled = true;
    document.getElementById('quantity').disabled = true;
    document.getElementById('status').disabled = true;
    document.getElementById('btnSave').disabled = true;
    document.getElementById('btnCancel').disabled = true;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

async function loadOptions() {
    try {
        const res = await fetch('api_parts.php?action=options');
        optionsData = await res.json();
        
        const scooterSelect = document.getElementById('filterScooter');
        optionsData.scooters.forEach(s => {
            scooterSelect.innerHTML += `<option value="${s}">${s}</option>`;
        });
    } catch(e) {
        console.error('Error loading options', e);
    }
}

async function loadParts() {
    const scooter = document.getElementById('filterScooter').value;
    const model = document.getElementById('filterModel').value;
    const desc = document.getElementById('filterDescription').value;
    
    if (!scooter) return;
    
    const params = new URLSearchParams({ scooter, model, description: desc });
    try {
        const res = await fetch(`api_parts.php?${params.toString()}`);
        currentParts = await res.json();
        currentPage = 1;
        renderTable();
    } catch(e) {
        console.error('Failed to load parts', e);
    }
}

function renderTable() {
    const tbody = document.querySelector('#partsTable tbody');
    tbody.innerHTML = '';
    
    const totalParts = currentParts.length;
    const totalPages = Math.ceil(totalParts / partsPerPage);
    
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    const startIndex = (currentPage - 1) * partsPerPage;
    const endIndex = startIndex + partsPerPage;
    const paginatedParts = currentParts.slice(startIndex, endIndex);

    if (totalParts === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #94a3b8;">No parts found.</td></tr>';
        const paginationContainer = document.getElementById('partsPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    paginatedParts.forEach(part => {
        const tr = document.createElement('tr');
        const statusClass = part.status === 'In Stock' ? 'status-instock' : 'status-outstock';
        
        let imgHtml = '❌';
        if (part.photo_path) {
            imgHtml = `<a href="#" onclick="showImagePopup('${part.photo_path}'); return false;" style="text-decoration:none;" title="View Photo">✅</a>`;
        }
        
        tr.innerHTML = `
            <td style="text-align:center;">${imgHtml}</td>
            <td>${part.sku}</td>
            <td>${part.scooter}</td>
            <td>${part.model}</td>
            <td>${part.description}</td>
            <td>${part.quantity}</td>
            <td><span class="status-badge ${statusClass}">${part.status}</span></td>
            <td class="actions">
                <button class="btn btn-ghost" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="editPart('${part.sku}')">Edit</button>
                <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="deletePart('${part.sku}')">Del</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('partsPagination');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = 'btn ' + (i === currentPage ? 'btn-primary' : 'btn-ghost');
        btn.style.padding = '0.25rem 0.5rem';
        btn.onclick = () => {
            currentPage = i;
            renderTable();
        };
        paginationContainer.appendChild(btn);
    }
}

function editPart(sku) {
    const part = currentParts.find(p => p.sku === sku);
    if (!part) return;
    
    enableForm(false);
    editingSku = sku;
    document.getElementById('sku').value = part.sku;
    document.getElementById('description').value = part.description;
    document.getElementById('scooter').value = part.scooter;
    document.getElementById('model').value = part.model;
    document.getElementById('quantity').value = part.quantity;
    document.getElementById('status').value = part.status;
    
    if (part.photo_path) {
        document.getElementById('photo_path').value = part.photo_path;
        document.getElementById('photoPreview').innerHTML = `<img src="${part.photo_path}">`;
    } else {
        document.getElementById('photo_path').value = '';
        document.getElementById('photoPreview').innerHTML = '<span style="color:#94a3b8">No Photo</span>';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    editingSku = null;
    document.getElementById('partForm').reset();
    disableForm();
    document.getElementById('photo_path').value = '';
    document.getElementById('photoPreview').innerHTML = '<span style="color:#94a3b8">No Photo Selected</span>';
}

async function savePart(e) {
    e.preventDefault();
    
    const payload = {
        sku: document.getElementById('sku').value,
        description: document.getElementById('description').value,
        scooter: document.getElementById('scooter').value,
        model: document.getElementById('model').value,
        quantity: document.getElementById('quantity').value,
        status: document.getElementById('status').value,
        photo_path: document.getElementById('photo_path').value
    };
    
    const method = editingSku ? 'PUT' : 'POST';
    
    try {
        const res = await fetch('api_parts.php', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            alert('Part saved successfully');
            resetForm();
            loadOptions(); // Refresh options in case new scooter/model was added
            if (document.getElementById('filterScooter').value) {
                loadParts();
            }
        } else {
            alert('Error saving part: ' + data.error);
        }
    } catch(err) {
        alert('Server error: ' + err);
    }
}

async function deletePart(sku) {
    if (!confirm('Are you sure you want to delete SKU ' + sku + '?')) return;
    
    try {
        const res = await fetch(`api_parts.php?sku=${sku}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            loadParts();
        } else {
            alert('Error deleting part');
        }
    } catch(err) {
        console.error(err);
    }
}

async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('photo', file);
    
    document.getElementById('photoPreview').innerHTML = '<span style="color:var(--primary-color)">Uploading...</span>';
    
    try {
        const res = await fetch('upload_photo.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('photo_path').value = data.photo_path;
            document.getElementById('photoPreview').innerHTML = `<img src="${data.photo_path}">`;
        } else {
            alert('Upload failed: ' + data.error);
            document.getElementById('photoPreview').innerHTML = '<span style="color:red">Upload failed</span>';
        }
    } catch(err) {
        alert('Upload Error');
    }
}

function deletePhoto() {
    document.getElementById('photo_path').value = '';
    document.getElementById('photoPreview').innerHTML = '<span style="color:#94a3b8">Photo Removed</span>';
}

async function handleCsvImport(e) {
    e.preventDefault();
    const file = document.getElementById('csvFile').files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csv', file);

    const btn = document.getElementById('btnImport');
    btn.disabled = true;
    btn.innerText = 'Importing...';

    try {
        const res = await fetch('api_csv_import.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            alert(`Import successful!\nRows added: ${data.added}\nRows failed: ${data.failed}`);
            document.getElementById('csvModal').style.display = 'none';
            document.getElementById('csvForm').reset();
            loadOptions();
            if (document.getElementById('filterScooter').value) {
                loadParts();
            }
        } else {
            alert('Import Error: ' + data.error);
        }
    } catch(err) {
        console.error(err);
        alert('An error occurred during import.');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Import';
    }
}
