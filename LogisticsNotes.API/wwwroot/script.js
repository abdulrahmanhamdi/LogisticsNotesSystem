const API_URL = "/api";

let CURRENT_USER = null;
let ALL_SHIPMENTS = [];

const ROLE_ADMIN = 1;
const ROLE_CUSTOMER = 2;
const ROLE_COURIER = 3;

// ================= 1. LOGIN & LOGOUT =================

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value;
            const pass = document.getElementById("loginPassword").value;
            const errorBox = document.getElementById("loginError");

            errorBox.classList.add("hidden");

            try {
                const res = await fetch(`${API_URL}/Users/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email, password: pass })
                });

                if (res.ok) {
                    const user = await res.json();
                    CURRENT_USER = user;

                    document.getElementById("login-screen").classList.add("hidden");
                    document.getElementById("login-screen").style.display = "none";

                    const dashboard = document.getElementById("dashboard-screen");
                    dashboard.classList.remove("hidden");
                    dashboard.style.display = "flex";

                    document.getElementById("userNameDisplay").innerText = `${user.firstName} ${user.lastName}`;
                    document.getElementById("userRoleDisplay").innerText = user.role ? user.role.roleName : "User";

                    applyRolePermissions(user.roleId);
                    loadAllData();
                } else {
                    errorBox.classList.remove("hidden");
                    errorBox.innerText = "Incorrect login details!";
                }
            } catch (err) {
                console.error("Login Error:", err);
                errorBox.classList.remove("hidden");
                errorBox.innerText = "Error connecting to the server!";
            }
        });
    }
});

function logout() {
    CURRENT_USER = null;
    window.location.reload();
}

// ================= 2. NAVIGATION & ROLE ACCESS =================

function showSection(sectionId) {
    const allSections = ["logistics", "notes", "users", "branches", "vehicles"];
    allSections.forEach(id => {
        const el = document.getElementById(`section-${id}`);
        if (el) el.classList.add("hidden");
    });

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

    const selectedSection = document.getElementById(`section-${sectionId}`);
    if (selectedSection) selectedSection.classList.remove("hidden");

    const navItem = document.getElementById(`nav-${sectionId}`);
    if (navItem) navItem.classList.add("active");
}

function applyRolePermissions(roleId) {
    const navLogistics = document.getElementById("nav-logistics");
    const navNotes = document.getElementById("nav-notes");
    const navUsers = document.getElementById("nav-users");
    const navBranches = document.getElementById("nav-branches");
    const navVehicles = document.getElementById("nav-vehicles");
    const newShipmentBtn = document.getElementById("btn-new-shipment");

    // Hide All
    if (navLogistics) navLogistics.style.display = "none";
    if (navNotes) navNotes.style.display = "none";
    if (navUsers) navUsers.style.display = "none";
    if (navBranches) navBranches.style.display = "none";
    if (navVehicles) navVehicles.style.display = "none";
    if (newShipmentBtn) newShipmentBtn.style.display = "none";

    // Show per Role
    if (roleId === ROLE_ADMIN) {
        if (navLogistics) navLogistics.style.display = "flex";
        if (navNotes) navNotes.style.display = "flex";
        if (navUsers) navUsers.style.display = "flex";
        if (navBranches) navBranches.style.display = "flex";
        if (navVehicles) navVehicles.style.display = "flex";
        if (newShipmentBtn) newShipmentBtn.style.display = "block";
        showSection('logistics');
    }
    else if (roleId === ROLE_CUSTOMER) {
        if (navLogistics) navLogistics.style.display = "flex";
        if (navNotes) navNotes.style.display = "flex";
        if (newShipmentBtn) newShipmentBtn.style.display = "block";
        showSection('logistics');
    }
    else if (roleId === ROLE_COURIER) {
        if (navLogistics) navLogistics.style.display = "flex";
        if (navNotes) navNotes.style.display = "flex";
        showSection('logistics');
    }
}

function loadAllData() {
    getShipments();
    getNotes();
    getUsers();
    getRoles();
    getBranchesTable();
    loadShipmentLookups();
    if (CURRENT_USER && CURRENT_USER.roleId === ROLE_ADMIN) getVehicles();
}

// ================= 3. SHIPMENTS LOGIC =================

async function getShipments() {
    const res = await fetch(`${API_URL}/Shipments`);
    if (res.ok) {
        let data = await res.json();

        if (CURRENT_USER.roleId === ROLE_CUSTOMER) {
            data = data.filter(s => s.senderId === CURRENT_USER.userId);
        }

        ALL_SHIPMENTS = data;
        renderShipments(data);

        const totalEl = document.getElementById("stat-total-shipments");
        const pendingEl = document.getElementById("stat-pending-shipments");

        if (totalEl) totalEl.innerText = data.length;
        if (pendingEl) pendingEl.innerText = data.filter(s => s.currentStatusId === 1).length;
    }
}

function renderShipments(data) {
    const tbody = document.getElementById("shipmentsTable");
    const actionsHeader = document.getElementById("actionsHeader");

    if (!tbody) return;
    tbody.innerHTML = "";

    const isAdmin = CURRENT_USER && CURRENT_USER.roleId === ROLE_ADMIN;
    const isCourier = CURRENT_USER && CURRENT_USER.roleId === ROLE_COURIER;
    const isCustomer = CURRENT_USER && CURRENT_USER.roleId === ROLE_CUSTOMER;

    if (actionsHeader) actionsHeader.style.display = "";

    data.forEach(s => {
        if (isCustomer && s.senderId !== CURRENT_USER.userId) return;

        let actionButtons = '';

        if (isAdmin) {
            actionButtons = `
                <button class="btn btn-sm btn-outline-success btn-action" onclick="openPaymentModal(${s.shipmentId})" title="Payments"><i class="fas fa-dollar-sign"></i></button>
                <button class="btn btn-sm btn-outline-warning btn-action" onclick="openStatusModal(${s.shipmentId})" title="Status"><i class="fas fa-truck-loading"></i></button>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editShipment(${s.shipmentId})" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteShipment(${s.shipmentId})" title="Delete"><i class="fas fa-trash"></i></button>
            `;
        } else if (isCourier) {
            actionButtons = `
                <button class="btn btn-sm btn-outline-warning btn-action" onclick="openStatusModal(${s.shipmentId})" title="Update Status"><i class="fas fa-truck-loading"></i></button>
            `;
        } else {
            actionButtons = `
                <button class="btn btn-sm btn-outline-success btn-action" onclick="openPaymentModal(${s.shipmentId})" title="View Payments"><i class="fas fa-dollar-sign"></i></button>
                <button class="btn btn-sm btn-outline-info btn-action" onclick="openStatusModal(${s.shipmentId})" title="View History"><i class="fas fa-eye"></i></button>
            `;
        }

        let costDisplay = s.shippingCost > 0
            ? `<span class="fw-bold text-success">$${s.shippingCost}</span>`
            : `<span class="fw-bold text-danger">$0</span>`;

        tbody.innerHTML += `
            <tr>
                <td>#${s.shipmentId}</td>
                <td>${s.description}</td>
                <td>${s.weight} KG</td>
                <td>${costDisplay}</td>
                <td><span class="badge ${getStatusBadge(s.currentStatusId)}">${getStatusName(s.currentStatusId)}</span></td>
                <td>${new Date(s.sendingDate).toLocaleDateString()}</td>
                <td>${actionButtons}</td>
            </tr>`;
    });
}

const searchInput = document.getElementById("searchShipmentInput");
if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = ALL_SHIPMENTS.filter(s =>
            s.description.toLowerCase().includes(term) ||
            s.shipmentId.toString().includes(term)
        );
        renderShipments(filtered);
    });
}

function openShipmentModal() {
    if (CURRENT_USER.roleId === ROLE_COURIER) return alert("You are not authorized to create new shipments.");
    document.getElementById("shipmentForm").reset();
    document.getElementById("sId").value = "";
    document.getElementById("shipmentModalTitle").innerText = "Add New Shipment";
    loadShipmentLookups();
    new bootstrap.Modal(document.getElementById('shipmentModal')).show();
}

async function editShipment(id) {
    const res = await fetch(`${API_URL}/Shipments/${id}`);
    const s = await res.json();
    document.getElementById("sId").value = s.shipmentId;
    document.getElementById("sDesc").value = s.description;
    document.getElementById("sWeight").value = s.weight;
    if (document.getElementById("sOrigin")) document.getElementById("sOrigin").value = s.originBranchId;
    if (document.getElementById("sDest")) document.getElementById("sDest").value = s.destinationBranchId;
    if (document.getElementById("sService")) document.getElementById("sService").value = s.serviceTypeId;
    if (document.getElementById("sCourier")) document.getElementById("sCourier").value = s.assignedCourierId || "";
    document.getElementById("shipmentModalTitle").innerText = "Edit Shipment";
    loadShipmentLookups();
    new bootstrap.Modal(document.getElementById('shipmentModal')).show();
}

const shipmentForm = document.getElementById("shipmentForm");
if (shipmentForm) {
    shipmentForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const weightVal = parseFloat(document.getElementById("sWeight").value);
        if (weightVal <= 0) return alert("Error: Weight cannot be negative or zero!");

        const id = document.getElementById("sId").value;
        const isEdit = id ? true : false;
        const courierVal = document.getElementById("sCourier").value;

        const payload = {
            shipmentId: isEdit ? parseInt(id) : 0,
            senderId: CURRENT_USER.userId,
            originBranchId: parseInt(document.getElementById("sOrigin").value),
            destinationBranchId: parseInt(document.getElementById("sDest").value),
            serviceTypeId: parseInt(document.getElementById("sService").value),
            currentStatusId: isEdit ? ALL_SHIPMENTS.find(s => s.shipmentId == id)?.currentStatusId : 1,
            description: document.getElementById("sDesc").value,
            weight: weightVal,
            estimatedDeliveryDate: new Date().toISOString(),
            assignedCourierId: courierVal ? parseInt(courierVal) : null,
        };

        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `${API_URL}/Shipments/${id}` : `${API_URL}/Shipments`;
        await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        bootstrap.Modal.getInstance(document.getElementById('shipmentModal')).hide();
        getShipments();
    });
}

async function deleteShipment(id) {
    if (confirm("Are you sure you want to delete?")) {
        await fetch(`${API_URL}/Shipments/${id}`, { method: "DELETE" });
        getShipments();
    }
}

async function loadShipmentLookups() {
    try {
        const resB = await fetch(`${API_URL}/Branches`);
        if (resB.ok) {
            const branches = await resB.json();
            const originSel = document.getElementById("sOrigin");
            const destSel = document.getElementById("sDest");
            if (originSel && destSel) {
                originSel.innerHTML = "";
                destSel.innerHTML = "";
                branches.forEach(b => {
                    const opt = `<option value="${b.branchId}">${b.branchName} (${b.city})</option>`;
                    originSel.innerHTML += opt;
                    destSel.innerHTML += opt;
                });
            }
        }
        const resS = await fetch(`${API_URL}/ServiceTypes`);
        if (resS.ok) {
            const types = await resS.json();
            const serviceSel = document.getElementById("sService");
            if (serviceSel) {
                serviceSel.innerHTML = '<option value="" disabled selected>-- Select Type --</option>';
                types.forEach(t => {
                    const id = t.serviceTypeId || t.ServiceTypeId;
                    const name = t.typeName || t.TypeName;
                    serviceSel.innerHTML += `<option value="${id}">${name}</option>`;
                });
            }
        }
        const resC = await fetch(`${API_URL}/Couriers`);
        if (resC.ok) {
            const couriers = await resC.json();
            const courierSel = document.getElementById("sCourier");
            if (courierSel) {
                courierSel.innerHTML = '<option value="">-- Unassigned --</option>';
                couriers.forEach(c => {
                    const name = c.user ? `${c.user.firstName} ${c.user.lastName}` : `Courier #${c.courierId}`;
                    courierSel.innerHTML += `<option value="${c.courierId}">${name}</option>`;
                });
            }
        }
    } catch (e) { console.error("Error loading lookups", e); }
}

// ================= 4. NOTES LOGIC =================

async function loadNoteLookups() {
    try {
        const resCat = await fetch(`${API_URL}/Categories`);
        if (resCat.ok) {
            const categories = await resCat.json();
            const catSelect = document.getElementById("nCategory");
            catSelect.innerHTML = '<option value="">-- No Category --</option>';
            categories.forEach(c => {
                catSelect.innerHTML += `<option value="${c.categoryId}">${c.categoryName}</option>`;
            });
        }

        const resFold = await fetch(`${API_URL}/Folders`);
        if (resFold.ok) {
            let folders = await resFold.json();
            if (CURRENT_USER.roleId !== ROLE_ADMIN) {
                folders = folders.filter(f => f.userId === CURRENT_USER.userId);
            }

            const foldSelect = document.getElementById("nFolder");
            foldSelect.innerHTML = '<option value="">-- No Folder --</option>';
            folders.forEach(f => {
                foldSelect.innerHTML += `<option value="${f.folderId}">${f.folderName}</option>`;
            });
        }
    } catch (e) { console.error("Error loading note lookups", e); }
}

async function getNotes() {
    const res = await fetch(`${API_URL}/Notes`);
    if (res.ok) {
        const data = await res.json();

        let displayNotes = [];
        if (CURRENT_USER.roleId === ROLE_ADMIN) {
            displayNotes = data;
        } else {
            displayNotes = data.filter(n => n.userId === CURRENT_USER.userId);
        }

        const totalNotesEl = document.getElementById("stat-total-notes");
        if (totalNotesEl) totalNotesEl.innerText = displayNotes.length;

        const list = document.getElementById("notesList");
        if (list) {
            list.innerHTML = "";
            displayNotes.forEach(n => {
                const ownerTag = (CURRENT_USER.roleId === ROLE_ADMIN && n.userId !== CURRENT_USER.userId)
                    ? `<small class="text-primary d-block mb-1">(User #${n.userId})</small>` : "";

                const categoryBadge = n.category
                    ? `<span class="badge bg-info text-dark me-1"><i class="fas fa-tag"></i> ${n.category.categoryName}</span>`
                    : "";

                const folderBadge = n.folder
                    ? `<span class="badge bg-warning text-dark"><i class="fas fa-folder"></i> ${n.folder.folderName}</span>`
                    : "";

                list.innerHTML += `
                    <div class="col-md-4 mb-3">
                        <div class="card card-custom h-100 border-left-success shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h5 class="card-title text-success fw-bold mb-0">${n.title}</h5>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="editNote(${n.noteId})">Edit</a></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteNote(${n.noteId})">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                                ${ownerTag}
                                <div class="mb-2">
                                    ${categoryBadge} ${folderBadge}
                                </div>
                                <p class="card-text text-muted" style="white-space: pre-wrap;">${n.content}</p>
                                <small class="text-muted" style="font-size: 0.8rem;">Updated: ${new Date(n.createdAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>`;
            });
        }
    }
}

function openNoteModal() {
    document.getElementById("noteForm").reset();
    document.getElementById("nId").value = "";
    document.getElementById("noteModalTitle").innerText = "New Note";
    loadNoteLookups(); 
    new bootstrap.Modal(document.getElementById('noteModal')).show();
}

async function editNote(id) {
    const res = await fetch(`${API_URL}/Notes/${id}`);
    const n = await res.json();

    await loadNoteLookups();

    document.getElementById("nId").value = n.noteId;
    document.getElementById("nTitle").value = n.title;
    document.getElementById("nContent").value = n.content;

    if (document.getElementById("nCategory")) document.getElementById("nCategory").value = n.categoryId || "";
    if (document.getElementById("nFolder")) document.getElementById("nFolder").value = n.folderId || "";

    document.getElementById("noteModalTitle").innerText = "Edit Note";
    new bootstrap.Modal(document.getElementById('noteModal')).show();
}

const noteForm = document.getElementById("noteForm");
if (noteForm) {
    noteForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("nId").value;
        const isEdit = id ? true : false;

        const catVal = document.getElementById("nCategory").value;
        const foldVal = document.getElementById("nFolder").value;

        const payload = {
            noteId: isEdit ? parseInt(id) : 0,
            userId: CURRENT_USER.userId,
            title: document.getElementById("nTitle").value,
            content: document.getElementById("nContent").value,
            categoryId: catVal ? parseInt(catVal) : null, // إرسال null إذا لم يتم الاختيار
            folderId: foldVal ? parseInt(foldVal) : null
        };

        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `${API_URL}/Notes/${id}` : `${API_URL}/Notes`;

        await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        bootstrap.Modal.getInstance(document.getElementById('noteModal')).hide();
        getNotes();
    });
}

async function deleteNote(id) {
    if (confirm("Delete Note?")) {
        await fetch(`${API_URL}/Notes/${id}`, { method: "DELETE" });
        getNotes();
    }
}
// ================= 5. USERS LOGIC (CRUD) =================

let isEditingUser = false;

async function getUsers() {
    const res = await fetch(`${API_URL}/Users`);
    if (res.ok) {
        const data = await res.json();
        const tbody = document.getElementById("usersTable");
        if (tbody) {
            tbody.innerHTML = "";
            data.forEach(u => {
                tbody.innerHTML += `
                    <tr>
                        <td>${u.userId}</td>
                        <td>${u.firstName} ${u.lastName}</td>
                        <td>${u.email}</td>
                        <td>${u.role?.roleName || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="editUser(${u.userId})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.userId})" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
            });
        }
    }
}

function openUserModal() {
    isEditingUser = false;
    document.getElementById("userForm").reset();
    document.getElementById("uId").disabled = false; // Allow ID for new users
    document.getElementById("userModalTitle").innerText = "New User";
    new bootstrap.Modal(document.getElementById('userModal')).show();
}

async function editUser(id) {
    isEditingUser = true;
    const res = await fetch(`${API_URL}/Users/${id}`);
    if (res.ok) {
        const u = await res.json();
        document.getElementById("uId").value = u.userId;
        document.getElementById("uFname").value = u.firstName;
        document.getElementById("uLname").value = u.lastName;
        document.getElementById("uEmail").value = u.email;
        document.getElementById("uPhone").value = u.phone;
        document.getElementById("uRole").value = u.roleId;
        document.getElementById("uPass").value = "";

        document.getElementById("uId").disabled = true; // Lock ID during edit
        document.getElementById("userModalTitle").innerText = "Edit User";
        new bootstrap.Modal(document.getElementById('userModal')).show();
    }
}

const userForm = document.getElementById("userForm");
if (userForm) {
    userForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const manualId = parseInt(document.getElementById("uId").value);
        if (!isEditingUser && manualId < 1) return alert("User ID cannot be negative or zero!");

        const payload = {
            userId: manualId,
            firstName: document.getElementById("uFname").value,
            lastName: document.getElementById("uLname").value,
            email: document.getElementById("uEmail").value,
            passwordHash: document.getElementById("uPass").value ? document.getElementById("uPass").value : (isEditingUser ? "123456" : "123456"),
            roleId: parseInt(document.getElementById("uRole").value),
            phone: document.getElementById("uPhone").value || "0000000000"
        };

        const method = isEditingUser ? "PUT" : "POST";
        const url = isEditingUser ? `${API_URL}/Users/${manualId}` : `${API_URL}/Users`;

        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
            getUsers();
        } else { alert("Error saving user!"); }
    });
}

async function deleteUser(id) {
    if (confirm("Deleting the user will delete all their data! Agree?")) {
        await fetch(`${API_URL}/Users/${id}`, { method: "DELETE" });
        getUsers();
    }
}

async function getRoles() {
    const res = await fetch(`${API_URL}/Roles`);
    if (res.ok) {
        const data = await res.json();
        const sel = document.getElementById("uRole");
        if (sel) {
            sel.innerHTML = "";
            data.forEach(r => sel.innerHTML += `<option value="${r.roleId}">${r.roleName}</option>`);
        }
    }
}

// ================= 6. BRANCHES =================

async function getBranchesTable() {
    const res = await fetch(`${API_URL}/Branches`);
    if (res.ok) {
        const data = await res.json();
        const tbody = document.getElementById("branchesTable");
        if (tbody) {
            tbody.innerHTML = "";
            data.forEach(b => {
                tbody.innerHTML += `<tr><td>${b.branchId}</td><td>${b.branchName}</td><td>${b.city}</td><td>${b.address}</td><td>${b.phone}</td><td><button class="btn btn-sm btn-outline-danger" onclick="deleteBranch(${b.branchId})"><i class="fas fa-trash"></i></button></td></tr>`;
            });
        }
    }
}
function openBranchModal() {
    document.getElementById("branchForm").reset();
    new bootstrap.Modal(document.getElementById('branchModal')).show();
}
const branchForm = document.getElementById("branchForm");
if (branchForm) {
    branchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            branchName: document.getElementById("bName").value,
            city: document.getElementById("bCity").value,
            address: document.getElementById("bAddress").value,
            phone: document.getElementById("bPhone").value
        };
        const res = await fetch(`${API_URL}/Branches`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('branchModal')).hide();
            getBranchesTable();
            loadShipmentLookups();
        }
    });
}
async function deleteBranch(id) {
    if (confirm("Delete Branch?")) {
        await fetch(`${API_URL}/Branches/${id}`, { method: "DELETE" });
        getBranchesTable();
        loadShipmentLookups();
    }
}

// ================= 7. STATUS & HISTORY =================

async function openStatusModal(id) {
    document.getElementById("statusShipmentId").value = id;
    const statusForm = document.getElementById("statusForm");
    const modalTitle = document.querySelector("#statusModal .modal-title");
    const isCustomer = CURRENT_USER.roleId === ROLE_CUSTOMER;

    if (isCustomer) {
        statusForm.style.display = "none";
        modalTitle.innerText = "Shipment Tracking History";
    } else {
        statusForm.style.display = "block";
        modalTitle.innerText = "Update Shipment Status";
        const res = await fetch(`${API_URL}/ShipmentStatus`);
        if (res.ok) {
            const statuses = await res.json();
            const sel = document.getElementById("newStatusSelect");
            sel.innerHTML = "";
            statuses.forEach(st => sel.innerHTML += `<option value="${st.statusId}">${st.statusName}</option>`);
        }
    }
    const historyRes = await fetch(`${API_URL}/Shipments/${id}/History`);
    const historyBody = document.getElementById("historyTableBody");
    historyBody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";
    if (historyRes.ok) {
        const historyData = await historyRes.json();
        historyBody.innerHTML = "";
        if (historyData.length === 0) historyBody.innerHTML = "<tr><td colspan='3' class='text-center text-muted'>No history yet.</td></tr>";
        else {
            historyData.forEach(h => {
                historyBody.innerHTML += `<tr><td>${new Date(h.changedAt).toLocaleString()}</td><td><span class="badge bg-secondary">${h.statusName}</span></td><td>${h.notes || '-'}</td></tr>`;
            });
        }
    }
    new bootstrap.Modal(document.getElementById('statusModal')).show();
}
const statusForm = document.getElementById("statusForm");
if (statusForm) {
    statusForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("statusShipmentId").value;
        const newStatusId = parseInt(document.getElementById("newStatusSelect").value);
        const oldRes = await fetch(`${API_URL}/Shipments/${id}`);
        const shipment = await oldRes.json();
        shipment.currentStatusId = newStatusId;
        if (newStatusId === 5) shipment.deliveredAt = new Date().toISOString();
        await fetch(`${API_URL}/Shipments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(shipment) });
        bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
        getShipments();
    });
}
function getStatusBadge(statusId) {
    if (statusId === 1) return "bg-warning text-dark";
    if (statusId === 2) return "bg-info text-white";
    if (statusId === 3) return "bg-primary";
    if (statusId === 5) return "bg-success";
    if (statusId === 6) return "bg-danger";
    return "bg-secondary";
}
function getStatusName(statusId) {
    const names = { 1: "Pending", 2: "Picked Up", 3: "In Transit", 4: "Ready", 5: "Delivered", 6: "Cancelled" };
    return names[statusId] || `Status ${statusId}`;
}

// ================= 8. PAYMENTS LOGIC =================

async function openPaymentModal(shipmentId) {
    document.getElementById("payShipmentId").value = shipmentId;
    const form = document.getElementById("paymentForm");
    if (CURRENT_USER.roleId === ROLE_ADMIN) {
        form.style.display = "block";
        form.reset();
        loadPaymentMethods();
    } else {
        form.style.display = "none";
    }
    const res = await fetch(`${API_URL}/Payments/ByShipment/${shipmentId}`);
    const tbody = document.getElementById("paymentHistoryBody");
    tbody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";
    if (res.ok) {
        const payments = await res.json();
        tbody.innerHTML = "";
        if (payments.length === 0) tbody.innerHTML = "<tr><td colspan='3' class='text-center text-muted'>No payments recorded.</td></tr>";
        else {
            payments.forEach(p => {
                tbody.innerHTML += `<tr><td>${new Date(p.paymentDate).toLocaleDateString()}</td><td>${p.methodName}</td><td class="fw-bold text-success">$${p.amount}</td></tr>`;
            });
        }
    }
    new bootstrap.Modal(document.getElementById('paymentModal')).show();
}
async function loadPaymentMethods() {
    const res = await fetch(`${API_URL}/Payments/Methods`);
    if (res.ok) {
        const methods = await res.json();
        const sel = document.getElementById("payMethod");
        sel.innerHTML = "";
        methods.forEach(m => sel.innerHTML += `<option value="${m.methodId}">${m.methodName}</option>`);
    }
}
const paymentForm = document.getElementById("paymentForm");
if (paymentForm) {
    paymentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById("payAmount").value);
        if (amount <= 0) return alert("Amount must be positive!");
        const payload = {
            shipmentId: parseInt(document.getElementById("payShipmentId").value),
            methodId: parseInt(document.getElementById("payMethod").value),
            amount: amount
        };
        const res = await fetch(`${API_URL}/Payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
            alert("Payment Recorded!");
            openPaymentModal(payload.shipmentId);
        } else alert("Error recording payment.");
    });
}

// ================= 9. VEHICLES LOGIC =================

async function getVehicles() {
    const res = await fetch(`${API_URL}/Vehicles`);
    if (res.ok) {
        const data = await res.json();
        const tbody = document.getElementById("vehiclesTable");
        if (tbody) {
            tbody.innerHTML = "";
            data.forEach(v => {
                let badgeClass = "bg-success";
                if (v.status === "Busy") badgeClass = "bg-warning text-dark";
                if (v.status === "Maintenance") badgeClass = "bg-danger";
                tbody.innerHTML += `<tr><td>${v.vehicleId}</td><td class="fw-bold">${v.licensePlate}</td><td>${v.model}</td><td>${v.capacity} KG</td><td><span class="badge ${badgeClass}">${v.status}</span></td><td><button class="btn btn-sm btn-outline-danger" onclick="deleteVehicle(${v.vehicleId})"><i class="fas fa-trash"></i></button></td></tr>`;
            });
        }
    }
}
function openVehicleModal() {
    document.getElementById("vehicleForm").reset();
    new bootstrap.Modal(document.getElementById('vehicleModal')).show();
}
const vehicleForm = document.getElementById("vehicleForm");
if (vehicleForm) {
    vehicleForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            licensePlate: document.getElementById("vPlate").value,
            model: document.getElementById("vModel").value,
            capacity: parseFloat(document.getElementById("vCapacity").value),
            status: document.getElementById("vStatus").value
        };
        const res = await fetch(`${API_URL}/Vehicles`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('vehicleModal')).hide();
            getVehicles();
        } else alert("Error saving vehicle");
    });
}
async function deleteVehicle(id) {
    if (confirm("Delete this vehicle?")) {
        await fetch(`${API_URL}/Vehicles/${id}`, { method: "DELETE" });
        getVehicles();
    }
}