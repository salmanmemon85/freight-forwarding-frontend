// Global Workflow Data Manager - Complete A to Z Flow
// This manages data flow between Enquiries → Quotations → Jobs → Invoices → Payments

// Prevent redeclaration if already loaded
if (typeof WorkflowManager === 'undefined') {
    class WorkflowManager {
        constructor() {
            this.initializeData();
        }

        initializeData() {
            // Initialize workflow data if not exists
            if (!localStorage.getItem('workflowData')) {
                const initialData = {
                    enquiries: [],
                    quotations: [],
                    jobs: [],
                    invoices: [],
                    payments: [],
                    nextNumbers: {
                        enquiry: 1,
                        quotation: 1,
                        job: 1,
                        invoice: 1,
                        payment: 1
                    }
                };
                localStorage.setItem('workflowData', JSON.stringify(initialData));
            }
        }

        getData() {
            return JSON.parse(localStorage.getItem('workflowData'));
        }

        saveData(data) {
            localStorage.setItem('workflowData', JSON.stringify(data));
        }

        // STEP 1: Create Enquiry
        createEnquiry(enquiryData) {
            const data = this.getData();
            const enquiry = {
                ...enquiryData,
                no: `ENQ${data.nextNumbers.enquiry.toString().padStart(3, '0')}`,
                date: new Date().toISOString().split('T')[0],
                status: 'new',
                createdAt: new Date().toISOString()
            };
            
            data.enquiries.unshift(enquiry);
            data.nextNumbers.enquiry++;
            this.saveData(data);
            return enquiry;
        }

        // Get data by type
        getEnquiries() {
            return this.getData().enquiries;
        }

        getQuotations() {
            return this.getData().quotations;
        }

        getJobs() {
            return this.getData().jobs;
        }

        getInvoices() {
            return this.getData().invoices;
        }

        getPayments() {
            return this.getData().payments;
        }

        // Get dashboard statistics
        getDashboardStats() {
            const data = this.getData();
            const today = new Date().toISOString().split('T')[0];

            return {
                todayEnquiries: data.enquiries.filter(e => e.date === today).length,
                pendingQuotations: data.quotations.filter(q => q.status === 'sent').length,
                activeJobs: data.jobs.filter(j => ['open', 'in-progress'].includes(j.status)).length,
                pendingInvoices: data.invoices.filter(i => i.status === 'sent').length,
                totalRevenue: data.invoices.reduce((sum, i) => sum + (i.total || 0), 0),
                totalProfit: data.jobs.reduce((sum, j) => sum + (j.profit || 0), 0)
            };
        }
    }
}

// Initialize global workflow manager only if not already exists
if (!window.workflowManager) {
    window.workflowManager = new WorkflowManager();
}