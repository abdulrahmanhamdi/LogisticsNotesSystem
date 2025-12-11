const API_URL = "/api";
let CURRENT_USER = null;
let ALL_SHIPMENTS = [];

// Define Role IDs for easy reference
const ROLE_ADMIN = 1;
const ROLE_CUSTOMER = 2;
const ROLE_COURIER = 3;

// ================= 1. LOGIN & LOGOUT =================

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

                // 1. Switch Screens
                document.getElementById("login-screen").classList.add("hidden");
                const dashboard = document.getElementById("dashboard-screen");
                dashboard.classList.remove("hidden");
                dashboard.style.display = "flex";

                // 2. Set User Info
                document.getElementById("userNameDisplay").innerText = `${user.firstName} ${user.lastName}`;
                document.getElementById("userRoleDisplay").innerText = user.role ? user.role.roleName : "User";

                // 3. APPLY ROLE PERMISSIONS
                applyRolePermissions(user.roleId);

                loadAllData();
            } else {
                errorBox.classList.remove("hidden");
                errorBox.innerText = "Incorrect login details!";
            }
        } catch (err) {
            console.error(err);
            errorBox.classList.remove("hidden");
            errorBox.innerText = "Error connecting to the server!";
        }
    });
}

function logout() {
    CURRENT_USER = null;

    const dashboard = document.getElementById("dashboard-screen");
    dashboard.classList.add("hidden");
    dashboard.style.display = "none";

    const loginScreen = document.getElementById("login-screen");
    loginScreen.classList.remove("hidden");
    loginScreen.style.display = "flex";

    if (loginForm) loginForm.reset();
    document.getElementById("loginError").classList.add("hidden");
}

// ================= 2. NAVIGATION & DATA LOADING =================

function showSection(sectionId) {
    document.getElementById("section-logistics").classList.add("hidden");
    document.getElementById("section-notes").classList.add("hidden");
    document.getElementById("section-users").classList.add("hidden");
    document.getElementById("section-branches").classList.add("hidden");

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

    const selectedSection = document.getElementById(`section-${sectionId}`);
    if (selectedSection) selectedSection.classList.remove("hidden");

    const navItem = document.getElementById(`nav-${sectionId}`);
    if (navItem) navItem.classList.add("active");
}

function loadAllData() {
    getShipments();
    getNotes();
    getUsers();
    getRoles();
    getBranchesTable();
    loadShipmentLookups();
}

// --- Lookups (Dropdowns) ---
async function loadShipmentLookups() {
    try {
        // Branches
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

        // Service Types
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

        // Couriers
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

// ================= 3. SHIPMENTS LOGIC =================

async function getShipments() {
    const res = await fetch(`${API_URL}/Shipments`);
    if (res.ok) {
        let data = await res.json();

        // --- FIX: Filter data specific to CUSTOMER *before* calculating stats ---
        if (CURRENT_USER.roleId === ROLE_CUSTOMER) {
            data = data.filter(s => s.senderId === CURRENT_USER.userId);
        }
        // -----------------------------------------------------------------------

        ALL_SHIPMENTS = data;
        renderShipments(data);

        // Update Stats (Now reflects only filtered data for customers)
        const totalEl = document.getElementById("stat-total-shipments");
        const pendingEl = document.getElementById("stat-pending-shipments");

        if (totalEl) totalEl.innerText = data.length;
        // 1 = Pending (based on new DB seed)
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

    // Ensure Actions header is visible for everyone (including customers now)
    if (actionsHeader) actionsHeader.style.display = "";

    data.forEach(s => {
        // Redundant check (data is already filtered in getShipments), but keeps logic safe
        if (isCustomer && s.senderId !== CURRENT_USER.userId) return;

        let actionButtons = '';

        if (isAdmin) {
            // Admin: All actions
            actionButtons = `
                <button class="btn btn-sm btn-outline-warning btn-action" onclick="openStatusModal(${s.shipmentId})" title="Status"><i class="fas fa-truck-loading"></i></button>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editShipment(${s.shipmentId})" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteShipment(${s.shipmentId})" title="Delete"><i class="fas fa-trash"></i></button>
            `;
        } else if (isCourier) {
            // Courier: Update Status only
            actionButtons = `
                <button class="btn btn-sm btn-outline-warning btn-action" onclick="openStatusModal(${s.shipmentId})" title="Update Status"><i class="fas fa-truck-loading"></i></button>
            `;
        } else {
            // Customer: View Status only (The 'Eye' icon)
            actionButtons = `
                <button class="btn btn-sm btn-outline-info btn-action" onclick="openStatusModal(${s.shipmentId})" title="View History"><i class="fas fa-eye"></i></button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td>#${s.shipmentId}</td>
                <td>${s.description}</td>
                <td>${s.weight} KG</td>
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

        // --- Validation: Weight Check ---
        const weightVal = parseFloat(document.getElementById("sWeight").value);
        if (weightVal <= 0) {
            alert("Error: Weight cannot be negative or zero!");
            return;
        }
        // -------------------------------

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

// ================= 4. NOTES LOGIC =================

async function getNotes() {
    const res = await fetch(`${API_URL}/Notes`);
    if (res.ok) {
        const data = await res.json();

        // --- Privacy: Only show MY notes ---
        const myNotes = data.filter(n => n.userId === CURRENT_USER.userId);

        const totalNotesEl = document.getElementById("stat-total-notes");
        if (totalNotesEl) totalNotesEl.innerText = myNotes.length;

        const list = document.getElementById("notesList");
        if (list) {
            list.innerHTML = "";
            myNotes.forEach(n => {
                list.innerHTML += `
                    <div class="col-md-4 mb-3">
                        <div class="card card-custom h-100 border-left-success">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <h5 class="card-title text-success">${n.title}</h5>
                                    <div>
                                        <button class="btn btn-sm text-primary" onclick="editNote(${n.noteId})"><i class="fas fa-edit"></i></button>
                                        <button class="btn btn-sm text-danger" onclick="deleteNote(${n.noteId})"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                                <p class="card-text text-muted">${n.content}</p>
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

const noteForm = document.getElementById("noteForm");
if (noteForm) {
    noteForm.addEventListener("submit", async (e) => {
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

// ================= 5. USERS LOGIC (MANUAL ID & VALIDATION) =================

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
                        <td><button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.userId})"><i class="fas fa-trash"></i></button></td>
                    </tr>`;
            });
        }
    }
}

function openUserModal() {
    document.getElementById("userForm").reset();
    document.getElementById("uId").value = "";
    document.getElementById("uPhone").value = "";
    new bootstrap.Modal(document.getElementById('userModal')).show();
}

const userForm = document.getElementById("userForm");
if (userForm) {
    userForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const manualId = document.getElementById("uId").value;

        // --- Validation: ID Check ---
        if (parseInt(manualId) < 1) {
            alert("Error: User ID cannot be negative or zero!");
            return;
        }
        // ---------------------------

        const phoneVal = document.getElementById("uPhone").value;

        const payload = {
            userId: parseInt(manualId),
            firstName: document.getElementById("uFname").value,
            lastName: document.getElementById("uLname").value,
            email: document.getElementById("uEmail").value,
            passwordHash: document.getElementById("uPass").value || "123456",
            roleId: parseInt(document.getElementById("uRole").value),
            phone: phoneVal || "0000000000"
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
            const errorMsg = await res.text();
            if (errorMsg.includes("PRIMARY KEY")) {
                alert("Error! User ID already exists. Please choose a different ID.");
            } else if (errorMsg.includes("Duplicate")) {
                alert("Error! Email already exists.");
            } else {
                alert("Error creating user!");
            }
        }
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

// ================= 6. BRANCHES & HISTORY =================

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

// Status & History Helpers
// Status & History Helpers
async function openStatusModal(id) {
    document.getElementById("statusShipmentId").value = id;

    // Select UI elements
    const statusForm = document.getElementById("statusForm");
    const historySection = document.getElementById("historyTableBody").parentElement;
    const modalTitle = document.querySelector("#statusModal .modal-title");

    // User role check
    const isCustomer = CURRENT_USER.roleId === ROLE_CUSTOMER;

    // --- Adjust UI based on user role ---
    if (isCustomer) {
        // If customer: hide the update form and change modal title
        statusForm.style.display = "none";
        modalTitle.innerText = "Shipment Tracking History";
    } else {
        // If admin or courier: show update form and restore title
        statusForm.style.display = "block";
        modalTitle.innerText = "Update Shipment Status";

        // Load status list for admin/courier only
        const res = await fetch(`${API_URL}/ShipmentStatus`);
        if (res.ok) {
            const statuses = await res.json();
            const sel = document.getElementById("newStatusSelect");
            sel.innerHTML = "";
            statuses.forEach(st => {
                sel.innerHTML += `<option value="${st.statusId}">${st.statusName}</option>`;
            });
        }
    }

    // --- Fetch and display history (visible to all users) ---
    const historyRes = await fetch(`${API_URL}/Shipments/${id}/History`);
    const historyBody = document.getElementById("historyTableBody");
    historyBody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

    if (historyRes.ok) {
        const historyData = await historyRes.json();
        historyBody.innerHTML = "";

        if (historyData.length === 0) {
            historyBody.innerHTML = "<tr><td colspan='3' class='text-center text-muted'>No history yet.</td></tr>";
        } else {
            historyData.forEach(h => {
                historyBody.innerHTML += `
                    <tr>
                        <td>${new Date(h.changedAt).toLocaleString()}</td>
                        <td><span class="badge bg-secondary">${h.statusName}</span></td>
                        <td>${h.notes || '-'}</td>
                    </tr>
                `;
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

        // 5 = Delivered based on new DB seed
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

// ================= ROLE BASED ACCESS CONTROL =================
function applyRolePermissions(roleId) {
    const navLogistics = document.getElementById("nav-logistics");
    const navNotes = document.getElementById("nav-notes");
    const navUsers = document.getElementById("nav-users");
    const navBranches = document.getElementById("nav-branches");
    const newShipmentBtn = document.getElementById("btn-new-shipment");

    if (navLogistics) navLogistics.style.display = "none";
    if (navNotes) navNotes.style.display = "none";
    if (navUsers) navUsers.style.display = "none";
    if (navBranches) navBranches.style.display = "none";
    if (newShipmentBtn) newShipmentBtn.style.display = "none";

    if (roleId === ROLE_ADMIN) {
        if (navLogistics) navLogistics.style.display = "flex";
        if (navNotes) navNotes.style.display = "flex";
        if (navUsers) navUsers.style.display = "flex";
        if (navBranches) navBranches.style.display = "flex";
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