// Currency Management Module - Multi-Currency Support

class CurrencyManager {
    constructor() {
        this.initializeCurrencies();
        this.loadExchangeRates();
    }

    initializeCurrencies() {
        // Default currencies for freight forwarding
        this.currencies = {
            'USD': { name: 'US Dollar', symbol: '$', rate: 1.0, isBase: true },
            'EUR': { name: 'Euro', symbol: '€', rate: 0.85, isBase: false },
            'GBP': { name: 'British Pound', symbol: '£', rate: 0.73, isBase: false },
            'INR': { name: 'Indian Rupee', symbol: '₹', rate: 83.0, isBase: false },
            'AED': { name: 'UAE Dirham', symbol: 'د.إ', rate: 3.67, isBase: false },
            'SGD': { name: 'Singapore Dollar', symbol: 'S$', rate: 1.35, isBase: false },
            'CNY': { name: 'Chinese Yuan', symbol: '¥', rate: 7.2, isBase: false },
            'JPY': { name: 'Japanese Yen', symbol: '¥', rate: 150.0, isBase: false }
        };
        
        // Save to localStorage if not exists
        if (!localStorage.getItem('currencies')) {
            localStorage.setItem('currencies', JSON.stringify(this.currencies));
        } else {
            this.currencies = JSON.parse(localStorage.getItem('currencies'));
        }
    }

    loadExchangeRates() {
        // In real app, this would fetch from API
        // For demo, using static rates
        const savedRates = localStorage.getItem('exchangeRates');
        if (savedRates) {
            const rates = JSON.parse(savedRates);
            Object.keys(rates).forEach(currency => {
                if (this.currencies[currency]) {
                    this.currencies[currency].rate = rates[currency];
                }
            });
        }
    }

    // Convert amount from one currency to another
    convert(amount, fromCurrency, toCurrency) {
        if (!this.currencies[fromCurrency] || !this.currencies[toCurrency]) {
            throw new Error('Currency not supported');
        }

        // Convert to base currency (USD) first
        const usdAmount = amount / this.currencies[fromCurrency].rate;
        
        // Convert from USD to target currency
        const convertedAmount = usdAmount * this.currencies[toCurrency].rate;
        
        return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
    }

    // Format amount with currency symbol
    format(amount, currency) {
        if (!this.currencies[currency]) {
            return `${amount}`;
        }

        const { symbol } = this.currencies[currency];
        const formattedAmount = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);

        return `${symbol}${formattedAmount}`;
    }

    // Get all available currencies
    getAllCurrencies() {
        return Object.keys(this.currencies).map(code => ({
            code,
            ...this.currencies[code]
        }));
    }

    // Update exchange rate
    updateRate(currency, rate) {
        if (this.currencies[currency]) {
            this.currencies[currency].rate = rate;
            localStorage.setItem('currencies', JSON.stringify(this.currencies));
            return true;
        }
        return false;
    }

    // Get currency info
    getCurrency(code) {
        return this.currencies[code] || null;
    }

    // Add new currency
    addCurrency(code, name, symbol, rate) {
        this.currencies[code] = {
            name,
            symbol,
            rate,
            isBase: false
        };
        localStorage.setItem('currencies', JSON.stringify(this.currencies));
    }

    // Get exchange rate between two currencies
    getExchangeRate(fromCurrency, toCurrency) {
        if (!this.currencies[fromCurrency] || !this.currencies[toCurrency]) {
            return null;
        }

        const fromRate = this.currencies[fromCurrency].rate;
        const toRate = this.currencies[toCurrency].rate;
        
        return Math.round((toRate / fromRate) * 10000) / 10000; // 4 decimal places
    }

    // Generate currency dropdown options
    getCurrencyOptions() {
        return Object.keys(this.currencies).map(code => {
            const currency = this.currencies[code];
            return `<option value="${code}">${code} - ${currency.name} (${currency.symbol})</option>`;
        }).join('');
    }

    // Calculate profit in multiple currencies
    calculateMultiCurrencyProfit(revenue, revenueCurrency, costs, baseCurrency = 'USD') {
        // Convert revenue to base currency
        const revenueInBase = this.convert(revenue, revenueCurrency, baseCurrency);
        
        // Convert all costs to base currency and sum
        let totalCostInBase = 0;
        costs.forEach(cost => {
            totalCostInBase += this.convert(cost.amount, cost.currency, baseCurrency);
        });
        
        const profitInBase = revenueInBase - totalCostInBase;
        const marginPercent = revenueInBase > 0 ? (profitInBase / revenueInBase) * 100 : 0;
        
        return {
            revenue: revenueInBase,
            totalCost: totalCostInBase,
            profit: profitInBase,
            margin: Math.round(marginPercent * 100) / 100,
            currency: baseCurrency
        };
    }

    // Get currency conversion widget HTML
    getCurrencyWidget() {
        return `
            <div class="currency-widget">
                <h4>💱 Currency Converter</h4>
                <div class="converter-row">
                    <input type="number" id="convertAmount" placeholder="Amount" step="0.01">
                    <select id="fromCurrency">
                        ${this.getCurrencyOptions()}
                    </select>
                    <span>→</span>
                    <select id="toCurrency">
                        ${this.getCurrencyOptions()}
                    </select>
                    <button onclick="convertCurrency()">Convert</button>
                </div>
                <div id="conversionResult" class="conversion-result"></div>
            </div>
        `;
    }

    // Update exchange rates (simulate API call)
    async updateExchangeRates() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate rate fluctuations (±5%)
        Object.keys(this.currencies).forEach(currency => {
            if (!this.currencies[currency].isBase) {
                const currentRate = this.currencies[currency].rate;
                const fluctuation = (Math.random() - 0.5) * 0.1; // ±5%
                const newRate = currentRate * (1 + fluctuation);
                this.currencies[currency].rate = Math.round(newRate * 10000) / 10000;
            }
        });
        
        localStorage.setItem('currencies', JSON.stringify(this.currencies));
        return true;
    }
}

// Initialize global currency manager
window.currencyManager = new CurrencyManager();

// Global currency conversion function
function convertCurrency() {
    const amount = parseFloat(document.getElementById('convertAmount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    if (!amount || !fromCurrency || !toCurrency) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const convertedAmount = window.currencyManager.convert(amount, fromCurrency, toCurrency);
        const fromFormatted = window.currencyManager.format(amount, fromCurrency);
        const toFormatted = window.currencyManager.format(convertedAmount, toCurrency);
        const rate = window.currencyManager.getExchangeRate(fromCurrency, toCurrency);
        
        document.getElementById('conversionResult').innerHTML = `
            <div class="conversion-display">
                <strong>${fromFormatted} = ${toFormatted}</strong>
                <small>Rate: 1 ${fromCurrency} = ${rate} ${toCurrency}</small>
            </div>
        `;
    } catch (error) {
        alert('Conversion error: ' + error.message);
    }
}

// Enhanced workflow manager with currency support
class CurrencyEnhancedWorkflow extends EnhancedWorkflowManager {
    // Override recordAgentPurchase to include currency
    recordAgentPurchase(jobNo, purchaseData) {
        const data = this.getData();
        const job = data.jobs.find(j => j.no === jobNo);
        
        if (!job) return null;

        const purchase = {
            no: `PUR${data.nextNumbers.purchase.toString().padStart(3, '0')}`,
            jobNo: jobNo,
            vendor: purchaseData.vendor,
            service: purchaseData.service,
            amount: purchaseData.amount,
            currency: purchaseData.currency || 'USD',
            description: purchaseData.description,
            purchaseDate: purchaseData.purchaseDate || new Date().toISOString().split('T')[0],
            status: purchaseData.status || 'pending',
            createdAt: new Date().toISOString()
        };

        data.agentPurchases.push(purchase);
        data.nextNumbers.purchase++;
        
        // Update job purchases
        if (!job.purchases) job.purchases = [];
        job.purchases.push(purchase.no);
        
        // Calculate total cost in job's base currency
        const jobCurrency = job.currency || 'USD';
        const costInJobCurrency = window.currencyManager.convert(
            purchase.amount, 
            purchase.currency, 
            jobCurrency
        );
        
        job.totalCost = (job.totalCost || 0) + costInJobCurrency;
        job.actualProfit = ((job.customerRate || 0) * (job.cbm || 0)) - job.totalCost;
        
        this.saveData(data);
        return purchase;
    }

    // Override calculateJobProfitability with currency support
    calculateJobProfitability(jobNo) {
        const data = this.getData();
        const job = data.jobs.find(j => j.no === jobNo);
        const purchases = this.getJobPurchases(jobNo);
        
        if (!job) return null;

        const jobCurrency = job.currency || 'USD';
        const revenue = (job.customerRate || 0) * (job.cbm || 0);
        
        // Convert all purchase costs to job currency
        const costs = purchases.map(purchase => ({
            amount: purchase.amount,
            currency: purchase.currency || 'USD'
        }));
        
        const profitData = window.currencyManager.calculateMultiCurrencyProfit(
            revenue, 
            jobCurrency, 
            costs, 
            jobCurrency
        );

        return {
            jobNo: job.no,
            currency: jobCurrency,
            ...profitData,
            purchases: purchases.length
        };
    }
}

// Replace enhanced workflow manager with currency-enhanced version
window.workflowManager = new CurrencyEnhancedWorkflow();