
// ======================================
// SPENDSENSE - SMART EXPENSE TRACKER
// ======================================

// 1. GET HTML ELEMENTS

const expenseForm = document.getElementById("expenseForm");
const expenseTitle = document.getElementById("expenseTitle");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseDate = document.getElementById("expenseDate");

const expenseList = document.getElementById("expenseList");

const totalSpent = document.getElementById("totalSpent");
const monthlySpent = document.getElementById("monthlySpent");
const expenseCount = document.getElementById("expenseCount");

const searchExpense = document.getElementById("searchExpense");
const filterCategory = document.getElementById("filterCategory");
const filterMonth = document.getElementById("filterMonth");
const sortExpenses = document.getElementById("sortExpenses");

const submitBtn = document.getElementById("submitBtn");
const cancelEdit = document.getElementById("cancelEdit");

// 2. APPLICATION DATA

let expenses = JSON.parse(localStorage.getItem("spendSenseExpenses")) || [];

let editingId = null;

let monthlyBudget = Number(localStorage.getItem("spendSenseBudget")) || 5000;

// 3. HELPER FUNCTIONS

function saveExpenses() {
    localStorage.setItem("spendSenseExpenses", JSON.stringify(expenses));
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}

function getToday() {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    return new Date(today.getTime() - offset * 60000)
        .toISOString()
        .split("T")[0];
}

// 4. ADD OR UPDATE EXPENSE

expenseForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = expenseTitle.value.trim();
    const amount = Number(expenseAmount.value);
    const category = expenseCategory.value;
    const date = expenseDate.value;

    if (!title || !category || !date || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter valid expense details.");
        return;
    }

    if (editingId !== null) {

        const expense = expenses.find(item => item.id === editingId);

        if (expense) {
            expense.title = title;
            expense.amount = amount;
            expense.category = category;
            expense.date = date;
        }

        editingId = null;
        submitBtn.textContent = "+ Add Expense";
        cancelEdit.hidden = true;

    } else {

        const newExpense = {
            id: Date.now(),
            title: title,
            amount: amount,
            category: category,
            date: date
        };

        expenses.push(newExpense);
    }

    saveExpenses();
    render();
    expenseForm.reset();
    expenseDate.value = getToday();
});

// 5. RENDER EXPENSES

function render() {

    const searchText = searchExpense.value.trim().toLowerCase();
    const selectedCategory = filterCategory.value;
    const selectedMonth = filterMonth.value;
    const sortValue = sortExpenses.value;

    let filteredExpenses = expenses.filter(expense => {

        const matchesSearch = expense.title.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            expense.category === selectedCategory;

        const matchesMonth =
            !selectedMonth ||
            expense.date.startsWith(selectedMonth);

        return matchesSearch && matchesCategory && matchesMonth;
    });

    // SORT EXPENSES

    filteredExpenses.sort((a, b) => {

        if (sortValue === "newest") {
            return b.date.localeCompare(a.date) || b.id - a.id;
        }

        if (sortValue === "oldest") {
            return a.date.localeCompare(b.date) || a.id - b.id;
        }

        if (sortValue === "high") {
            return b.amount - a.amount;
        }

        if (sortValue === "low") {
            return a.amount - b.amount;
        }

        return 0;
    });

    // DISPLAY EXPENSES

    if (filteredExpenses.length === 0) {

        expenseList.innerHTML = `
            <p class="empty-message">
                No expenses found. Try adding an expense!
            </p>
        `;

    } else {

        expenseList.innerHTML = filteredExpenses.map(expense => `

            <article class="expense-item">

                <div class="expense-info">
                    <h3>${escapeHTML(expense.title)}</h3>
                    <p>
                        ${escapeHTML(expense.category)}
                        • ${formatDate(expense.date)}
                    </p>
                </div>

                <div class="expense-actions">
                    <strong>${formatCurrency(expense.amount)}</strong>

                    <button class="edit-btn" data-id="${expense.id}">
                        Edit
                    </button>

                    <button class="delete-btn" data-id="${expense.id}">
                        Delete
                    </button>
                </div>

            </article>

        `).join("");
    }

    // UPDATE DASHBOARD TOTALS

    const allTimeTotal = expenses.reduce(
        (sum, expense) => sum + expense.amount, 0
    );

    const currentMonth = getToday().slice(0, 7);

    const thisMonthTotal = expenses
        .filter(expense => expense.date.startsWith(currentMonth))
        .reduce((sum, expense) => sum + expense.amount, 0);

    totalSpent.textContent = formatCurrency(allTimeTotal);
    monthlySpent.textContent = formatCurrency(thisMonthTotal);
    expenseCount.textContent = expenses.length;

    updateBudget();
    renderCategorySummary();
    renderChart();
}

// 6. SAFE TEXT DISPLAY

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// 7. EDIT AND DELETE USING EVENT DELEGATION

expenseList.addEventListener("click", function(event) {

    const id = Number(event.target.dataset.id);

    if (!id) return;

    if (event.target.classList.contains("edit-btn")) {

        const expense = expenses.find(item => item.id === id);

        if (!expense) return;

        expenseTitle.value = expense.title;
        expenseAmount.value = expense.amount;
        expenseCategory.value = expense.category;
        expenseDate.value = expense.date;

        editingId = id;

        submitBtn.textContent = "Update Expense";
        cancelEdit.hidden = false;

        expenseTitle.focus();

    }

    if (event.target.classList.contains("delete-btn")) {

        const confirmDelete = confirm(
            "Are you sure you want to delete this expense?"
        );

        if (confirmDelete) {
            expenses = expenses.filter(item => item.id !== id);
            saveExpenses();
            render();
        }
    }
});

// 8. CANCEL EDITING

cancelEdit.addEventListener("click", function() {

    editingId = null;

    expenseForm.reset();
    expenseDate.value = getToday();

    submitBtn.textContent = "+ Add Expense";
    cancelEdit.hidden = true;
});

// 9. SEARCH, FILTER AND SORT

searchExpense.addEventListener("input", render);
filterCategory.addEventListener("change", render);
filterMonth.addEventListener("change", render);
sortExpenses.addEventListener("change", render);

// 10. CATEGORY SUMMARY

function renderCategorySummary() {

    const categorySummary = document.getElementById("categorySummary");

    const totals = {};

    expenses.forEach(expense => {
        totals[expense.category] =
            (totals[expense.category] || 0) + expense.amount;
    });

    categorySummary.innerHTML = Object.entries(totals).length
        ? Object.entries(totals).map(([category, amount]) =>
            `<p>${escapeHTML(category)}: <strong>${formatCurrency(amount)}</strong></p>`
        ).join("")
        : "<p>No expenses recorded yet.</p>";
}

// 11. MONTHLY BUDGET

const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("budgetInput");

function updateBudget() {

    const currentMonth = getToday().slice(0, 7);

    const spent = expenses
        .filter(expense => expense.date.startsWith(currentMonth))
        .reduce((sum, expense) => sum + expense.amount, 0);

    document.getElementById("budgetAmount").textContent =
        formatCurrency(monthlyBudget);

    const percentage = monthlyBudget > 0
        ? (spent / monthlyBudget) * 100
        : 0;

    const progress = document.getElementById("budgetProgress");

    progress.style.width = Math.min(percentage, 100) + "%";

    const status = document.getElementById("budgetStatus");
    const message = document.getElementById("budgetMessage");

    if (percentage >= 100) {
        status.textContent = "Budget exceeded!";
        message.textContent = "You've crossed your monthly budget.";
    } else if (percentage >= 80) {
        status.textContent = "Almost at your limit!";
        message.textContent = "Warning: You've used " + percentage.toFixed(1) + "% of your budget.";
    } else {
        status.textContent = "Within your budget";
        message.textContent = formatCurrency(monthlyBudget - spent) + " remaining this month.";
    }
}

budgetForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const value = Number(budgetInput.value);

    if (!Number.isFinite(value) || value <= 0) {
        alert("Enter a valid budget.");
        return;
    }

    monthlyBudget = value;

    localStorage.setItem("spendSenseBudget", monthlyBudget);

    budgetInput.value = "";

    render();
});

// 12. DARK AND LIGHT MODE

const themeToggle = document.getElementById("themeToggle");

let savedTheme = localStorage.getItem("spendSenseTheme") || "light";

function applyTheme() {

    document.body.classList.toggle("dark", savedTheme === "dark");

    themeToggle.textContent =
        savedTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
}

themeToggle.addEventListener("click", function() {

    savedTheme = savedTheme === "light" ? "dark" : "light";

    localStorage.setItem("spendSenseTheme", savedTheme);

    applyTheme();
});

// 13. EXPORT CSV

document.getElementById("exportCSV").addEventListener("click", function() {

    const headers = ["Title", "Amount", "Category", "Date"];

    const rows = expenses.map(expense => [
        expense.title,
        expense.amount,
        expense.category,
        expense.date
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(value =>
            `"${String(value).replace(/"/g, '""')}"`
        ).join(","))
        .join("\n");

    downloadFile(csv, "spendsense-expenses.csv", "text/csv;charset=utf-8;");
});

// 14. EXPORT JSON

document.getElementById("exportJSON").addEventListener("click", function() {

    const json = JSON.stringify(expenses, null, 2);

    downloadFile(json, "spendsense-expenses.json", "application/json");
});

// 15. DOWNLOAD HELPER

function downloadFile(content, filename, type) {

    const blob = new Blob([content], { type });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

// 16. CATEGORY CHART

let expenseChart = null;

function renderChart() {

    const canvas = document.getElementById("expenseChart");

    if (typeof Chart === "undefined") return;

    const totals = {};

    expenses.forEach(expense => {
        totals[expense.category] =
            (totals[expense.category] || 0) + expense.amount;
    });

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: Object.keys(totals),

            datasets: [{
                data: Object.values(totals),
                backgroundColor: [
                    "#6657e8",
                    "#24b8a5",
                    "#f4a340",
                    "#ef7187",
                    "#5396e8",
                    "#a77bea",
                    "#65b98a",
                    "#9ca3af"
                ],
                borderWidth: 0
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

// 17. INITIALIZE APPLICATION

expenseDate.value = getToday();

applyTheme();

render();
