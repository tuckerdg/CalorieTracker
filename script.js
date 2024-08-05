document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById('calorie-form');
    const exerciseForm = document.getElementById('exercise-form');
    const goalForm = document.getElementById('goal-form');
    const saveLogButton = document.getElementById('save-log-button');
    const resetLogButton = document.getElementById('reset-log-button');
    const viewLogButton = document.getElementById('view-log-button');
    const calorieList = document.getElementById('calorie-list');
    const totalCalories = document.getElementById('total-calories');
    const calorieGoalDisplay = document.getElementById('calorie-goal-display');
    const caloriesRemaining = document.getElementById('calories-remaining');
    const totalProtein = document.getElementById('total-protein');
    const proteinGoalDisplay = document.getElementById('protein-goal-display');
    const proteinRemaining = document.getElementById('protein-remaining');
    const caloriesBurned = document.getElementById('calories-burned');
    const maintenanceCaloriesDisplay = document.getElementById('maintenance-calories-display');
    const netCalories = document.getElementById('net-calories');

    let maintenanceCalories = parseInt(localStorage.getItem('maintenanceCalories')) || 0;
    let calorieGoal = parseInt(localStorage.getItem('calorieGoal')) || 0;
    let proteinGoal = parseInt(localStorage.getItem('proteinGoal')) || 0;
    let currentTotalCalories = 0;
    let currentTotalProtein = 0;
    let currentTotalBurned = 0;

    function loadEntries() {
        const entries = JSON.parse(localStorage.getItem('calories')) || [];
        calorieList.innerHTML = '';
        currentTotalCalories = 0;
        currentTotalProtein = 0;
        currentTotalBurned = 0;
        entries.forEach((entry, index) => {
            addEntryToDOM(entry.foodItem, entry.calories, entry.protein, entry.type, index);
            if (entry.type === 'food') {
                currentTotalCalories += parseInt(entry.calories);
                currentTotalProtein += parseInt(entry.protein);
            } else if (entry.type === 'exercise') {
                currentTotalBurned += parseInt(entry.calories);
            }
        });
        updateDisplays();
    }

    function addEntryToDOM(foodItem, calories, protein, type, index) {
        const entry = document.createElement('div');
        entry.classList.add('calorie-entry');
        entry.innerHTML = `<strong>${foodItem}</strong>: ${calories} calories, ${protein}g protein <button class="remove-button" data-index="${index}">Remove</button>`;
        calorieList.appendChild(entry);
    }

    function removeEntry(index) {
        let entries = JSON.parse(localStorage.getItem('calories'));
        entries.splice(index, 1);
        localStorage.setItem('calories', JSON.stringify(entries));
        loadEntries();
    }

    function updateDisplays() {
        totalCalories.textContent = `Total Calories: ${currentTotalCalories}`;
        calorieGoalDisplay.textContent = `Calorie Goal: ${calorieGoal}`;
        caloriesBurned.textContent = `Calories Burned: ${currentTotalBurned}`;
        caloriesRemaining.textContent = `Remaining Calories: ${calorieGoal - (currentTotalCalories - currentTotalBurned)}`;
        totalProtein.textContent = `Total Protein: ${currentTotalProtein}g`;
        proteinGoalDisplay.textContent = `Protein Goal: ${proteinGoal}g`;
        maintenanceCaloriesDisplay.textContent = `Maintenance Calories: ${maintenanceCalories + currentTotalBurned}`;
        netCalories.textContent = `Net Calories: ${(maintenanceCalories + currentTotalBurned) - currentTotalCalories}`;

        const remainingProtein = proteinGoal - currentTotalProtein;
        if (remainingProtein >= 0) {
            proteinRemaining.textContent = `Remaining Protein: ${remainingProtein}g`;
            if (remainingProtein > proteinGoal * 0.5) {
                proteinRemaining.style.color = 'red';
            } else if (remainingProtein > proteinGoal * 0.2) {
                proteinRemaining.style.color = 'orange';
            } else {
                proteinRemaining.style.color = 'yellow darker-yellow';
            }
        } else {
            proteinRemaining.textContent = `Over Protein Goal by: ${-remainingProtein}g`;
            proteinRemaining.style.color = 'green';
        }

        const progress = Math.min((currentTotalCalories / calorieGoal) * 100, 100);
        document.getElementById('progress-bar').style.width = `${progress}%`;
        caloriesRemaining.style.color = (currentTotalCalories - currentTotalBurned) > calorieGoal ? 'red' : 'green';
    }

    goalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const maintenanceCaloriesInput = document.getElementById('maintenance-calories').value;
        const calorieGoalInput = document.getElementById('calorie-goal').value;
        const proteinGoalInput = document.getElementById('protein-goal').value;
        maintenanceCalories = maintenanceCaloriesInput ? parseInt(maintenanceCaloriesInput) : maintenanceCalories;
        calorieGoal = calorieGoalInput ? parseInt(calorieGoalInput) : calorieGoal;
        proteinGoal = proteinGoalInput ? parseInt(proteinGoalInput) : proteinGoal;
        if (!isNaN(maintenanceCalories) && !isNaN(calorieGoal) && !isNaN(proteinGoal)) {
            localStorage.setItem('maintenanceCalories', maintenanceCalories);
            localStorage.setItem('calorieGoal', calorieGoal);
            localStorage.setItem('proteinGoal', proteinGoal);
            updateDisplays();
        } else {
            alert('Please enter valid numbers for the goals.');
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const foodItem = document.getElementById('food-item').value;
        const calories = parseInt(document.getElementById('calories').value);
        const protein = parseInt(document.getElementById('protein').value);
        if (foodItem && !isNaN(calories) && !isNaN(protein)) {
            const entries = JSON.parse(localStorage.getItem('calories')) || [];
            entries.push({ foodItem, calories, protein, type: 'food' });
            localStorage.setItem('calories', JSON.stringify(entries));
            loadEntries();
        } else {
            alert('Please fill in all fields.');
        }
    });

    exerciseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const exerciseItem = document.getElementById('exercise-item').value;
        const caloriesBurned = parseInt(document.getElementById('exercise-calories').value);
        if (exerciseItem && !isNaN(caloriesBurned)) {
            const entries = JSON.parse(localStorage.getItem('calories')) || [];
            entries.push({ foodItem: exerciseItem, calories: caloriesBurned, protein: 0, type: 'exercise' });
            localStorage.setItem('calories', JSON.stringify(entries));
            loadEntries();
        } else {
            alert('Please fill in both fields.');
        }
    });

    saveLogButton.addEventListener('click', function() {
        const dateInput = document.getElementById('log-date');
        const date = dateInput.value;
        if (date) {
            const entries = JSON.parse(localStorage.getItem('calorieLog')) || [];
            entries.push({
                date: date,
                totalCalories: currentTotalCalories,
                calorieGoal: calorieGoal,
                totalProtein: currentTotalProtein,
                totalBurned: currentTotalBurned,
                maintenanceCalories: maintenanceCalories
            });
            entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            localStorage.setItem('calorieLog', JSON.stringify(entries));
            alert('Log saved for ' + date);
        } else {
            alert('Please select a date for the log.');
        }
    });

    resetLogButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset the log?')) {
            localStorage.removeItem('calories');
            calorieList.innerHTML = '';
            currentTotalCalories = 0;
            currentTotalProtein = 0;
            currentTotalBurned = 0;
            updateDisplays();
            alert('Log has been reset.');
        }
    });

    viewLogButton.addEventListener('click', function() {
        window.location.href = 'log.html';
    });

    loadEntries();
});
