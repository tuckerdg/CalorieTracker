/****************************************************
 * 1) INITIALIZE FIREBASE (Compat syntax, no NPM)
 ****************************************************/
const firebaseConfig = {
    // Replace with your own config from Firebase Console → Project settings → "Your apps"
    apiKey: "AIzaSyB...N1UQ6HOkH1sjkowfBmW0",
    authDomain: "calorie-tracker-7b84f.firebaseapp.com",
    projectId: "calorie-tracker-7b84f",
    storageBucket: "calorie-tracker-7b84f.appspot.com", // Note: .appspot.com is typical for storage
    messagingSenderId: "60409261415",
    appId: "1:60409261415:web:de6dd9410206163eee53c2",
    measurementId: "G-YJQPVL2N0Q"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();      // Firestore DB
  // optional analytics
  const analytics = firebase.analytics(); 
  
  
  document.addEventListener("DOMContentLoaded", function () {
    const goalForm        = document.getElementById("goal-form");
    const form            = document.getElementById("calorie-form");
    const exerciseForm    = document.getElementById("exercise-form");
    const weightForm      = document.getElementById("weight-form");
    const saveLogButton   = document.getElementById("save-log-button");
    const resetTodayButton= document.getElementById("reset-today-button");
  
    const totalCaloriesEl = document.getElementById("total-calories");
    const calorieGoalDisplay = document.getElementById("calorie-goal-display");
    const caloriesRemaining = document.getElementById("calories-remaining");
    const proteinGoalDisplay = document.getElementById("protein-goal-display");
    const proteinRemaining = document.getElementById("protein-remaining");
    const caloriesBurnedEl = document.getElementById("calories-burned");
    const maintenanceCaloriesDisplay = document.getElementById("maintenance-calories-display");
  
    let maintenanceCalories = parseInt(localStorage.getItem("maintenanceCalories")) || 0;
    let calorieGoal        = parseInt(localStorage.getItem("calorieGoal")) || 0;
    let proteinGoal        = parseInt(localStorage.getItem("proteinGoal")) || 0;
  
    // RENDER ENTRIES + CALENDAR ON LOAD
    renderEntries();
    updateDisplays();
    initCalendar();
  
    /****************************************************
     * "Reset Today's Log" - naive example removing ALL entries from "caloriesEntries"
     ****************************************************/
    resetTodayButton.addEventListener("click", async function () {
      if (confirm("Are you sure you want to reset today's log? This will clear everything in 'caloriesEntries'.")) {
        const snapshot = await db.collection("caloriesEntries").get();
        const batch = db.batch();
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
  
        alert("Today's log has been reset from Firestore.");
        renderEntries();
        updateDisplays();
      }
    });
  
    /****************************************************
     * Update the top-of-page displays (totals, goals, etc.)
     ****************************************************/
    async function updateDisplays() {
      // get all entries from Firestore
      const entriesSnapshot = await db.collection("caloriesEntries").get();
      const entries = entriesSnapshot.docs.map(doc => doc.data());
  
      const currentTotalCalories = entries
        .filter(e => e.type === "food")
        .reduce((sum, e) => sum + (e.calories || 0), 0);
  
      const currentTotalProtein = entries
        .filter(e => e.type === "food")
        .reduce((sum, e) => sum + (e.protein || 0), 0);
  
      const currentTotalBurned = entries
        .filter(e => e.type === "exercise")
        .reduce((sum, e) => sum + (e.calories || 0), 0);
  
      // Maintenance & Goals
      maintenanceCaloriesDisplay.textContent = `Maintenance Calories: ${maintenanceCalories}`;
      calorieGoalDisplay.textContent         = `Calorie Goal: ${calorieGoal}`;
      proteinGoalDisplay.textContent         = `Protein Goal: ${proteinGoal}g`;
  
      // Summaries
      totalCaloriesEl.textContent    = `Total Calories: ${currentTotalCalories}`;
      caloriesBurnedEl.textContent   = `Calories Burned: ${currentTotalBurned}`;
  
      // New Calorie Goal
      const newCalorieGoal = calorieGoal + currentTotalBurned;
      const newCalorieGoalDisplay = document.getElementById("new-calorie-goal");
      if (newCalorieGoalDisplay) {
        newCalorieGoalDisplay.textContent = `New Calorie Goal: ${newCalorieGoal}`;
      }
  
      // Remaining Calories
      const remainingCaloriesValue = calorieGoal - (currentTotalCalories - currentTotalBurned);
      caloriesRemaining.textContent = `Remaining Calories: ${remainingCaloriesValue}`;
      caloriesRemaining.style.color = remainingCaloriesValue >= 0 ? "green" : "red";
  
      // Remaining Protein
      const remainingProteinVal = proteinGoal - currentTotalProtein;
      if (remainingProteinVal >= 0) {
        proteinRemaining.textContent = `Protein Needed: ${remainingProteinVal}g`;
        proteinRemaining.style.color = "red";
      } else {
        proteinRemaining.textContent = `Over Protein Goal by: ${-remainingProteinVal}g`;
        proteinRemaining.style.color = "green";
      }
    }
  
    /****************************************************
     * Render the "Today's Consumption" entries list
     ****************************************************/
    async function renderEntries() {
      const entriesList = document.getElementById("entries-list");
      entriesList.innerHTML = '';
  
      const snapshot = await db.collection("caloriesEntries").get();
      if (snapshot.empty) {
        entriesList.innerHTML = '<p>No entries yet. Start adding food, exercise, or weight!</p>';
        return;
      }
  
      snapshot.forEach(doc => {
        const entry = doc.data();
        const docId = doc.id;
  
        const entryDiv = document.createElement("div");
        entryDiv.classList.add("entry-item");
  
        if (entry.type === "food") {
          entryDiv.innerHTML = `
            <strong>Food:</strong> ${entry.foodItem} <br>
            <strong>Calories:</strong> ${entry.calories} <br>
            <strong>Protein:</strong> ${entry.protein}g <br>
            <button class="remove-entry" data-id="${docId}">Remove</button>
          `;
        } else if (entry.type === "exercise") {
          entryDiv.innerHTML = `
            <strong>Exercise:</strong> ${entry.foodItem} <br>
            <strong>Calories Burned:</strong> ${entry.calories} <br>
            <button class="remove-entry" data-id="${docId}">Remove</button>
          `;
        } else if (entry.type === "weight") {
          entryDiv.innerHTML = `
            <strong>Weight:</strong> ${parseFloat(entry.weight).toFixed(1)} lbs <br>
            <button class="remove-entry" data-id="${docId}">Remove</button>
          `;
        }
  
        entriesList.appendChild(entryDiv);
      });
    }
  
    // Removing a single entry
    document.getElementById("entries-list").addEventListener("click", async (e) => {
      if (e.target.classList.contains("remove-entry")) {
        const docId = e.target.getAttribute("data-id");
        await db.collection("caloriesEntries").doc(docId).delete();
        renderEntries();
        updateDisplays();
      }
    });
  
    /****************************************************
     * FORMS
     ****************************************************/
  
    // 1) Goals form
    goalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      maintenanceCalories = parseInt(document.getElementById("maintenance-calories").value) || maintenanceCalories;
      calorieGoal        = parseInt(document.getElementById("calorie-goal").value) || calorieGoal;
      proteinGoal        = parseInt(document.getElementById("protein-goal").value) || proteinGoal;
  
      localStorage.setItem("maintenanceCalories", maintenanceCalories);
      localStorage.setItem("calorieGoal", calorieGoal);
      localStorage.setItem("proteinGoal", proteinGoal);
  
      updateDisplays();
    });
  
    // 2) Add Food
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const foodItem = document.getElementById("food-item").value;
      const calories = parseInt(document.getElementById("calories").value);
      const protein  = parseInt(document.getElementById("protein").value);
  
      if (foodItem && !isNaN(calories) && !isNaN(protein)) {
        try {
          await db.collection("caloriesEntries").add({
            type: "food",
            foodItem: foodItem,
            calories: calories,
            protein: protein,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          renderEntries();
          updateDisplays();
        } catch (err) {
          console.error("Error adding food entry:", err);
          alert("Could not add food entry. Check console.");
        }
      } else {
        alert("Please fill in all fields for Food.");
      }
    });
  
    // 3) Add Exercise
    exerciseForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const exerciseItem      = document.getElementById("exercise-item").value;
      const caloriesBurnedInput = parseInt(document.getElementById("exercise-calories").value);
  
      if (exerciseItem && !isNaN(caloriesBurnedInput)) {
        try {
          await db.collection("caloriesEntries").add({
            type: "exercise",
            foodItem: exerciseItem,
            calories: caloriesBurnedInput,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          renderEntries();
          updateDisplays();
        } catch (err) {
          console.error("Error adding exercise entry:", err);
          alert("Could not add exercise entry.");
        }
      } else {
        alert("Please fill in all fields for Exercise.");
      }
    });
  
    // 4) Add Weight
    weightForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const weightValue = parseFloat(document.getElementById("weight").value);
  
      if (!isNaN(weightValue)) {
        try {
          await db.collection("caloriesEntries").add({
            type: "weight",
            weight: weightValue,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          renderEntries();
          updateDisplays();
        } catch (err) {
          console.error("Error adding weight entry:", err);
          alert("Could not add weight entry.");
        }
      } else {
        alert("Please enter a valid weight.");
      }
    });
  
    /****************************************************
     * SAVE DAILY LOG -> "calorieLogHistory" with { year, month, day }
     ****************************************************/
    saveLogButton.addEventListener("click", async () => {
      // The user picks a date, or we default to "today"
      const rawDate = document.getElementById("log-date").value || new Date().toISOString().slice(0, 10);
      const dateObj = new Date(rawDate); // e.g. "2025-03-17"
  
      // Extract year/month/day as numbers
      const year  = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1; // 1-12
      const day   = dateObj.getDate();      // 1-31
  
      // We'll get the latest weight from "caloriesEntries"
      let weightVal = null;
      try {
        const weightSnapshot = await db.collection("caloriesEntries")
          .where("type","==","weight")
          .orderBy("timestamp","desc")
          .limit(1)
          .get();
        if (!weightSnapshot.empty) {
          weightVal = weightSnapshot.docs[0].data().weight || null;
        }
      } catch (err) {
        console.error("Error fetching latest weight:", err);
      }
  
      // Fetch totals
      const snapshot = await db.collection("caloriesEntries").get();
      const entries = snapshot.docs.map(doc => doc.data());
  
      const currentTotalCalories = entries
        .filter(e => e.type === "food")
        .reduce((sum, e) => sum + (e.calories || 0), 0);
  
      const currentTotalProtein = entries
        .filter(e => e.type === "food")
        .reduce((sum, e) => sum + (e.protein || 0), 0);
  
      const currentTotalBurned = entries
        .filter(e => e.type === "exercise")
        .reduce((sum, e) => sum + (e.calories || 0), 0);
  
      await db.collection("calorieLogHistory").add({
        year: year,
        month: month,
        day: day,
        totalCalories: currentTotalCalories,
        totalProtein: currentTotalProtein,
        totalBurned: currentTotalBurned,
        weight: weightVal
      });
  
      alert("Daily log saved to Firestore!");
      renderCalendar(currentYear, currentMonth); // refresh calendar if it's the same month
    });
  
  
    /****************************************************
     * MONTHLY CALENDAR - Right Panel
     ****************************************************/
    const prevMonthBtn       = document.getElementById("prev-month-btn");
    const nextMonthBtn       = document.getElementById("next-month-btn");
    const calendarMonthLabel = document.getElementById("calendar-month-label");
    const calendarGrid       = document.getElementById("calendar-grid");
  
    let currentYear  = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1; // 1-12
  
    function initCalendar() {
      // render once
      renderCalendar(currentYear, currentMonth);
  
      // handle nav
      prevMonthBtn.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 1) {
          currentMonth = 12;
          currentYear--;
        }
        renderCalendar(currentYear, currentMonth);
      });
  
      nextMonthBtn.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
        renderCalendar(currentYear, currentMonth);
      });
    }
  
    async function renderCalendar(year, month) {
      // Clear old cells
      calendarGrid.innerHTML = "";
  
      // Month label e.g. "March 2025"
      const monthNames = ["January","February","March","April","May","June","July",
                          "August","September","October","November","December"];
      calendarMonthLabel.textContent = `${monthNames[month-1]} ${year}`;
  
      // 1) Query Firestore for logs in this month
      const logsSnapshot = await db.collection("calorieLogHistory")
        .where("year","==",year)
        .where("month","==",month)
        .get();
  
      // Create day -> log map
      const logMap = {};
      logsSnapshot.forEach(doc => {
        const data = doc.data();
        logMap[data.day] = data; // day => { totalCalories, weight, etc. }
      });
  
      // 2) Figure out the weekday of the 1st (Sunday=0, Monday=1, etc.)
      const firstDay = new Date(year, month-1, 1);
      let startWeekday = firstDay.getDay(); 
  
      // 3) How many days in that month?
      const daysInMonth = new Date(year, month, 0).getDate(); 
  
      // 4) Create empty cells for days before the 1st
      for (let i=0; i<startWeekday; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-cell");
        calendarGrid.appendChild(emptyCell);
      }
  
      // 5) Fill in each day of the month
      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const cell = document.createElement("div");
        cell.classList.add("calendar-cell");
  
        const dateDiv = document.createElement("div");
        dateDiv.classList.add("calendar-date");
        dateDiv.textContent = dayNum;
        cell.appendChild(dateDiv);
  
        // If there's a log for this day
        const logData = logMap[dayNum];
        if (logData) {
          const calsEl = document.createElement("div");
          calsEl.textContent = `Calories: ${logData.totalCalories || 0}`;
          cell.appendChild(calsEl);
  
          const protEl = document.createElement("div");
          protEl.textContent = `Protein: ${logData.totalProtein || 0}`;
          cell.appendChild(protEl);
  
          const burnEl = document.createElement("div");
          burnEl.textContent = `Burned: ${logData.totalBurned || 0}`;
          cell.appendChild(burnEl);
  
          const wgtEl = document.createElement("div");
          wgtEl.textContent = `Weight: ${logData.weight != null ? logData.weight : "N/A"}`;
          cell.appendChild(wgtEl);
        }
        // else: blank for no log that day
  
        calendarGrid.appendChild(cell);
      }
    }
  });
  