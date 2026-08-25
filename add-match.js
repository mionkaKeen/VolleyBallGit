import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc 
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

const divisionSelect = document.getElementById("division-select");
const courtSelect = document.getElementById("court-select");
const officialSelect = document.getElementById("official-select");
const addMatchForm = document.getElementById("add-match-form");
const messageDiv = document.getElementById("form-message");

function listenAndDebug(collectionName, selectElement, defaultLabel) {
  if (!selectElement) {
    console.error(`Select element for ${collectionName} was NOT found in DOM! Check HTML IDs.`);
    return;
  }

  onSnapshot(collection(db, collectionName), (snapshot) => {
    console.log(`📡 Realtime fetch for [${collectionName}]: Found ${snapshot.size} documents.`);
    
    selectElement.innerHTML = `<option value="">-- Select ${defaultLabel} --</option>`;

    if (snapshot.empty) {
      console.warn(`⚠️ Collection "${collectionName}" is completely empty in Firestore.`);
      selectElement.innerHTML = `<option value="">No ${defaultLabel}s found in database</option>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      console.log(`Document ID (${docSnap.id}) in [${collectionName}]:`, data);

      // Try multiple field variations
      const displayName = data.divisionName || data.courtName || 
                          (data.firstName ? `${data.firstName} ${data.lastName || ''}` : null) || 
                          data.name || docSnap.id;

      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = displayName;
      selectElement.appendChild(option);
    });
  }, (error) => {
    console.error(`❌ Firestore Error on collection [${collectionName}]:`, error);
    selectElement.innerHTML = `<option value="">Permission Error / Failed to load</option>`;
  });
}

// Start Listeners
listenAndDebug("divisions", divisionSelect, "Division");
listenAndDebug("courts", courtSelect, "Court");
listenAndDebug("officials", officialSelect, "Official");

// Submit Handler
if (addMatchForm) {
  addMatchForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const teamAEl = document.getElementById("team-a");
    const teamBEl = document.getElementById("team-b");
    const matchTimeEl = document.getElementById("match-time");
    const statusEl = document.getElementById("match-status");

    if (!divisionSelect?.value) {
      showMessage("Please select a division.", "error");
      return;
    }

    const newMatch = {
      divisionId: divisionSelect.value,
      courtId: courtSelect?.value || "",
      officialId: officialSelect?.value || "",
      teamA: teamAEl ? teamAEl.value.trim() : "",
      teamB: teamBEl ? teamBEl.value.trim() : "",
      matchTime: matchTimeEl?.value ? new Date(matchTimeEl.value).toISOString() : new Date().toISOString(),
      status: statusEl ? statusEl.value : "Scheduled",
      score: { teamAScore: 0, teamBScore: 0, lastUpdated: new Date().toISOString() }
    };

    try {
      const docRef = await addDoc(collection(db, "matches"), newMatch);
      showMessage(`Match created! ID: ${docRef.id}`, "success");
      addMatchForm.reset();
    } catch (err) {
      console.error("Match save error:", err);
      showMessage(`Error: ${err.message}`, "error");
    }
  });
}

function showMessage(msg, type) {
  if (!messageDiv) return;
  messageDiv.textContent = msg;
  messageDiv.className = `status-msg ${type}`;
  messageDiv.classList.remove("hidden");
}
