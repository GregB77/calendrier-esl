// AUTHENTIFICATION ============================================================

// Définir la persistance sur SESSION (expire à la fermeture de l'onglet)
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
  .then(() => {
    console.log("Persistance SESSION activée : l'utilisateur sera déconnecté à la fermeture de l'onglet.");
  })
  .catch((error) => {
    console.error("Erreur de persistance :", error);
  });

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Validation basique
  if (!email || !password) {
    showError("Veuillez remplir tous les champs");
    return;
  }

  if (!isValidEmail(email)) {
    showError("Adresse email invalide");
    return;
  }

  // Désactiver le bouton pendant la connexion
  const btn = event.target;
  btn.disabled = true;
  btn.innerHTML = '<span>Connexion...</span>';

  // Connexion Firebase
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      console.log("Connexion réussie:", userCredential.user.email);
      window.location.href = "app.html";
    })
    .catch(error => {
      console.error("Erreur de connexion:", error);
      showError(getFirebaseErrorMessage(error.code));
      btn.disabled = false;
      btn.innerHTML = '<span>Se connecter</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    });
}

function resetPassword() {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    showError("Veuillez saisir votre adresse email");
    return;
  }

  if (!isValidEmail(email)) {
    showError("Adresse email invalide");
    return;
  }

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      const errorDiv = document.getElementById("error");
      errorDiv.style.display = "block";
      errorDiv.style.color = "#22c55e";
      errorDiv.textContent =
        "Un email de réinitialisation vient de vous être envoyé.";
    })
    .catch(error => {
      console.error("Erreur reset password:", error);
      showError(getFirebaseErrorMessage(error.code));
    });
}


// VALIDATION & HELPERS ========================================================

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showError(message) {
  const errorDiv = document.getElementById("error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    
    // Animation shake
    errorDiv.style.animation = "none";
    setTimeout(() => {
      errorDiv.style.animation = "shake 0.4s";
    }, 10);
    
    // Masquer après 5 secondes
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  }
}

function getFirebaseErrorMessage(code) {
  const messages = {
    "auth/invalid-email": "Adresse email invalide",
    "auth/user-disabled": "Ce compte a été désactivé",
    "auth/user-not-found": "Aucun compte ne correspond à cet email",
    "auth/wrong-password": "Mot de passe incorrect",
    "auth/email-already-in-use": "Cette adresse email est déjà utilisée",
    "auth/weak-password": "Le mot de passe est trop faible",
    "auth/operation-not-allowed": "Opération non autorisée",
    "auth/too-many-requests": "Trop de tentatives. Veuillez réessayer plus tard",
    "auth/network-request-failed": "Erreur de connexion réseau"
  };

  return messages[code] || "Une erreur est survenue. Veuillez réessayer.";
}


// GESTION SESSION =============================================================

// Vérifier si l'utilisateur est déjà connecté et rediriger si sur la page login
firebase.auth().onAuthStateChanged(user => {
  if (user && window.location.pathname.includes("index.html")) {
    window.location.href = "app.html";
  }
});


// ÉVÉNEMENTS ==================================================================

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      const errorDiv = document.getElementById("error");
      if (errorDiv && errorDiv.style.display === "block") {
        errorDiv.style.display = "none";
      }
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const errorDiv = document.getElementById("error");
      if (errorDiv && errorDiv.style.display === "block") {
        errorDiv.style.display = "none";
      }
    });
    
    // Soumission avec Enter
    passwordInput.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        login();
      }
    });
  }
});
