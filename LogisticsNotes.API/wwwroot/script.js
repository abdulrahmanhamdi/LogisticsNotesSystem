const API_URL = "/api";

let CURRENT_USER = null;
let ALL_SHIPMENTS = [];

const ROLE_ADMIN = 1;
const ROLE_CUSTOMER = 2;
const ROLE_COURIER = 3;

// ================= 1. LOGIN & AUTHENTICATION =================

document.addEventListener("DOMContentLoaded", () => {
    // Removed automatic retrieval of stored user (localStorage)
    // The application will now always start at the login screen.
    // const storedUser = localStorage.getItem("LOGI_USER");
    // if (storedUser) {
    //     try {
    //         CURRENT_USER = JSON.parse(storedUser);
    //         showDashboard();
    //     } catch (e) {
    //         console.error("Error parsing stored user", e);
    //         localStorage.removeItem("LOGI_USER");
    //     }
    // }

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

                    // Removed saving the user to localStorage:
                    // localStorage.setItem("LOGI_USER", JSON.stringify(user));

                    showDashboard();
                } else {
                    errorBox.classList.remove("hidden");
                    errorBox.innerText = "Incorrect login details!";
                }
            } catch (err) {
                console.error("Login Error:", err);
                errorBox.classList.remove("hidden");
                errorBox.innerText = "Error connecting to the server! Check if backend is running.";
            }
        });
    }
});

function showDashboard() {
    const loginScreen = document.getElementById("login-screen");
    if (loginScreen) {
        loginScreen.classList.add("hidden");
        loginScreen.style.display = "none";
    }

    const dashboard = document.getElementById("dashboard-screen");
    if (dashboard) {
        dashboard.classList.remove("hidden");
        dashboard.style.display = "flex";
    }

    if (CURRENT_USER) {
        document.getElementById("userNameDisplay").innerText = `${CURRENT_USER.firstName} ${CURRENT_USER.lastName}`;
        document.getElementById("userRoleDisplay").innerText = CURRENT_USER.role ? CURRENT_USER.role.roleName : "User";
        applyRolePermissions(CURRENT_USER.roleId);

        loadAllData();
    }
}

function logout() {
    CURRENT_USER = null;
    localStorage.removeItem("LOGI_USER");
    window.location.reload();
}// ================= 2. NAVIGATION & ROLE ACCESS =================

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

    if (navLogistics) navLogistics.style.display = "none";
    if (navNotes) navNotes.style.display = "none";
    if (navUsers) navUsers.style.display = "none";
    if (navBranches) navBranches.style.display = "none";
    if (navVehicles) navVehicles.style.display = "none";
    if (newShipmentBtn) newShipmentBtn.style.display = "none";

    if (roleId === ROLE_ADMIN) {
        navLogistics.style.display = "flex";
        navNotes.style.display = "flex";
        navUsers.style.display = "flex";
        navBranches.style.display = "flex";
        navVehicles.style.display = "flex";
        newShipmentBtn.style.display = "block";
        showSection('logistics');
    }
    else if (roleId === ROLE_CUSTOMER) {
        navLogistics.style.display = "flex";
        navNotes.style.display = "flex";
        newShipmentBtn.style.display = "block";
        showSection('logistics');
    }
    else if (roleId === ROLE_COURIER) {
        navLogistics.style.display = "flex";
        navNotes.style.display = "flex";
        newShipmentBtn.style.display = "none";
        showSection('logistics');
    }
}


function loadAllData() {
    getShipments();
    getNotes(); // سيجلب المجلدات والتاغات داخلياً
    if (CURRENT_USER.roleId === ROLE_ADMIN) {
        getUsers();
        getRoles(); // للمودال
        getBranchesTable();
        getVehicles();
    }
    loadShipmentLookups(); // لتجهيز قوائم الشحنات
}

// ================= 3. SHIPMENTS LOGIC =================

async function getShipments() {
    try {
        const res = await fetch(`${API_URL}/Shipments`);
        if (res.ok) {
            let data = await res.json();

            if (CURRENT_USER.roleId === ROLE_CUSTOMER) {
                data = data.filter(s => s.senderId === CURRENT_USER.userId);
            }
            else if (CURRENT_USER.roleId === ROLE_COURIER) {
                // Courier filter logic (kept empty because original logic was commented out)
                /*
                data = data.filter(s => 
                    s.assignedCourier?.userId === CURRENT_USER.userId ||
                    s.assignedCourierId === null
                );
                */
            }

            ALL_SHIPMENTS = data;
            renderShipments(data);

            const totalEl = document.getElementById("stat-total-shipments");
            const pendingEl = document.getElementById("stat-pending-shipments");

            if (totalEl) totalEl.innerText = data.length;
            if (pendingEl) pendingEl.innerText = data.filter(s => s.currentStatusId === 1).length;
        }
    } catch (e) {
        console.error("Error loading shipments", e);
    }
}

function renderShipments(data) {
    const tbody = document.getElementById("shipmentsTable");
    const actionsHeader = document.getElementById("actionsHeader");

    if (!tbody) return;
    tbody.innerHTML = "";

    const isAdmin = CURRENT_USER && CURRENT_USER.roleId === ROLE_ADMIN;
    const isCourier = CURRENT_USER && CURRENT_USER.roleId === ROLE_COURIER;

    if (actionsHeader) actionsHeader.style.display = "";

    data.forEach(s => {
        const totalPaid = s.payments ? s.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
        const remaining = s.shippingCost - totalPaid;

        let costDisplay = "";

        if (remaining <= 0) {
            costDisplay = `<span class="badge bg-success" style="font-size: 0.9rem;">Paid ($${s.shippingCost})</span>`;
        }
        else if (totalPaid > 0) {
            costDisplay = `
                <div class="text-warning fw-bold" style="font-size: 0.9rem;">$${remaining.toFixed(1)} left</div>
                <small class="text-muted text-decoration-line-through" style="font-size: 0.75rem;">$${s.shippingCost}</small>
            `;
        }
        else {
            costDisplay = s.shippingCost > 0
                ? `<span class="fw-bold text-danger">$${s.shippingCost}</span>`
                : `<span class="fw-bold text-muted">$0</span>`;
        }

        let actionButtons = '';
        if (isAdmin) {
            actionButtons = `
                <button class="btn btn-sm btn-outline-warning btn-action" onclick="openStatusModal(${s.shipmentId})" title="Status"><i class="fas fa-truck-loading"></i></button>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editShipment(${s.shipmentId})" title="Edit Price"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-success btn-action" onclick="openPaymentModal(${s.shipmentId})" title="Pay"><i class="fas fa-dollar-sign"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteShipment(${s.shipmentId})" title="Delete"><i class="fas fa-trash"></i></button>
            `;
        } else if (isCourier) {
            actionButtons = `
                <button class="btn btn-sm btn-outline-warning btn-action" onclick="openStatusModal(${s.shipmentId})" title="Update Status"><i class="fas fa-truck-loading"></i></button>
            `;
        } else {
            actionButtons = `
                <button class="btn btn-sm btn-outline-info btn-action" onclick="openStatusModal(${s.shipmentId})" title="View History"><i class="fas fa-eye"></i></button>
            `;
        }

        const originName = s.originBranch ? s.originBranch.branchName : s.originBranchId;
        const destName = s.destinationBranch ? s.destinationBranch.branchName : s.destinationBranchId;
        const statusDesc = s.currentStatus ? s.currentStatus.description : "";

        tbody.innerHTML += `
            <tr>
                <td>#${s.shipmentId}</td>
                <td>
                    <div class="fw-bold">${s.description}</div>
                    <small class="text-muted">${originName} &rarr; ${destName}</small>
                </td>
                <td>${s.weight} KG</td>
                <td>${costDisplay}</td> 
                <td><span class="badge ${getStatusBadge(s.currentStatusId)}" title="${statusDesc}">${s.currentStatus ? s.currentStatus.statusName : s.currentStatusId}</span></td>
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
    if (CURRENT_USER.roleId === ROLE_COURIER) return alert("Unauthorized");
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

    document.getElementById("sCost").value = s.shippingCost;

    await loadShipmentLookups();

    if (document.getElementById("sOrigin")) document.getElementById("sOrigin").value = s.originBranchId;
    if (document.getElementById("sDest")) document.getElementById("sDest").value = s.destinationBranchId;
    if (document.getElementById("sService")) document.getElementById("sService").value = s.serviceTypeId;
    if (document.getElementById("sCourier")) document.getElementById("sCourier").value = s.assignedCourierId || "";

    new bootstrap.Modal(document.getElementById('shipmentModal')).show();
}

const shipmentForm = document.getElementById("shipmentForm");
if (shipmentForm) {
    shipmentForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const weightVal = parseFloat(document.getElementById("sWeight").value);
        if (weightVal <= 0) return alert("Weight cannot be negative or zero!");

        const id = document.getElementById("sId").value;
        const isEdit = id ? true : false;
        const courierVal = document.getElementById("sCourier").value;
        const costVal = document.getElementById("sCost").value;

        const payload = {
            shipmentId: isEdit ? parseInt(id) : 0,
            senderId: CURRENT_USER.userId,
            shippingCost: costVal ? parseFloat(costVal) : 0,
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

        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('shipmentModal')).hide();
            getShipments();
        } else { alert("Error saving shipment"); }
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
                // حفظ القيمة الحالية إذا كنا في وضع التعديل
                const currentOrigin = originSel.value;
                const currentDest = destSel.value;

                originSel.innerHTML = "";
                destSel.innerHTML = "";
                branches.forEach(b => {
                    const opt = `<option value="${b.branchId}">${b.branchName} (${b.city})</option>`;
                    originSel.innerHTML += opt;
                    destSel.innerHTML += opt;
                });

                if (currentOrigin) originSel.value = currentOrigin;
                if (currentDest) destSel.value = currentDest;
            }
        }
        const resS = await fetch(`${API_URL}/ServiceTypes`);
        if (resS.ok) {
            const types = await resS.json();
            const serviceSel = document.getElementById("sService");
            if (serviceSel) {
                const current = serviceSel.value;
                serviceSel.innerHTML = '<option value="" disabled selected>-- Select Type --</option>';
                types.forEach(t => {
                    const id = t.serviceTypeId || t.ServiceTypeId;
                    const name = t.typeName || t.TypeName;
                    serviceSel.innerHTML += `<option value="${id}">${name} ($${t.basePrice} + $${t.pricePerKg}/kg)</option>`;
                });
                if (current) serviceSel.value = current;
            }
        }
        const resC = await fetch(`${API_URL}/Couriers`);
        if (resC.ok) {
            const couriers = await resC.json();
            const courierSel = document.getElementById("sCourier");
            if (courierSel) {
                const current = courierSel.value;
                courierSel.innerHTML = '<option value="">-- Unassigned --</option>';

                couriers.forEach(c => {
                    let displayName = `Courier #${c.courierId}`;
                    if (c.user) {
                        displayName = `${c.user.firstName} ${c.user.lastName}`;
                    }

                    if (c.vehicle) {
                        displayName += ` [${c.vehicle.model}]`;
                    }

                    courierSel.innerHTML += `<option value="${c.courierId}">${displayName}</option>`;
                });

                if (current) courierSel.value = current;
            }
        }
    } catch (e) { console.error("Error loading lookups", e); }
}

// ================= 4. NOTES LOGIC (FULL FEATURES) =================

async function loadNoteLookups() {
    try {
        // 1. Categories
        const resCat = await fetch(`${API_URL}/Categories`);
        if (resCat.ok) {
            const categories = await resCat.json();
            const catSelect = document.getElementById("nCategory");
            catSelect.innerHTML = '<option value="">-- No Category --</option>';
            categories.forEach(c => catSelect.innerHTML += `<option value="${c.categoryId}">${c.categoryName}</option>`);
        }

        // 2. Folders
        const resFold = await fetch(`${API_URL}/Folders`);
        if (resFold.ok) {
            let folders = await resFold.json();
            if (CURRENT_USER.roleId !== ROLE_ADMIN) folders = folders.filter(f => f.userId === CURRENT_USER.userId);
            const foldSelect = document.getElementById("nFolder");
            foldSelect.innerHTML = '<option value="">-- No Folder --</option>';
            folders.forEach(f => foldSelect.innerHTML += `<option value="${f.folderId}">${f.folderName}</option>`);
        }

        // 3. TAGS - Checkboxes
        const resTags = await fetch(`${API_URL}/Tags`);
        if (resTags.ok) {
            const tags = await resTags.json();
            const container = document.getElementById("tagsContainer");
            if (container) {
                container.innerHTML = "";
                tags.forEach(t => {
                    container.innerHTML += `
                        <div class="form-check form-check-inline">
                            <input class="form-check-input note-tag-check" type="checkbox" value="${t.tagId}" id="tag-${t.tagId}">
                            <label class="form-check-label" for="tag-${t.tagId}">
                                ${t.tagName}
                            </label>
                        </div>`;
                });
            }
        }
    } catch (e) { console.error("Error loading note lookups", e); }
}

// تحديث: جلب الملاحظات (المملوكة والمشاركة)
async function getNotes() {
    try {
        const res = await fetch(`${API_URL}/Notes`);
        if (res.ok) {
            const data = await res.json();

            // الفلترة: أعرض الملاحظات التي أملكها OR الملاحظات المشاركة معي
            let displayNotes = [];
            if (CURRENT_USER.roleId === ROLE_ADMIN) {
                displayNotes = data;
            } else {
                displayNotes = data.filter(n =>
                    n.userId === CURRENT_USER.userId || // ملاحظاتي
                    (n.sharedNotes && n.sharedNotes.some(sn => sn.sharedWithUserId === CURRENT_USER.userId)) // مشاركة معي
                );
            }

            document.getElementById("stat-total-notes").innerText = displayNotes.length;
            const list = document.getElementById("notesList");
            if (!list) return;
            list.innerHTML = "";

            displayNotes.forEach(n => {
                const isMine = n.userId === CURRENT_USER.userId;

                // شارات التمييز
                const ownerBadge = isMine
                    ? ""
                    : `<span class="badge bg-primary mb-2"><i class="fas fa-share"></i> Shared by ${n.user ? n.user.firstName : 'Unknown'}</span>`;

                const catBadge = n.category ? `<span class="badge bg-info text-dark me-1"><i class="fas fa-tag"></i> ${n.category.categoryName}</span>` : "";
                const foldBadge = n.folder ? `<span class="badge bg-warning text-dark me-1"><i class="fas fa-folder"></i> ${n.folder.folderName}</span>` : "";

                let tagsHtml = "";
                if (n.tags && n.tags.length > 0) n.tags.forEach(t => tagsHtml += `<span class="badge bg-secondary rounded-pill me-1" style="font-size:0.7rem;">#${t.tagName}</span>`);

                // أزرار التحكم (تظهر فقط للمالك أو المدير)
                let actionMenu = "";
                if (isMine || CURRENT_USER.roleId === ROLE_ADMIN) {
                    actionMenu = `
                        <div class="dropdown">
                            <button class="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="openShareModal(${n.noteId})"><i class="fas fa-user-plus"></i> Share</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="#" onclick="editNote(${n.noteId})">Edit</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteNote(${n.noteId})">Delete</a></li>
                            </ul>
                        </div>`;
                } else {
                    // للملاحظات المشاركة (عرض فقط)
                    actionMenu = `<small class="text-muted"><i class="fas fa-eye"></i> View Only</small>`;
                }

                list.innerHTML += `
                    <div class="col-md-4 mb-3">
                        <div class="card card-custom h-100 border-left-${isMine ? 'success' : 'primary'} shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h5 class="card-title fw-bold mb-0 ${isMine ? 'text-success' : 'text-primary'}">${n.title}</h5>
                                    ${actionMenu}
                                </div>
                                ${ownerBadge}
                                <div class="mb-2">${catBadge} ${foldBadge}</div>
                                <div class="mb-2">${tagsHtml}</div>
                                <p class="card-text text-muted" style="white-space: pre-wrap;">${n.content}</p>
                                <small class="text-muted" style="font-size: 0.8rem;">
                                    ${new Date(n.createdAt).toLocaleDateString()}
                                </small>
                            </div>
                        </div>
                    </div>`;
            });
        }
    } catch (e) { console.error("Error getting notes", e); }
}

// دالة فتح نافذة إنشاء/تعديل الملاحظة
function openNoteModal() {
    document.getElementById("noteForm").reset();
    document.getElementById("nId").value = "";
    document.getElementById("noteModalTitle").innerText = "New Note";
    // التأكد من إلغاء تحديد جميع العلامات عند فتح نافذة جديدة
    document.querySelectorAll('.note-tag-check').forEach(cb => cb.checked = false);
    loadNoteLookups();
    new bootstrap.Modal(document.getElementById('noteModal')).show();
}

// تحديث: دالة تعديل الملاحظة (مع دعم العلامات)
async function editNote(id) {
    const res = await fetch(`${API_URL}/Notes/${id}`);
    const n = await res.json();
    await loadNoteLookups(); // تحميل القوائم أولاً

    // ملء حقول النموذج
    document.getElementById("nId").value = n.noteId;
    document.getElementById("nTitle").value = n.title;
    document.getElementById("nContent").value = n.content;

    if (document.getElementById("nCategory")) document.getElementById("nCategory").value = n.categoryId || "";
    if (document.getElementById("nFolder")) document.getElementById("nFolder").value = n.folderId || "";

    // إلغاء تحديد الكل قبل تحديد العلامات الخاصة بهذه الملاحظة
    document.querySelectorAll('.note-tag-check').forEach(cb => cb.checked = false);

    // تحديد العلامات المرتبطة بالملاحظة
    if (n.tags && n.tags.length > 0) {
        n.tags.forEach(t => {
            const checkbox = document.getElementById(`tag-${t.tagId}`);
            if (checkbox) checkbox.checked = true;
        });
    }

    document.getElementById("noteModalTitle").innerText = "Edit Note";
    new bootstrap.Modal(document.getElementById('noteModal')).show();
}

// منطق حفظ الملاحظة (مع دعم العلامات)
const noteForm = document.getElementById("noteForm");
if (noteForm) {
    noteForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("nId").value;
        const isEdit = id ? true : false;

        // جلب معرفات العلامات المحددة
        const selectedTagIds = [];
        document.querySelectorAll('.note-tag-check:checked').forEach(cb => {
            selectedTagIds.push(parseInt(cb.value));
        });

        const payload = {
            noteId: isEdit ? parseInt(id) : 0,
            userId: CURRENT_USER.userId,
            title: document.getElementById("nTitle").value,
            content: document.getElementById("nContent").value,
            categoryId: document.getElementById("nCategory").value ? parseInt(document.getElementById("nCategory").value) : null,
            folderId: document.getElementById("nFolder").value ? parseInt(document.getElementById("nFolder").value) : null,
            tagIds: selectedTagIds
        };

        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `${API_URL}/Notes/${id}` : `${API_URL}/Notes`;

        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('noteModal')).hide();
            getNotes();
        } else {
            alert("Error saving note");
        }
    });
}

// دالة حذف الملاحظة
async function deleteNote(id) {
    if (confirm("Delete Note?")) {
        await fetch(`${API_URL}/Notes/${id}`, { method: "DELETE" });
        getNotes();
    }
}

// دالة فتح نافذة المشاركة
async function openShareModal(noteId) {
    document.getElementById("shareNoteId").value = noteId;

    // جلب قائمة المستخدمين لتعبئة الـ Select
    const res = await fetch(`${API_URL}/Users`);
    if (res.ok) {
        const users = await res.json();
        const sel = document.getElementById("shareUserSelect");
        sel.innerHTML = "";
        // استبعاد نفسي من القائمة
        users.filter(u => u.userId !== CURRENT_USER.userId).forEach(u => {
            sel.innerHTML += `<option value="${u.userId}">${u.firstName} ${u.lastName} (${u.email})</option>`;
        });
    }

    new bootstrap.Modal(document.getElementById('shareModal')).show();
}

// منطق تنفيذ المشاركة
const shareForm = document.getElementById("shareForm");
if (shareForm) {
    shareForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            noteId: parseInt(document.getElementById("shareNoteId").value),
            sharedWithUserId: parseInt(document.getElementById("shareUserSelect").value),
            permissionLevel: document.getElementById("sharePermission").value
        };

        const res = await fetch(`${API_URL}/SharedNotes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Note shared successfully!");
            bootstrap.Modal.getInstance(document.getElementById('shareModal')).hide();
            // تحديث قائمة الملاحظات لعرض أي تغييرات محتملة (على الرغم من أن المشاركة لا تؤثر على عرض القائمة الخاصة بنا مباشرة)
            getNotes();
        } else {
            const err = await res.json();
            alert("Error: " + (err.message || "Could not share note"));
        }
    });
}

// ================= 5. USERS LOGIC (CRUD + Courier Profile) =================

let isEditingUser = false;
// Assuming ROLE_COURIER is defined elsewhere (e.g., const ROLE_COURIER = 3;)
// If not defined, you must define it at the top of the file:
// const ROLE_COURIER = 3;

async function getUsers() {
    const res = await fetch(`${API_URL}/Users`);
    if (res.ok) {
        const data = await res.json();
        const tbody = document.getElementById("usersTable");
        if (tbody) {
            tbody.innerHTML = "";
            data.forEach(u => {
                // Check if the user is a Courier (Role ID 3 assumed)
                const isCourier = u.roleId === ROLE_COURIER;
                const courierBtn = isCourier
                    ? `<button class="btn btn-sm btn-outline-dark ms-1" onclick="openCourierModal(${u.userId})" title="Manage Courier Profile"><i class="fas fa-truck"></i></button>`
                    : "";

                tbody.innerHTML += `
                    <tr>
                        <td>${u.userId}</td>
                        <td>${u.firstName} ${u.lastName}</td>
                        <td>${u.email}</td>
                        <td><span class="badge bg-secondary">${u.role?.roleName || '-'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="editUser(${u.userId})" title="Edit"><i class="fas fa-edit"></i></button>
                            ${courierBtn}
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
    document.getElementById("uId").disabled = false;
    document.getElementById("userModalTitle").innerText = "New User";

    getRoles();

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

        document.getElementById("uId").disabled = true;
        document.getElementById("userModalTitle").innerText = "Edit User";

        await getRoles();
        document.getElementById("uRole").value = u.roleId; // Re-apply role ID after filling options
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
            // Simple logic for password hash for CRUD demo. In real apps, hash is handled server-side.
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
        } else {
            const errData = await res.json();
            alert("Error saving user: " + (errData.message || "Unknown Error"));
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
            const current = sel.value;
            sel.innerHTML = "";
            data.forEach(r => sel.innerHTML += `<option value="${r.roleId}">${r.roleName}</option>`);
            if (current) sel.value = current;
        }
    }
}

// --- Courier Profile Logic ---

async function openCourierModal(userId) {
    document.getElementById("courierForm").reset();
    document.getElementById("cUserId").value = userId;

    // 1. Fetch Vehicles to populate the dropdown list
    const resVeh = await fetch(`${API_URL}/Vehicles`);
    if (resVeh.ok) {
        const vehicles = await resVeh.json();
        const sel = document.getElementById("cVehicle");
        sel.innerHTML = '<option value="">-- No Vehicle --</option>';
        vehicles.forEach(v => {
            // Display available cars or those already assigned to the courier
            sel.innerHTML += `<option value="${v.vehicleId}">${v.model} (${v.licensePlate}) - ${v.status}</option>`;
        });
    }

    // 2. Attempt to fetch current Courier profile data (if exists)
    const resProf = await fetch(`${API_URL}/Couriers/ByUserId/${userId}`);
    if (resProf.status !== 204) { // 204 means No Content (New Courier)
        const profile = await resProf.json();
        document.getElementById("cId").value = profile.courierId || "";
        document.getElementById("cLicense").value = profile.licenseNumber || "";
        // Set vehicle value after options are populated
        document.getElementById("cVehicle").value = profile.vehicleId || "";
        document.getElementById("cShiftStart").value = profile.shiftStart ? profile.shiftStart.substring(0, 5) : ""; // Format time
        document.getElementById("cShiftEnd").value = profile.shiftEnd ? profile.shiftEnd.substring(0, 5) : ""; // Format time
    } else {
        document.getElementById("cId").value = ""; // New profile
    }

    new bootstrap.Modal(document.getElementById('courierModal')).show();
}

const courierForm = document.getElementById("courierForm");
if (courierForm) {
    courierForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const uId = document.getElementById("cUserId").value;
        const cId = document.getElementById("cId").value;
        const lic = document.getElementById("cLicense").value;
        const vId = document.getElementById("cVehicle").value;
        const sStart = document.getElementById("cShiftStart").value;
        const sEnd = document.getElementById("cShiftEnd").value;

        const payload = {
            userId: parseInt(uId),
            courierId: cId ? parseInt(cId) : 0,
            licenseNumber: lic,
            vehicleId: vId ? parseInt(vId) : null,
            shiftStart: sStart ? sStart + ":00" : null,
            shiftEnd: sEnd ? sEnd + ":00" : null
        };

        try {
            const res = await fetch(`${API_URL}/Couriers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Courier Profile Saved Successfully! ✅");
                bootstrap.Modal.getInstance(document.getElementById('courierModal')).hide();
            } else {
                const errorData = await res.json();
                alert("Error: " + (errorData.message || JSON.stringify(errorData)));
                console.error("Server Error:", errorData);
            }
        } catch (err) {
            alert("Network Error: Check console.");
            console.error(err);
        }
    });
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

        const res = await fetch(`${API_URL}/ShipmentStatuses`);
        if (res.ok) {
            const statuses = await res.json();
            const sel = document.getElementById("newStatusSelect");
            sel.innerHTML = "";
            statuses.forEach(st => sel.innerHTML += `<option value="${st.statusId}">${st.statusName}</option>`);
        }

        document.getElementById("statusNotes").value = "";
    }

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
                    </tr>`;
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
        const notesVal = document.getElementById("statusNotes").value;

        const payload = {
            shipmentId: parseInt(id),
            newStatusId: newStatusId,
            notes: notesVal
        };

        try {
            const res = await fetch(`${API_URL}/Shipments/UpdateStatus`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Status Updated & Note Sent! ✅");
                bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
                getShipments();
            } else {
                const err = await res.json();
                alert("Error: " + (err.message || "Failed to update status"));
            }
        } catch (err) {
            console.error(err);
            alert("Connection error.");
        }
    });
}

function getStatusBadge(statusId) {
    if (statusId === 1) return "bg-warning text-dark"; // Pending
    if (statusId === 2) return "bg-info text-white"; // Picked Up
    if (statusId === 3) return "bg-primary"; // In Transit
    if (statusId === 4) return "bg-primary"; // Ready
    if (statusId === 5) return "bg-success"; // Delivered
    if (statusId === 6) return "bg-danger"; // Cancelled
    return "bg-secondary";
}

// ================= 8. PAYMENTS LOGIC =================

// 1. Open payment modal
async function openPaymentModal(shipmentId) {
    document.getElementById("payShipmentId").value = shipmentId;

    document.getElementById("paymentForm").reset();

    await loadPaymentMethods();
    await loadPaymentHistory(shipmentId);

    new bootstrap.Modal(document.getElementById('paymentModal')).show();
}

// 2. Load payment history
async function loadPaymentHistory(shipmentId) {
    const tbody = document.getElementById("paymentHistoryBody");
    tbody.innerHTML = "<tr><td colspan='3' class='text-center'>Loading...</td></tr>";

    try {
        const res = await fetch(`${API_URL}/Payments/ByShipment/${shipmentId}`);
        if (res.ok) {
            const payments = await res.json();
            tbody.innerHTML = "";

            if (payments.length === 0) {
                tbody.innerHTML = "<tr><td colspan='3' class='text-center text-muted'>No payments recorded.</td></tr>";
            } else {
                payments.forEach(p => {
                    tbody.innerHTML += `
                        <tr>
                            <td>${new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td>${p.methodName}</td>
                            <td class="fw-bold text-success">$${p.amount}</td>
                        </tr>`;
                });
            }
        } else {
            tbody.innerHTML = "<tr><td colspan='3' class='text-center text-danger'>Error loading history.</td></tr>";
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = "<tr><td colspan='3' class='text-center text-danger'>Connection Error.</td></tr>";
    }
}

// 3. Load payment methods (dropdown)
async function loadPaymentMethods() {
    const sel = document.getElementById("payMethod");
    if (sel.options.length > 0) return;

    try {
        const res = await fetch(`${API_URL}/Payments/Methods`);
        if (res.ok) {
            const methods = await res.json();
            sel.innerHTML = "";
            methods.forEach(m =>
                sel.innerHTML += `<option value="${m.methodId}">${m.methodName}</option>`
            );
        }
    } catch (e) {
        console.error("Error loading payment methods", e);
    }
}

// 4. Payment submit handler
const paymentForm = document.getElementById("paymentForm");
if (paymentForm) {
    paymentForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = paymentForm.querySelector("button[type='submit']");
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing...";

        const shipmentId = parseInt(document.getElementById("payShipmentId").value);
        const amount = parseFloat(document.getElementById("payAmount").value);
        const methodId = parseInt(document.getElementById("payMethod").value);

        if (amount <= 0) {
            alert("Amount must be positive!");
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
            return;
        }

        const payload = {
            shipmentId: shipmentId,
            methodId: methodId,
            amount: amount
        };

        try {
            const res = await fetch(`${API_URL}/Payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                document.getElementById("payAmount").value = "";
                await loadPaymentHistory(shipmentId);
                alert("Payment Recorded Successfully! ✅");
            } else {
                alert("Error recording payment.");
            }
        } catch (err) {
            console.error(err);
            alert("Connection Error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });
}

// ================= 9. VEHICLES LOGIC =================

async function getVehicles() {
    try {
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
    } catch (e) { console.error("Error getting vehicles", e); }
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