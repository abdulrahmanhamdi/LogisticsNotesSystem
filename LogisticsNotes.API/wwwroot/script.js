const API_URL = "/api";
let CURRENT_USER = null;

// ================= LOGIN & LOGOUT =================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;
    const errorBox = document.getElementById("loginError");
    try {
        const res = await fetch(`${API_URL}/Users`);
        const users = await res.json();

        // Simple Login Check (For Demo)
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === pass);
        if (user) {
            CURRENT_USER = user;
            document.getElementById("login-screen").classList.add("hidden");
            document.getElementById("dashboard-screen").style.display = "flex";
            document.getElementById("dashboard-screen").classList.remove("hidden");

            document.getElementById("userNameDisplay").innerText = `${user.firstName} ${user.lastName}`;
            document.getElementById("userRoleDisplay").innerText = user.role ? user.role.roleName : "User";

            loadAllData();
        } else {
            errorBox.classList.remove("hidden");
        }
    } catch (err) {
        console.error(err);
        alert("Make sure the backend server is running!");
    }
});

function logout() {
    location.reload();
}

function showSection(sectionId) {
    document.getElementById("section-logistics").classList.add("hidden");
    document.getElementById("section-notes").classList.add("hidden");
    document.getElementById("section-users").classList.add("hidden");

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

    document.getElementById(`section-${sectionId}`).classList.remove("hidden");
    document.querySelector(`.nav-item[onclick="showSection('${sectionId}')"]`).classList.add("active");
}

function loadAllData() {
    getShipments();
    getNotes();
    getUsers();
    getRoles();
}

// ================= SHIPMENTS (CRUD) =================
async function getShipments() {
    const res = await fetch(`${API_URL}/Shipments`);
    const data = await res.json();
    const tbody = document.getElementById("shipmentsTable");
    tbody.innerHTML = "";
    data.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td>#${s.shipmentId}</td>
                <td>${s.description}</td>
                <td>${s.weight} KG</td>
                <td><span class="badge bg-warning text-dark">Pending</span></td>
                <td>${new Date(s.sendingDate).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editShipment(${s.shipmentId})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteShipment(${s.shipmentId})">Delete</button>
                </td>
            </tr>`;
    });
}

// Open Modal for Add
function openShipmentModal() {
    document.getElementById("shipmentForm").reset();
    document.getElementById("sId").value = ""; // Clear ID for new
    document.getElementById("shipmentModalTitle").innerText = "New Shipment";
    new bootstrap.Modal(document.getElementById('shipmentModal')).show();
}

// Open Modal for Edit
async function editShipment(id) {
    const res = await fetch(`${API_URL}/Shipments/${id}`);
    const s = await res.json();

    document.getElementById("sId").value = s.shipmentId;
    document.getElementById("sDesc").value = s.description;
    document.getElementById("sWeight").value = s.weight;
    document.getElementById("shipmentModalTitle").innerText = "Edit Shipment";

    new bootstrap.Modal(document.getElementById('shipmentModal')).show();
}

// Handle Save (Add or Update)
document.getElementById("shipmentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("sId").value;
    const isEdit = id ? true : false;

    const payload = {
        shipmentId: isEdit ? parseInt(id) : 0,
        senderId: CURRENT_USER.userId,
        originBranchId: 1,
        destinationBranchId: 1,
        serviceTypeId: 1,
        currentStatusId: 5,
        description: document.getElementById("sDesc").value,
        weight: parseFloat(document.getElementById("sWeight").value),
        estimatedDeliveryDate: new Date().toISOString()
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

// ================= NOTES (CRUD) =================
async function getNotes() {
    const res = await fetch(`${API_URL}/Notes`);
    const data = await res.json();
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