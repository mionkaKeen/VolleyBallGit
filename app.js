import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- YOUR FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authError = document.getElementById("authError");
const authSection = document.getElementById("authSection");
const mainContent = document.getElementById("mainContent");
const tabOfficials = document.getElementById("tab-officials");
const scoreboard = document.getElementById("projectionView");

// --- LOGIN EVENT HANDLER ---
loginBtn.addEventListener("click", async (e) => {
  e.preventDefault(); // Prevents page reload if wrapped in a <form>

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Basic validation check before querying Firebase
  if (!email || !password) {
    showError("Please enter both email and password.");
    return;
  }

  try {
    // Clear previous errors
    hideError();

    // Authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in successfully:", userCredential.user.email);
    
    // Clear input fields on success
    emailInput.value = "";
    passwordInput.value = "";

  } catch (error) {
    console.error("Firebase Login Error:", error.code, error.message);
    
    // Provide user-friendly feedback for common Firebase Auth errors
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        showError("Invalid email or password. Please try again.");
        break;
      case 'auth/invalid-email':
        showError("Please enter a valid email address.");
        break;
      case 'auth/too-many-requests':
        showError("Access disabled temporarily due to too many failed login attempts.");
        break;
      default:
        showError(error.message || "Failed to log in. Please check your network.");
    }
  }
});

// --- LOGOUT EVENT HANDLER ---
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    showError("Error signing out.");
  }
});

// --- AUTH STATE LISTENER & ROLE UI CONTROL ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Show Authenticated UI
    authSection.classList.add("hidden");
    mainContent.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");

    // Fetch User Role from Firestore (Database structure unchanged)
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      let userRole = "spectator"; // Default fallback
      if (userSnap.exists()) {
        userRole = userSnap.data().role?.toLowerCase() || "spectator";
      }

      applyRolePermissions(userRole);
    } catch (err) {
      console.warn("Could not fetch user role, defaulting to spectator view.", err);
      applyRolePermissions("spectator");
    }

  } else {
    // Show Unauthenticated / Login UI
    authSection.classList.remove("hidden");
    mainContent.classList.add("hidden");
    logoutBtn.classList.add("hidden");
  }
});

// --- UI HELPERS ---
function showError(message) {
  authError.textContent = message;
  authError.classList.remove("hidden");
}

function hideError() {
  authError.textContent = "";
  authError.classList.add("hidden");
}

function applyRolePermissions(role) {
  // Only Coordinator/Admin views sensitive 'Officials' tab (per wireframe star)
  if (role === "coordinator" || role === "administrator" || role === "admin") {
    if (tabOfficials) tabOfficials.style.display = "inline-block";
    if (scoreboard) scoreboard.classList.remove("disabled");
  } else {
    if (tabOfficials) tabOfficials.style.display = "none";
    // Disable editing controls on scoreboard for player/spectator/coach roles
    if (scoreboard) scoreboard.classList.add("disabled");
  }
}
