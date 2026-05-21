let currentJobs = [];
let allParts = [];
let optionsData = { scooters: [], models: [] };
let selectedJobNumber = null;
let currentJobParts = [];
let currentJobPartsPage = 1;
const jobPartsPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    loadJobs();
    loadAllPartsForAssignment();
    
    document.getElementById('assign_filter_scooter').addEventListener('change', (e) => {
        const scooter = e.target.value;
        const modelSelect = document.getElementById('assign_filter_model');
        modelSelect.innerHTML = '<option value="">-- All Models --</option>';
        if (scooter) {
            modelSelect.disabled = false;
            const relatedModels = optionsData.models.filter(m => m.scooter === scooter);
            relatedModels.forEach(m => {
                modelSelect.innerHTML += `<option value="${m.model}">${m.model}</option>`;
            });
        } else {
            modelSelect.disabled = true;
        }
        filterPartsDropdown();
    });
    
    document.getElementById('assign_filter_model').addEventListener('change', filterPartsDropdown);

    document.getElementById('jobForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            job_number: document.getElementById('job_number_input').value,
            client_name: document.getElementById('client_name').value,
            status: document.getElementById('job_status').value
        };
        
        // This acts as Create or Update depending on logic, our backend just inserts, wait, if insert fails due to duplicate, we should handle it or make a separate update.
        // Let's check if the generic jobForm should be creating.
        try {
            // First try to check if we are updating
            const existing = currentJobs.find(j => j.job_number === payload.job_number);
            let url = 'api_jobs.php';
            let method = existing ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.success) {
                alert(`Job ${existing ? 'updated' : 'created'} successfully!`);
                selectedJobNumber = payload.job_number;
                enableAssignment(selectedJobNumber);
                loadJobs();
                if (existing) {
                    loadJobParts(selectedJobNumber);
                }
            } else {
                alert('Error: ' + data.error);
            }
        } catch(err) {
            console.error('Save Job error:', err);
        }
    });

    document.getElementById('assignPartForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedJobNumber) return;
        
        const payload = {
            job_number: selectedJobNumber,
            sku: document.getElementById('assign_sku').value,
            quantity: document.getElementById('assign_qty').value,
            status: 'requested'
        };
        
        try {
            const res = await fetch('api_jobs.php?action=add_part', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                alert('Part assigned successfully');
                document.getElementById('assign_qty').value = 1; // leave form ready for another part
                loadJobParts(selectedJobNumber);
            } else {
                alert('Error assigning part: ' + data.error);
            }
        } catch(err) {
            console.error(err);
        }
    });
});

function enableAssignment(job_number) {
    document.getElementById('assignSection').style.opacity = '1';
    document.getElementById('assignSection').style.pointerEvents = 'auto';
    document.getElementById('assign_sku').disabled = false;
    document.getElementById('assign_qty').disabled = false;
    document.getElementById('btnAssign').disabled = false;
    document.getElementById('btnAssign').classList.replace('btn-ghost', 'btn-primary');
}

async function loadAllPartsForAssignment() {
    try {
        const res = await fetch('api_parts.php');
        allParts = await res.json();
        
        const optRes = await fetch('api_parts.php?action=options');
        optionsData = await optRes.json();
        
        const scooterSelect = document.getElementById('assign_filter_scooter');
        optionsData.scooters.forEach(s => {
            scooterSelect.innerHTML += `<option value="${s}">${s}</option>`;
        });
        
        filterPartsDropdown();
    } catch(err) {
        console.error('Load parts error', err);
    }
}

function filterPartsDropdown() {
    const scooter = document.getElementById('assign_filter_scooter').value;
    const model = document.getElementById('assign_filter_model').value;
    
    let filtered = allParts;
    if (scooter) filtered = filtered.filter(p => p.scooter === scooter);
    if (model) filtered = filtered.filter(p => p.model === model);
    
    const select = document.getElementById('assign_sku');
    select.innerHTML = '<option value="">-- Select a Part --</option>';
    filtered.forEach(p => {
        select.innerHTML += `<option value="${p.sku}">${p.sku} - ${p.description} (Stock: ${p.quantity})</option>`;
    });
}

async function loadJobs() {
    try {
        const res = await fetch('api_jobs.php');
        currentJobs = await res.json();
        const tbody = document.querySelector('#jobsTable tbody');
        tbody.innerHTML = '';
        
        if(currentJobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No jobs found</td></tr>';
            return;
        }
        
        currentJobs.forEach(j => {
            tbody.innerHTML += `
                <tr>
                    <td>${j.job_number}</td>
                    <td>${j.Client_name}</td>
                    <td>${j.status}</td>
                    <td>
                        <button class="btn btn-ghost" style="padding: 0.25rem 0.5rem" onclick="editJob('${j.job_number}')">Manage</button>
                        <button class="btn btn-danger" style="padding: 0.25rem 0.5rem" onclick="deleteJob('${j.job_number}')">Del</button>
                    </td>
                </tr>
            `;
        });
    } catch(err) {
        console.error('Load jobs error', err);
    }
}

function editJob(job_number) {
    const job = currentJobs.find(j => j.job_number === job_number);
    if (!job) return;
    
    document.getElementById('job_number_input').value = job.job_number;
    document.getElementById('client_name').value = job.Client_name;
    document.getElementById('job_status').value = job.status;
    
    selectedJobNumber = job_number;
    enableAssignment(job_number);
    loadJobParts(job_number);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteJob(job_number) {
    if (!confirm('Delete job ' + job_number + '?')) return;
    try {
        const res = await fetch(`api_jobs.php?job_number=${job_number}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            loadJobs();
            if (selectedJobNumber === job_number) {
                document.getElementById('jobPartsPanel').style.display = 'none';
                selectedJobNumber = null;
                document.getElementById('jobForm').reset();
            }
        } else {
            alert('Error: ' + data.error);
        }
    } catch(err) {
        console.error(err);
    }
}

async function loadJobParts(job_number) {
    try {
        const res = await fetch(`api_jobs.php?action=parts&job_number=${job_number}`);
        currentJobParts = await res.json();
        currentJobPartsPage = 1;
        
        document.getElementById('jobPartsTitle').innerText = 'Parts for Job: ' + job_number;
        document.getElementById('jobPartsPanel').style.display = 'block';
        
        renderJobParts();
    } catch(err) {
        console.error('Load job parts error', err);
    }
}

function renderJobParts() {
    const tbody = document.querySelector('#jobPartsTable tbody');
    tbody.innerHTML = '';
    
    const totalParts = currentJobParts.length;
    const totalPages = Math.ceil(totalParts / jobPartsPerPage);
    
    if (currentJobPartsPage > totalPages && totalPages > 0) currentJobPartsPage = totalPages;
    const startIndex = (currentJobPartsPage - 1) * jobPartsPerPage;
    const endIndex = startIndex + jobPartsPerPage;
    const paginatedParts = currentJobParts.slice(startIndex, endIndex);

    if (totalParts === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No parts assigned yet.</td></tr>';
        const pContainer = document.getElementById('jobPartsPagination');
        if (pContainer) pContainer.innerHTML = '';
        return;
    }
    
    paginatedParts.forEach(p => {
        const statusOptions = ['requested', 'received', 'warehouse', 'in_transit', 'customer_provided'].map(opt => 
            `<option value="${opt}" ${p.status === opt ? 'selected' : ''}>${opt}</option>`
        ).join('');
        
        tbody.innerHTML += `
            <tr>
                <td>${p.sku}</td>
                <td>${p.description}<br><small style="color:var(--text-muted)">${p.scooter} / ${p.model}</small></td>
                <td>${p.quantity}</td>
                <td>
                    <select onchange="updatePartStatus(${p.id_request}, this.value)" style="padding: 0.25rem; border-radius: 4px; background: rgba(255,255,255,0.8); color: var(--text-main); border: 1px solid var(--surface-border);">
                        ${statusOptions}
                    </select>
                </td>
                <td><button class="btn btn-danger" style="padding: 0.25rem 0.5rem;" onclick="removePart(${p.id_request})">Remove</button></td>
            </tr>
        `;
    });

    renderJobPartsPagination(totalPages);
}

function renderJobPartsPagination(totalPages) {
    const pContainer = document.getElementById('jobPartsPagination');
    if (!pContainer) return;
    
    pContainer.innerHTML = '';
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = 'btn ' + (i === currentJobPartsPage ? 'btn-primary' : 'btn-ghost');
        btn.style.padding = '0.25rem 0.5rem';
        btn.onclick = () => {
            currentJobPartsPage = i;
            renderJobParts();
        };
        pContainer.appendChild(btn);
    }
}

async function updatePartStatus(id_request, status) {
    try {
        const payload = { id_request, status };
        await fetch('api_jobs.php?action=update_part_status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch(err) {
        console.error(err);
    }
}

async function removePart(id_request) {
    if (!confirm('Remove part assignment?')) return;
    try {
        const res = await fetch(`api_jobs.php?action=remove_part&id_request=${id_request}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success && selectedJobNumber) {
            loadJobParts(selectedJobNumber);
        }
    } catch(err) {
        console.error(err);
    }
}
