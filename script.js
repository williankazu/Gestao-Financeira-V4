
        // Data Storage
        let transactions = loadStoredTransactions();
        let currentFilter = 'all';
        let pieChart = null;
        let currentCalendarMonth = new Date().getMonth();
        let currentCalendarYear = new Date().getFullYear();
        let selectedDay = null;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('date').valueAsDate = new Date();
            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();
            renderCalendar();
        });

        // Modal Functions
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('is-active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('is-active');
        }

        // Add Transaction
        function addTransaction() {
            const type = document.getElementById('transactionType').value;
            const description = document.getElementById('description').value.trim();
            const category = document.getElementById('category').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const date = document.getElementById('date').value;
            const paymentMethod = document.getElementById('paymentMethod').value;

            if (!description || !Number.isFinite(amount) || amount <= 0 || !isValidDateValue(date)) {
                alert('Por favor, preencha todos os campos!');
                return;
            }

            const transaction = {
                id: Date.now(),
                type,
                description,
                category,
                amount,
                date,
                paymentMethod,
                timestamp: new Date().getTime()
            };

            transactions.push(transaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));

            // Clear form
            document.getElementById('description').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('date').valueAsDate = new Date();

            closeModal('addModal');
            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();
            renderCalendar();

            showNotification('Transação adicionada com sucesso!', 'is-success');
        }

        // Edit Transaction
        function editTransaction(id) {
            const transaction = transactions.find(t => t.id === id);
            if (!transaction) return;

            document.getElementById('editId').value = transaction.id;
            document.getElementById('editType').value = transaction.type;
            document.getElementById('editDescription').value = transaction.description;
            document.getElementById('editCategory').value = transaction.category;
            document.getElementById('editAmount').value = transaction.amount;
            document.getElementById('editDate').value = transaction.date;
            document.getElementById('editPaymentMethod').value = transaction.paymentMethod || 'dinheiro';

            openModal('editModal');
        }

        function saveEdit() {
            const id = parseInt(document.getElementById('editId').value);
            const index = transactions.findIndex(t => t.id === id);

            if (index === -1) return;

            const description = document.getElementById('editDescription').value.trim();
            const amount = parseFloat(document.getElementById('editAmount').value);
            const date = document.getElementById('editDate').value;

            if (!description || !Number.isFinite(amount) || amount <= 0 || !isValidDateValue(date)) {
                alert('Por favor, preencha todos os campos com valores válidos!');
                return;
            }

            transactions[index] = {
                ...transactions[index],
                type: document.getElementById('editType').value,
                description: description,
                category: document.getElementById('editCategory').value,
                amount: amount,
                date: date,
                paymentMethod: document.getElementById('editPaymentMethod').value
            };

            localStorage.setItem('transactions', JSON.stringify(transactions));
            closeModal('editModal');
            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();
            renderCalendar();

            showNotification('Transação atualizada com sucesso!', 'is-info');
        }

        // Delete Transaction
        function deleteTransaction(id) {
            if (!confirm('Deseja realmente excluir esta transação?')) return;

            transactions = transactions.filter(t => t.id !== id);
            localStorage.setItem('transactions', JSON.stringify(transactions));

            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();
            renderCalendar();

            showNotification('Transação excluída com sucesso!', 'is-danger');
        }

        // Toggle Select All
        function toggleSelectAll() {
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            const checkboxes = document.querySelectorAll('.transaction-checkbox');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            
            updateBulkActions();
        }

        // Update Bulk Actions
        function updateBulkActions() {
            const checkboxes = document.querySelectorAll('.transaction-checkbox');
            const checkedBoxes = document.querySelectorAll('.transaction-checkbox:checked');
            const bulkActions = document.getElementById('bulkActions');
            const selectedCount = document.getElementById('selectedCount');
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            
            // Update count
            selectedCount.textContent = `${checkedBoxes.length} selecionada${checkedBoxes.length !== 1 ? 's' : ''}`;
            
            // Show/hide bulk actions
            if (checkedBoxes.length > 0) {
                bulkActions.classList.add('active');
            } else {
                bulkActions.classList.remove('active');
            }
            
            // Update "Select All" checkbox state
            if (checkboxes.length > 0) {
                selectAllCheckbox.checked = checkedBoxes.length === checkboxes.length;
                selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
            }
            
            // Update visual selection
            checkboxes.forEach(checkbox => {
                const transactionId = checkbox.getAttribute('data-transaction-id');
                const transactionElement = document.getElementById(`transaction-${transactionId}`);
                if (checkbox.checked) {
                    transactionElement.classList.add('selected');
                } else {
                    transactionElement.classList.remove('selected');
                }
            });
        }

        // Delete Selected Transactions
        function deleteSelected() {
            const checkedBoxes = document.querySelectorAll('.transaction-checkbox:checked');
            
            if (checkedBoxes.length === 0) {
                showNotification('Nenhuma transação selecionada!', 'is-warning');
                return;
            }
            
            const count = checkedBoxes.length;
            const message = count === 1 
                ? 'Deseja realmente excluir 1 transação selecionada?' 
                : `Deseja realmente excluir ${count} transações selecionadas?`;
            
            if (!confirm(message)) return;
            
            // Get IDs of selected transactions
            const selectedIds = Array.from(checkedBoxes).map(checkbox => 
                parseInt(checkbox.getAttribute('data-transaction-id'))
            );
            
            // Filter out selected transactions
            transactions = transactions.filter(t => !selectedIds.includes(t.id));
            localStorage.setItem('transactions', JSON.stringify(transactions));
            
            // Update UI
            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();
            renderCalendar();
            
            showNotification(`${count} transação${count !== 1 ? 'ões' : ''} excluída${count !== 1 ? 's' : ''} com sucesso!`, 'is-success');
        }

        // Filter Transactions
        function filterByPeriod(period) {
            currentFilter = period;

            // Update button states
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('is-active');
            });
            document.querySelectorAll(`[data-period="${period}"]`).forEach(btn => {
                btn.classList.add('is-active');
            });

            loadTransactions();
            updateStats();
            updateChart();
            
            // Show comparison for specific periods
            if (['today', 'yesterday', 'week', 'lastWeek', 'month', 'lastMonth', 'year', 'lastYear'].includes(period)) {
                calculatePeriodComparison(period);
            } else {
                document.getElementById('periodComparison').style.display = 'none';
            }
        }

        // Calculate Period Comparison
        function calculatePeriodComparison(period) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            let currentPeriodStart, currentPeriodEnd, previousPeriodStart, previousPeriodEnd;
            let periodName = '';

            switch(period) {
                case 'today':
                    currentPeriodStart = new Date(today);
                    currentPeriodEnd = new Date(today);
                    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 1);
                    previousPeriodStart = new Date(today);
                    previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
                    previousPeriodEnd = new Date(today);
                    periodName = 'ontem';
                    break;

                case 'yesterday':
                    currentPeriodStart = new Date(today);
                    currentPeriodStart.setDate(currentPeriodStart.getDate() - 1);
                    currentPeriodEnd = new Date(today);
                    previousPeriodStart = new Date(today);
                    previousPeriodStart.setDate(previousPeriodStart.getDate() - 2);
                    previousPeriodEnd = new Date(today);
                    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
                    periodName = 'anteontem';
                    break;

                case 'week':
                    currentPeriodStart = new Date(today);
                    currentPeriodStart.setDate(today.getDate() - today.getDay());
                    currentPeriodEnd = new Date(today);
                    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 1);
                    previousPeriodStart = new Date(currentPeriodStart);
                    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
                    previousPeriodEnd = new Date(currentPeriodStart);
                    periodName = 'semana passada';
                    break;

                case 'lastWeek':
                    currentPeriodEnd = new Date(today);
                    currentPeriodEnd.setDate(today.getDate() - today.getDay());
                    currentPeriodStart = new Date(currentPeriodEnd);
                    currentPeriodStart.setDate(currentPeriodStart.getDate() - 7);
                    previousPeriodStart = new Date(currentPeriodStart);
                    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
                    previousPeriodEnd = new Date(currentPeriodStart);
                    periodName = 'duas semanas atrás';
                    break;

                case 'month':
                    currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 1);
                    previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 1);
                    periodName = 'mês passado';
                    break;

                case 'lastMonth':
                    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                    currentPeriodStart = new Date(lastMonthYear, lastMonth, 1);
                    currentPeriodEnd = new Date(lastMonthYear, lastMonth + 1, 1);
                    previousPeriodStart = new Date(lastMonthYear, lastMonth - 1, 1);
                    previousPeriodEnd = new Date(lastMonthYear, lastMonth, 1);
                    periodName = 'dois meses atrás';
                    break;

                case 'year':
                    currentPeriodStart = new Date(now.getFullYear(), 0, 1);
                    currentPeriodEnd = new Date(now.getFullYear() + 1, 0, 1);
                    previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
                    previousPeriodEnd = new Date(now.getFullYear(), 0, 1);
                    periodName = 'ano passado';
                    break;

                case 'lastYear':
                    currentPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
                    currentPeriodEnd = new Date(now.getFullYear(), 0, 1);
                    previousPeriodStart = new Date(now.getFullYear() - 2, 0, 1);
                    previousPeriodEnd = new Date(now.getFullYear() - 1, 0, 1);
                    periodName = 'dois anos atrás';
                    break;
            }

            // Calculate current period totals
            const currentTransactions = transactions.filter(t => {
                const date = new Date(t.date + 'T00:00:00');
                return date >= currentPeriodStart && date < currentPeriodEnd;
            });

            const currentIncome = currentTransactions
                .filter(t => t.type === 'income' || t.type === 'entrada')
                .reduce((sum, t) => sum + t.amount, 0);

            const currentExpense = currentTransactions
                .filter(t => t.type === 'expense' || t.type === 'saida')
                .reduce((sum, t) => sum + t.amount, 0);

            const currentBalance = currentIncome - currentExpense;

            // Calculate previous period totals
            const previousTransactions = transactions.filter(t => {
                const date = new Date(t.date + 'T00:00:00');
                return date >= previousPeriodStart && date < previousPeriodEnd;
            });

            const previousIncome = previousTransactions
                .filter(t => t.type === 'income' || t.type === 'entrada')
                .reduce((sum, t) => sum + t.amount, 0);

            const previousExpense = previousTransactions
                .filter(t => t.type === 'expense' || t.type === 'saida')
                .reduce((sum, t) => sum + t.amount, 0);

            const previousBalance = previousIncome - previousExpense;

            // Calculate differences
            const incomeDiff = currentIncome - previousIncome;
            const expenseDiff = currentExpense - previousExpense;
            const balanceDiff = currentBalance - previousBalance;

            // Calculate percentages
            const incomePercent = previousIncome > 0 ? ((incomeDiff / previousIncome) * 100) : 0;
            const expensePercent = previousExpense > 0 ? ((expenseDiff / previousExpense) * 100) : 0;
            const balancePercent = previousBalance !== 0 ? ((balanceDiff / Math.abs(previousBalance)) * 100) : 0;

            // Update UI
            const formatComparison = (diff, percent, isExpense = false) => {
                const sign = diff >= 0 ? '+' : '';
                const color = isExpense 
                    ? (diff > 0 ? 'has-text-danger' : 'has-text-success')
                    : (diff >= 0 ? 'has-text-success' : 'has-text-danger');
                const arrow = diff >= 0 ? '↑' : '↓';
                
                return `
                    <span class="${color}">
                        ${sign}R$ ${Math.abs(diff).toFixed(2)} 
                        (${arrow} ${Math.abs(percent).toFixed(1)}%)
                    </span>
                    <br>
                    <small class="has-text-grey">vs ${periodName}</small>
                `;
            };

            document.getElementById('incomeComparison').innerHTML = formatComparison(incomeDiff, incomePercent);
            document.getElementById('expenseComparison').innerHTML = formatComparison(expenseDiff, expensePercent, true);
            document.getElementById('balanceComparison').innerHTML = formatComparison(balanceDiff, balancePercent);

            document.getElementById('periodComparison').style.display = 'block';
        }

        function getFilteredTransactions() {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            return transactions.filter(t => {
                const transactionDate = new Date(t.date + 'T00:00:00');

                switch(currentFilter) {
                    case 'today':
                        return transactionDate >= today && transactionDate < tomorrow;
                    
                    case 'yesterday':
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        return transactionDate >= yesterday && transactionDate < today;
                    
                    case 'week':
                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - today.getDay()); // Domingo
                        return transactionDate >= weekStart && transactionDate < tomorrow;
                    
                    case 'lastWeek':
                        const lastWeekEnd = new Date(today);
                        lastWeekEnd.setDate(today.getDate() - today.getDay()); // Domingo desta semana
                        const lastWeekStart = new Date(lastWeekEnd);
                        lastWeekStart.setDate(lastWeekEnd.getDate() - 7); // Domingo da semana passada
                        return transactionDate >= lastWeekStart && transactionDate < lastWeekEnd;
                    
                    case 'month':
                        return transactionDate.getMonth() === now.getMonth() && 
                               transactionDate.getFullYear() === now.getFullYear();
                    
                    case 'lastMonth':
                        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                        return transactionDate.getMonth() === lastMonth && 
                               transactionDate.getFullYear() === lastMonthYear;
                    
                    case 'year':
                        return transactionDate.getFullYear() === now.getFullYear();
                    
                    case 'lastYear':
                        return transactionDate.getFullYear() === now.getFullYear() - 1;
                    
                    default:
                        return true;
                }
            });
        }

        // Load Transactions
        function loadTransactions() {
            const filteredTransactions = getFilteredTransactions();
            const list = document.getElementById('transactionsList');

            if (filteredTransactions.length === 0) {
                list.innerHTML = '<p class="has-text-centered has-text-grey">Nenhuma transação encontrada</p>';
                document.getElementById('selectAllCheckbox').checked = false;
                updateBulkActions();
                return;
            }

            const paymentIcons = {
                'dinheiro': '💵',
                'pix': '📱',
                'credito': '💳',
                'debito': '💳',
                'crediario': '📝'
            };

            const paymentLabels = {
                'dinheiro': 'Dinheiro',
                'pix': 'PIX',
                'credito': 'Crédito',
                'debito': 'Débito',
                'crediario': 'Crediário'
            };

            const typeLabels = {
                'income': 'Receita',
                'expense': 'Despesa',
                'entrada': 'Entrada',
                'saida': 'Saída'
            };

            list.innerHTML = filteredTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(t => {
                    const isPositive = t.type === 'income' || t.type === 'entrada';
                    const typeClass = isPositive ? 'income' : 'expense';
                    const paymentMethod = paymentLabels[t.paymentMethod] ? t.paymentMethod : 'dinheiro';
                    const safeDescription = escapeHTML(t.description);
                    const safeCategory = escapeHTML(t.category);
                    const safeType = escapeHTML(typeLabels[t.type] || 'Transação');
                    
                    return `
                    <div class="transaction-item ${typeClass}" id="transaction-${t.id}">
                        <div class="level is-mobile">
                            <div class="level-left">
                                <div class="level-item">
                                    <input type="checkbox" 
                                           class="transaction-checkbox" 
                                           data-transaction-id="${t.id}"
                                           onchange="updateBulkActions()">
                                </div>
	                                <div class="level-item">
	                                    <div>
	                                        <p class="heading">${formatDate(t.date)} • ${safeType}</p>
	                                        <p class="title is-6">${safeDescription}</p>
	                                        <div>
	                                            <span class="category-badge has-background-light">${safeCategory}</span>
	                                            <span class="category-badge has-background-info has-text-white ml-2">
	                                                ${paymentIcons[paymentMethod]} ${paymentLabels[paymentMethod]}
	                                            </span>
	                                        </div>
	                                    </div>
                                </div>
                            </div>
                            <div class="level-right">
                                <div class="level-item">
                                    <div class="has-text-right">
                                        <p class="title is-5 ${isPositive ? 'has-text-success' : 'has-text-danger'}">
                                            ${isPositive ? '+' : '-'} R$ ${t.amount.toFixed(2)}
                                        </p>
	                                        <div class="buttons is-right">
	                                            <button class="button is-small is-info" onclick="editTransaction(${t.id})">
	                                                <span class="icon"><i class="fas fa-edit"></i></span>
	                                            </button>
	                                            <button class="button is-small is-danger" onclick="deleteTransaction(${t.id})">
	                                                <span class="icon"><i class="fas fa-trash"></i></span>
	                                            </button>
	                                        </div>
	                                    </div>
	                                </div>
                            </div>
                        </div>
                    </div>
                `}).join('');

            updateBulkActions();
        }

        // Update Stats
        function updateStats() {
            const filteredTransactions = getFilteredTransactions();

            const income = filteredTransactions
                .filter(t => t.type === 'income' || t.type === 'entrada')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = filteredTransactions
                .filter(t => t.type === 'expense' || t.type === 'saida')
                .reduce((sum, t) => sum + t.amount, 0);

            const balance = income - expense;
            const savingsRate = income > 0 ? ((balance / income) * 100) : 0;

            document.getElementById('totalIncome').textContent = `R$ ${income.toFixed(2)}`;
            document.getElementById('totalExpense').textContent = `R$ ${expense.toFixed(2)}`;
            document.getElementById('balance').textContent = `R$ ${balance.toFixed(2)}`;
            document.getElementById('savings').textContent = `${savingsRate.toFixed(1)}%`;

            updatePaymentMethodsStats();
            updateHistoricalSummary();
        }

        // Update Historical Summary
        function updateHistoricalSummary() {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Today
            const todayTrans = transactions.filter(t => {
                const date = new Date(t.date + 'T00:00:00');
                return date >= today && date < tomorrow;
            });
            const todayIncome = todayTrans.filter(t => t.type === 'income' || t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
            const todayExpense = todayTrans.filter(t => t.type === 'expense' || t.type === 'saida').reduce((s, t) => s + t.amount, 0);
            const todayBalance = todayIncome - todayExpense;

            // Yesterday
            const yesterdayStart = new Date(today);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            const yesterdayEnd = new Date(today);
            const yesterdayTrans = transactions.filter(t => {
                const date = new Date(t.date + 'T00:00:00');
                return date >= yesterdayStart && date < yesterdayEnd;
            });
            const yesterdayIncome = yesterdayTrans.filter(t => t.type === 'income' || t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
            const yesterdayExpense = yesterdayTrans.filter(t => t.type === 'expense' || t.type === 'saida').reduce((s, t) => s + t.amount, 0);
            const yesterdayBalance = yesterdayIncome - yesterdayExpense;

            // Last Week
            const lastWeekEnd = new Date(today);
            lastWeekEnd.setDate(today.getDate() - today.getDay());
            const lastWeekStart = new Date(lastWeekEnd);
            lastWeekStart.setDate(lastWeekStart.getDate() - 6);
            const lastWeekTrans = transactions.filter(t => {
                const date = new Date(t.date + 'T00:00:00');
                return date >= lastWeekStart && date < lastWeekEnd;
            });
            const lastWeekIncome = lastWeekTrans.filter(t => t.type === 'income' || t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
            const lastWeekExpense = lastWeekTrans.filter(t => t.type === 'expense' || t.type === 'saida').reduce((s, t) => s + t.amount, 0);
            const lastWeekBalance = lastWeekIncome - lastWeekExpense;

            // Last Month
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            const lastMonthTrans = transactions.filter(t => {
                const date = new Date(t.date + 'T00:00:00');
                return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
            });
            const lastMonthIncome = lastMonthTrans.filter(t => t.type === 'income' || t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
            const lastMonthExpense = lastMonthTrans.filter(t => t.type === 'expense' || t.type === 'saida').reduce((s, t) => s + t.amount, 0);
            const lastMonthBalance = lastMonthIncome - lastMonthExpense;

            // Update UI
            const formatBalance = (balance) => {
                const color = balance >= 0 ? 'has-text-success' : 'has-text-danger';
                return `<span class="${color}">${balance >= 0 ? '+' : ''}R$ ${balance.toFixed(2)}</span>`;
            };

            document.getElementById('todayBalance').innerHTML = formatBalance(todayBalance);
            document.getElementById('todayTransactions').textContent = `${todayTrans.length} transações`;

            document.getElementById('yesterdayBalance').innerHTML = formatBalance(yesterdayBalance);
            document.getElementById('yesterdayTransactions').textContent = `${yesterdayTrans.length} transações`;

            document.getElementById('lastWeekBalance').innerHTML = formatBalance(lastWeekBalance);
            document.getElementById('lastWeekTransactions').textContent = `${lastWeekTrans.length} transações`;

            document.getElementById('lastMonthBalance').innerHTML = formatBalance(lastMonthBalance);
            document.getElementById('lastMonthTransactions').textContent = `${lastMonthTrans.length} transações`;
        }

        // Update Payment Methods Stats
        function updatePaymentMethodsStats() {
            const filteredTransactions = getFilteredTransactions();
            
            // Update period label
            const periodLabels = {
                'all': 'Todos os períodos',
                'today': 'Hoje',
                'yesterday': 'Ontem',
                'week': 'Esta Semana',
                'lastWeek': 'Semana Passada',
                'month': 'Este Mês',
                'lastMonth': 'Mês Passado',
                'year': 'Este Ano',
                'lastYear': 'Ano Passado'
            };
            
            document.getElementById('paymentPeriodLabel').textContent = periodLabels[currentFilter] || 'Período selecionado';
            
            const paymentMethodData = {};
            filteredTransactions.forEach(t => {
                const method = t.paymentMethod || 'dinheiro';
                paymentMethodData[method] = (paymentMethodData[method] || 0) + t.amount;
            });

            const paymentLabels = {
                'dinheiro': { name: 'Dinheiro', icon: '💵', color: '#48c774' },
                'pix': { name: 'PIX', icon: '📱', color: '#00d1b2' },
                'credito': { name: 'Crédito', icon: '💳', color: '#3298dc' },
                'debito': { name: 'Débito', icon: '💳', color: '#667eea' },
                'crediario': { name: 'Crediário', icon: '📝', color: '#b86bff' }
            };

            const total = Object.values(paymentMethodData).reduce((sum, val) => sum + val, 0);

            const statsHTML = Object.keys(paymentLabels).map(method => {
                const amount = paymentMethodData[method] || 0;
                const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                const info = paymentLabels[method];
                const transCount = filteredTransactions.filter(t => (t.paymentMethod || 'dinheiro') === method).length;

                return `
                    <div class="column is-4-desktop is-6-tablet">
                        <div class="box has-text-centered payment-stats-box" style="border-left: 4px solid ${info.color};">
                            <span style="font-size: 2rem;">${info.icon}</span>
                            <p class="title is-5 mt-2">${info.name}</p>
                            <p class="subtitle is-6 has-text-weight-bold" style="color: ${info.color};">
                                R$ ${amount.toFixed(2)}
                            </p>
                            <p class="has-text-grey">${percentage}% do total</p>
                            <p class="has-text-grey is-size-7">${transCount} transaç${transCount !== 1 ? 'ões' : 'ão'}</p>
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('paymentMethodsStats').innerHTML = statsHTML || '<div class="column is-12"><p class="has-text-centered has-text-grey">Nenhuma transação neste período</p></div>';
        }

        // Update Chart
        function updateChart() {
            const filteredTransactions = getFilteredTransactions();
            const expenses = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'saida');

            const categoryData = {};
            expenses.forEach(t => {
                categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
            });

            const labels = Object.keys(categoryData);
            const data = Object.values(categoryData);
            const total = data.reduce((sum, val) => sum + val, 0);

            const ctx = document.getElementById('pieChart');

            if (pieChart) {
                pieChart.destroy();
            }

            pieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            '#ff6b35',
                            '#f7931e',
                            '#ffdd57',
                            '#48c774',
                            '#00d1b2',
                            '#3298dc',
                            '#667eea',
                            '#b86bff',
                            '#ff3860',
                            '#ff1744',
                            '#00bcd4',
                            '#4caf50'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed;
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${context.label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // AI Insights
        function generateAIInsights() {
            const filteredTransactions = getFilteredTransactions();
            const expenses = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'saida');
            const income = filteredTransactions.filter(t => t.type === 'income' || t.type === 'entrada');

            const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
            const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

            // Category analysis
            const categoryExpenses = {};
            expenses.forEach(t => {
                categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
            });

            // Payment method analysis
            const paymentMethodData = {};
            filteredTransactions.forEach(t => {
                const method = t.paymentMethod || 'dinheiro';
                paymentMethodData[method] = (paymentMethodData[method] || 0) + t.amount;
            });

            const paymentLabels = {
                'dinheiro': 'Dinheiro',
                'pix': 'PIX',
                'credito': 'Crédito',
                'debito': 'Débito',
                'crediario': 'Crediário'
            };

            const highestCategory = Object.keys(categoryExpenses).reduce((a, b) => 
                categoryExpenses[a] > categoryExpenses[b] ? a : b, ''
            );

            const highestAmount = categoryExpenses[highestCategory] || 0;
            const percentage = totalExpense > 0 ? ((highestAmount / totalExpense) * 100).toFixed(1) : 0;

            const mostUsedPayment = Object.keys(paymentMethodData).reduce((a, b) => 
                paymentMethodData[a] > paymentMethodData[b] ? a : b, 'dinheiro'
            );

            let insights = [];

            // Insight 1: Highest spending category
            if (highestCategory) {
                const safeHighestCategory = escapeHTML(highestCategory);
                insights.push(`
                    <div class="notification is-ai mb-3">
                        <strong>💡 Maior Gasto:</strong> Você gastou mais em <strong>${safeHighestCategory}</strong>
                        (R$ ${highestAmount.toFixed(2)} - ${percentage}% do total). 
                        ${highestAmount > totalIncome * 0.3 ? 'Considere reduzir gastos nesta categoria.' : 'Gastos controlados!'}
                    </div>
                `);
            }

            // Insight 2: Payment method preference
            const paymentAmount = paymentMethodData[mostUsedPayment] || 0;
            const paymentPercentage = filteredTransactions.length > 0 ? 
                ((paymentAmount / (totalIncome + totalExpense)) * 100).toFixed(1) : 0;
            
            insights.push(`
                <div class="notification is-info mb-3">
                    <strong>💳 Forma de Pagamento Preferida:</strong> Você mais utiliza <strong>${paymentLabels[mostUsedPayment]}</strong> 
                    (R$ ${paymentAmount.toFixed(2)} - ${paymentPercentage}% das transações).
                    ${mostUsedPayment === 'credito' ? ' ⚠️ Cuidado com os juros!' : mostUsedPayment === 'pix' ? ' 💚 Ótima escolha!' : ''}
                </div>
            `);

            // Insight 3: Savings rate
            const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;
            insights.push(`
                <div class="notification ${savingsRate > 20 ? 'is-success' : savingsRate > 10 ? 'is-warning' : 'is-danger'} mb-3">
                    <strong>📊 Taxa de Economia:</strong> Você está economizando <strong>${savingsRate.toFixed(1)}%</strong> 
                    da sua renda. ${savingsRate > 20 ? '🎉 Excelente!' : savingsRate > 10 ? '👍 Bom trabalho!' : '⚠️ Tente economizar mais!'}
                </div>
            `);

            // Insight 4: Spending trend
            if (expenses.length > 5) {
                const avgDaily = totalExpense / 30;
                insights.push(`
                    <div class="notification is-link mb-3">
                        <strong>📈 Previsão:</strong> Com base nos seus gastos, sua despesa mensal estimada é 
                        <strong>R$ ${(avgDaily * 30).toFixed(2)}</strong>. 
                        Planeje suas finanças com antecedência!
                    </div>
                `);
            }

            // Insight 5: Recommendation
            const recommendations = [
                '💰 Dica: Configure alertas de gastos para categorias específicas.',
                '🎯 Dica: Estabeleça metas mensais de economia.',
                '📱 Dica: Revise seus gastos semanalmente para melhor controle.',
                '💡 Dica: Considere criar um fundo de emergência.',
                '🏦 Dica: Automatize suas economias transferindo uma porcentagem fixa.',
                '💳 Dica: Use PIX sempre que possível para evitar taxas.',
                '📊 Dica: Negocie suas dívidas do crediário para reduzir juros.'
            ];
            insights.push(`
                <div class="notification is-primary">
                    <strong>${recommendations[Math.floor(Math.random() * recommendations.length)]}</strong>
                </div>
            `);

            document.getElementById('aiInsights').innerHTML = insights.join('');
        }

        // Calendar Functions
        function renderCalendar() {
            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];

            // Update header
            document.getElementById('calendarMonthYear').textContent = 
                `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;

            // Get first day of month and number of days
            const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
            const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();

            // Get previous month's last days
            const prevMonthLastDay = new Date(currentCalendarYear, currentCalendarMonth, 0);
            const prevMonthDays = prevMonthLastDay.getDate();

            const calendarDays = document.getElementById('calendarDays');
            calendarDays.innerHTML = '';

            // Get transactions for the month
            const monthTransactions = transactions.filter(t => {
                const date = new Date(t.date + 'T00:00:00');
                return date.getMonth() === currentCalendarMonth && 
                       date.getFullYear() === currentCalendarYear;
            });

            // Group transactions by day
            const transactionsByDay = {};
            monthTransactions.forEach(t => {
                const day = new Date(t.date + 'T00:00:00').getDate();
                if (!transactionsByDay[day]) {
                    transactionsByDay[day] = { income: 0, expense: 0, transactions: [] };
                }
                
                const isIncome = t.type === 'income' || t.type === 'entrada';
                if (isIncome) {
                    transactionsByDay[day].income += t.amount;
                } else {
                    transactionsByDay[day].expense += t.amount;
                }
                transactionsByDay[day].transactions.push(t);
            });

            // Add previous month's days
            for (let i = startingDayOfWeek - 1; i >= 0; i--) {
                const day = prevMonthDays - i;
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day other-month';
                dayDiv.innerHTML = `<span class="calendar-day-number">${day}</span>`;
                calendarDays.appendChild(dayDiv);
            }

            // Add current month's days
            const today = new Date();
            const isCurrentMonth = currentCalendarMonth === today.getMonth() && 
                                   currentCalendarYear === today.getFullYear();

            for (let day = 1; day <= daysInMonth; day++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                
                // Check if it's today
                if (isCurrentMonth && day === today.getDate()) {
                    dayDiv.classList.add('today');
                }

                // Check if it's selected
                if (selectedDay && selectedDay.day === day && 
                    selectedDay.month === currentCalendarMonth && 
                    selectedDay.year === currentCalendarYear) {
                    dayDiv.classList.add('selected');
                }

                // Add transaction indicators
                if (transactionsByDay[day]) {
                    const data = transactionsByDay[day];
                    const hasIncome = data.income > 0;
                    const hasExpense = data.expense > 0;

                    if (hasIncome && hasExpense) {
                        dayDiv.classList.add('has-both');
                        const balance = data.income - data.expense;
                        dayDiv.innerHTML = `
                            <span class="calendar-day-number">${day}</span>
                            <span class="calendar-day-amount">
                                ${balance >= 0 ? '+' : ''}R$ ${Math.abs(balance).toFixed(0)}
                            </span>
                        `;
                    } else if (hasIncome) {
                        dayDiv.classList.add('has-income');
                        dayDiv.innerHTML = `
                            <span class="calendar-day-number">${day}</span>
                            <span class="calendar-day-amount">+R$ ${data.income.toFixed(0)}</span>
                        `;
                    } else if (hasExpense) {
                        dayDiv.classList.add('has-expense');
                        dayDiv.innerHTML = `
                            <span class="calendar-day-number">${day}</span>
                            <span class="calendar-day-amount">-R$ ${data.expense.toFixed(0)}</span>
                        `;
                    }

                    dayDiv.onclick = () => showDayTransactions(day);
                } else {
                    dayDiv.innerHTML = `<span class="calendar-day-number">${day}</span>`;
                }

                calendarDays.appendChild(dayDiv);
            }

            // Add next month's days to fill the grid
            const totalCells = calendarDays.children.length;
            const remainingCells = 42 - totalCells; // 6 rows * 7 days

            for (let i = 1; i <= remainingCells; i++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day other-month';
                dayDiv.innerHTML = `<span class="calendar-day-number">${i}</span>`;
                calendarDays.appendChild(dayDiv);
            }
        }

        function changeMonth(delta) {
            currentCalendarMonth += delta;
            
            if (currentCalendarMonth > 11) {
                currentCalendarMonth = 0;
                currentCalendarYear++;
            } else if (currentCalendarMonth < 0) {
                currentCalendarMonth = 11;
                currentCalendarYear--;
            }

            selectedDay = null;
            document.getElementById('dayTransactionsContainer').style.display = 'none';
            renderCalendar();
        }

        function showDayTransactions(day) {
            selectedDay = {
                day: day,
                month: currentCalendarMonth,
                year: currentCalendarYear
            };

            const date = new Date(currentCalendarYear, currentCalendarMonth, day);
            const dateStr = date.toISOString().split('T')[0];

            const dayTransactions = transactions.filter(t => t.date === dateStr);

            if (dayTransactions.length === 0) {
                return;
            }

            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];

            // Calculate totals
            const income = dayTransactions.filter(t => t.type === 'income' || t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
            const expense = dayTransactions.filter(t => t.type === 'expense' || t.type === 'saida').reduce((s, t) => s + t.amount, 0);
            const balance = income - expense;

            document.getElementById('selectedDayHeader').innerHTML = `
                <div>
                    <p class="title is-5 mb-2">📅 ${day} de ${monthNames[currentCalendarMonth]} de ${currentCalendarYear}</p>
                    <div class="tags">
                        <span class="tag is-success is-medium">Receitas: R$ ${income.toFixed(2)}</span>
                        <span class="tag is-danger is-medium">Despesas: R$ ${expense.toFixed(2)}</span>
                        <span class="tag ${balance >= 0 ? 'is-info' : 'is-warning'} is-medium">Saldo: R$ ${balance.toFixed(2)}</span>
                    </div>
                </div>
            `;

            const paymentIcons = {
                'dinheiro': '💵',
                'pix': '📱',
                'credito': '💳',
                'debito': '💳',
                'crediario': '📝'
            };

            const paymentLabels = {
                'dinheiro': 'Dinheiro',
                'pix': 'PIX',
                'credito': 'Crédito',
                'debito': 'Débito',
                'crediario': 'Crediário'
            };

            const typeLabels = {
                'income': 'Receita',
                'expense': 'Despesa',
                'entrada': 'Entrada',
                'saida': 'Saída'
            };

            const transactionsHTML = dayTransactions
                .sort((a, b) => {
                    const typeOrder = { income: 0, entrada: 1, expense: 2, saida: 3 };
                    return typeOrder[a.type] - typeOrder[b.type];
                })
                .map(t => {
                    const isIncome = t.type === 'income' || t.type === 'entrada';
                    const color = isIncome ? 'has-text-success' : 'has-text-danger';
                    const sign = isIncome ? '+' : '-';
                    const paymentMethod = paymentLabels[t.paymentMethod] ? t.paymentMethod : 'dinheiro';
                    const safeDescription = escapeHTML(t.description);
                    const safeCategory = escapeHTML(t.category);
                    const safeType = escapeHTML(typeLabels[t.type] || 'Transação');

                    return `
                        <div class="box mb-2" style="padding: 12px;">
                            <div class="level is-mobile mb-0">
                                <div class="level-left">
                                    <div class="level-item">
                                        <div>
	                                            <p class="subtitle is-6 mb-1">
	                                                <span class="tag ${isIncome ? 'is-success' : 'is-danger'} is-light is-small">
	                                                    ${safeType}
	                                                </span>
	                                                <strong class="ml-2">${safeDescription}</strong>
	                                            </p>
	                                            <p class="is-size-7 has-text-grey">
	                                                ${safeCategory} • ${paymentIcons[paymentMethod]} ${paymentLabels[paymentMethod]}
	                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="level-right">
                                    <div class="level-item">
                                        <p class="subtitle is-5 ${color} mb-0">
                                            ${sign} R$ ${t.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

            document.getElementById('selectedDayTransactions').innerHTML = transactionsHTML;
            document.getElementById('dayTransactionsContainer').style.display = 'block';

            // Scroll to transactions
            setTimeout(() => {
                document.getElementById('dayTransactionsContainer').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);

            renderCalendar(); // Re-render to show selected state
        }

        function closeDayTransactions() {
            selectedDay = null;
            document.getElementById('dayTransactionsContainer').style.display = 'none';
            renderCalendar();
        }

        // Export Functions
        function exportToExcel() {
            const typeLabels = {
                'income': 'Receita',
                'expense': 'Despesa',
                'entrada': 'Entrada',
                'saida': 'Saída'
            };

            const paymentLabels = {
                'dinheiro': 'Dinheiro',
                'pix': 'PIX',
                'credito': 'Crédito',
                'debito': 'Débito',
                'crediario': 'Crediário'
            };

            const data = getFilteredTransactions().map(t => ({
                'Data': t.date,
                'Tipo': typeLabels[t.type],
                'Descrição': t.description,
                'Categoria': t.category,
                'Forma de Pagamento': paymentLabels[t.paymentMethod || 'dinheiro'],
                'Valor': t.amount
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Transações');
            XLSX.writeFile(wb, `financas_${currentFilter}_${new Date().toISOString().split('T')[0]}.xlsx`);

            showNotification('Exportado para Excel com sucesso!', 'is-success');
        }

        function exportToCSV() {
            const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma de Pagamento', 'Valor'];
            const typeLabels = {
                'income': 'Receita',
                'expense': 'Despesa',
                'entrada': 'Entrada',
                'saida': 'Saída'
            };

            const paymentLabels = {
                'dinheiro': 'Dinheiro',
                'pix': 'PIX',
                'credito': 'Crédito',
                'debito': 'Débito',
                'crediario': 'Crediário'
            };

            const data = getFilteredTransactions().map(t => [
                t.date,
                typeLabels[t.type] || 'Transação',
                t.description,
                t.category,
                paymentLabels[t.paymentMethod || 'dinheiro'] || 'Dinheiro',
                t.amount
            ]);

            const csv = [
                headers.map(escapeCSVValue).join(','),
                ...data.map(row => row.map(escapeCSVValue).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financas_${currentFilter}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            showNotification('Exportado para CSV com sucesso!', 'is-success');
        }

        function exportToPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Relatório Financeiro', 14, 22);

            doc.setFontSize(11);
            doc.text(`Período: ${currentFilter}`, 14, 32);
            doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 38);

            const filteredTransactions = getFilteredTransactions();
            const income = filteredTransactions.filter(t => t.type === 'income' || t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0);
            const expense = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'saida').reduce((sum, t) => sum + t.amount, 0);

            doc.text(`Receitas: R$ ${income.toFixed(2)}`, 14, 48);
            doc.text(`Despesas: R$ ${expense.toFixed(2)}`, 14, 54);
            doc.text(`Saldo: R$ ${(income - expense).toFixed(2)}`, 14, 60);

            let y = 75;
            doc.setFontSize(14);
            doc.text('Transações', 14, y);
            y += 10;

            doc.setFontSize(10);
            filteredTransactions.slice(0, 20).forEach(t => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                const line = `${t.date} | ${t.type === 'income' || t.type === 'entrada' ? '+' : '-'}R$ ${t.amount.toFixed(2)} | ${String(t.description || '').slice(0, 80)}`;
                doc.text(line, 14, y);
                y += 7;
            });

            doc.save(`financas_${currentFilter}_${new Date().toISOString().split('T')[0]}.pdf`);

            showNotification('Exportado para PDF com sucesso!', 'is-success');
        }

        // Import Function
        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = function(e) {
                try {
                    if (file.name.endsWith('.csv')) {
                        importCSV(e.target.result);
                    } else if (file.name.endsWith('.xlsx')) {
                        importExcel(e.target.result);
                    }
                } catch (error) {
                    alert('Erro ao importar arquivo. Verifique o formato.');
                }
            };

            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        }

        function importCSV(content) {
            const lines = parseCSV(content).slice(1); // Skip header
            let imported = 0;

            const reverseTypeLabels = {
                'Receita': 'income',
                'Despesa': 'expense',
                'Entrada': 'entrada',
                'Saída': 'saida'
            };

            const reversePaymentLabels = {
                'Dinheiro': 'dinheiro',
                'PIX': 'pix',
                'Crédito': 'credito',
                'Débito': 'debito',
                'Crediário': 'crediario'
            };

            lines.forEach(parts => {
                if (!parts.some(part => String(part).trim())) return;
                if (parts.length < 5) return;

                const date = String(parts[0] || '').trim();
                const type = reverseTypeLabels[String(parts[1] || '').trim()] || 'expense';
                const description = String(parts[2] || '').trim();
                const category = String(parts[3] || 'Outros').trim();
                const paymentMethod = reversePaymentLabels[String(parts[4] || '').trim()] || 'dinheiro';
                const amount = parseFloat(parts[5] || parts[4]); // fallback for old format
                if (!description || !Number.isFinite(amount) || amount <= 0 || !isValidDateValue(date)) return;

                transactions.push({
                    id: Date.now() + imported,
                    type: type,
                    description: description,
                    category: category,
                    paymentMethod: paymentMethod,
                    amount: amount,
                    date: date,
                    timestamp: new Date().getTime()
                });

                imported++;
            });

            localStorage.setItem('transactions', JSON.stringify(transactions));
            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();
            renderCalendar();

            showNotification(`${imported} transações importadas com sucesso!`, 'is-success');
        }

        function importExcel(content) {
            const wb = XLSX.read(content, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws);

            let imported = 0;

            const reverseTypeLabels = {
                'Receita': 'income',
                'Despesa': 'expense',
                'Entrada': 'entrada',
                'Saída': 'saida'
            };

            const reversePaymentLabels = {
                'Dinheiro': 'dinheiro',
                'PIX': 'pix',
                'Crédito': 'credito',
                'Débito': 'debito',
                'Crediário': 'crediario'
            };

            data.forEach((row, index) => {
                const type = reverseTypeLabels[row['Tipo']] || 'expense';
                const paymentMethod = reversePaymentLabels[row['Forma de Pagamento']] || 'dinheiro';
                const description = String(row['Descrição'] || row['Descricao'] || '').trim();
                const category = String(row['Categoria'] || 'Outros').trim();
                const amount = parseFloat(row['Valor']);
                const date = normalizeExcelDate(row['Data']);
                if (!description || !Number.isFinite(amount) || amount <= 0 || !isValidDateValue(date)) return;

                transactions.push({
                    id: Date.now() + imported,
                    type: type,
                    description: description,
                    category: category,
                    paymentMethod: paymentMethod,
                    amount: amount,
                    date: date,
                    timestamp: new Date().getTime()
                });

                imported++;
            });

            localStorage.setItem('transactions', JSON.stringify(transactions));
            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();
            renderCalendar();

            showNotification(`${imported} transações importadas com sucesso!`, 'is-success');
        }

        // Helper Functions
        function loadStoredTransactions() {
            try {
                const stored = JSON.parse(localStorage.getItem('transactions')) || [];
                if (!Array.isArray(stored)) return [];
                return stored.map(normalizeTransaction).filter(Boolean);
            } catch (error) {
                console.warn('Não foi possível carregar as transações salvas.', error);
                return [];
            }
        }

        function normalizeTransaction(transaction) {
            if (!transaction || typeof transaction !== 'object') return null;

            const amount = parseFloat(transaction.amount);
            const date = normalizeExcelDate(transaction.date);
            const description = String(transaction.description || '').trim();
            const category = String(transaction.category || 'Outros').trim();
            const validTypes = ['income', 'expense', 'entrada', 'saida'];
            const validPaymentMethods = ['dinheiro', 'pix', 'credito', 'debito', 'crediario'];

            if (!description || !Number.isFinite(amount) || amount <= 0 || !isValidDateValue(date)) {
                return null;
            }

            return {
                id: Number.isFinite(Number(transaction.id)) ? Number(transaction.id) : Date.now(),
                type: validTypes.includes(transaction.type) ? transaction.type : 'expense',
                description,
                category,
                amount,
                date,
                paymentMethod: validPaymentMethods.includes(transaction.paymentMethod) ? transaction.paymentMethod : 'dinheiro',
                timestamp: Number.isFinite(Number(transaction.timestamp)) ? Number(transaction.timestamp) : Date.now()
            };
        }

        function isValidDateValue(value) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
            const date = new Date(`${value}T00:00:00`);
            return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
        }

        function normalizeExcelDate(value) {
            if (typeof value === 'number' && Number.isFinite(value)) {
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                excelEpoch.setUTCDate(excelEpoch.getUTCDate() + value);
                return excelEpoch.toISOString().slice(0, 10);
            }

            return String(value || '').trim();
        }

        function escapeHTML(value) {
            return String(value ?? '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[char]));
        }

        function escapeCSVValue(value) {
            const text = String(value ?? '');
            if (/[",\n\r]/.test(text)) {
                return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        }

        function parseCSV(content) {
            const rows = [];
            let row = [];
            let value = '';
            let inQuotes = false;

            for (let i = 0; i < content.length; i++) {
                const char = content[i];
                const next = content[i + 1];

                if (char === '"' && inQuotes && next === '"') {
                    value += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    row.push(value);
                    value = '';
                } else if ((char === '\n' || char === '\r') && !inQuotes) {
                    if (char === '\r' && next === '\n') i++;
                    row.push(value);
                    rows.push(row);
                    row = [];
                    value = '';
                } else {
                    value += char;
                }
            }

            if (value || row.length) {
                row.push(value);
                rows.push(row);
            }

            return rows;
        }

        function formatDate(dateString) {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('pt-BR');
        }

        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.right = '20px';
            notification.style.zIndex = '10000';
            notification.style.minWidth = '300px';

            const closeButton = document.createElement('button');
            closeButton.className = 'delete';
            closeButton.addEventListener('click', () => notification.remove());
            notification.appendChild(closeButton);
            notification.appendChild(document.createTextNode(` ${message}`));

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
