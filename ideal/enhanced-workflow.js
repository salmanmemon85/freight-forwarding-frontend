// Enhanced Workflow Manager - Complete Shipping Operations
// Handles: Jobs → Documents → Agent Purchases → Invoices → Payments

class EnhancedWorkflowManager extends WorkflowManager {
    constructor() {
        super();
        this.initializeShippingData();
    }

    initializeShippingData() {
        const data = this.getData();
        if (!data.documents) data.documents = [];
        if (!data.agentPurchases) data.agentPurchases = [];
        if (!data.nextNumbers.document) data.nextNumbers.document = 1;
        if (!data.nextNumbers.purchase) data.nextNumbers.purchase = 1;
        this.saveData(data);
    }

    // STEP 4A: Add Shipping Documents to Job
    addShippingDocument(jobNo, docData) {
        const data = this.getData();
        const job = data.jobs.find(j => j.no === jobNo);
        
        if (!job) return null;

        const document = {
            no: `DOC${data.nextNumbers.document.toString().padStart(3, '0')}`,
            jobNo: jobNo,
            type: docData.type,
            title: docData.title,
            status: docData.status || 'pending',
            receivedDate: docData.receivedDate || null,
            remarks: docData.remarks || '',
            createdAt: new Date().toISOString()
        };

        data.documents.push(document);
        data.nextNumbers.document++;
        
        // Update job documents status
        if (!job.documents) job.documents = [];
        job.documents.push(document.no);
        
        this.saveData(data);
        return document;
    }

    // STEP 4B: Record Agent Purchase (Shipping Line/Airline/Agent Costs)
    recordAgentPurchase(jobNo, purchaseData) {
        const data = this.getData();
        const job = data.jobs.find(j => j.no === jobNo);
        
        if (!job) return null;

        const purchase = {
            no: `PUR${data.nextNumbers.purchase.toString().padStart(3, '0')}`,
            jobNo: jobNo,
            vendor: purchaseData.vendor, // Agent/Shipping Line/Airline
            service: purchaseData.service, // Freight/DO/Documents
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
        
        // Update job cost
        job.totalCost = (job.totalCost || 0) + purchase.amount;
        job.actualProfit = (job.customerRate * job.cbm) - job.totalCost;
        
        this.saveData(data);
        return purchase;
    }

    // Generate Arrival Notice
    generateArrivalNotice(jobNo) {
        const data = this.getData();
        const job = data.jobs.find(j => j.no === jobNo);
        
        if (!job) return null;

        const arrivalNotice = {
            no: `AN${job.no.substring(3)}`, // AN001 from JOB001
            jobNo: jobNo,
            customer: job.customer,
            vessel: job.vessel || 'TBD',
            voyage: job.voyage || 'TBD',
            eta: job.eta || new Date().toISOString().split('T')[0],
            port: job.destination,
            cargo: job.commodity,
            weight: job.weight,
            cbm: job.cbm,
            containers: job.containers || 1,
            generatedAt: new Date().toISOString()
        };

        // Add as document
        this.addShippingDocument(jobNo, {
            type: 'arrival_notice',
            title: `Arrival Notice - ${arrivalNotice.no}`,
            status: 'generated',
            receivedDate: new Date().toISOString().split('T')[0]
        });

        return arrivalNotice;
    }

    // Get Job Documents
    getJobDocuments(jobNo) {
        const data = this.getData();
        return data.documents.filter(doc => doc.jobNo === jobNo);
    }

    // Get Job Purchases
    getJobPurchases(jobNo) {
        const data = this.getData();
        return data.agentPurchases.filter(purchase => purchase.jobNo === jobNo);
    }

    // Get All Documents
    getAllDocuments() {
        return this.getData().documents;
    }

    // Get All Agent Purchases
    getAllAgentPurchases() {
        return this.getData().agentPurchases;
    }

    // Update Job Status with Shipping Stages
    updateJobStatus(jobNo, status, updateData = {}) {
        const data = this.getData();
        const job = data.jobs.find(j => j.no === jobNo);
        
        if (!job) return null;

        job.status = status;
        Object.assign(job, updateData);
        
        // Add status history
        if (!job.statusHistory) job.statusHistory = [];
        job.statusHistory.push({
            status: status,
            date: new Date().toISOString(),
            ...updateData
        });
        
        this.saveData(data);
        return job;
    }

    // Calculate Job Profitability
    calculateJobProfitability(jobNo) {
        const data = this.getData();
        const job = data.jobs.find(j => j.no === jobNo);
        const purchases = this.getJobPurchases(jobNo);
        
        if (!job) return null;

        const revenue = (job.customerRate || 0) * (job.cbm || 0);
        const totalCost = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
        const profit = revenue - totalCost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
            jobNo: job.no,
            revenue,
            totalCost,
            profit,
            margin: Math.round(margin * 100) / 100,
            purchases: purchases.length
        };
    }

    // Get Job Complete Details
    getJobCompleteDetails(jobNo) {
        const data = this.getData();
        const job = data.jobs.find(j => j.no === jobNo);
        const documents = this.getJobDocuments(jobNo);
        const purchases = this.getJobPurchases(jobNo);
        const profitability = this.calculateJobProfitability(jobNo);
        
        return {
            job,
            documents,
            purchases,
            profitability,
            workflow: this.getWorkflowChain(job?.enquiryNo)
        };
    }

    // Check if Job can be closed
    canCloseJob(jobNo) {
        const details = this.getJobCompleteDetails(jobNo);
        if (!details.job) return { canClose: false, reason: 'Job not found' };

        const requiredDocs = ['bl', 'invoice', 'packing_list'];
        const receivedDocs = details.documents
            .filter(doc => doc.status === 'received')
            .map(doc => doc.type);

        const hasAllDocs = requiredDocs.every(type => 
            receivedDocs.includes(type) || receivedDocs.includes(type.replace('_', ''))
        );

        const hasInvoice = details.workflow.invoice && details.workflow.invoice.status === 'paid';
        const hasPurchases = details.purchases.length > 0;

        if (!hasAllDocs) return { canClose: false, reason: 'Missing required documents' };
        if (!hasInvoice) return { canClose: false, reason: 'Invoice not paid' };
        if (!hasPurchases) return { canClose: false, reason: 'No agent purchases recorded' };

        return { canClose: true, reason: 'All conditions met' };
    }

    // Close Job
    closeJob(jobNo) {
        const canClose = this.canCloseJob(jobNo);
        if (!canClose.canClose) return { success: false, reason: canClose.reason };

        const job = this.updateJobStatus(jobNo, 'closed', {
            closedAt: new Date().toISOString(),
            finalProfit: this.calculateJobProfitability(jobNo).profit
        });

        return { success: true, job };
    }
}

// Replace global workflow manager with enhanced version
window.workflowManager = new EnhancedWorkflowManager();