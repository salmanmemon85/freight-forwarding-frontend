// Accounts Management System - Chart of Accounts

if (!window.AccountsManager) {
    class AccountsManager {
        constructor() {
            this.initializeAccountsData();
            this.initializeDefaultAccounts();
        }

        initializeAccountsData() {
            const data = this.getData();
            if (!data.chartOfAccounts) data.chartOfAccounts = [];
            if (!data.transactions) data.transactions = [];
            this.saveData(data);
        }

        getData() {
            return JSON.parse(localStorage.getItem('idealFreightData')) || {};
        }

        saveData(data) {
            localStorage.setItem('idealFreightData', JSON.stringify(data));
        }

        initializeDefaultAccounts() {
            const accounts = this.getAccounts();
            
            if (accounts.length === 0) {
                const defaultAccounts = [
                    // Assets
                    { name: 'Cash in Hand', type: 'assets', code: '1001', balance: 50000 },
                    { name: 'Bank Account', type: 'assets', code: '1002', balance: 200000 },
                    { name: 'Accounts Receivable', type: 'assets', code: '1003', balance: 150000 },
                    { name: 'Office Equipment', type: 'assets', code: '1004', balance: 100000 },
                    
                    // Liabilities
                    { name: 'Accounts Payable', type: 'liabilities', code: '2001', balance: 80000 },
                    { name: 'Bank Loan', type: 'liabilities', code: '2002', balance: 300000 },
                    { name: 'Salary Payable', type: 'liabilities', code: '2003', balance: 45000 },
                    
                    // Equity
                    { name: 'Owner Equity', type: 'equity', code: '3001', balance: 500000 },
                    { name: 'Retained Earnings', type: 'equity', code: '3002', balance: 75000 },
                    
                    // Income
                    { name: 'Freight Revenue', type: 'income', code: '4001', balance: 0 },
                    { name: 'Commission Income', type: 'income', code: '4002', balance: 0 },
                    { name: 'Other Income', type: 'income', code: '4003', balance: 0 },
                    
                    // Expenses
                    { name: 'Office Rent', type: 'expenses', code: '5001', balance: 0 },
                    { name: 'Salaries Expense', type: 'expenses', code: '5002', balance: 0 },
                    { name: 'Fuel Expense', type: 'expenses', code: '5003', balance: 0 },
                    { name: 'Agent Charges', type: 'expenses', code: '5004', balance: 0 },
                    { name: 'Documentation Expense', type: 'expenses', code: '5005', balance: 0 }
                ];
                
                defaultAccounts.forEach(account => {
                    this.addAccount(account);
                });
            }
        }

        addAccount(accountData) {
            const data = this.getData();
            const accountId = 'ACC' + Date.now().toString().slice(-6);
            
            const account = {
                id: accountId,
                name: accountData.name,
                type: accountData.type,
                code: accountData.code || accountId,
                balance: parseFloat(accountData.balance) || 0,
                createdAt: new Date().toISOString(),
                status: 'active'
            };

            data.chartOfAccounts.push(account);
            this.saveData(data);
            return account;
        }

        getAccounts(type = null) {
            const accounts = this.getData().chartOfAccounts || [];
            return type ? accounts.filter(a => a.type === type) : accounts;
        }

        addTransaction(transactionData) {
            const data = this.getData();
            const transactionId = 'TXN' + Date.now().toString().slice(-6);
            
            const transaction = {
                id: transactionId,
                date: transactionData.date,
                description: transactionData.description,
                debitAccountId: transactionData.debitAccountId,
                creditAccountId: transactionData.creditAccountId,
                amount: parseFloat(transactionData.amount),
                reference: transactionData.reference || '',
                createdAt: new Date().toISOString()
            };

            data.transactions.push(transaction);
            
            // Update account balances
            this.updateAccountBalance(transactionData.debitAccountId, transactionData.amount, 'debit');
            this.updateAccountBalance(transactionData.creditAccountId, transactionData.amount, 'credit');
            
            this.saveData(data);
            return transaction;
        }

        updateAccountBalance(accountId, amount, type) {
            const data = this.getData();
            const accountIndex = data.chartOfAccounts.findIndex(a => a.id === accountId);
            
            if (accountIndex !== -1) {
                const account = data.chartOfAccounts[accountIndex];
                
                if (type === 'debit') {
                    if (['assets', 'expenses'].includes(account.type)) {
                        account.balance += amount;
                    } else {
                        account.balance -= amount;
                    }
                } else { // credit
                    if (['liabilities', 'equity', 'income'].includes(account.type)) {
                        account.balance += amount;
                    } else {
                        account.balance -= amount;
                    }
                }
                
                this.saveData(data);
            }
        }

        getTransactions() {
            return this.getData().transactions || [];
        }

        getBalanceSheet() {
            const accounts = this.getAccounts();
            
            const assets = accounts.filter(a => a.type === 'assets');
            const liabilities = accounts.filter(a => a.type === 'liabilities');
            const equity = accounts.filter(a => a.type === 'equity');
            
            const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
            const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
            const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);
            
            return {
                assets,
                liabilities,
                equity,
                totalAssets,
                totalLiabilities,
                totalEquity
            };
        }

        getPnLStatement() {
            const accounts = this.getAccounts();
            
            const income = accounts.filter(a => a.type === 'income');
            const expenses = accounts.filter(a => a.type === 'expenses');
            
            const totalIncome = income.reduce((sum, a) => sum + a.balance, 0);
            const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);
            const netIncome = totalIncome - totalExpenses;
            
            return {
                income,
                expenses,
                totalIncome,
                totalExpenses,
                netIncome
            };
        }
    }

    window.AccountsManager = AccountsManager;
    window.accountsManager = new AccountsManager();
}

document.addEventListener('DOMContentLoaded', function() {
    loadAccountsData();
    setTodayDate();
});

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateField = document.getElementById('transactionDate');
    if (dateField) dateField.value = today;
}

function loadAccountsData() {
    const balanceSheet = window.accountsManager.getBalanceSheet();
    const pnl = window.accountsManager.getPnLStatement();
    
    // Update stats
    const totalAssetsEl = document.getElementById('totalAssets');
    const totalLiabilitiesEl = document.getElementById('totalLiabilities');
    const totalEquityEl = document.getElementById('totalEquity');
    const netIncomeEl = document.getElementById('netIncome');
    
    if (totalAssetsEl) totalAssetsEl.textContent = '₹' + balanceSheet.totalAssets.toLocaleString('en-IN');
    if (totalLiabilitiesEl) totalLiabilitiesEl.textContent = '₹' + balanceSheet.totalLiabilities.toLocaleString('en-IN');
    if (totalEquityEl) totalEquityEl.textContent = '₹' + balanceSheet.totalEquity.toLocaleString('en-IN');
    if (netIncomeEl) netIncomeEl.textContent = '₹' + pnl.netIncome.toLocaleString('en-IN');
    
    displayChartOfAccounts();
    displayTransactions();
}

function displayChartOfAccounts() {
    const accounts = window.accountsManager.getAccounts();
    
    const categories = ['assets', 'liabilities', 'equity', 'income', 'expenses'];
    
    categories.forEach(category => {
        const categoryAccounts = accounts.filter(a => a.type === category);
        const listElement = document.getElementById(category + 'List');
        
        if (listElement) {
            listElement.innerHTML = '';
            categoryAccounts.forEach(account => {
                const accountItem = `
                    <div class="account-item">
                        <div class="account-info">
                            <strong>${account.name}</strong>
                            <small>Code: ${account.code}</small>
                        </div>
                        <div class="account-balance">
                            ₹${account.balance.toLocaleString('en-IN')}
                        </div>
                    </div>
                `;
                listElement.innerHTML += accountItem;
            });
        }
    });
    
    // Populate account dropdowns
    populateAccountDropdowns();
}

function populateAccountDropdowns() {
    const accounts = window.accountsManager.getAccounts();
    const debitSelect = document.getElementById('debitAccount');
    const creditSelect = document.getElementById('creditAccount');
    
    if (debitSelect && creditSelect) {
        debitSelect.innerHTML = '<option value="">Select Debit Account</option>';
        creditSelect.innerHTML = '<option value="">Select Credit Account</option>';
        
        accounts.forEach(account => {
            const option = `<option value="${account.id}">${account.name} (${account.code})</option>`;
            debitSelect.innerHTML += option;
            creditSelect.innerHTML += option;
        });
    }
}

function displayTransactions() {
    const transactions = window.accountsManager.getTransactions();
    const accounts = window.accountsManager.getAccounts();
    
    // Recent transactions
    const recentTransactionsEl = document.getElementById('recentTransactions');
    if (recentTransactionsEl) {
        const recentTxns = transactions.slice(-5).reverse();
        recentTransactionsEl.innerHTML = '';
        
        recentTxns.forEach(txn => {
            const debitAccount = accounts.find(a => a.id === txn.debitAccountId);
            const creditAccount = accounts.find(a => a.id === txn.creditAccountId);
            
            const txnItem = `
                <div class="transaction-item">
                    <small class="text-muted">${new Date(txn.date).toLocaleDateString()}</small>
                    <div><strong>₹${txn.amount.toLocaleString('en-IN')}</strong></div>
                    <div class="small">${txn.description}</div>
                    <div class="small text-muted">
                        Dr: ${debitAccount?.name || 'Unknown'}<br>
                        Cr: ${creditAccount?.name || 'Unknown'}
                    </div>
                </div>
            `;
            recentTransactionsEl.innerHTML += txnItem;
        });
    }
    
    // All transactions
    const allTransactionsEl = document.getElementById('allTransactions');
    if (allTransactionsEl) {
        allTransactionsEl.innerHTML = '';
        
        transactions.reverse().forEach(txn => {
            const debitAccount = accounts.find(a => a.id === txn.debitAccountId);
            const creditAccount = accounts.find(a => a.id === txn.creditAccountId);
            
            const txnRow = `
                <div class="transaction-item">
                    <div class="row">
                        <div class="col-md-2">${new Date(txn.date).toLocaleDateString()}</div>
                        <div class="col-md-3">${txn.description}</div>
                        <div class="col-md-2">Dr: ${debitAccount?.name || 'Unknown'}</div>
                        <div class="col-md-2">Cr: ${creditAccount?.name || 'Unknown'}</div>
                        <div class="col-md-2">₹${txn.amount.toLocaleString('en-IN')}</div>
                        <div class="col-md-1">${txn.reference || '-'}</div>
                    </div>
                </div>
            `;
            allTransactionsEl.innerHTML += txnRow;
        });
    }
}

function displayReports() {
    const balanceSheet = window.accountsManager.getBalanceSheet();
    const pnl = window.accountsManager.getPnLStatement();
    
    // Balance Sheet Report
    const balanceSheetEl = document.getElementById('balanceSheetReport');
    if (balanceSheetEl) {
        let balanceSheetHTML = `
            <h6>Assets</h6>
            <table class="table table-sm">
        `;
        
        balanceSheet.assets.forEach(asset => {
            balanceSheetHTML += `
                <tr>
                    <td>${asset.name}</td>
                    <td class="text-end">₹${asset.balance.toLocaleString('en-IN')}</td>
                </tr>
            `;
        });
        
        balanceSheetHTML += `
                <tr class="table-success">
                    <td><strong>Total Assets</strong></td>
                    <td class="text-end"><strong>₹${balanceSheet.totalAssets.toLocaleString('en-IN')}</strong></td>
                </tr>
            </table>
            
            <h6>Liabilities</h6>
            <table class="table table-sm">
        `;
        
        balanceSheet.liabilities.forEach(liability => {
            balanceSheetHTML += `
                <tr>
                    <td>${liability.name}</td>
                    <td class="text-end">₹${liability.balance.toLocaleString('en-IN')}</td>
                </tr>
            `;
        });
        
        balanceSheetHTML += `
                <tr class="table-warning">
                    <td><strong>Total Liabilities</strong></td>
                    <td class="text-end"><strong>₹${balanceSheet.totalLiabilities.toLocaleString('en-IN')}</strong></td>
                </tr>
            </table>
            
            <h6>Equity</h6>
            <table class="table table-sm">
        `;
        
        balanceSheet.equity.forEach(equity => {
            balanceSheetHTML += `
                <tr>
                    <td>${equity.name}</td>
                    <td class="text-end">₹${equity.balance.toLocaleString('en-IN')}</td>
                </tr>
            `;
        });
        
        balanceSheetHTML += `
                <tr class="table-info">
                    <td><strong>Total Equity</strong></td>
                    <td class="text-end"><strong>₹${balanceSheet.totalEquity.toLocaleString('en-IN')}</strong></td>
                </tr>
            </table>
        `;
        
        balanceSheetEl.innerHTML = balanceSheetHTML;
    }
    
    // P&L Report
    const pnlEl = document.getElementById('pnlReport');
    if (pnlEl) {
        let pnlHTML = `
            <h6>Income</h6>
            <table class="table table-sm">
        `;
        
        pnl.income.forEach(income => {
            pnlHTML += `
                <tr>
                    <td>${income.name}</td>
                    <td class="text-end">₹${income.balance.toLocaleString('en-IN')}</td>
                </tr>
            `;
        });
        
        pnlHTML += `
                <tr class="table-primary">
                    <td><strong>Total Income</strong></td>
                    <td class="text-end"><strong>₹${pnl.totalIncome.toLocaleString('en-IN')}</strong></td>
                </tr>
            </table>
            
            <h6>Expenses</h6>
            <table class="table table-sm">
        `;
        
        pnl.expenses.forEach(expense => {
            pnlHTML += `
                <tr>
                    <td>${expense.name}</td>
                    <td class="text-end">₹${expense.balance.toLocaleString('en-IN')}</td>
                </tr>
            `;
        });
        
        pnlHTML += `
                <tr class="table-danger">
                    <td><strong>Total Expenses</strong></td>
                    <td class="text-end"><strong>₹${pnl.totalExpenses.toLocaleString('en-IN')}</strong></td>
                </tr>
                <tr class="table-success">
                    <td><strong>Net Income</strong></td>
                    <td class="text-end"><strong>₹${pnl.netIncome.toLocaleString('en-IN')}</strong></td>
                </tr>
            </table>
        `;
        
        pnlEl.innerHTML = pnlHTML;
    }
}

// Form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Transaction form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const transactionData = {
                date: document.getElementById('transactionDate').value,
                amount: parseFloat(document.getElementById('transactionAmount').value),
                debitAccountId: document.getElementById('debitAccount').value,
                creditAccountId: document.getElementById('creditAccount').value,
                description: document.getElementById('transactionDescription').value,
                reference: document.getElementById('transactionReference').value
            };
            
            if (transactionData.debitAccountId === transactionData.creditAccountId) {
                alert('Debit and Credit accounts cannot be the same!');
                return;
            }
            
            window.accountsManager.addTransaction(transactionData);
            
            // Reset form
            transactionForm.reset();
            setTodayDate();
            
            // Refresh data
            loadAccountsData();
            displayReports();
            
            alert('Transaction added successfully!');
        });
    }
    
    // Account form
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const accountData = {
                name: document.getElementById('accountName').value,
                type: document.getElementById('accountType').value,
                code: document.getElementById('accountCode').value,
                balance: parseFloat(document.getElementById('accountBalance').value) || 0
            };
            
            window.accountsManager.addAccount(accountData);
            
            // Reset form
            accountForm.reset();
            
            // Refresh data
            loadAccountsData();
            displayReports();
            
            alert('Account added successfully!');
        });
    }
    
    // Tab change handler
    const reportTab = document.getElementById('reports-tab');
    if (reportTab) {
        reportTab.addEventListener('click', function() {
            setTimeout(displayReports, 100);
        });
    }
});

// Functions for header buttons
function refreshData() {
    loadAccountsData();
    displayReports();
    alert('Data refreshed successfully!');
}

function exportData() {
    const data = window.accountsManager.getData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'accounts-data.json';
    link.click();
}