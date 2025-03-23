/****************************************************
 * 1) INITIALIZE FIREBASE + AUTH
 ****************************************************/
console.log("Script loaded: initializing Firebase.");

const firebaseConfig = {
  apiKey: "AIzaSyBmQNNdFoU7homZ1UQ6HOkH1sjkowfBmW0",
  authDomain: "calorie-tracker-7b84f.firebaseapp.com",
  projectId: "calorie-tracker-7b84f",
  storageBucket: "calorie-tracker-7b84f.appspot.com",
  messagingSenderId: "60409261415",
  appId: "1:60409261415:web:de6dd9410206163eee53c2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUserId = null; 
let maintenanceCalories, calorieGoal, proteinGoal;

console.log("Firebase initialized. db, auth set up.");

/****************************************************
 * DOMContentLoaded
 ****************************************************/
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded event - hooking up auth UI.");

  // Auth elements
  const emailInput      = document.getElementById("auth-email");
  const passInput       = document.getElementById("auth-password");
  const loginBtn        = document.getElementById("auth-login-btn");
  const registerBtn     = document.getElementById("auth-register-btn");
  const logoutBtn       = document.getElementById("auth-logout-btn");
  const authStatus      = document.getElementById("auth-status");

  // Login
  loginBtn.addEventListener("click", async () => {
    console.log("Login button clicked.");
    try {
      const userCredential = await auth.signInWithEmailAndPassword(
        emailInput.value,
        passInput.value
      );
      console.log("Signed in successfully. UID:", userCredential.user.uid);
    } catch (err) {
      console.error("Sign in error:", err);
      alert("Sign in error: " + err.message);
    }
  });

  // Register
  registerBtn.addEventListener("click", async () => {
    console.log("Register button clicked.");
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        emailInput.value,
        passInput.value
      );
      console.log("Registered new user. UID:", userCredential.user.uid);
    } catch (err) {
      console.error("Register error:", err);
      alert("Register error: " + err.message);
    }
  });

  // Logout
  logoutBtn.addEventListener("click", async () => {
    console.log("Logout button clicked.");
    await auth.signOut();
  });

  // Auth State
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUserId = user.uid;
      console.log("AuthStateChanged: user is signed in with UID:", currentUserId);
      authStatus.textContent = `Signed in as: ${user.email || user.uid}`;
      logoutBtn.style.display = "inline-block";
      loginBtn.style.display  = "none";
      registerBtn.style.display = "none";
      emailInput.style.display= "none";
      passInput.style.display = "none";

      initApp();
    } else {
      console.log("AuthStateChanged: user is signed OUT.");
      currentUserId = null;
      authStatus.textContent = "Not signed in.";
      logoutBtn.style.display = "none";
      loginBtn.style.display  = "inline-block";
      registerBtn.style.display = "inline-block";
      emailInput.style.display= "inline-block";
      passInput.style.display = "inline-block";
      clearAppUI();
    }
  });
});

/****************************************************
 * initApp / clearAppUI
 ****************************************************/
function initApp() {
  console.log("initApp() called. Setting up forms, rendering data...");
  setupFormsAndUI();
  renderEntries();
  updateDisplays();
  initCalendar();
  console.log("initApp() finished.");
}

function clearAppUI() {
  console.log("clearAppUI() called. Removing UI data because user is signed out.");
  document.getElementById("entries-list").innerHTML = "";
  document.getElementById("calendar-grid").innerHTML = "";
  document.getElementById("calendar-month-label").textContent = "";
}

/****************************************************
 * Setup forms & event listeners
 ****************************************************/
function setupFormsAndUI() {
  console.log("setupFormsAndUI() - hooking up form listeners.");

  const goalForm        = document.getElementById("goal-form");
  const foodForm        = document.getElementById("calorie-form");
  const exerciseForm    = document.getElementById("exercise-form");
  const weightForm      = document.getElementById("weight-form");
  const resetTodayButton= document.getElementById("reset-today-button");
  const entriesList     = document.getElementById("entries-list");

  // Attach the remove-entry click listener exactly once here
  entriesList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("remove-entry")) {
      const docId = e.target.getAttribute("data-id");
      console.log("Removing doc id=", docId);
      try {
        await db.collection("caloriesEntries").doc(docId).delete();
        console.log("Doc removed. Refreshing entries & displays.");
        renderEntries();
        updateDisplays();
      } catch(err) {
        console.error("Error removing doc:", err);
      }
    }
  });

  // Load user goals from localStorage
  maintenanceCalories = parseInt(localStorage.getItem("maintenanceCalories")) || 0;
  calorieGoal         = parseInt(localStorage.getItem("calorieGoal")) || 0;
  proteinGoal         = parseInt(localStorage.getItem("proteinGoal")) || 0;
  console.log("Loaded goals from localStorage:", {maintenanceCalories, calorieGoal, proteinGoal});

  resetTodayButton.addEventListener("click", async function () {
    console.log("resetTodayButton clicked.");
    if (!currentUserId) {
      alert("You must be signed in to reset logs.");
      return;
    }
    if (confirm("Are you sure you want to reset today's log?")) {
      try {
        console.log("Deleting all docs from 'caloriesEntries' for uid=", currentUserId);
        const snapshot = await db.collection("caloriesEntries")
          .where("uid","==", currentUserId)
          .get();
        console.log("Docs found to delete:", snapshot.size);

        const batch = db.batch();
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        alert("Today's log has been reset.");
        renderEntries();
        updateDisplays();
      } catch(err) {
        console.error("Error resetting today's log:", err);
      }
    }
  });

  // Handle user goals form
  goalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Set Goals form submitted.");

    const maintInputVal  = parseInt(document.getElementById("maintenance-calories").value);
    const goalInputVal   = parseInt(document.getElementById("calorie-goal").value);
    const protGoalInput  = parseInt(document.getElementById("protein-goal").value);

    if (!isNaN(maintInputVal))  maintenanceCalories = maintInputVal;
    if (!isNaN(goalInputVal))   calorieGoal         = goalInputVal;
    if (!isNaN(protGoalInput))  proteinGoal         = protGoalInput;

    localStorage.setItem("maintenanceCalories", maintenanceCalories);
    localStorage.setItem("calorieGoal", calorieGoal);
    localStorage.setItem("proteinGoal", proteinGoal);

    console.log("Goals updated. New local values:", {maintenanceCalories, calorieGoal, proteinGoal});
    updateDisplays();
  });

  // Add Food
  foodForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("Add Food form submitted.");
    if (!currentUserId) {
      alert("Sign in first.");
      return;
    }

    // We'll store the same date the user picked, so we can do older logs
    const chosenDate = document.getElementById("log-date").value 
                       || new Date().toISOString().slice(0,10);

    const foodItem = document.getElementById("food-item").value;
    const calories = parseInt(document.getElementById("calories").value);
    const protein  = parseInt(document.getElementById("protein").value);

    console.log("Food form values:", { foodItem, calories, protein, date: chosenDate });

    if (foodItem && !isNaN(calories) && !isNaN(protein)) {
      try {
        console.log("Writing 'food' doc to 'caloriesEntries'. uid=", currentUserId);
        await db.collection("caloriesEntries").add({
          uid: currentUserId,
          type: "food",
          date: chosenDate,
          foodItem,
          calories,
          protein,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Successfully added FOOD doc. Refreshing entries.");
        renderEntries();
        updateDisplays();
      } catch (err) {
        console.error("Error adding food:", err);
      }
    } else {
      alert("Please fill all food fields.");
    }
  });

  // Add Exercise
  exerciseForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("Add Exercise form submitted.");
    if (!currentUserId) {
      alert("Sign in first.");
      return;
    }

    const chosenDate = document.getElementById("log-date").value 
                       || new Date().toISOString().slice(0,10);

    const exerciseItem = document.getElementById("exercise-item").value;
    const burnVal      = parseInt(document.getElementById("exercise-calories").value);

    console.log("Exercise form values:", { exerciseItem, burnVal, date: chosenDate });

    if (exerciseItem && !isNaN(burnVal)) {
      try {
        console.log("Writing 'exercise' doc to 'caloriesEntries'. uid=", currentUserId);
        await db.collection("caloriesEntries").add({
          uid: currentUserId,
          type: "exercise",
          date: chosenDate,
          foodItem: exerciseItem, // re-using 'foodItem' field for the name, you can rename it
          calories: burnVal,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Successfully added EXERCISE doc. Refreshing entries.");
        renderEntries();
        updateDisplays();
      } catch (err) {
        console.error("Error adding exercise:", err);
      }
    } else {
      alert("Please fill all exercise fields.");
    }
  });

  // Add Weight
  weightForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("Add Weight form submitted.");
    if (!currentUserId) {
      alert("Sign in first.");
      return;
    }

    const chosenDate = document.getElementById("log-date").value 
                       || new Date().toISOString().slice(0,10);

    // If you only want 1 weight doc per day, let's block a second one
    const existingSnapshot = await db.collection("caloriesEntries")
      .where("uid","==", currentUserId)
      .where("type","==","weight")
      .where("date","==", chosenDate)
      .get();
    if (!existingSnapshot.empty) {
      alert("You've already logged weight for this date!");
      return;
    }

    const wVal = parseFloat(document.getElementById("weight").value);
    if (isNaN(wVal)) {
      alert("Please enter a valid weight.");
      return;
    }

    try {
      console.log("Writing 'weight' doc to 'caloriesEntries'. uid=", currentUserId);
      await db.collection("caloriesEntries").add({
        uid: currentUserId,
        type: "weight",
        date: chosenDate,
        weight: wVal,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert("Weight added for " + chosenDate + "!");
      renderEntries();
      updateDisplays();
    } catch (err) {
      console.error("Error adding weight:", err);
    }
  });

  // Save Log
  const saveLogButton = document.getElementById("save-log-button");
  saveLogButton.addEventListener("click", async () => {
    console.log("Save Log button clicked.");
    if (!currentUserId) {
      alert("Sign in first.");
      return;
    }

    // The user picks the date in "log-date"
    const rawDate = document.getElementById("log-date").value 
                    || new Date().toISOString().slice(0, 10);
    const [yyyy, mm, dd] = rawDate.split("-");
    const year  = parseInt(yyyy, 10);
    const month = parseInt(mm, 10);
    const day   = parseInt(dd, 10);

    // Let's find the weight doc for that exact date
    const dayStr = rawDate; // same format
    let weightVal = null;
    try {
      console.log("Querying weight doc for date=", dayStr, "uid=", currentUserId);
      const weightSnapshot = await db.collection("caloriesEntries")
        .where("uid","==", currentUserId)
        .where("type","==","weight")
        .where("date","==", dayStr)
        .limit(1)
        .get();
      console.log("weightSnapshot size =", weightSnapshot.size);
      if (!weightSnapshot.empty) {
        weightVal = weightSnapshot.docs[0].data().weight || null;
      }
    } catch (err) {
      console.error("Error fetching weight doc by date:", err);
    }

    // Now let's compute totals (cal, prot, burned) but only for that date
    let currentTotalCalories = 0;
    let currentTotalProtein = 0;
    let currentTotalBurned = 0;

    try {
      console.log("Fetching docs for chosen date:", dayStr, "uid=", currentUserId);
      const snapshot = await db.collection("caloriesEntries")
        .where("uid","==", currentUserId)
        .where("date","==", dayStr)
        .get();
      console.log("entriesSnapshot size for chosen date =", snapshot.size);

      const entries = snapshot.docs.map(doc => doc.data());

      currentTotalCalories = entries
        .filter(e => e.type === "food")
        .reduce((sum, e) => sum + (e.calories || 0), 0);

      currentTotalProtein = entries
        .filter(e => e.type === "food")
        .reduce((sum, e) => sum + (e.protein || 0), 0);

      currentTotalBurned = entries
        .filter(e => e.type === "exercise")
        .reduce((sum, e) => sum + (e.calories || 0), 0);

      console.log("Computed totals for that date:", {
        currentTotalCalories,
        currentTotalProtein,
        currentTotalBurned,
        weightVal
      });
    } catch(err) {
      console.error("Error fetching entries for chosen date:", err);
      return;
    }

    // We'll build a custom doc ID => ensures only 1 log per user+date
    const docId = `${currentUserId}_${year}_${month}_${day}`;
    try {
      // .set => overwrite or create
      await db.collection("calorieLogHistory").doc(docId).set({
        uid: currentUserId,
        year,
        month,
        day,
        totalCalories: currentTotalCalories,
        totalProtein: currentTotalProtein,
        totalBurned: currentTotalBurned,
        weight: weightVal
      });

      alert("Daily log saved for " + rawDate + " (overwritten if existed)!");
      renderCalendar(currentYear, currentMonth);
    } catch(err) {
      console.error("Error saving daily log:", err);
      alert("Could not save log. Check console for details.");
    }
  });
}

/****************************************************
 * Render Entries & Update Summaries
 ****************************************************/
async function renderEntries() {
  console.log("renderEntries() called. currentUserId=", currentUserId);
  if (!currentUserId) {
    console.log("No user logged in, skipping renderEntries.");
    return;
  }
  const listEl = document.getElementById("entries-list");
  listEl.innerHTML = '';

  try {
    console.log("Querying 'caloriesEntries' for user:", currentUserId);
    const snapshot = await db.collection("caloriesEntries")
      .where("uid","==", currentUserId)
      .get();
    console.log("'caloriesEntries' query returned docs:", snapshot.size);

    if (snapshot.empty) {
      listEl.innerHTML = '<p>No entries yet. Start adding food, exercise, or weight!</p>';
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const docId = doc.id;
      const div = document.createElement("div");
      div.classList.add("entry-item");

      if (data.type === "food") {
        div.innerHTML = `
          <strong>Food:</strong> ${data.foodItem} <br>
          <strong>Calories:</strong> ${data.calories} <br>
          <strong>Protein:</strong> ${data.protein}g <br>
          <strong>Date:</strong> ${data.date || "N/A"}<br>
          <button class="remove-entry" data-id="${docId}">Remove</button>
        `;
      } else if (data.type === "exercise") {
        div.innerHTML = `
          <strong>Exercise:</strong> ${data.foodItem} <br>
          <strong>Calories Burned:</strong> ${data.calories} <br>
          <strong>Date:</strong> ${data.date || "N/A"}<br>
          <button class="remove-entry" data-id="${docId}">Remove</button>
        `;
      } else if (data.type === "weight") {
        div.innerHTML = `
          <strong>Weight:</strong> ${parseFloat(data.weight).toFixed(1)} lbs<br>
          <strong>Date:</strong> ${data.date || "N/A"}<br>
          <button class="remove-entry" data-id="${docId}">Remove</button>
        `;
      }
      listEl.appendChild(div);
    });
  } catch(err) {
    console.error("Error in renderEntries query:", err);
  }
}

async function updateDisplays() {
  console.log("updateDisplays() called. currentUserId=", currentUserId);
  if (!currentUserId) {
    console.log("No user, skipping updateDisplays.");
    return;
  }

  console.log("Querying 'caloriesEntries' to compute summary for uid=", currentUserId);
  try {
    const snap = await db.collection("caloriesEntries")
      .where("uid","==",currentUserId)
      .get();
    console.log("updateDisplays - docs found:", snap.size);

    const arr = snap.docs.map(d => d.data());

    const totalCals = arr
      .filter(e => e.type==="food")
      .reduce((sum, e) => sum + (e.calories||0), 0);
    const totalProt = arr
      .filter(e => e.type==="food")
      .reduce((sum, e) => sum + (e.protein||0), 0);
    const totalBurn = arr
      .filter(e => e.type==="exercise")
      .reduce((sum, e) => sum + (e.calories||0), 0);

    console.log("Summary totals (all dates):", { totalCals, totalProt, totalBurn });

    // Maintenance & Goals from localStorage
    document.getElementById("maintenance-calories-display").textContent 
      = "Maintenance Calories: " + maintenanceCalories;
    document.getElementById("calorie-goal-display").textContent 
      = "Calorie Goal: " + calorieGoal;
    document.getElementById("protein-goal-display").textContent 
      = "Protein Goal: " + proteinGoal + "g";

    // Summaries
    document.getElementById("total-calories").textContent 
      = "Total Calories: " + totalCals;
    document.getElementById("calories-burned").textContent 
      = "Calories Burned: " + totalBurn;

    const newCalGoal = calorieGoal + totalBurn;
    document.getElementById("new-calorie-goal").textContent 
      = "New Calorie Goal: " + newCalGoal;

    const remCals = calorieGoal - (totalCals - totalBurn);
    const calRemEl = document.getElementById("calories-remaining");
    calRemEl.textContent = "Remaining Calories: " + remCals;
    calRemEl.style.color = remCals >= 0 ? "green" : "red";

    const remProt = proteinGoal - totalProt;
    const protRemEl = document.getElementById("protein-remaining");
    if (remProt >= 0) {
      protRemEl.textContent = "Protein Needed: " + remProt + "g";
      protRemEl.style.color = "red";
    } else {
      protRemEl.textContent = "Over Protein Goal by: " + (-remProt) + "g";
      protRemEl.style.color = "green";
    }
  } catch(err) {
    console.error("Error in updateDisplays query:", err);
  }
}

/****************************************************
 * Calendar
 ****************************************************/
let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; 
const calendarGrid       = document.getElementById("calendar-grid");
const calendarMonthLabel = document.getElementById("calendar-month-label");
const prevMonthBtn       = document.getElementById("prev-month-btn");
const nextMonthBtn       = document.getElementById("next-month-btn");

function initCalendar() {
  console.log("initCalendar called. hooking up prev/next month.");
  if (!prevMonthBtn) {
    console.log("No prevMonthBtn found, skipping initCalendar.");
    return;
  }
  prevMonthBtn.addEventListener("click", () => {
    console.log("Prev month clicked.");
    currentMonth--;
    if (currentMonth<1) {
      currentMonth=12; currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
  });
  nextMonthBtn.addEventListener("click", () => {
    console.log("Next month clicked.");
    currentMonth++;
    if (currentMonth>12) {
      currentMonth=1; currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
  });
  renderCalendar(currentYear, currentMonth);
}

async function renderCalendar(year, month) {
  console.log("renderCalendar() for", {year, month}, "user:", currentUserId);
  if (!currentUserId) {
    console.log("No user, showing 'sign in' message in the calendar.");
    calendarGrid.innerHTML = "<p>Please sign in to view logs.</p>";
    calendarMonthLabel.textContent = "";
    return;
  }

  calendarGrid.innerHTML="";
  const mNames=["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  calendarMonthLabel.textContent = mNames[month-1]+" "+year;

  console.log("Querying 'calorieLogHistory' for logs. uid=", currentUserId);
  try {
    const snap = await db.collection("calorieLogHistory")
      .where("uid","==", currentUserId)
      .where("year","==", year)
      .where("month","==", month)
      .get();
    console.log("calorieLogHistory snapshot size:", snap.size);

    const map = {};
    snap.forEach(doc=>{
      const d=doc.data();
      map[d.day]=d;
    });

    const firstDay=new Date(year,month-1,1);
    let startWeekday=firstDay.getDay();
    const daysInMonth=new Date(year,month,0).getDate();

    // empty cells
    for(let i=0;i<startWeekday;i++){
      const c=document.createElement("div");
      c.classList.add("calendar-cell");
      calendarGrid.appendChild(c);
    }

    // day cells
    for(let dayNum=1; dayNum<=daysInMonth; dayNum++){
      const cell=document.createElement("div");
      cell.classList.add("calendar-cell");
      const dateDiv=document.createElement("div");
      dateDiv.classList.add("calendar-date");
      dateDiv.textContent=dayNum;
      cell.appendChild(dateDiv);

      const data=map[dayNum];
      if(data){
        const cals=document.createElement("div");
        cals.textContent="Calories: "+(data.totalCalories||0);
        cell.appendChild(cals);

        const prot=document.createElement("div");
        prot.textContent="Protein: "+(data.totalProtein||0);
        cell.appendChild(prot);

        const burn=document.createElement("div");
        burn.textContent="Burned: "+(data.totalBurned||0);
        cell.appendChild(burn);

        const wgt=document.createElement("div");
        wgt.textContent="Weight: "+(data.weight!=null? data.weight:"N/A");
        cell.appendChild(wgt);
      } else {
        const cals=document.createElement("div");
        cals.textContent="Calories: 0";
        cell.appendChild(cals);

        const prot=document.createElement("div");
        prot.textContent="Protein: 0";
        cell.appendChild(prot);

        const burn=document.createElement("div");
        burn.textContent="Burned: 0";
        cell.appendChild(burn);

        const wgt=document.createElement("div");
        wgt.textContent="Weight: 0";
        cell.appendChild(wgt);
      }
      calendarGrid.appendChild(cell);
    }
  } catch(err) {
    console.error("Error in renderCalendar query:", err);
  }
  console.log("renderCalendar finished for", {year, month});
}
