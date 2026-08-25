import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc,
  collection, 
  onSnapshot, 
  updateDoc 
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
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authSection = document.getElementById("auth-section");
const mainContent = document.getElementById("main-content");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const toggleAuthBtn = document.getElementById("toggle-auth-mode");
const authError = document.getElementById("auth-error");
const userProfile = document.getElementById("user-profile");
const userEmailDisplay = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

const matchSelect = document.getElementById("match-select");
const matchMetaDetails = document.getElementById("match-meta-details");
const metaDivision = document.getElementById("meta-division");
const metaCourt = document.getElementById("meta-court");
const metaOfficial = document.getElementById("meta-official");
const metaStatus = document.getElementById("meta-status");

const scoreboardView = document.getElementById("scoreboard-view");
const teamAName = document.getElementById("team-a-name");
const teamBName = document.getElementById("team-b-name");
const scoreADisplay = document.getElementById("score-a");
const scoreBDisplay = document.getElementById("score-b");
const dbStatus = document.getElementById("db-status");
const lastUpdatedDisplay = document.getElementById("last-updated");
const resetBtn = document.getElementById("reset-btn");

let isSignUp = false;
let currentMatchId = null;
let matchUnsubscribe = null;
let currentScores = { teamAScore: 0, teamBScore: 0 };

// Authentication Toggle
toggleAuthBtn.addEventListener("click", () => {
  isSignUp = !isSignUp;
  authTitle.textContent = isSignUp ? "Sign Up" : "Sign In";
  authSubmitBtn.textContent = isSignUp ? "Sign Up" : "Sign In";
  document.getElementById("auth-toggle-text").textContent = isSignUp ? "Already have an account?" : "Need an account?";
  toggleAuthBtn.textContent = isSignUp ? "Sign In" : "Sign Up";
});

// Authentication Handler
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.classList.add("hidden");
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    if (isSignUp) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    authError.textContent = error.message;
    authError.classList.remove("hidden");
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

// Auth State Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.classList.add("hidden");
    mainContent.classList.remove("hidden");
    userProfile.classList.remove("hidden");
    userEmailDisplay.textContent = user.email;
    loadMatches();
  } else {
    authSection.classList.remove("hidden");
    mainContent.classList.add("hidden");
    userProfile.classList.add("hidden");
    if (matchUnsubscribe) matchUnsubscribe();
  }
});

// Fetch Available Matches
function loadMatches() {
  onSnapshot(collection(db, "matches"), (snapshot) => {
    matchSelect.innerHTML = '<option value="">-- Choose a Match --</option>';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = `${data.teamA || "Team A"} vs ${data.teamB || "Team B"} (${data.status || "Scheduled"})`;
      matchSelect.appendChild(option);
    });
    
    if (currentMatchId) matchSelect.value = currentMatchId;
  });
}

// Select Active Match & Subscribe to Real-Time Updates
matchSelect.addEventListener("change", async (e) => {
  currentMatchId = e.target.value;
  if (matchUnsubscribe) matchUnsubscribe();

  if (!currentMatchId) {
    scoreboardView.classList.add("disabled");
    matchMetaDetails.classList.add("hidden");
    return;
  }

  scoreboardView.classList.remove("disabled");
  matchMetaDetails.classList.remove("hidden");

  // Subscribe to Match Document
  matchUnsubscribe = onSnapshot(doc(db, "matches", currentMatchId), async (matchSnap) => {
    if (!matchSnap.exists()) return;
    const matchData = matchSnap.data();

    // Populate Teams and Embedded Scores
    teamAName.textContent = matchData.teamA || "Home Team";
    teamBName.textContent = matchData.teamB || "Away Team";
    
    currentScores = matchData.score || { teamAScore: 0, teamBScore: 0 };
    scoreADisplay.textContent = currentScores.teamAScore ?? 0;
    scoreBDisplay.textContent = currentScores.teamBScore ?? 0;
    metaStatus.textContent = `Status: ${matchData.status || "N/A"}`;
    
    if (currentScores.lastUpdated) {
      lastUpdatedDisplay.textContent = `Last Updated: ${new Date(currentScores.lastUpdated).toLocaleTimeString()}`;
    }

    // Resolve Foreign References (divisions, courts, officials)
    fetchReference(matchData.divisionId, "divisions", "divisionName", metaDivision, "Division");
    fetchReference(matchData.courtId, "courts", "courtName", metaCourt, "Court");
    fetchReference(matchData.officialId, "officials", ["firstName", "lastName"], metaOfficial, "Official");
  });
});

// Helper to Resolve Document References
async function fetchReference(id, collectionName, field, targetElement, label) {
  if (!id) {
    targetElement.textContent = `${label}: N/A`;
    return;
  }
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(field)) {
        targetElement.textContent = `${label}: ${field.map(f => data[f] || "").join(" ").trim()}`;
      } else {
        targetElement.textContent = `${label}: ${data[field] || id}`;
      }
    } else {
      targetElement.textContent = `${label}: ${id}`;
    }
  } catch (err) {
    targetElement.textContent = `${label}: ${id}`;
  }
}

// Adjust Scores
document.querySelectorAll(".score-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    if (!currentMatchId) return;

    const team = e.target.getAttribute("data-team");
    const delta = parseInt(e.target.getAttribute("data-delta"), 10);

    let newAScore = currentScores.teamAScore || 0;
    let newBScore = currentScores.teamBScore || 0;

    if (team === "A") newAScore = Math.max(0, newAScore + delta);
    if (team === "B") newBScore = Math.max(0, newBScore + delta);

    dbStatus.textContent = "Database Status: Syncing...";

    try {
      await updateDoc(doc(db, "matches", currentMatchId), {
        score: {
          teamAScore: newAScore,
          teamBScore: newBScore,
          lastUpdated: new Date().toISOString()
        }
      });
      dbStatus.textContent = "Database Status: Synced";
    } catch (error) {
      dbStatus.textContent = "Database Status: Error Updating";
      console.error("Score update error:", error);
    }
  });
});

// Reset Score
resetBtn.addEventListener("click", async () => {
  if (!currentMatchId || !confirm("Reset current match score to 0-0?")) return;
  
  try {
    await updateDoc(doc(db, "matches", currentMatchId), {
      score: {
        teamAScore: 0,
        teamBScore: 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Reset score error:", error);
  }
});
