document.addEventListener("DOMContentLoaded", function() {
    const logEntriesDiv = document.getElementById('log-entries');
    const resetLogButton = document.getElementById('reset-log-button');
    loadEntries();

    resetLogButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset the entire log?')) {
            localStorage.removeItem('calorieLog');
            logEntriesDiv.innerHTML = '<p>No log entries found.</p>';
            alert('Log has been reset.');
        }
    });

    function loadEntries() {
        let entries = JSON.parse(localStorage.getItem('calorieLog')) || [];
        // Sort entries by date
        entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        logEntriesDiv.innerHTML = ''; // Clear existing entries

        if (entries.length === 0) {
            logEntriesDiv.innerHTML = '<p>No log entries found.</p>';
        } else {
            entries.forEach((entry, index) => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('log-entry');
                entryDiv.innerHTML = `<strong>Date:</strong> ${entry.date}<br>
                                      <strong>Total Calories:</strong> ${entry.totalCalories}<br>
                                      <strong>Calorie Goal:</strong> ${entry.calorieGoal}<br>
                                      <strong>Remaining Calories:</strong> ${entry.remainingCalories}<br>
                                      <strong>Total Protein:</strong> ${entry.totalProtein}g<br>
                                      <strong>Protein Goal:</strong> ${entry.proteinGoal}g<br>
                                      <strong>Remaining Protein:</strong> ${entry.remainingProtein}g
                                      <button class="remove-entry" data-index="${index}">Remove</button>`;
                logEntriesDiv.appendChild(entryDiv);
            });
        }
    }

    logEntriesDiv.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-entry')) {
            const index = e.target.getAttribute('data-index');
            removeEntry(index);
        }
    });

    function removeEntry(index) {
        let entries = JSON.parse(localStorage.getItem('calorieLog'));
        entries.splice(index, 1); // Remove the entry at the specified index
        entries.sort((a, b) => new Date(a.date) - new Date(b.date)); // Re-sort entries after removal
        localStorage.setItem('calorieLog', JSON.stringify(entries));
        loadEntries(); // Refresh the list of entries
    }
});
