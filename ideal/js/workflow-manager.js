// Global Workflow Data Manager - Complete A to Z Flow
// This manages data flow between Enquiries → Quotations → Jobs → Invoices → Payments

if (!window.WorkflowManager) {
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

        // Create Invoice from Job
        createInvoiceFromJob(jobNo, invoiceData) {
            const data = this.getData();
            const job = data.jobs.find(j => j.no === jobNo);
            
            if (!job) return null;

            const invoice = {
                no: `INV${data.nextNumbers.invoice.toString().padStart(3, '0')}`,
                jobNo: jobNo,
                date: new Date().toISOString().split('T')[0],
                customer: job.customer,
                contact: job.contact,
                phone: job.phone,
                email: job.email,
                ...invoiceData,
                status: 'sent',
                createdAt: new Date().toISOString()
            };

            data.invoices.unshift(invoice);
            data.nextNumbers.invoice++;
            
            // Update job status
            job.status = 'invoiced';
            job.invoiceNo = invoice.no;
            
            this.saveData(data);
            return invoice;
        }

        // Document Management Functions
        getJobDocuments(jobNo) {
            const data = this.getData();
            const job = data.jobs.find(j => j.no === jobNo);
            return job ? job.documents || {} : {};
        }

        updateJobDocuments(jobNo, documentType, documentData) {
            const data = this.getData();
            const jobIndex = data.jobs.findIndex(j => j.no === jobNo);
            
            if (jobIndex !== -1) {
                if (!data.jobs[jobIndex].documents) {
                    data.jobs[jobIndex].documents = {};
                }
                
                data.jobs[jobIndex].documents[documentType] = {
                    ...documentData,
                    uploadedAt: new Date().toISOString(),
                    status: 'uploaded'
                };
                
                this.saveData(data);
                return true;
            }
            return false;
        }

        getRequiredDocuments(jobMode) {
            const baseDocuments = {
                'bl': { name: 'Bill of Lading (B/L)', required: true },
                'do': { name: 'Delivery Order (DO)', required: true },
                'arrivalNotice': { name: 'Arrival Notice', required: true },
                'invoice': { name: 'Commercial Invoice', required: true },
                'packingList': { name: 'Packing List', required: true }
            };

            if (jobMode === 'Sea') {
                return {
                    ...baseDocuments,
                    'seawayBill': { name: 'Seaway Bill', required: false },
                    'containerSeal': { name: 'Container Seal Certificate', required: true }
                };
            } else if (jobMode === 'Air') {
                return {
                    'awb': { name: 'Air Waybill (AWB)', required: true },
                    'flightManifest': { name: 'Flight Manifest', required: true },
                    'airlineDoc': { name: 'Airline Documentation', required: true },
                    'invoice': { name: 'Commercial Invoice', required: true },
                    'packingList': { name: 'Packing List', required: true }
                };
            }
            
            return baseDocuments;
        }
    }
    
    window.WorkflowManager = WorkflowManager;
}

// Initialize global workflow manager
if (!window.workflowManager) {
    window.workflowManager = new window.WorkflowManager();
}