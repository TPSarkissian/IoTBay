import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js"
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js"

const firebaseConfig = {
    apiKey: "AIzaSyDR54BjRSGlutPBOjdx8A3GbofF9Ke2Kic",
    authDomain: "iotbay-ff263.firebaseapp.com",
    projectId: "iotbay-ff263",
    storageBucket: "iotbay-ff263.appspot.com",
    messagingSenderId: "1091175866865",
    appId: "1:1091175866865:web:bf69d7f64e6120cb2fe450"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();

window.authstate = function authState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log(user);
            sessionStorage.setItem("Customer_Type", 1);
            sessionStorage.setItem("Customer_ID", user.uid);
            sessionStorage.setItem("Email", user.email);
            sessionStorage.setItem("Full_Name", user.displayName);
            sessionStorage.setItem("Register_Date", user.metadata.creationTime);
            if (user.email.includes("@iotbaystaff")) {
                sessionStorage.setItem("isStaff", "TRUE");
            } else {
                sessionStorage.setItem("isStaff", "FALSE");
            }
            if (location.pathname == "/" || location.pathname.includes("index")) {
            } else if (location.pathname.includes("login") || location.pathname.includes("register")) {
                location.href = "index.html";
            }
        } else {
            if (location.pathname == "/" || location.pathname.includes("index")) {
                sessionStorage.setItem("Customer_Type", 0);
            }
        }
    });
}
window.addEventListener('load', window.authstate);

window.register = function register() {
    const full_name = document.getElementById("full_name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirm_password").value;

    if (password == "" || confirm_password == "" || email == "" || full_name == "") {
        document.getElementById("error_message").innerHTML = "Invalid input fields: One or more input fields are empty.";
        return;
    } else if (password !== confirm_password) {
        document.getElementById("error_message").innerHTML = "Invalid input fields: Passwords do not match.";
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            sessionStorage.setItem("Full_Name", full_name);
            await updateProfile(user, {
                displayName: full_name
            }).then(function () {
                sessionStorage.setItem("Customer_Type", 1);
                sessionStorage.setItem("Customer_ID", user.uid);
                sessionStorage.setItem("Email", user.email);
                sessionStorage.setItem("Register_Date", user.metadata.creationTime);
                sessionStorage.setItem("isStaff", "FALSE");
                location.href = "index.html";
            }, function (error) {
                sessionStorage.removeItem("Full_Name");
                document.getElementById("error_message").innerHTML = error;
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            if (errorCode == "auth/invalid-email") {
                document.getElementById("error_message").innerHTML = "Invalid input fields: Invalid email address.";
            } else if (errorCode == "auth/weak-password") {
                document.getElementById("error_message").innerHTML = "Invalid input fields: Password should be at least 6 characters.";
            } else if (errorCode == "auth/email-already-in-use") {
                document.getElementById("error_message").innerHTML = "Registration Failed: Email address already registered.";
            } else {
                document.getElementById("error_message").innerHTML = "Registration Failed: We were unable to process your registration request at this time, please try again after we refresh the page in 5 seconds.";
                setTimeout(function () {
                    location.reload();
                }, 5000);
            }
        });
}

window.login = function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (password == "" || email == "") {
        document.getElementById("error_message").innerHTML = "Invalid input fields: One or more input fields are empty.";
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            sessionStorage.setItem("Customer_Type", 1);
            sessionStorage.setItem("Customer_ID", user.uid);
            sessionStorage.setItem("Email", user.email);
            sessionStorage.setItem("Full_Name", user.displayName);
            sessionStorage.setItem("Register_Date", user.metadata.creationTime);
            if (user.email.includes("@iotbaystaff")) {
                sessionStorage.setItem("isStaff", "TRUE");
            } else {
                sessionStorage.setItem("isStaff", "FALSE");
            }
            location.href = "index.html";
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            if (errorCode == "auth/invalid-email") {
                document.getElementById("error_message").innerHTML = "Invalid input fields: Invalid email address.";
            } else if (errorCode == "auth/wrong-password" || errorCode == "auth/user-not-found") {
                document.getElementById("error_message").innerHTML = "Login Failed: Email or password was incorrect.";
            } else {
                document.getElementById("error_message").innerHTML = "Login Failed: We were unable to process your registration request at this time, please try again after we refresh the page in 5 seconds.";
                setTimeout(function () {
                    location.reload();
                }, 5000);
            }
        });
}

window.logout = function logout() {
    signOut(auth).then(() => {
        sessionStorage.clear();
        sessionStorage.setItem("Customer_Type", 0);
        location.href = "/index.html";
    }).catch((error) => {
        console.log(error);
    });
}