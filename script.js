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

    let calorieGoal = parseInt(localStorage.getItem('calorieGoal')) || 0;
    let proteinGoal = parseInt(localStorage.getItem('proteinGoal')) || 0;
    let currentTotalCalories = 0;
    let currentTotalProtein = 0;

    updateDisplays(); // Initial update for all displays
    loadEntries();

    function loadEntries() {
        const entries = JSON.parse(localStorage.getItem('calories')) || [];
        calorieList.innerHTML = '';
        currentTotalCalories = 0;
        currentTotalProtein = 0;
        entries.forEach((entry, index) => {
            addEntryToDOM(entry.foodItem, entry.calories, entry.protein, index);
            currentTotalCalories += parseInt(entry.calories);
            currentTotalProtein += parseInt(entry.protein);
        });
        updateDisplays();
    }

    function addEntryToDOM(foodItem, calories, protein, index) {
        const entry = document.createElement('div');
        entry.classList.add('calorie-entry');
        entry.innerHTML = `<strong>${foodItem}</strong>: ${calories} calories, ${protein}g protein <button class="remove-button" data-index="${index}">Remove</button>`;
        calorieList.appendChild(entry);
    }

    calorieList.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-button')) {
            const index = e.target.getAttribute('data-index');
            removeEntry(index);
        }
    });

    function removeEntry(index) {
        let entries = JSON.parse(localStorage.getItem('calories'));
        entries.splice(index, 1);
        localStorage.setItem('calories', JSON.stringify(entries));
        loadEntries(); // Reload entries to update the DOM
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const foodItem = document.getElementById('food-item').value;
        const calories = parseInt(document.getElementById('calories').value);
        const protein = parseInt(document.getElementById('protein').value);
        if (foodItem && calories && protein) {
            const entries = JSON.parse(localStorage.getItem('calories')) || [];
            entries.push({ foodItem, calories, protein });
            localStorage.setItem('calories', JSON.stringify(entries));
            loadEntries(); // Recalculate and reload entries
        } else {
            alert('Please fill in all fields.');
        }
    });

    exerciseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const exerciseItem = document.getElementById('exercise-item').value;
        const caloriesBurned = parseInt(document.getElementById('exercise-calories').value);
        if (exerciseItem && caloriesBurned) {
            const entries = JSON.parse(localStorage.getItem('calories')) || [];
            entries.push({ foodItem: exerciseItem, calories: -caloriesBurned, protein: 0 });
            localStorage.setItem('calories', JSON.stringify(entries));
            loadEntries(); // Update entries with exercise
        } else {
            alert('Please fill in both fields.');
        }
    });

    goalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        calorieGoal = parseInt(document.getElementById('calorie-goal').value);
        proteinGoal = parseInt(document.getElementById('protein-goal').value);
        if (!isNaN(calorieGoal) && !isNaN(proteinGoal)) {
            localStorage.setItem('calorieGoal', calorieGoal);
            localStorage.setItem('proteinGoal', proteinGoal);
            updateDisplays();  // Recalculate calories and protein to update the display correctly
        } else {
            alert('Please enter valid numbers for the goals.');
        }
    });

    saveLogButton.addEventListener('click', function() {
        const date = document.getElementById('log-date').value;
        if (date) {
            const entries = JSON.parse(localStorage.getItem('calorieLog')) || [];
            entries.push({
                date: date,
                remainingCalories: calorieGoal - currentTotalCalories,
                totalCalories: currentTotalCalories,
                calorieGoal: calorieGoal,
                remainingProtein: proteinGoal - currentTotalProtein,
                totalProtein: currentTotalProtein,
                proteinGoal: proteinGoal
            });
            // Sort entries by date before saving
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
            updateDisplays();
            alert('Log has been reset.');
        }
    });

    viewLogButton.addEventListener('click', function() {
        window.location.href = 'log.html'; // Assuming 'log.html' is the log page
    });

    function updateDisplays() {
        totalCalories.textContent = `Total Calories: ${currentTotalCalories}`;
        calorieGoalDisplay.textContent = `Calorie Goal: ${calorieGoal}`;
        caloriesRemaining.textContent = `Remaining Calories: ${calorieGoal - currentTotalCalories}`;
        totalProtein.textContent = `Total Protein: ${currentTotalProtein}g`;
        proteinGoalDisplay.textContent = `Protein Goal: ${proteinGoal}g`;
        proteinRemaining.textContent = `Remaining Protein: ${proteinGoal - currentTotalProtein}g`;
        const progress = Math.min((currentTotalCalories / calorieGoal) * 100, 100);
        document.getElementById('progress-bar').style.width = `${progress}%`;
        caloriesRemaining.style.color = currentTotalCalories > calorieGoal ? 'red' : 'green';
    }

    loadEntries(); // Initial load of entries
});
