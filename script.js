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

    let calorieGoal = parseInt(localStorage.getItem('calorieGoal')) || 0;
    let currentTotal = 0;

    updateDisplays(); // Initial update for all displays
    loadEntries();

    function updateDisplays() {
        totalCalories.textContent = `Total Calories: ${currentTotal}`;
        calorieGoalDisplay.textContent = `Goal: ${calorieGoal}`;
        caloriesRemaining.textContent = `Remaining: ${calorieGoal - currentTotal}`;
        const progress = Math.min((currentTotal / calorieGoal) * 100, 100);
        document.getElementById('progress-bar').style.width = `${progress}%`;
        caloriesRemaining.style.color = currentTotal > calorieGoal ? 'red' : 'green';
    }

    function loadEntries() {
        const entries = JSON.parse(localStorage.getItem('calories')) || [];
        calorieList.innerHTML = '';
        currentTotal = 0;
        entries.forEach((entry, index) => {
            addEntryToDOM(entry.foodItem, entry.calories, index);
            currentTotal += parseInt(entry.calories);
        });
        updateDisplays();
    }

    function addEntryToDOM(foodItem, calories, index) {
        const entry = document.createElement('div');
        entry.classList.add('calorie-entry');
        entry.innerHTML = `<strong>${foodItem}</strong>: ${calories} calories <button class="remove-button" data-index="${index}">Remove</button>`;
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
        loadEntries();
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const foodItem = document.getElementById('food-item').value;
        const calories = parseInt(document.getElementById('calories').value);
        if (foodItem && calories) {
            const entries = JSON.parse(localStorage.getItem('calories')) || [];
            entries.push({ foodItem, calories });
            localStorage.setItem('calories', JSON.stringify(entries));
            loadEntries();
        } else {
            alert('Please fill in both fields.');
        }
    });

    exerciseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const exerciseItem = document.getElementById('exercise-item').value;
        const caloriesBurned = parseInt(document.getElementById('exercise-calories').value);
        if (exerciseItem && caloriesBurned) {
            const entries = JSON.parse(localStorage.getItem('calories')) || [];
            entries.push({ foodItem: exerciseItem, calories: -caloriesBurned });
            localStorage.setItem('calories', JSON.stringify(entries));
            loadEntries();
        } else {
            alert('Please fill in both fields.');
        }
    });

    goalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        calorieGoal = parseInt(document.getElementById('calorie-goal').value);
        if (!isNaN(calorieGoal)) {
            localStorage.setItem('calorieGoal', calorieGoal);
            updateDisplays();  // Recalculate calories to update the display correctly
        } else {
            alert('Please enter a valid number for the calorie goal.');
        }
    });

    saveLogButton.addEventListener('click', function() {
        const dateInput = document.getElementById('log-date');
        const date = dateInput.value;
        if (date) {
            const entries = JSON.parse(localStorage.getItem('calorieLog')) || [];
            entries.push({
                date: date,
                remainingCalories: calorieGoal - currentTotal,
                totalCalories: currentTotal,
                calorieGoal: calorieGoal
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
            currentTotal = 0;
            updateDisplays();
            alert('Log has been reset.');
        }
    });

    viewLogButton.addEventListener('click', function() {
        window.location.href = 'log.html'; // Assuming 'log.html' is the log page
    });
});
