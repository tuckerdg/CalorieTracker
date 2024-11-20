document.addEventListener("DOMContentLoaded", function () {
    
    const goalForm = document.getElementById("goal-form");
    const form = document.getElementById("calorie-form");
    const exerciseForm = document.getElementById("exercise-form");
    const saveLogButton = document.getElementById("save-log-button");
    const resetLogButton = document.getElementById("reset-log-button");
    const logScrollDiv = document.getElementById("log-scroll");
    const calorieList = document.getElementById("calorie-list");

    const totalCalories = document.getElementById("total-calories");
    const calorieGoalDisplay = document.getElementById("calorie-goal-display");
    const caloriesRemaining = document.getElementById("calories-remaining");
    const proteinGoalDisplay = document.getElementById("protein-goal-display");
    const proteinRemaining = document.getElementById("protein-remaining");
    const caloriesBurned = document.getElementById("calories-burned");
    const maintenanceCaloriesDisplay = document.getElementById("maintenance-calories-display");
    let maintenanceCalories = parseInt(localStorage.getItem("maintenanceCalories")) || 0;
    let calorieGoal = parseInt(localStorage.getItem("calorieGoal")) || 0;
    let proteinGoal = parseInt(localStorage.getItem("proteinGoal")) || 0;
    let currentTotalCalories = 0;
    let currentTotalProtein = 0;
    let currentTotalBurned = 0;
    updateDisplays();
    renderEntries();
    loadLogsToSidebar(); // For the right-panel log history

    function updateDisplays() {
        const entries = JSON.parse(localStorage.getItem("calories")) || [];
    
        // Recalculate totals dynamically
        currentTotalCalories = entries.reduce((sum, entry) => sum + (entry.type === "food" ? entry.calories : 0), 0);
        currentTotalProtein = entries.reduce((sum, entry) => sum + (entry.type === "food" ? entry.protein : 0), 0);
        currentTotalBurned = entries.reduce((sum, entry) => sum + (entry.type === "exercise" ? entry.calories : 0), 0);
    
        // Update Maintenance Calories and Goals
        maintenanceCaloriesDisplay.textContent = `Maintenance Calories: ${maintenanceCalories}`;
        calorieGoalDisplay.textContent = `Calorie Goal: ${calorieGoal}`;
        proteinGoalDisplay.textContent = `Protein Goal: ${proteinGoal}g`;
    
        // Update Totals
        totalCalories.textContent = `Total Calories: ${currentTotalCalories}`;
        caloriesBurned.textContent = `Calories Burned: ${currentTotalBurned}`;

         // Calculate and Update New Calorie Goal
        const newCalorieGoal = calorieGoal + currentTotalBurned;
        document.getElementById("new-calorie-goal").textContent = `New Calorie Goal: ${newCalorieGoal}`;

        // Calculate and Update Remaining Calories
        const remainingCaloriesValue = calorieGoal - (currentTotalCalories - currentTotalBurned);
        caloriesRemaining.textContent = `Remaining Calories: ${remainingCaloriesValue}`;
        caloriesRemaining.style.color = remainingCaloriesValue >= 0 ? "green" : "red";
    
        // Calculate Remaining Protein
        const remainingProtein = proteinGoal - currentTotalProtein;
        proteinRemaining.textContent = remainingProtein >= 0
            ? `Protein Needed: ${remainingProtein}g`
            : `Over Protein Goal by: ${-remainingProtein}g`;
        proteinRemaining.style.color = remainingProtein >= 0 ? "red" : "green";

    }
    

    function loadLogsToSidebar() {
        const entries = JSON.parse(localStorage.getItem("calorieLog")) || [];
        logScrollDiv.innerHTML = '';
    
        if (entries.length === 0) {
            logScrollDiv.innerHTML = '<p>No log entries found.</p>';
        } else {
            entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            entries.forEach((entry, index) => {
                const logDiv = document.createElement("div");
                logDiv.classList.add("log-entry");
                logDiv.innerHTML = `
                    <strong>${entry.date}</strong><br>
                    Calories: ${entry.totalCalories}<br>
                    Protein: ${entry.totalProtein}g<br>
                    Burned: ${entry.totalBurned}<br>
                    <button class="remove-log" data-index="${index}">Remove</button>
                `;
                logScrollDiv.appendChild(logDiv);
            });
    
            // Scroll to the latest log entry
            logScrollDiv.scrollTop = logScrollDiv.scrollHeight;
        }
    }
    
    function renderEntries() {
        const entriesList = document.getElementById("entries-list");
        const entries = JSON.parse(localStorage.getItem("calories")) || [];
    
        entriesList.innerHTML = ''; // Clear the current list
    
        if (entries.length === 0) {
            entriesList.innerHTML = '<p>No entries yet. Start adding food or exercise!</p>';
        } else {
            entries.forEach((entry, index) => {
                const entryDiv = document.createElement("div");
                entryDiv.classList.add("entry-item");
    
                if (entry.type === "food") {
                    entryDiv.innerHTML = `
                        <strong>Food:</strong> ${entry.foodItem} <br>
                        <strong>Calories:</strong> ${entry.calories} <br>
                        <strong>Protein:</strong> ${entry.protein}g <br>
                        <button class="remove-entry" data-index="${index}">Remove</button>
                    `;
                } else if (entry.type === "exercise") {
                    entryDiv.innerHTML = `
                        <strong>Exercise:</strong> ${entry.foodItem} <br>
                        <strong>Calories Burned:</strong> ${entry.calories} <br>
                        <button class="remove-entry" data-index="${index}">Remove</button>
                    `;
                }
    
                entriesList.appendChild(entryDiv);
            });
        }
    }
    
    document.getElementById("entries-list").addEventListener("click", function (e) {
        if (e.target.classList.contains("remove-entry")) {
            const index = e.target.getAttribute("data-index");
            const entries = JSON.parse(localStorage.getItem("calories")) || [];
            entries.splice(index, 1); // Remove the selected entry
            localStorage.setItem("calories", JSON.stringify(entries));
            renderEntries(); // Refresh the entries list
            updateDisplays(); // Refresh totals in the summary
        }
    });
    
    goalForm.addEventListener("submit", (e) => {
        e.preventDefault();
        maintenanceCalories = parseInt(document.getElementById("maintenance-calories").value) || maintenanceCalories;
        calorieGoal = parseInt(document.getElementById("calorie-goal").value) || calorieGoal;
        proteinGoal = parseInt(document.getElementById("protein-goal").value) || proteinGoal;

        localStorage.setItem("maintenanceCalories", maintenanceCalories);
        localStorage.setItem("calorieGoal", calorieGoal);
        localStorage.setItem("proteinGoal", proteinGoal);
        updateDisplays();
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const foodItem = document.getElementById("food-item").value;
        const calories = parseInt(document.getElementById("calories").value);
        const protein = parseInt(document.getElementById("protein").value);
    
        if (foodItem && !isNaN(calories) && !isNaN(protein)) {
            const entries = JSON.parse(localStorage.getItem("calories")) || [];
            entries.push({ foodItem, calories, protein, type: "food" });
            localStorage.setItem("calories", JSON.stringify(entries));
            renderEntries();
            updateDisplays(); // Refresh totals in the summary
        } else {
            alert("Please fill in all fields.");
        }
    });
    
    exerciseForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const exerciseItem = document.getElementById("exercise-item").value;
        const caloriesBurnedInput = parseInt(document.getElementById("exercise-calories").value);
    
        if (exerciseItem && !isNaN(caloriesBurnedInput)) {
            const entries = JSON.parse(localStorage.getItem("calories")) || [];
            entries.push({ foodItem: exerciseItem, calories: caloriesBurnedInput, type: "exercise" });
            localStorage.setItem("calories", JSON.stringify(entries));
            renderEntries();
            updateDisplays(); // Refresh totals in the summary
        } else {
            alert("Please fill in all fields.");
        }
    });
    
    logScrollDiv.addEventListener("click", function (e) {
        if (e.target.classList.contains("remove-log")) {
            const index = e.target.getAttribute("data-index");
            const calorieLog = JSON.parse(localStorage.getItem("calorieLog")) || [];
            calorieLog.splice(index, 1); // Remove the selected log
            localStorage.setItem("calorieLog", JSON.stringify(calorieLog));
            loadLogsToSidebar(); // Refresh the log history
        }
    });
    
    saveLogButton.addEventListener("click", () => {
        const logDate = document.getElementById("log-date").value;
        const calorieLog = JSON.parse(localStorage.getItem("calorieLog")) || [];
        calorieLog.push({
            date: logDate,
            totalCalories: currentTotalCalories,
            totalProtein: currentTotalProtein,
            totalBurned: currentTotalBurned,
        });
        localStorage.setItem("calorieLog", JSON.stringify(calorieLog));
        loadLogsToSidebar();
    });

    resetLogButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset all entries?")) {
            localStorage.removeItem("calories"); // Clear food and exercise data
            localStorage.removeItem("calorieLog"); // Clear log history
            currentTotalCalories = 0;
            currentTotalProtein = 0;
            currentTotalBurned = 0;
            updateDisplays();
            renderEntries();
            loadLogsToSidebar();
        }
    });
    

    updateDisplays();
    loadLogsToSidebar();
});
