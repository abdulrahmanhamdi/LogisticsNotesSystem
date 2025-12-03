const API_URL = "/api";
let CURRENT_USER = null;

// 1. LOGIN LOGIC (Simulation)
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;
    const errorBox = document.getElementById("loginError");

    try {
        // Fetch all users to find a match (Not secure for production, but perfect for DB project demo)
        const res = await fetch(`${API_URL}/Users`);
        const users = await res.json();

        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === pass);

        if (user) {
            CURRENT_USER = user;
            // Switch Screens
            document.getElementById("login-screen").style.display = "none"; // Hide Login
            document.getElementById("dashboard-screen").style.display = "flex"; // Show Dashboard
            document.getElementById("dashboard-screen").classList.remove("hidden");

            // Setup UI
            document.getElementById("userNameDisplay").innerText = `${user.firstName} ${user.lastName}`;
            document.getElementById("userRoleDisplay").innerText = user.role ? user.role.roleName : "User";

            // Load Initial Data
            loadAllData();
        } else {
            errorBox.classList.remove("hidden");
            errorBox.innerText = "Wrong Email or Password!";
        }
    } catch (err) {
        console.error(err);
        errorBox.classList.remove("hidden");
        errorBox.innerText = "Server Connection Error!";
    }
});

function logout() {
    location.reload(); // Simple reload to clear state
}

// 2. NAVIGATION LOGIC
function showSection(sectionId) {
    // Hide all sections
    document.getElementById("section-logistics").classList.add("hidden");
    document.getElementById("section-notes").classList.add("hidden");
    document.getElementById("section-users").classList.add("hidden");

    // Remove active class from sidebar
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

    // Show selected
    document.getElementById(`section-${sectionId}`).classList.remove("hidden");

    // Update Title
    const titles = {
        'logistics': 'Logistics Management System',
        'notes': 'My Personal Notes',
        'users': 'System User Administration'
    };
    document.getElementById("pageTitle").innerText = titles[sectionId];
}

// 3. DATA FETCHING LOGIC
function loadAllData() {
    getShipments();
    getNotes();
    getUsers();
    getRoles();
}

async function getShipments() {
    try {
        const res = await fetch(`${API_URL}/Shipments`);
        const data = await res.json();
        const tbody = document.getElementById("shipmentsTable");
        document.getElementById("stat-shipments").innerText = data.length;
        tbody.innerHTML = "";
        data.forEach(s => {
            tbody.innerHTML += `
                            <tr>
                                <td>#${s.shipmentId}</td>
                                <td>${s.description}</td>
                                <td>${s.weight} KG</td>
                                <td><span class="badge bg-warning text-dark">Pending</span></td>
                                <td>${new Date(s.sendingDate).toLocaleDateString()}</td>
                            </tr>`;
        });
    } catch (e) { console.log(e); }
}

async function getNotes() {
    try {
        const res = await fetch(`${API_URL}/Notes`);
        const data = await res.json();
        const list = document.getElementById("notesList");
        list.innerHTML = "";
        data.forEach(n => {
            list.innerHTML += `
                            <div class="col-md-4 mb-3">
                                <div class="card card-custom h-100 border-left-success">
                                    <div class="card-body">
                                        <h5 class="card-title text-success">${n.title}</h5>
                                        <p class="card-text text-muted">${n.content}</p>
                                        <small class="text-xs text-gray-400">${new Date().toLocaleDateString()}</small>
                                    </div>
                                </div>
                            </div>`;
        });
    } catch (e) { console.log(e); }
}

async function getUsers() {
    const res = await fetch(`${API_URL}/Users`);
    const data = await res.json();
    const tbody = document.getElementById("usersTable");
    tbody.innerHTML = "";
    data.forEach(u => {
        tbody.innerHTML += `<tr><td>${u.userId}</td><td>${u.firstName} ${u.lastName}</td><td>${u.email}</td><td>${u.role?.roleName || '-'}</td></tr>`;
    });
}

async function getRoles() {
    const res = await fetch(`${API_URL}/Roles`);
    const data = await res.json();
    const sel = document.getElementById("uRole");
    sel.innerHTML = "";
    data.forEach(r => sel.innerHTML += `<option value="${r.roleId}">${r.roleName}</option>`);
}

// 4. ADD DATA LOGIC
document.getElementById("shipmentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        senderId: CURRENT_USER.userId, originBranchId: 1, destinationBranchId: 1, serviceTypeId: 1, currentStatusId: 5,
        description: document.getElementById("sDesc").value,
        weight: parseFloat(document.getElementById("sWeight").value),
        estimatedDeliveryDate: new Date().toISOString()
    };
    await fetch(`${API_URL}/Shipments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    bootstrap.Modal.getInstance(document.getElementById('shipmentModal')).hide();
    getShipments();
});

document.getElementById("noteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        userId: CURRENT_USER.userId,
        title: document.getElementById("nTitle").value,
        content: document.getElementById("nContent").value
    };
    await fetch(`${API_URL}/Notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    bootstrap.Modal.getInstance(document.getElementById('noteModal')).hide();
    getNotes();
});

document.getElementById("userForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        firstName: document.getElementById("uFname").value,
        lastName: document.getElementById("uLname").value,
        email: document.getElementById("uEmail").value,
        passwordHash: document.getElementById("uPass").value,
        roleId: parseInt(document.getElementById("uRole").value),
        phone: "0000000000"
    };
    const res = await fetch(`${API_URL}/Users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        getUsers();
        alert("User Registered!");
    } else { alert("Error! Check duplicate email."); }
});