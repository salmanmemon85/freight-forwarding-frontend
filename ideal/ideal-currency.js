// Currency Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadCurrencyData();
    setupCurrencySelectors();
    startAutoRefresh();
});

function checkUserSession() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('currentUser').textContent = 
        `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} - ${user.branch.charAt(0).toUpperCase() + user.branch.slice(1)} Branch`;
}

function loadCurrencyData() {
    const currencies = window.currencyManager.getAllCurrencies();
    
    // Update stats
    document.getElementById('activeCurrencies').textContent = currencies.length;
    document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('en-IN');
    
    // Load currency table
    displayCurrencies(currencies);
}

function displayCurrencies(currencies) {
    const tbody = document.getElementById('currencyTable');
    tbody.innerHTML = '';
    
    currencies.forEach(currency => {
        const reverseRate = currency.code !== 'USD' ? 
            (1 / currency.rate).toFixed(4) : 
            '1.0000';
        
        const row = `
            <tr>
                <td>
                    <strong>${currency.code}</strong>
                    ${currency.isBase ? '<span class="badge badge-success">BASE</span>' : ''}
                </td>
                <td>${currency.name}</td>
                <td><span class="currency-symbol">${currency.symbol}</span></td>
                <td>
                    <strong>${currency.rate.toFixed(4)}</strong>
                    ${currency.code !== 'USD' ? `<small>${currency.symbol}${currency.rate.toFixed(2)}</small>` : ''}
                </td>
                <td>
                    ${currency.code !== 'USD' ? reverseRate : '-'}
                    ${currency.code !== 'USD' ? `<small>$${reverseRate}</small>` : ''}
                </td>
                <td>
                    ${currency.code !== 'USD' ? 
                        `<button class="btn-small" onclick="editRate('${currency.code}')">✏️ Edit</button>` : 
                        '<span class="text-muted">Base Currency</span>'
                    }
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function setupCurrencySelectors() {
    const currencies = window.currencyManager.getAllCurrencies();
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    // Clear existing options
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Add currency options
    currencies.forEach(currency => {
        const option = `<option value="${currency.code}">${currency.code} - ${currency.name} (${currency.symbol})</option>`;
        fromSelect.innerHTML += option;
        toSelect.innerHTML += option;
    });
    
    // Set default values
    fromSelect.value = 'USD';
    toSelect.value = 'INR';
}

function convertCurrency() {
    const amount = parseFloat(document.getElementById('convertAmount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    if (!amount || !fromCurrency || !toCurrency) {
        alert('Please fill all fields');
        return;
    }
    
    if (amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        const convertedAmount = window.currencyManager.convert(amount, fromCurrency, toCurrency);
        const fromFormatted = window.currencyManager.format(amount, fromCurrency);
        const toFormatted = window.currencyManager.format(convertedAmount, toCurrency);
        const rate = window.currencyManager.getExchangeRate(fromCurrency, toCurrency);
        
        document.getElementById('conversionResult').innerHTML = `
            <div class="conversion-display">
                <div class="conversion-main">
                    <strong>${fromFormatted} = ${toFormatted}</strong>
                </div>
                <div class="conversion-rate">
                    <small>Exchange Rate: 1 ${fromCurrency} = ${rate} ${toCurrency}</small>
                </div>
                <div class="conversion-time">
                    <small>Updated: ${new Date().toLocaleString('en-IN')}</small>
                </div>
            </div>
        `;
    } catch (error) {
        alert('Conversion error: ' + error.message);
    }
}

function updateRates() {
    const updateBtn = document.querySelector('.header-actions .btn-primary');
    const originalText = updateBtn.textContent;
    
    updateBtn.textContent = '🔄 Updating...';
    updateBtn.disabled = true;
    
    // Simulate API call
    window.currencyManager.updateExchangeRates().then(() => {
        loadCurrencyData();
        setupCurrencySelectors();
        
        updateBtn.textContent = originalText;
        updateBtn.disabled = false;
        
        alert('✅ Exchange rates updated successfully!\\n\\nRates are now current as of ' + new Date().toLocaleString('en-IN'));
    }).catch(error => {
        updateBtn.textContent = originalText;
        updateBtn.disabled = false;
        alert('❌ Failed to update rates: ' + error.message);
    });
}

function showAddCurrency() {
    document.getElementById('addCurrencyModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('addCurrencyModal').style.display = 'none';
    document.getElementById('addCurrencyForm').reset();
}

function editRate(currencyCode) {
    const currency = window.currencyManager.getCurrency(currencyCode);
    if (!currency) return;
    
    document.getElementById('editCurrencyCode').value = currencyCode;
    document.getElementById('currentRate').value = currency.rate.toFixed(4);
    document.getElementById('newRate').value = currency.rate.toFixed(4);
    
    document.getElementById('editRateModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editRateModal').style.display = 'none';
    document.getElementById('editRateForm').reset();
}

// Add Currency Form Submission
document.getElementById('addCurrencyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const code = document.getElementById('currencyCode').value.toUpperCase();
    const name = document.getElementById('currencyName').value;
    const symbol = document.getElementById('currencySymbol').value;
    const rate = parseFloat(document.getElementById('exchangeRate').value);
    
    if (window.currencyManager.getCurrency(code)) {
        alert('❌ Currency already exists!');
        return;
    }
    
    if (rate <= 0) {
        alert('❌ Exchange rate must be greater than 0');
        return;
    }
    
    window.currencyManager.addCurrency(code, name, symbol, rate);
    
    loadCurrencyData();
    setupCurrencySelectors();
    closeModal();
    
    alert(`✅ Currency Added Successfully!\\n\\nCode: ${code}\\nName: ${name}\\nSymbol: ${symbol}\\nRate: ${rate}`);
});

// Edit Rate Form Submission
document.getElementById('editRateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currencyCode = document.getElementById('editCurrencyCode').value;
    const newRate = parseFloat(document.getElementById('newRate').value);
    
    if (newRate <= 0) {
        alert('❌ Exchange rate must be greater than 0');
        return;
    }
    
    const success = window.currencyManager.updateRate(currencyCode, newRate);
    
    if (success) {
        loadCurrencyData();
        setupCurrencySelectors();
        closeEditModal();
        
        alert(`✅ Exchange Rate Updated!\\n\\nCurrency: ${currencyCode}\\nNew Rate: ${newRate}\\nUpdated: ${new Date().toLocaleString('en-IN')}`);
    } else {
        alert('❌ Failed to update exchange rate');
    }
});

function startAutoRefresh() {
    // Auto-refresh rates every 5 minutes
    setInterval(() => {
        window.currencyManager.updateExchangeRates().then(() => {
            loadCurrencyData();
            console.log('Exchange rates auto-updated');
        });
    }, 5 * 60 * 1000);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('addCurrencyModal');
    const editModal = document.getElementById('editRateModal');
    
    if (event.target === addModal) {
        closeModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
}