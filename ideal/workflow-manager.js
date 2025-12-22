// Global Workflow Data Manager - Complete A to Z Flow
// This manages data flow between Enquiries → Quotations → Jobs → Invoices → Payments

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

    // STEP 2: Create Quotation from Enquiry
    createQuotationFromEnquiry(enquiryNo, quoteData) {
        const data = this.getData();
        const enquiry = data.enquiries.find(e => e.no === enquiryNo);
        
        if (!enquiry) return null;

        const quotation = {
            no: `QUO${data.nextNumbers.quotation.toString().padStart(3, '0')}`,
            enquiryNo: enquiryNo,
            date: new Date().toISOString().split('T')[0],
            customer: enquiry.customer,
            contact: enquiry.contact,
            phone: enquiry.phone,
            email: enquiry.email,
            mode: enquiry.mode,
            type: enquiry.type,
            origin: enquiry.origin,
            destination: enquiry.destination,
            weight: enquiry.weight,
            cbm: enquiry.cbm,
            commodity: enquiry.commodity,
            hsCode: enquiry.hsCode,
            ...quoteData,
            status: 'sent',
            createdAt: new Date().toISOString()
        };

        data.quotations.unshift(quotation);
        data.nextNumbers.quotation++;
        
        // Update enquiry status
        enquiry.status = 'quoted';
        enquiry.quotationNo = quotation.no;
        
        this.saveData(data);
        return quotation;
    }

    // STEP 3: Approve Quotation
    approveQuotation(quotationNo) {
        const data = this.getData();
        const quotation = data.quotations.find(q => q.no === quotationNo);
        const enquiry = data.enquiries.find(e => e.no === quotation.enquiryNo);
        
        if (quotation) {
            quotation.status = 'approved';
            quotation.approvedAt = new Date().toISOString();
        }
        
        if (enquiry) {
            enquiry.status = 'approved';
        }
        
        this.saveData(data);
        return quotation;
    }

    // STEP 4: Convert Quotation to Job
    convertQuotationToJob(quotationNo) {
        const data = this.getData();
        const quotation = data.quotations.find(q => q.no === quotationNo);
        const enquiry = data.enquiries.find(e => e.no === quotation.enquiryNo);
        
        if (!quotation || quotation.status !== 'approved') return null;

        const job = {
            no: `JOB${data.nextNumbers.job.toString().padStart(3, '0')}`,
            enquiryNo: quotation.enquiryNo,
            quotationNo: quotationNo,
            date: new Date().toISOString().split('T')[0],
            customer: quotation.customer,
            contact: quotation.contact,
            phone: quotation.phone,
            email: quotation.email,
            mode: quotation.mode,
            type: quotation.type,
            origin: quotation.origin,
            destination: quotation.destination,
            weight: quotation.weight,
            cbm: quotation.cbm,
            commodity: quotation.commodity,
            hsCode: quotation.hsCode,
            agentRate: quotation.agentRate || 0,
            customerRate: quotation.customerRate || 0,
            profit: quotation.profit || 0,
            status: 'open',
            createdAt: new Date().toISOString()
        };

        data.jobs.unshift(job);
        data.nextNumbers.job++;
        
        // Update quotation and enquiry status
        quotation.status = 'converted';
        quotation.jobNo = job.no;
        enquiry.status = 'converted';
        enquiry.jobNo = job.no;
        
        this.saveData(data);
        return job;
    }

    // STEP 5: Create Invoice from Job
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

    // STEP 6: Record Payment
    recordPayment(invoiceNo, paymentData) {
        const data = this.getData();
        const invoice = data.invoices.find(i => i.no === invoiceNo);
        const job = data.jobs.find(j => j.no === invoice.jobNo);
        
        if (!invoice) return null;

        const payment = {
            id: `PAY${data.nextNumbers.payment.toString().padStart(3, '0')}`,
            invoiceNo: invoiceNo,
            jobNo: invoice.jobNo,
            date: new Date().toISOString().split('T')[0],
            customer: invoice.customer,
            ...paymentData,
            status: 'cleared',
            createdAt: new Date().toISOString()
        };

        data.payments.unshift(payment);
        data.nextNumbers.payment++;
        
        // Update invoice and job status
        invoice.status = 'paid';
        invoice.paidAt = new Date().toISOString();
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        
        this.saveData(data);
        return payment;
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

    // Get workflow chain for a specific enquiry
    getWorkflowChain(enquiryNo) {
        const data = this.getData();
        const enquiry = data.enquiries.find(e => e.no === enquiryNo);
        const quotation = data.quotations.find(q => q.enquiryNo === enquiryNo);
        const job = data.jobs.find(j => j.enquiryNo === enquiryNo);
        const invoice = data.invoices.find(i => job && i.jobNo === job.no);
        const payment = data.payments.find(p => invoice && p.invoiceNo === invoice.no);

        return {
            enquiry,
            quotation,
            job,
            invoice,
            payment,
            status: this.getChainStatus(enquiry, quotation, job, invoice, payment)
        };
    }

    getChainStatus(enquiry, quotation, job, invoice, payment) {
        if (payment) return 'completed';
        if (invoice) return 'invoiced';
        if (job) return 'in-progress';
        if (quotation && quotation.status === 'approved') return 'approved';
        if (quotation) return 'quoted';
        if (enquiry) return 'enquiry';
        return 'unknown';
    }

    // Calculate profit for a job
    calculateJobProfit(jobNo) {
        const data = this.getData();
        const job = data.jobs.find(j => j.no === jobNo);
        
        if (!job) return null;

        const revenue = job.customerRate * job.cbm;
        const cost = job.agentRate * job.cbm;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
            revenue,
            cost,
            profit,
            margin: Math.round(margin * 100) / 100
        };
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

// Initialize global workflow manager
window.workflowManager = new WorkflowManager();