import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js"
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js"
import { getFirestore, doc, getDoc, getDocs, collection, setDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js"

const firebaseConfig = {
    apiKey: "AIzaSyDR54BjRSGlutPBOjdx8A3GbofF9Ke2Kic",
    authDomain: "iotbay-ff263.firebaseapp.com",
    projectId: "iotbay-ff263",
    storageBucket: "iotbay-ff263.appspot.com",
    messagingSenderId: "1091175866865",
    appId: "1:1091175866865:web:bf69d7f64e6120cb2fe450"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

async function sendLog(id, action, type) {
    var now = new Date().valueOf();
    await setDoc(doc(db, "logs", id + ":" + now.toString()), {
        logUser: id,
        logTimestamp: now,
        logAction: action,
        logType: type
    }, { merge: true });
}

window.authstate = function authState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
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
        } else {
            if (location.pathname == "/" || location.pathname.includes("index")) {
                sessionStorage.setItem("Customer_Type", 0);
            }
        }
        displayProducts();
    });
}
window.addEventListener('load', window.authstate);

window.register = async function register() {
    var full_name = document.getElementById("full_name").value;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var confirm_password = document.getElementById("confirm_password").value;

    if (password == "" || confirm_password == "" || email == "" || full_name == "") {
        document.getElementById("error_message").innerHTML = "Invalid input fields: One or more input fields are empty.";
        return;
    } else if (password !== confirm_password) {
        document.getElementById("error_message").innerHTML = "Invalid input fields: Passwords do not match.";
        return;
    }

    await createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            sessionStorage.setItem("Full_Name", full_name);
            await updateProfile(user, {
                displayName: sessionStorage.getItem("Full_Name")
            }).then(async function () {
                sessionStorage.setItem("Customer_Type", 1);
                sessionStorage.setItem("Customer_ID", user.uid);
                sessionStorage.setItem("Email", user.email);
                sessionStorage.setItem("Register_Date", user.metadata.creationTime);
                sessionStorage.setItem("isStaff", "FALSE");
                await sendLog(user.uid, "Signed up for system", "Customer");
                location.href = "index.html";
            }, async function (error) {
                sessionStorage.removeItem("Full_Name");
                document.getElementById("error_message").innerHTML = error;
                await sendLog("Unknown", "Failed to update name of the email: " + email, "Customer");
            });
        })
        .catch(async (error) => {
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
            await sendLog("Unknown", "Failed sign up attempt with email: " + email, "Customer");
        });
}

window.login = async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (password == "" || email == "") {
        document.getElementById("error_message").innerHTML = "Invalid input fields: One or more input fields are empty.";
        return;
    }

    await signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            sessionStorage.setItem("Customer_Type", 1);
            sessionStorage.setItem("Customer_ID", user.uid);
            sessionStorage.setItem("Email", user.email);
            sessionStorage.setItem("Full_Name", user.displayName);
            sessionStorage.setItem("Register_Date", user.metadata.creationTime);
            if (user.email.includes("@iotbaystaff")) {
                sessionStorage.setItem("isStaff", "TRUE");
                await sendLog(user.uid, "Logged into system", "Admin");
            } else {
                sessionStorage.setItem("isStaff", "FALSE");
                await sendLog(user.uid, "Logged into system", "Customer");
            }
            location.href = "index.html";
        })
        .catch(async (error) => {
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
            await sendLog("Unknown", "Failed login attempt with email: " + email, "Customer");
        });
}

window.findAllCustomerTranscations = async function findAllCustomerTranscations(id) {
    var array = [];
    const q = query(collection(db, "orders"), where("customerId", "==", id));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        var json = {
            trackingId: doc.id,
            data: doc.data()
        }
        array.push(json);
    });
    sessionStorage.setItem("Receipts", JSON.stringify(array));
}

window.findAllTranscations = async function findAllTranscations() {
    var array = [];
    const q = query(collection(db, "orders"), orderBy("orderStatus", "asc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        var json = {
            trackingId: doc.id,
            data: doc.data()
        }
        array.push(json);
    });
    sessionStorage.setItem("Orders", JSON.stringify(array));
}

window.updateOrderStatus = async function updateOrderStatus(id, status) {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    var dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    if (status != "Complete") {
        await setDoc(doc(db, "orders", id), {
            orderStatus: status
        }, { merge: true });
    } else {
        await setDoc(doc(db, "orders", id), {
            orderStatus: status,
            orderArrival: dateTimeString
        }, { merge: true });
    }
    findAllTranscations();
}

window.loadProduct = async function loadProduct(id) {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        sessionStorage.setItem("Product_Description", docSnap.data()["Description"]);
        sessionStorage.setItem("Product_Img", docSnap.data()["Img"]);
        sessionStorage.setItem("Product_Name", docSnap.data()["Name"]);
        sessionStorage.setItem("Product_Price", docSnap.data()["Price"]);
        sessionStorage.setItem("Product_Stock", docSnap.data()["Stock"]);
        sessionStorage.setItem("Product_ID", id);
    }
}

window.updateProduct = async function updateProduct(id, price, stock) {
    var setPrice = parseFloat(price).toFixed(2);
    var setStock = parseInt(stock);
    if (Number.isInteger(setStock) && !isNaN(parseFloat(setPrice))) {
        await setDoc(doc(db, "products", id), {
            Price: parseFloat(setPrice),
            Stock: setStock
        }, { merge: true });
        await sendLog(sessionStorage.getItem("Customer_ID"), "Set price of product (" + id + ") to $" + parseFloat(setPrice), "Admin");
        await sendLog(sessionStorage.getItem("Customer_ID"), "Set stock of product (" + id + ") to " + setStock, "Admin");
    } else if (!isNaN(parseFloat(setPrice)) && !Number.isInteger(setStock)) {
        await setDoc(doc(db, "products", id), {
            Price: parseFloat(setPrice)
        }, { merge: true });
        await sendLog(sessionStorage.getItem("Customer_ID"), "Set price of product (" + id + ") to $" + parseFloat(setPrice), "Admin");
    } else if (Number.isInteger(setStock) && isNaN(parseFloat(setPrice))) {
        await setDoc(doc(db, "products", id), {
            Stock: setStock
        }, { merge: true });
        await sendLog(sessionStorage.getItem("Customer_ID"), "Set stock of product (" + id + ") to " + setStock, "Admin");
    } else {
        alert("Invalid input fields: One or more input fields is invalid.");
    }
    displayProducts();
}

window.displayProducts = async function displayProducts() {
    var array = [];
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach((doc) => {
        array.push(doc.data());
        sessionStorage.setItem("Products", JSON.stringify(array));
    });
}

function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateNoRandomString(length) {
    let result = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

window.sendOrder = async function sendOrder() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    var dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    var trackingId = generateRandomString(30);
    var products = JSON.parse(sessionStorage.getItem("Cart"));
    const docRef = doc(db, "orders", trackingId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        sessionStorage.setItem("Tracking_ID", trackingId);
        for (var itemName in products) {
            var stockRef = doc(db, "products", itemName);
            var stockSnap = await getDoc(stockRef);
            if (stockSnap.exists()) {
                if (stockSnap.data()["Stock"] - products[itemName]["quantity"] < 0) {
                    document.getElementById("error_message").innerHTML = "Error purchasing products: The stock limit is exceeded in this transaction, please remove items from your cart and try again.";
                    return false;
                } else {
                    await setDoc(doc(db, "products", itemName), {
                        Stock: stockSnap.data()["Stock"] - products[itemName]["quantity"],
                        Sales: stockSnap.data()["Sales"] + products[itemName]["quantity"]
                    }, { merge: true });
                    await setDoc(doc(db, "orders", (trackingId)), {
                        orderId: generateNoRandomString(10),
                        transactionId: generateNoRandomString(10),
                        orderDate: dateTimeString,
                        orderArrival: "",
                        orderStatus: "Processing",
                        orderTotal: sessionStorage.getItem("Order_Total"),
                        shippingAddress1: sessionStorage.getItem("Temp_SA1"),
                        shippingAddress2: sessionStorage.getItem("Temp_SA2"),
                        shippingCity: sessionStorage.getItem("Temp_City"),
                        shippingState: sessionStorage.getItem("Temp_State"),
                        shippingCountry: sessionStorage.getItem("Temp_Country"),
                        shippingPostalAddress: sessionStorage.getItem("Temp_Postal"),
                        shippingTotal: sessionStorage.getItem("Shipping_Total"),
                        shippingType: sessionStorage.getItem("Shipping_Type"),
                        products: products,
                        customerId: sessionStorage.getItem("Customer_ID")
                    });
                    if (sessionStorage.getItem("isStaff") == "TRUE") {
                        await sendLog(sessionStorage.getItem("Customer_ID"), "Order was made with tracking ID: " + trackingId, "Admin");
                    } else {
                        await sendLog(sessionStorage.getItem("Customer_ID"), "Order was made with tracking ID: " + trackingId, "Customer");
                    }
                }
            }
        }
        return true;
    } else {
        alert("There was an error sending order, please try again.");
        return false;
    }
}

window.getOrderViaTracking = async function getOrderViaTracking(id) {
    var docRef = doc(db, "orders", String(id));
    var docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        sessionStorage.setItem("Tracking_ID", id);
        sessionStorage.setItem("Order_Date", docSnap.data()["orderDate"]);
        sessionStorage.setItem("Order_Arrival", docSnap.data()["orderArrival"]);
        sessionStorage.setItem("Order_Status", docSnap.data()["orderStatus"]);
        sessionStorage.setItem("Order_Total", docSnap.data()["orderTotal"]);
        sessionStorage.setItem("Order_Products", JSON.stringify(docSnap.data()["products"]));
        sessionStorage.setItem("Shipping_Order_Total", docSnap.data()["orderTotal"]);
        sessionStorage.setItem("Shipping_SA1", docSnap.data()["shippingAddress1"]);
        sessionStorage.setItem("Shipping_SA2", docSnap.data()["shippingAddress2"]);
        sessionStorage.setItem("Shipping_City", docSnap.data()["shippingCity"]);
        sessionStorage.setItem("Shipping_State", docSnap.data()["shippingState"]);
        sessionStorage.setItem("Shipping_Country", docSnap.data()["shippingCountry"]);
        sessionStorage.setItem("Shipping_Postal", docSnap.data()["shippingPostalAddress"]);
        sessionStorage.setItem("Shipping_Total", docSnap.data()["shippingTotal"]);
        sessionStorage.setItem("Shipping_Type", docSnap.data()["shippingType"]);
    }
}

window.findAllLogs = async function findAllLogs() {
    var array = [];
    const q = query(collection(db, "logs"), orderBy("logTimestamp", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        var json = {
            Id: doc.id,
            data: doc.data()
        }
        array.push(json);
    });
    sessionStorage.setItem("Logs", JSON.stringify(array));
}

window.findUserLogs = async function findUserLogs(id) {
    var array = [];
    const q = query(collection(db, "logs"), orderBy("logTimestamp", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        if ((doc.id).includes(id) == true) {
            var json = {
                Id: doc.id,
                data: doc.data()
            }
            array.push(json);
        }
    });
    sessionStorage.setItem("User_Logs", JSON.stringify(array));
}

window.getTopProducts = async function getTopProducts(count) {
    var array = [];
    const q = query(collection(db, "products"), orderBy("Sales", "desc"));
    const querySnapshot = await getDocs(q);
    var i = 0;
    querySnapshot.forEach((doc) => {
        if (i < count) {
            var json = {
                Id: doc.id,
                data: doc.data()
            }
            array.push(json);
            i = i + 1;
        }
    });
    sessionStorage.setItem("Best_Sellers", JSON.stringify(array));
}


window.resetPassword = async function resetPassword(email, element) {
    sendPasswordResetEmail(auth, email)
        .then(() => {
            document.getElementById(element).innerHTML = "Password reset sent to email.";
        })
        .catch((error) => {
            document.getElementById(element).innerHTML = "Error reseting password: Please try again later.";
        });

}

window.logout = function logout() {
    signOut(auth).then(async () => {
        if (sessionStorage.getItem("isStaff") == "TRUE") {
            await sendLog(sessionStorage.getItem("Customer_ID"), "Logged out of system", "Admin");
        } else {
            await sendLog(sessionStorage.getItem("Customer_ID"), "Logged out of system", "Customer");
        }
        sessionStorage.removeItem("Email");
        sessionStorage.removeItem("Customer_ID");
        sessionStorage.removeItem("isStaff");
        sessionStorage.removeItem("Register_Date");
        sessionStorage.removeItem("Full_Name");
        sessionStorage.removeItem("Logs");
        sessionStorage.setItem("Customer_Type", 0);
        location.href = "index.html";
    }).catch((error) => {
        console.log(error);
    });
}
