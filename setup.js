import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEKqPBKFwTnCHTt9sij5bgNeJqb0e2PE8",
  authDomain: "vballscorer-3292c.firebaseapp.com",
  projectId: "vballscorer-3292c",
  storageBucket: "vballscorer-3292c.firebasestorage.app",
  messagingSenderId: "604715132324",
  appId: "1:604715132324:web:c682e61dc8518bf18ecd31"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tab Controls
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const messageBox = document.getElementById("setup-message");

// Form Elements
const addDivisionForm = document.getElementById("add-division-form");
const addCourtForm = document.getElementById("add-court-form");
const addOfficialForm = document.getElementById("add-official-form");

// List Containers
const divisionsList = document.getElementById("divisions-list");
const courtsList = document.getElementById("courts-list");
const officialsList = document.getElementById("officials-list");

// --- Tab Navigation Logic ---
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const targetTab = btn.getAttribute("data-tab");

    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => {
      c.classList.add("hidden");
      c.classList.remove("active");
    });

    btn.classList.add("active");
    const activeSection = document.getElementById(targetTab);
    if (activeSection) {
      activeSection.classList.remove("hidden");
      activeSection.classList.add("active");
    }
  });
});

// --- Data Add Listeners ---

// 1. Add Division
addDivisionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const divisionName = document.getElementById("division-name").value.trim();
  
  try {
    await addDoc(collection(db, "divisions"), { divisionName });
    showMessage(`Division "${divisionName}" created!`, "success");
    addDivisionForm.reset();
  } catch (err) {
    showMessage(`Error adding division: ${err.message}`, "error");
  }
});

// 2. Add Court
addCourtForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const courtName = document.getElementById("court-name").value.trim();
  
  try {
    await addDoc(collection(db, "courts"), { courtName });
    showMessage(`Court "${courtName}" created!`, "success");
    addCourtForm.reset();
  } catch (err) {
    showMessage(`Error adding court: ${err.message}`, "error");
  }
});

// 3. Add Official
addOfficialForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const firstName = document.getElementById("official-first-name").value.trim();
  const lastName = document.getElementById("official-last-name").value.trim();
  
  try {
    await addDoc(collection(db, "officials"), { firstName, lastName });
    showMessage(`Official "${firstName} ${lastName}" registered!`, "success");
    addOfficialForm.reset();
  } catch (err) {
    showMessage(`Error adding official: ${err.message}`, "error");
  }
});

// --- Real-Time Data Listeners & Renderers ---

function bindRealtimeLists() {
  // Listen to Divisions
  onSnapshot(collection(db, "divisions"), (snapshot) => {
    divisionsList.innerHTML = "";
    if (snapshot.empty) {
      divisionsList.innerHTML = "<li>No divisions found.</li>";
      return;
    }
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const li = createListItem(docSnap.id, data.divisionName || "Unnamed Division", "divisions");
      divisionsList.appendChild(li);
    });
  });

  // Listen to Courts
  onSnapshot(collection(db, "courts"), (snapshot) => {
    courtsList.innerHTML = "";
    if (snapshot.empty) {
      courtsList.innerHTML = "<li>No courts found.</li>";
      return;
    }
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const li = createListItem(docSnap.id, data.courtName || "Unnamed Court", "courts");
      courtsList.appendChild(li);
    });
  });

  // Listen to Officials
  onSnapshot(collection(db, "officials"), (snapshot) => {
    officialsList.innerHTML = "";
    if (snapshot.empty) {
      officialsList.innerHTML = "<li>No officials found.</li>";
      return;
    }
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unnamed Official";
      const li = createListItem(docSnap.id, fullName, "officials");
      officialsList.appendChild(li);
    });
  });
}

// UI Item Factory with Delete Support
function createListItem(docId, labelText, collectionName) {
  const li = document.createElement("li");
  li.className = "list-item";
  
  const span = document.createElement("span");
  span.textContent = labelText;
  
  const delBtn = document.createElement("button");
  delBtn.textContent = "Delete";
  delBtn.className = "btn warning btn-sm";
  delBtn.addEventListener("click", async () => {
    if (confirm(`Are you sure you want to delete "${labelText}"?`)) {
      try {
        await deleteDoc(doc(db, collectionName, docId));
        showMessage(`Deleted "${labelText}".`, "success");
      } catch (err) {
        showMessage(`Delete failed: ${err.message}`, "error");
      }
    }
  });

  li.appendChild(span);
  li.appendChild(delBtn);
  return li;
}

function showMessage(msg, type) {
  messageBox.textContent = msg;
  messageBox.className = `status-msg ${type}`;
  messageBox.classList.remove("hidden");
  setTimeout(() => {
    messageBox.classList.add("hidden");
  }, 4000);
}

// Initialize Realtime Sync
bindRealtimeLists();
