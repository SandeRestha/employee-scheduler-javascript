// --- Data Structures and Constants ---
// An array to store employee data: { name: '...', preferences: { 'Monday': { 'Morning': '1', ... } } }
let employees = []; 
// The final schedule, e.g., { 'Monday': { 'Morning': ['Alice', 'Bob'], ... } }
let finalSchedule = {}; 

// Constants mirroring the Python version for clarity and consistency.
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHIFTS = ["Morning", "Afternoon", "Evening"];
const MAX_EMPLOYEES_PER_SHIFT = 2;
const MAX_WORKDAYS_PER_WEEK = 5;
const STORAGE_KEY = 'employeeSchedulerData';

// --- DOM Element References ---
const employeeNameInput = document.getElementById('employee-name');
const preferenceInputContainer = document.getElementById('preference-input-rows');
const scheduleModal = document.getElementById('scheduleModal'); // Reference to the new schedule modal
const scheduleDisplayDiv = document.getElementById('schedule-display');
const editModal = document.getElementById('editModal');
const editEmployeeListDiv = document.getElementById('edit-employee-list');
const noEmployeesMessage = document.getElementById('no-employees-message');
const statusMessageDiv = document.getElementById('status-message');
const generateButton = document.querySelector('.btn-generate');
const loadingSpinner = document.getElementById('loading-spinner');

// --- Initialization on Page Load ---

/**
 * Renders the initial preference input rows for each day of the week.
 * This is called once when the page loads.
 */
document.addEventListener('DOMContentLoaded', () => {
    renderPreferenceRows();
    loadEmployees(); // Load saved data on startup
});

/**
 * Dynamically creates the rows for entering shift priorities for each day.
 */
function renderPreferenceRows() {
    preferenceInputContainer.innerHTML = '';
    DAYS.forEach(day => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('preference-row');
        
        const dayLabel = document.createElement('span');
        dayLabel.textContent = day;
        rowDiv.appendChild(dayLabel);
        
        SHIFTS.forEach(shift => {
            const select = document.createElement('select');
            select.classList.add('priority-select');
            select.dataset.day = day;
            select.dataset.shift = shift;
            
            // Create options for priority levels.
            ['1', '2', '3'].forEach(priority => {
                const option = document.createElement('option');
                option.value = priority;
                option.textContent = priority;
                select.appendChild(option);
            });
            select.value = '1'; // Set default to highest priority.
            rowDiv.appendChild(select);
        });
        preferenceInputContainer.appendChild(rowDiv);
    });
}

// --- Data Persistence (localStorage) ---

/**
 * Saves the current employees array to localStorage.
 */
function saveEmployees() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    } catch (e) {
        showStatusMessage('Failed to save data. Please check your browser settings.', 'error');
        console.error('Error saving to localStorage:', e);
    }
}

/**
 * Loads employee data from localStorage on page load.
 */
function loadEmployees() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            employees = JSON.parse(storedData);
            showStatusMessage('Employee data loaded successfully from previous session.', 'success');
        }
    } catch (e) {
        showStatusMessage('Failed to load saved data. Starting with an empty list.', 'error');
        console.error('Error loading from localStorage:', e);
        employees = [];
    }
}

// --- User Feedback Functions ---

/**
 * Displays a temporary status message to the user.
 * @param {string} message The message to display.
 * @param {string} type The message type ('success', 'error', or 'info').
 */
function showStatusMessage(message, type) {
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status-message visible ${type}`;
    
    // Hide the message after 5 seconds.
    setTimeout(() => {
        statusMessageDiv.classList.remove('visible');
    }, 5000);
}

// --- Data Collection and Management ---

/**
 * Gathers the employee's name and their priority preferences from the UI.
 * @returns {Object} An employee data object or null if validation fails.
 */
function getEmployeeDataFromForm() {
    const name = employeeNameInput.value.trim();
    if (!name) {
        showStatusMessage("Employee name is required.", 'error');
        return null;
    }

    // Check for duplicate names (case-insensitive).
    if (employees.some(emp => emp.name.toLowerCase() === name.toLowerCase())) {
        showStatusMessage(`Employee '${name}' already exists. Please use a unique name.`, 'error');
        return null;
    }

    const preferences = {};
    const selects = document.querySelectorAll('.priority-select');
    
    selects.forEach(select => {
        const day = select.dataset.day;
        const shift = select.dataset.shift;
        if (!preferences[day]) {
            preferences[day] = {};
        }
        preferences[day][shift] = select.value;
    });

    return { name, preferences };
}

/**
 * Adds a new employee to the `employees` array and updates the UI.
 */
function addEmployee() {
    const employeeData = getEmployeeDataFromForm();
    if (employeeData) {
        employees.push(employeeData);
        saveEmployees(); // Save the updated list.
        showStatusMessage(`Employee '${employeeData.name}' added successfully.`, 'success');
        
        // Clear the form for the next entry.
        employeeNameInput.value = '';
        document.querySelectorAll('.priority-select').forEach(select => select.value = '1');
    }
}

/**
 * Populates the modal with the current list of employees for editing/removal.
 * Each employee entry now includes an input field and a "Save" button.
 */
function populateEditEmployeeList() {
    editEmployeeListDiv.innerHTML = '';
    if (employees.length === 0) {
        noEmployeesMessage.style.display = 'block';
        return;
    }
    noEmployeesMessage.style.display = 'none';

    employees.forEach(emp => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('edit-employee-item');
        
        // Input field for editing the name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = emp.name;
        
        // Button group for save and remove
        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('button-group');

        const saveButton = document.createElement('button');
        saveButton.classList.add('save-btn');
        saveButton.textContent = 'Save';
        saveButton.onclick = () => saveEmployeeName(emp.name, nameInput.value);
        
        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-btn');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeEmployee(emp.name);
        
        buttonGroup.appendChild(saveButton);
        buttonGroup.appendChild(removeButton);

        itemDiv.appendChild(nameInput);
        itemDiv.appendChild(buttonGroup);
        editEmployeeListDiv.appendChild(itemDiv);
    });
}

/**
 * Saves the edited name of an employee.
 * @param {string} oldName The original name of the employee.
 * @param {string} newName The new name to save.
 */
function saveEmployeeName(oldName, newName) {
    const newNameTrimmed = newName.trim();
    if (!newNameTrimmed) {
        showStatusMessage("Employee name cannot be empty.", 'error');
        return;
    }

    // Check for duplicates, excluding the employee being edited.
    const isDuplicate = employees.some(emp => 
        emp.name.toLowerCase() === newNameTrimmed.toLowerCase() && emp.name !== oldName
    );

    if (isDuplicate) {
        showStatusMessage(`The name '${newNameTrimmed}' already exists. Please choose a unique name.`, 'error');
        return;
    }

    // Find the employee in the array and update their name.
    const employeeToUpdate = employees.find(emp => emp.name === oldName);
    if (employeeToUpdate) {
        employeeToUpdate.name = newNameTrimmed;
        saveEmployees();
        showStatusMessage(`Employee name updated from '${oldName}' to '${newNameTrimmed}'.`, 'success');
        populateEditEmployeeList(); // Re-render the list to show the change.
    }
}

/**
 * Removes an employee from the `employees` list by name.
 * @param {string} name The name of the employee to remove.
 */
function removeEmployee(name) {
    if (confirm(`Are you sure you want to remove '${name}'?`)) {
        employees = employees.filter(emp => emp.name !== name);
        saveEmployees();
        showStatusMessage(`Employee '${name}' has been removed.`, 'info');
        // Re-populate the list in the modal to reflect the change.
        populateEditEmployeeList();
    }
}

/**
 * Displays the edit employee modal.
 */
function openEditEmployeeModal() {
    populateEditEmployeeList();
    editModal.style.display = 'block';
}

/**
 * Hides the edit employee modal.
 */
function closeEditEmployeeModal() {
    editModal.style.display = 'none';
}

/**
 * Hides the schedule modal.
 */
function closeScheduleModal() {
    scheduleModal.style.display = 'none';
}

// Close any modal if the user clicks outside of it.
window.onclick = function(event) {
    if (event.target === editModal) {
        closeEditEmployeeModal();
    }
    if (event.target === scheduleModal) {
        closeScheduleModal();
    }
};

// --- Scheduling Logic ---

/**
 * Initializes the `finalSchedule` data structure for a new scheduling run.
 */
function initializeSchedule() {
    finalSchedule = {};
    DAYS.forEach(day => {
        finalSchedule[day] = {};
        SHIFTS.forEach(shift => {
            finalSchedule[day][shift] = [];
        });
    });
}

/**
 * Calculates the number of shifts each employee is assigned.
 * @param {Array} employeesList A list of employee objects.
 * @returns {Map} A map where keys are employee names and values are their assigned shifts count.
 */
function getWorkdayCounts(employeesList) {
    return new Map(employeesList.map(emp => [emp.name, 0]));
}

/**
 * Assigns employees to shifts based on their top preferences (Priority 1).
 * @param {Array} employeesToSchedule A deep copy of employee data for the current run.
 * @param {Map} workdays A map tracking each employee's assigned shifts.
 */
function assignPriorityShifts(employeesToSchedule, workdays) {
    DAYS.forEach(day => {
        const assignedOnDay = new Set();
        
        // Sort employees by their best priority for this specific day.
        const employeesSortedByPriority = employeesToSchedule
            .map(emp => {
                const minPriority = Math.min(...SHIFTS.map(shift => parseInt(emp.preferences[day][shift])));
                return { ...emp, minPriority };
            })
            .sort((a, b) => a.minPriority - b.minPriority);
        
        employeesSortedByPriority.forEach(emp => {
            if (workdays.get(emp.name) >= MAX_WORKDAYS_PER_WEEK || assignedOnDay.has(emp.name)) {
                return;
            }
            
            // Try to assign the employee to their most preferred shift for this day.
            const sortedShifts = SHIFTS.sort((s1, s2) => 
                parseInt(emp.preferences[day][s1]) - parseInt(emp.preferences[day][s2])
            );
            
            for (const shift of sortedShifts) {
                if (finalSchedule[day][shift].length < MAX_EMPLOYEES_PER_SHIFT) {
                    finalSchedule[day][shift].push(emp.name);
                    workdays.set(emp.name, workdays.get(emp.name) + 1);
                    assignedOnDay.add(emp.name);
                    break;
                }
            }
        });
    });
}

/**
 * Fills remaining schedule slots, prioritizing employees who need more shifts.
 * This version iterates through days sequentially to find available slots for employees.
 * @param {Array} employeesToSchedule A deep copy of employee data.
 * @param {Map} workdays A map tracking assigned shifts.
 * @returns {Set} A set of employees who could not be fully scheduled.
 */
function fillRemainingSlots(employeesToSchedule, workdays) {
    const unresolvedEmployees = new Set();
    
    employeesToSchedule.forEach(emp => {
        while (workdays.get(emp.name) < MAX_WORKDAYS_PER_WEEK) {
            let assignedThisPass = false;
            
            // Iterate through days sequentially to find an available slot for the employee.
            for (const targetDay of DAYS) {
                // Check if the employee is already assigned a shift on this day.
                const isAssignedToday = SHIFTS.some(shift => finalSchedule[targetDay][shift].includes(emp.name));
                if (isAssignedToday) {
                    continue; // Skip this day if the employee is already assigned a shift.
                }
                
                // Sort shifts for the current day by priority.
                const sortedShifts = SHIFTS.sort((s1, s2) => 
                    parseInt(emp.preferences[targetDay][s1]) - parseInt(emp.preferences[targetDay][s2])
                );
                
                // Try to assign the employee to a preferred shift on this day.
                for (const targetShift of sortedShifts) {
                    if (finalSchedule[targetDay][targetShift].length < MAX_EMPLOYEES_PER_SHIFT) {
                        finalSchedule[targetDay][targetShift].push(emp.name);
                        workdays.set(emp.name, workdays.get(emp.name) + 1);
                        assignedThisPass = true;
                        break; // Move to the next employee if a shift is assigned.
                    }
                }
                if (assignedThisPass) break;
            }
            
            if (assignedThisPass) continue;
            unresolvedEmployees.add(emp.name);
            break;
        }
    });

    // Fill any remaining empty slots randomly with eligible employees.
    DAYS.forEach(day => {
        SHIFTS.forEach(shift => {
            while (finalSchedule[day][shift].length < MAX_EMPLOYEES_PER_SHIFT) {
                const eligibleCandidates = employeesToSchedule.filter(emp =>
                    workdays.get(emp.name) < MAX_WORKDAYS_PER_WEEK &&
                    !finalSchedule[day][shift].includes(emp.name) &&
                    !unresolvedEmployees.has(emp.name) &&
                    !SHIFTS.some(s => s !== shift && finalSchedule[day][s].includes(emp.name)) // Not working another shift on this day
                );

                if (eligibleCandidates.length > 0) {
                    const randomIndex = Math.floor(Math.random() * eligibleCandidates.length);
                    const chosenEmployee = eligibleCandidates[randomIndex];
                    finalSchedule[day][shift].push(chosenEmployee.name);
                    workdays.set(chosenEmployee.name, workdays.get(chosenEmployee.name) + 1);
                } else {
                    break; // No more eligible employees for this slot.
                }
            }
        });
    });

    return unresolvedEmployees;
}

/**
 * The main function to generate the employee schedule.
 * It follows a multi-phase logic to assign employees based on preferences and rules.
 */
async function generateSchedule() {
    if (employees.length === 0) {
        showStatusMessage("Please add employees before generating a schedule.", 'error');
        return;
    }

    // Show loading state
    generateButton.disabled = true;
    generateButton.textContent = 'Generating...';
    loadingSpinner.classList.add('active');

    // Use a small delay to allow the UI to update with the loading state.
    await new Promise(resolve => setTimeout(resolve, 50)); 

    initializeSchedule();
    
    // Create a deep copy of employees to track workdays for this scheduling run.
    const employeesForScheduling = JSON.parse(JSON.stringify(employees));
    const workdays = getWorkdayCounts(employeesForScheduling);
    
    // --- Phase 1: Assign based on prioritized preferences. ---
    assignPriorityShifts(employeesForScheduling, workdays);

    // --- Phase 2: Resolve conflicts and fill remaining preferred days. ---
    const unresolvedEmployees = fillRemainingSlots(employeesForScheduling, workdays);

    // Hide loading state
    generateButton.disabled = false;
    generateButton.textContent = 'Generate Schedule';
    loadingSpinner.classList.remove('active');

    // --- Output and Feedback ---
    if (unresolvedEmployees.size > 0) {
        const names = Array.from(unresolvedEmployees).sort().join(', ');
        showStatusMessage(`Partial Schedule Generated: The following employees could not be fully scheduled due to conflicts or work limit: ${names}`, 'info');
    } else {
        showStatusMessage("The weekly schedule has been generated successfully!", 'success');
    }
    
    displaySchedule();
}

/**
 * Displays the final schedule in a table format inside the modal.
 */
function displaySchedule() {
    let tableHTML = '<table><thead><tr><th>Day</th>';
    // Create headers for each shift.
    SHIFTS.forEach(shift => {
        tableHTML += `<th>${shift}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    // Populate rows for each day.
    DAYS.forEach(day => {
        tableHTML += `<tr><td><strong>${day}</strong></td>`;
        SHIFTS.forEach(shift => {
            const employeesOnShift = finalSchedule[day][shift];
            // Join names with a newline for vertical display in the cell.
            const employeeNames = employeesOnShift.length > 0 ? employeesOnShift.join('\n') : 'None Assigned';
            tableHTML += `<td>${employeeNames}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    scheduleDisplayDiv.innerHTML = tableHTML;
    scheduleModal.style.display = 'block'; // Show the modal
}

/**
 * Displays the current schedule if it exists.
 */
function viewSchedule() {
    // A robust check for an empty schedule
    const isScheduleEmpty = Object.keys(finalSchedule).length === 0 || Object.values(finalSchedule).every(day => Object.values(day).every(shift => shift.length === 0));
    if (isScheduleEmpty) {
        showStatusMessage("Please generate a schedule first.", 'info');
        return;
    }
    // If a schedule exists, just display it again.
    displaySchedule();
}

/**
 * Exports the generated schedule to a CSV file.
 */
function exportSchedule() {
    if (Object.keys(finalSchedule).length === 0 || Object.values(finalSchedule).every(day => Object.values(day).every(shift => shift.length === 0))) {
        showStatusMessage("No schedule to export. Please generate one first.", 'info');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Day,Shift,Employees\n";

    DAYS.forEach(day => {
        SHIFTS.forEach(shift => {
            const employeesOnShift = finalSchedule[day][shift].join(', ');
            csvContent += `${day},${shift},"${employeesOnShift}"\n`;
        });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showStatusMessage("Schedule exported to employee_schedule.csv", 'success');
}