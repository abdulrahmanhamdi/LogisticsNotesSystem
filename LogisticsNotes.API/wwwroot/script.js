const API_URL = "/api";
let CURRENT_USER = null;
let ALL_SHIPMENTS = []; // Global variable to store all fetched shipment data

// ================= LOGIN & LOGOUT =================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;
    const errorBox = document.getElementById("loginError");

    // Hide old error
    errorBox.classList.add("hidden");

    try {
        // The quick way: Send credentials to the server for verification
        const res = await fetch(`${API_URL}/Users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: pass })
        });

        if (res.ok) {
            const user = await res.json();

            // Successful Login
            CURRENT_USER = user;
            document.getElementById("login-screen").classList.add("hidden");
            document.getElementById("dashboard-screen").style.display = "flex";
            document.getElementById("dashboard-screen").classList.remove("hidden");

            document.getElementById("userNameDisplay").innerText = `${user.firstName} ${user.lastName}`;
            document.getElementById("userRoleDisplay").innerText = user.role ? user.role.roleName : "User";

            loadAllData();
        } else {
            // Login failed (401 Unauthorized)
            errorBox.classList.remove("hidden");
            errorBox.innerText = "Invalid login credentials!";
        }
    } catch (err) {
        console.error(err);
        errorBox.classList.remove("hidden");
        errorBox.innerText = "Error connecting to the server!";
    }
});

function logout() {
    // ... (rest of the file remains the same, but I will provide the full update for completeness)
}

function showSection(sectionId) {
    document.getElementById("section-logistics").classList.add("hidden");
    document.getElementById("section-notes").classList.add("hidden");
    document.getElementById("section-users").classList.add("hidden");
    document.getElementById("section-branches").classList.add("hidden");

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

    document.getElementById(`section-${sectionId}`).classList.remove("hidden");
    document.querySelector(`.nav-item[onclick="showSection('${sectionId}')"]`).classList.add("active");
}

function loadAllData() {
    getShipments();
    getNotes();
    getUsers();
    getRoles();
    getBranchesTable();
    loadShipmentLookups();
}

// --- Lookups for Shipment Modal (Branches, Service Types, & Couriers) ---
async function loadShipmentLookups() {
    // 1. Fetch Branches
    try {
        const res = await fetch(`${API_URL}/Branches`);
        const branches = await res.json();

        const originSel = document.getElementById("sOrigin");
        const destSel = document.getElementById("sDest");

        originSel.innerHTML = "";
        destSel.innerHTML = "";

        branches.forEach(b => {
            originSel.innerHTML += `<option value="${b.branchId}">${b.branchName} (${b.city})</option>`;
            destSel.innerHTML += `<option value="${b.branchId}">${b.branchName} (${b.city})</option>`;
        });

    } catch (e) { console.error("Error loading branches", e); }

    // 2. Fetch Service Types
    try {
        const res = await fetch(`${API_URL}/ServiceTypes`);
        const types = await res.json();

        const serviceSel = document.getElementById("sService");
        serviceSel.innerHTML = "";

        types.forEach(t => {
            serviceSel.innerHTML += `<option value="${t.serviceTypeId}">${t.typeName} - $${t.basePrice}</option>`;
        });

    } catch (e) { console.error("Error loading service types", e); }

    // 3. Fetch Couriers 
    try {
        const res = await fetch(`${API_URL}/Couriers`);
        const couriers = await res.json();

        const courierSel = document.getElementById("sCourier");
        // Keep the default "Unassigned" option
        courierSel.innerHTML = '<option value="">-- Unassigned --</option>';

        couriers.forEach(c => {
            // Access the nested User object for the name
            const courierName = c.user ? `${c.user.firstName} ${c.user.lastName}` : `Courier #${c.courierId}`;
            courierSel.innerHTML += `<option value="${c.courierId}">${courierName} (Vehicle: ${c.vehicleType || 'N/A'})</option>`;
        });

    } catch (e) { console.error("Error loading couriers", e); }
}

// ================= SHIPMENTS (CRUD) =================

// Main function to fetch data and save to global variable
async function getShipments() {
    const res = await fetch(`${API_URL}/Shipments`);
    const data = await res.json();

    ALL_SHIPMENTS = data; // Save the original copy
    renderShipments(data); // Display the data

    // Update Statistics
    document.getElementById("stat-total-shipments").innerText = data.length;
    document.getElementById("stat-pending-shipments").innerText = data.filter(s => s.currentStatusId === 5).length;
}

// Function to render the table (used by both getShipments and search)
function renderShipments(data) {
    const tbody = document.getElementById("shipmentsTable");
    tbody.innerHTML = "";
    data.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td>#${s.shipmentId}</td>
                <td>${s.description}</td>
                <td>${s.weight} KG</td>
                <td><span class="badge ${getStatusBadge(s.currentStatusId)}">${getStatusName(s.currentStatusId)}</span></td>
                <td>${new Date(s.sendingDate).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning btn-action" onclick="openStatusModal(${s.shipmentId})" title="Change Status"><i class="fas fa-truck-loading"></i></button>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editShipment(${s.shipmentId})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteShipment(${s.shipmentId})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

// Open Modal for Add
function openShipmentModal() {
    document.getElementById("shipmentForm").reset();
    document.getElementById("sId").value = "";
    document.getElementById("shipmentModalTitle").innerText = "New Shipment";
    // Crucial: Reload lookups here to ensure new branches/couriers are present
    loadShipmentLookups();
    new bootstrap.Modal(document.getElementById('shipmentModal')).show();
}

// Open Modal for Edit
async function editShipment(id) {
    const res = await fetch(`${API_URL}/Shipments/${id}`);
    const s = await res.json();

    document.getElementById("sId").value = s.shipmentId;
    document.getElementById("sDesc").value = s.description;
    document.getElementById("sWeight").value = s.weight;

    // Set selected values for dropdowns
    document.getElementById("sOrigin").value = s.originBranchId;
    document.getElementById("sDest").value = s.destinationBranchId;
    document.getElementById("sService").value = s.serviceTypeId;
    // Select the current courier
    document.getElementById("sCourier").value = s.courierId || "";

    document.getElementById("shipmentModalTitle").innerText = "Edit Shipment";
    // Crucial: Reload lookups here to ensure new branches/couriers are present
    loadShipmentLookups();
    new bootstrap.Modal(document.getElementById('shipmentModal')).show();
}

// Handle Save (Add or Update)
document.getElementById("shipmentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("sId").value;
    const isEdit = id ? true : false;

    // Get courier value
    const courierVal = document.getElementById("sCourier").value;

    const payload = {
        shipmentId: isEdit ? parseInt(id) : 0,
        senderId: CURRENT_USER.userId,

        originBranchId: parseInt(document.getElementById("sOrigin").value),
        destinationBranchId: parseInt(document.getElementById("sDest").value),
        serviceTypeId: parseInt(document.getElementById("sService").value),

        currentStatusId: 5, // Default to Pending
        description: document.getElementById("sDesc").value,
        weight: parseFloat(document.getElementById("sWeight").value),
        estimatedDeliveryDate: new Date().toISOString(),

        // Add courierId (send null if unassigned)
        courierId: courierVal ? parseInt(courierVal) : null,
    };

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${API_URL}/Shipments/${id}` : `${API_URL}/Shipments`;
    await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    bootstrap.Modal.getInstance(document.getElementById('shipmentModal')).hide();
    getShipments();
});

// Delete
async function deleteShipment(id) {
    if (confirm("Are you sure you want to delete this shipment?")) {
        await fetch(`${API_URL}/Shipments/${id}`, { method: "DELETE" });
        getShipments();
    }
}

// ================= REAL-TIME SEARCH FILTER =================

document.getElementById("searchShipmentInput").addEventListener("keyup", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = ALL_SHIPMENTS.filter(s =>
        // Search by description or shipment ID
        s.description.toLowerCase().includes(term) ||
        s.shipmentId.toString().includes(term)
    );
    renderShipments(filtered); // Re-render the table with filtered data
});

// ================= NOTES (CRUD) =================
async function getNotes() {
    const res = await fetch(`${API_URL}/Notes`);
    const data = await res.json();

    // Update Notes Statistics
    document.getElementById("stat-total-notes").innerText = data.length;

    const list = document.getElementById("notesList");
    list.innerHTML = "";
    data.forEach(n => {
        list.innerHTML += `
            <div class="col-md-4 mb-3">
                <div class="card card-custom h-100 border-left-success">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title text-success">${n.title}</h5>
                            <div>
                                <button class="btn btn-sm text-primary" onclick="editNote(${n.noteId})">Edit</button>
                                <button class="btn btn-sm text-danger" onclick="deleteNote(${n.noteId})">Delete</button>
                            </div>
                        </div>
                        <p class="card-text text-muted">${n.content}</p>
                    </div>
                </div>
            </div>`;
    });
}

function openNoteModal() {
    document.getElementById("noteForm").reset();
    document.getElementById("nId").value = "";
    document.getElementById("noteModalTitle").innerText = "New Note";
    new bootstrap.Modal(document.getElementById('noteModal')).show();
}

async function editNote(id) {
    const res = await fetch(`${API_URL}/Notes/${id}`);
    const n = await res.json();
    document.getElementById("nId").value = n.noteId;
    document.getElementById("nTitle").value = n.title;
    document.getElementById("nContent").value = n.content;
    document.getElementById("noteModalTitle").innerText = "Edit Note";
    new bootstrap.Modal(document.getElementById('noteModal')).show();
}

document.getElementById("noteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("nId").value;
    const isEdit = id ? true : false;
    const payload = {
        noteId: isEdit ? parseInt(id) : 0,
        userId: CURRENT_USER.userId,
        title: document.getElementById("nTitle").value,
        content: document.getElementById("nContent").value
    };
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${API_URL}/Notes/${id}` : `${API_URL}/Notes`;
    await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    bootstrap.Modal.getInstance(document.getElementById('noteModal')).hide();
    getNotes();
});

async function deleteNote(id) {
    if (confirm("Delete this note?")) {
        await fetch(`${API_URL}/Notes/${id}`, { method: "DELETE" });
        getNotes();
    }
}

// ================= USERS (CRUD) =================
async function getUsers() {
    const res = await fetch(`${API_URL}/Users`);
    const data = await res.json();
    const tbody = document.getElementById("usersTable");
    tbody.innerHTML = "";
    data.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.userId}</td>
                <td>${u.firstName} ${u.lastName}</td>
                <td>${u.email}</td>
                <td>${u.role?.roleName || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteUser(${u.userId})">Delete</button>
                </td>
            </tr>`;
    });
}

function openUserModal() {
    document.getElementById("userForm").reset();
    document.getElementById("userModalTitle").innerText = "New User";
    new bootstrap.Modal(document.getElementById('userModal')).show();
}

// User Save (Add only for simplicity)
document.getElementById("userForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        firstName: document.getElementById("uFname").value,
        lastName: document.getElementById("uLname").value,
        email: document.getElementById("uEmail").value,
        passwordHash: document.getElementById("uPass").value || "123456",
        roleId: parseInt(document.getElementById("uRole").value),
        phone: "0000000000"
    };

    const res = await fetch(`${API_URL}/Users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        getUsers();
    } else {
        alert("Error! Email might already exist.");
    }
});

async function deleteUser(id) {
    if (confirm("Are you sure? This will delete the user and all their shipments and notes!")) {
        await fetch(`${API_URL}/Users/${id}`, { method: "DELETE" });
        getUsers();
    }
}

async function getRoles() {
    const res = await fetch(`${API_URL}/Roles`);
    const data = await res.json();
    const sel = document.getElementById("uRole");
    sel.innerHTML = "";
    data.forEach(r => sel.innerHTML += `<option value="${r.roleId}">${r.roleName}</option>`);
}

// ================= STATUS WORKFLOW =================
async function openStatusModal(id) {
    document.getElementById("statusShipmentId").value = id;
    const res = await fetch(`${API_URL}/ShipmentStatus`);
    const statuses = await res.json();
    const sel = document.getElementById("newStatusSelect");
    sel.innerHTML = "";
    statuses.forEach(st => {
        sel.innerHTML += `<option value="${st.statusId}">${st.statusName}</option>`;
    });
    new bootstrap.Modal(document.getElementById('statusModal')).show();
}

document.getElementById("statusForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("statusShipmentId").value;
    const newStatusId = parseInt(document.getElementById("newStatusSelect").value);
    const oldRes = await fetch(`${API_URL}/Shipments/${id}`);
    const shipment = await oldRes.json();
    shipment.currentStatusId = newStatusId;
    if (newStatusId === 4) {
        shipment.deliveredAt = new Date().toISOString();
    }
    await fetch(`${API_URL}/Shipments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipment)
    });
    bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
    alert("Shipment status updated successfully!");
    getShipments();
});

function getStatusBadge(statusId) {
    if (statusId === 5) return "bg-warning text-dark"; // Pending
    if (statusId === 6) return "bg-info text-white";    // Picked Up
    if (statusId === 7) return "bg-primary";            // In Transit
    if (statusId === 4) return "bg-success";            // Delivered
    return "bg-secondary";
}

function getStatusName(statusId) {
    const names = { 5: "Pending", 6: "Picked Up", 7: "In Transit", 4: "Delivered" };
    return names[statusId] || `Status ${statusId}`;
}


// ================= BRANCHES (CRUD) =================

// 1. Display Branches in the Table
async function getBranchesTable() {
    const res = await fetch(`${API_URL}/Branches`);
    const data = await res.json();
    const tbody = document.getElementById("branchesTable");
    tbody.innerHTML = "";
    data.forEach(b => {
        tbody.innerHTML += `
            <tr>
                <td>${b.branchId}</td>
                <td><strong>${b.branchName}</strong></td>
                <td><span class="badge bg-info text-dark">${b.city}</span></td>
                <td>${b.address}</td>
                <td>${b.phone}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBranch(${b.branchId})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

// 2. Open the Modal
function openBranchModal() {
    document.getElementById("branchForm").reset();
    new bootstrap.Modal(document.getElementById('branchModal')).show();
}

// 3. Save New Branch
document.getElementById("branchForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
        branchName: document.getElementById("bName").value,
        city: document.getElementById("bCity").value,
        address: document.getElementById("bAddress").value,
        phone: document.getElementById("bPhone").value
    };

    const res = await fetch(`${API_URL}/Branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('branchModal')).hide();
        alert("Branch added successfully!");
        getBranchesTable(); // Update the branches table
        loadShipmentLookups(); // Crucial: Update the dropdowns in the Shipment modal
    } else {
        alert("An error occurred during addition. Status: " + res.status);
    }
});

// 4. Delete Branch
async function deleteBranch(id) {
    if (confirm("Warning: Deleting a branch may cause issues with associated shipments! Are you sure?")) {
        await fetch(`${API_URL}/Branches/${id}`, { method: "DELETE" });
        getBranchesTable();
        loadShipmentLookups(); // Crucial: Update the dropdowns in the Shipment modal
    }
}