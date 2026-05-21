let currentAssignedParts = [];
let sortCol = '';
let sortAsc = true;

document.addEventListener('DOMContentLoaded', () => {
    loadJobsFilter();
    
    document.querySelectorAll('#assignedTable th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (sortCol === col) {
                sortAsc = !sortAsc;
            } else {
                sortCol = col;
                sortAsc = true;
            }
            if (currentAssignedParts.length > 0) {
                renderAssignedParts();
            }
        });
    });
    
    document.getElementById('filterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const params = new URLSearchParams();
        const jobNo = document.getElementById('filter_job_number').value;
        const client = document.getElementById('filter_client').value;
        const scooter = document.getElementById('filter_scooter').value;
        const model = document.getElementById('filter_model').value;
        const sku = document.getElementById('filter_sku').value;
        const desc = document.getElementById('filter_desc').value;
        const status = document.getElementById('filter_status').value;
        
        if (jobNo) params.append('job_number', jobNo);
        if (client) params.append('Client_name', client);
        if (scooter) params.append('scooter', scooter);
        if (model) params.append('model', model);
        if (sku) params.append('sku', sku);
        if (desc) params.append('description', desc);
        if (status) params.append('status', status);
        
        try {
            const res = await fetch(`api_jobs.php?action=all_parts_list&${params.toString()}`);
            currentAssignedParts = await res.json();
            renderAssignedParts();
        } catch(err) {
            console.error(err);
        }
    });
    // Initial fetch if desired, but user req says "will be updated once the user clicks on the update button"
});

function renderAssignedParts() {
    const tbody = document.querySelector('#assignedTable tbody');
    tbody.innerHTML = '';
    
    if (currentAssignedParts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No assigned parts match filters.</td></tr>';
        return;
    }
    
    // Sort logic
    let displayData = [...currentAssignedParts];
    if (sortCol) {
        displayData.sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];
            
            if (sortCol === 'quantity' || sortCol === 'job_number') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            } else {
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            }
            
            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });
    }

    // Update header classes
    document.querySelectorAll('#assignedTable th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === sortCol) {
            th.classList.add(sortAsc ? 'sort-asc' : 'sort-desc');
        }
    });
    
    displayData.forEach(p => {
        let statusColor = "var(--text-main)";
        if(p.status === 'requested') statusColor = "#d97706";
        else if (p.status === 'received') statusColor = "#059669";
        else if (p.status === 'warehouse') statusColor = "#2563eb";
        const statusOptions = ['requested', 'received', 'warehouse', 'in_transit', 'customer_provided'].map(opt => 
            `<option value="${opt}" ${p.status === opt ? 'selected' : ''} style="background:var(--bg-color); color:var(--text-main)">${opt}</option>`
        ).join('');

        tbody.innerHTML += `
            <tr>
                <td>${p.job_number}</td>
                <td>${p.Client_name || ''}</td>
                <td>${p.scooter || ''}</td>
                <td>${p.model || ''}</td>
                <td>${p.sku || ''}</td>
                <td>${p.description || ''}</td>
                <td>${p.quantity}</td>
                <td>
                    <select onchange="updateGlobalStatus(${p.id_request}, this.value)" style="background:rgba(0,0,0,0.05); padding:0.25rem 0.5rem; border-radius:4px; color:${statusColor}; border:none; outline:none; font-family:inherit; font-weight: 500;">
                        ${statusOptions}
                    </select>
                </td>
            </tr>
        `;
    });
}

async function loadJobsFilter() {
    try {
        const res = await fetch('api_jobs.php');
        const jobs = await res.json();
        const select = document.getElementById('filter_job_number');
        if(!select) return;
        jobs.forEach(j => {
            if (j.status !== 'closed' && j.status !== 'completed') {
                select.innerHTML += `<option value="${j.job_number}">${j.job_number} - ${j.Client_name}</option>`;
            }
        });
    } catch(err) {
        console.error('Failed to load jobs for filter', err);
    }
}

async function updateGlobalStatus(id_request, status) {
    try {
        const payload = { id_request, status };
        const res = await fetch('api_jobs.php?action=update_part_status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            // Optional: Show quick ephemeral toast or just rely on color change
            document.getElementById('filterForm').dispatchEvent(new Event('submit')); // Refresh
        } else {
            alert('Error updating status: ' + data.error);
        }
    } catch(err) {
        console.error(err);
        alert('Exception updating status.');
    }
}
