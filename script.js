
        // Data Storage
        let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        let currentFilter = 'all';
        let pieChart = null;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('date').valueAsDate = new Date();
            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();
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
            const description = document.getElementById('description').value;
            const category = document.getElementById('category').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const date = document.getElementById('date').value;
            const paymentMethod = document.getElementById('paymentMethod').value;

            if (!description || !amount || !date) {
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

            transactions[index] = {
                ...transactions[index],
                type: document.getElementById('editType').value,
                description: document.getElementById('editDescription').value,
                category: document.getElementById('editCategory').value,
                amount: parseFloat(document.getElementById('editAmount').value),
                date: document.getElementById('editDate').value,
                paymentMethod: document.getElementById('editPaymentMethod').value
            };

            localStorage.setItem('transactions', JSON.stringify(transactions));
            closeModal('editModal');
            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();

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
            
            showNotification(`${count} transação${count !== 1 ? 'ões' : ''} excluída${count !== 1 ? 's' : ''} com sucesso!`, 'is-success');
        }

        // Filter Transactions
        function filterByPeriod(period) {
            currentFilter = period;

            // Update button states
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('is-active');
            });
            document.querySelector(`[data-period="${period}"]`).classList.add('is-active');

            loadTransactions();
            updateStats();
            updateChart();
        }

        function getFilteredTransactions() {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            return transactions.filter(t => {
                const transactionDate = new Date(t.date);

                switch(currentFilter) {
                    case 'today':
                        return transactionDate >= today;
                    case 'week':
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return transactionDate >= weekAgo;
                    case 'month':
                        return transactionDate.getMonth() === now.getMonth() && 
                               transactionDate.getFullYear() === now.getFullYear();
                    case 'year':
                        return transactionDate.getFullYear() === now.getFullYear();
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
                                        <p class="heading">${formatDate(t.date)} • ${typeLabels[t.type]}</p>
                                        <p class="title is-6">${t.description}</p>
                                        <div>
                                            <span class="category-badge has-background-light">${t.category}</span>
                                            <span class="category-badge has-background-info has-text-white ml-2">
                                                ${paymentIcons[t.paymentMethod || 'dinheiro']} ${paymentLabels[t.paymentMethod || 'dinheiro']}
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
        }

        // Update Payment Methods Stats
        function updatePaymentMethodsStats() {
            const filteredTransactions = getFilteredTransactions();
            
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

                return `
                    <div class="column is-4-desktop is-6-tablet">
                        <div class="box has-text-centered" style="border-left: 4px solid ${info.color};">
                            <span style="font-size: 2rem;">${info.icon}</span>
                            <p class="title is-5 mt-2">${info.name}</p>
                            <p class="subtitle is-6 has-text-weight-bold" style="color: ${info.color};">
                                R$ ${amount.toFixed(2)}
                            </p>
                            <p class="has-text-grey">${percentage}% do total</p>
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('paymentMethodsStats').innerHTML = statsHTML;
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
                insights.push(`
                    <div class="notification is-ai mb-3">
                        <strong>💡 Maior Gasto:</strong> Você gastou mais em <strong>${highestCategory}</strong> 
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

            const csv = [
                Object.keys(data[0]).join(','),
                ...data.map(row => Object.values(row).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financas_${currentFilter}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();

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
            const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

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
                const line = `${t.date} | ${t.type === 'income' ? '+' : '-'}R$ ${t.amount.toFixed(2)} | ${t.description}`;
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
            const lines = content.split('\n').slice(1); // Skip header
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

            lines.forEach(line => {
                if (!line.trim()) return;

                const parts = line.split(',');
                if (parts.length < 5) return;

                const date = parts[0];
                const type = reverseTypeLabels[parts[1]] || 'expense';
                const description = parts[2];
                const category = parts[3];
                const paymentMethod = reversePaymentLabels[parts[4]] || 'dinheiro';
                const amount = parseFloat(parts[5] || parts[4]); // fallback for old format

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

                transactions.push({
                    id: Date.now() + imported,
                    type: type,
                    description: row['Descrição'] || row['Descricao'],
                    category: row['Categoria'],
                    paymentMethod: paymentMethod,
                    amount: parseFloat(row['Valor']),
                    date: row['Data'],
                    timestamp: new Date().getTime()
                });

                imported++;
            });

            localStorage.setItem('transactions', JSON.stringify(transactions));
            loadTransactions();
            updateStats();
            updateChart();
            generateAIInsights();

            showNotification(`${imported} transações importadas com sucesso!`, 'is-success');
        }

        // Helper Functions
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
            notification.innerHTML = `
                <button class="delete" onclick="this.parentElement.remove()"></button>
                ${message}
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    