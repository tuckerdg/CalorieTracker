/****************************************************/
/*  1) INITIALIZE FIREBASE (Compat syntax, no NPM)  */
/****************************************************/
const firebaseConfig = {
    apiKey: "AIzaSyBmQNNdFoU7homZ1UQ6HOkH1sjkowfBmW0",
    authDomain: "calorie-tracker-7b84f.firebaseapp.com",
    projectId: "calorie-tracker-7b84f",
    storageBucket: "calorie-tracker-7b84f.firebasestorage.app",
    messagingSenderId: "60409261415",
    appId: "1:60409261415:web:de6dd9410206163eee53c2",
    measurementId: "G-YJQPVL2N0Q"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();      // Firestore DB
  const analytics = firebase.analytics(); // (Optional) Firebase Analytics
  
  /****************************************************/
  /*  2) MIGRATE LOCALSTORAGE LOGS (OPTIONAL, ONE-TIME) */
  /****************************************************/
  // If you want to migrate your existing localStorage logs to Firestore
  // once, uncomment and call `migrateLocalLogsToFirestore()` below.
  async function migrateLocalLogsToFirestore() {
    // Migrate "calories" entries
    const localEntries = JSON.parse(localStorage.getItem("calories")) || [];
    if (localEntries.length > 0) {
      for (const entry of localEntries) {
        await db.collection("caloriesEntries").add({ ...entry, migratedAt: new Date().toISOString() });
      }
      localStorage.removeItem("calories");
    }
  
    // Migrate "calorieLog"
    const localCalorieLog = JSON.parse(localStorage.getItem("calorieLog")) || [];
    if (localCalorieLog.length > 0) {
      for (const logEntry of localCalorieLog) {
        await db.collection("calorieLogHistory").add({ ...logEntry, migratedAt: new Date().toISOString() });
      }
      localStorage.removeItem("calorieLog");
    }
  }
  
  /****************************************************/
  /*  3) DOMContentLoaded: Hook up all your forms      */
  /****************************************************/
  document.addEventListener("DOMContentLoaded", function () {
    // Uncomment to migrate once if you want
    // migrateLocalLogsToFirestore();
  
    const goalForm = document.getElementById("goal-form");
    const form = document.getElementById("calorie-form");
    const exerciseForm = document.getElementById("exercise-form");
    const saveLogButton = document.getElementById("save-log-button");
    const resetTodayButton = document.getElementById("reset-today-button");
    const logScrollDiv = document.getElementById("log-scroll");
    const weightForm = document.getElementById("weight-form");
  
    // Display fields
    const totalCaloriesEl = document.getElementById("total-calories");
    const calorieGoalDisplay = document.getElementById("calorie-goal-display");
    const caloriesRemaining = document.getElementById("calories-remaining");
    const proteinGoalDisplay = document.getElementById("protein-goal-display");
    const proteinRemaining = document.getElementById("protein-remaining");
    const caloriesBurnedEl = document.getElementById("calories-burned");
    const maintenanceCaloriesDisplay = document.getElementById("maintenance-calories-display");
  
    // Retrieve user goals from localStorage (still stored locally for simplicity)
    let maintenanceCalories = parseInt(localStorage.getItem("maintenanceCalories")) || 0;
    let calorieGoal = parseInt(localStorage.getItem("calorieGoal")) || 0;
    let proteinGoal = parseInt(localStorage.getItem("proteinGoal")) || 0;
  
    // Update the text fields based on localStorage
    updateDisplays();
  
    // For the right-panel log history
    loadLogsToSidebar();
    renderEntries();
  
    /****************************************************/
    /*  "Reset Today's Log" - this will delete today's  */
    /*   entries from Firestore in this naive example.  */
    /****************************************************/
    resetTodayButton.addEventListener("click", async function () {
      if (confirm("Are you sure you want to reset today's log? This will clear today's entries in Firestore.")) {
        // We don't track "today" with a date in this code, so let's just delete everything in the "caloriesEntries" collection.
        // If you want day-by-day, you'll need a "date" field in each entry so you only remove today's items.
        const snapshot = await db.collection("caloriesEntries").get();
        const batch = db.batch();
        snapshot.forEach(doc => {
          // Remove each doc
          batch.delete(doc.ref);
        });
        await batch.commit();
  
        alert("Today's log has been reset from Firestore.");
        renderEntries();
        updateDisplays();
      }
    });
  
    /****************************************************/
    /*  Update top-of-page displays: totals, goals, etc. */
    /****************************************************/
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
      calorieGoalDisplay.textContent = `Calorie Goal: ${calorieGoal}`;
      proteinGoalDisplay.textContent = `Protein Goal: ${proteinGoal}g`;
  
      // Summaries
      totalCaloriesEl.textContent = `Total Calories: ${currentTotalCalories}`;
      caloriesBurnedEl.textContent = `Calories Burned: ${currentTotalBurned}`;
  
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
  
    /****************************************************/
    /*  RENDER ENTRIES: fetch from Firestore and display */
    /****************************************************/
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
  
    // Listen for remove entry clicks
    document.getElementById("entries-list").addEventListener("click", async (e) => {
      if (e.target.classList.contains("remove-entry")) {
        const docId = e.target.getAttribute("data-id");
        await db.collection("caloriesEntries").doc(docId).delete();
        renderEntries();
        updateDisplays();
      }
    });
  
    /****************************************************/
    /*               FORMS - EVENT HANDLERS             */
    /****************************************************/
    // 1) Goals form
    goalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      maintenanceCalories = parseInt(document.getElementById("maintenance-calories").value) || maintenanceCalories;
      calorieGoal = parseInt(document.getElementById("calorie-goal").value) || calorieGoal;
      proteinGoal = parseInt(document.getElementById("protein-goal").value) || proteinGoal;
  
      // Still store these locally for now
      localStorage.setItem("maintenanceCalories", maintenanceCalories);
      localStorage.setItem("calorieGoal", calorieGoal);
      localStorage.setItem("proteinGoal", proteinGoal);
      updateDisplays();
    });
  
    // 2) Add Food form
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const foodItem = document.getElementById("food-item").value;
      const calories = parseInt(document.getElementById("calories").value);
      const protein = parseInt(document.getElementById("protein").value);
  
      if (foodItem && !isNaN(calories) && !isNaN(protein)) {
        try {
          await db.collection("caloriesEntries").add({
            type: "food",
            foodItem: foodItem,
            calories: calories,
            protein: protein,
            timestamp: new Date().toISOString()
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
  
    // 3) Add Exercise form
    exerciseForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const exerciseItem = document.getElementById("exercise-item").value;
      const caloriesBurnedInput = parseInt(document.getElementById("exercise-calories").value);
  
      if (exerciseItem && !isNaN(caloriesBurnedInput)) {
        try {
          await db.collection("caloriesEntries").add({
            type: "exercise",
            foodItem: exerciseItem,
            calories: caloriesBurnedInput,
            timestamp: new Date().toISOString()
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
  
    // 4) Add Weight form
    weightForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const weightValue = parseFloat(document.getElementById("weight").value);
  
      if (!isNaN(weightValue)) {
        try {
          await db.collection("caloriesEntries").add({
            type: "weight",
            weight: weightValue,
            timestamp: new Date().toISOString()
          });
          renderEntries();
          updateDisplays();
        } catch (err) {
          console.error("Error adding weight:", err);
          alert("Could not add weight entry.");
        }
      } else {
        alert("Please enter a valid weight.");
      }
    });
  
    /****************************************************/
    /*   SAVE LOGS (like daily summary) into Firestore  */
    /****************************************************/
    saveLogButton.addEventListener("click", async () => {
      const logDate = document.getElementById("log-date").value || new Date().toISOString().slice(0, 10);
  
      // Let's get the latest weight from the "caloriesEntries" that is type=weight
      // We'll just pick the first from a descending order query for demonstration
      let weightVal = null;
      try {
        const weightSnapshot = await db.collection("caloriesEntries")
          .where("type", "==", "weight")
          .orderBy("timestamp", "desc")
          .limit(1)
          .get();
  
        if (!weightSnapshot.empty) {
          weightVal = weightSnapshot.docs[0].data().weight;
        }
      } catch (err) {
        console.error("Error fetching latest weight:", err);
      }
  
      // Let’s also fetch current totals for the day
      const snapshot = await db.collection("caloriesEntries").get();
      const entries = snapshot.docs.map(doc => doc.data());
      const currentTotalCalories = entries.filter(e => e.type === "food").reduce((sum, e) => sum + (e.calories || 0), 0);
      const currentTotalProtein = entries.filter(e => e.type === "food").reduce((sum, e) => sum + (e.protein || 0), 0);
      const currentTotalBurned = entries.filter(e => e.type === "exercise").reduce((sum, e) => sum + (e.calories || 0), 0);
  
      // Save to a separate collection, e.g., "calorieLogHistory"
      await db.collection("calorieLogHistory").add({
        date: logDate,
        totalCalories: currentTotalCalories,
        totalProtein: currentTotalProtein,
        totalBurned: currentTotalBurned,
        weight: weightVal
      });
      alert("Daily log saved to Firestore!");
      loadLogsToSidebar();
    });
  
    /****************************************************/
    /*  LOAD LOGS INTO SIDEBAR                          */
    /****************************************************/
    async function loadLogsToSidebar() {
      logScrollDiv.innerHTML = '';
      const snapshot = await db.collection("calorieLogHistory").orderBy("date").get();
      if (snapshot.empty) {
        logScrollDiv.innerHTML = '<p>No log entries found.</p>';
        return;
      }
      snapshot.forEach((doc, index) => {
        const entry = doc.data();
        const logDiv = document.createElement("div");
        logDiv.classList.add("log-entry");
        logDiv.innerHTML = `
          <strong>${entry.date}</strong><br>
          Calories: ${entry.totalCalories || 0}<br>
          Protein: ${entry.totalProtein || 0}g<br>
          Burned: ${entry.totalBurned || 0}<br>
          Weight: ${entry.weight !== null && entry.weight !== undefined 
                    ? parseFloat(entry.weight).toFixed(1) + ' lbs' 
                    : 'N/A'}<br>
          <button class="remove-log" data-id="${doc.id}">Remove</button>
        `;
        logScrollDiv.appendChild(logDiv);
      });
      logScrollDiv.scrollTop = logScrollDiv.scrollHeight;
    }
  
    // Remove a log from the sidebar
    logScrollDiv.addEventListener("click", async (e) => {
      if (e.target.classList.contains("remove-log")) {
        const docId = e.target.getAttribute("data-id");
        await db.collection("calorieLogHistory").doc(docId).delete();
        loadLogsToSidebar();
      }
    });
  });
  