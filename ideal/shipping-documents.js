// Enhanced Shipping Documents System - Complete A to Z Documents

class ShippingDocumentsManager {
    constructor() {
        this.initializeDocumentTypes();
    }

    initializeDocumentTypes() {
        this.documentTypes = {
            // 1️⃣ SHIPPING / TRANSPORT DOCUMENTS (Maal move karne ke documents)
            'shipping': {
                name: 'Shipping & Transport Documents',
                icon: '🚢',
                description: 'Maal move karne ke documents',
                documents: {
                    'bl': { name: 'Bill of Lading (B/L)', required: true, issuer: 'Carrier', description: 'Shipping ka main document, Cargo ownership proof' },
                    'mbl': { name: 'Master Bill of Lading (MBL)', required: true, issuer: 'Shipping Line', description: 'Main carrier ka B/L' },
                    'hbl': { name: 'House Bill of Lading (HBL)', required: true, issuer: 'Freight Forwarder', description: 'Forwarder ka B/L' },
                    'mawb': { name: 'Master Air Waybill (MAWB)', required: true, issuer: 'Airline', description: 'Air transport main document' },
                    'hawb': { name: 'House Air Waybill (HAWB)', required: true, issuer: 'Air Freight Agent', description: 'Air forwarder document' },
                    'do': { name: 'Delivery Order (DO)', required: true, issuer: 'Shipping Line/Agent', description: 'Delivery ka permission letter, DO ke bina cargo release nahi hota' },
                    'arrival_notice': { name: 'Arrival Notice (AN)', required: true, issuer: 'Shipping Line/Agent', description: 'Cargo arrival ka intimation letter, Consignee ko milta hai' }
                }
            },
            
            // 2️⃣ COMMERCIAL DOCUMENTS (Business & value related)
            'commercial': {
                name: 'Commercial Documents',
                icon: '🧾',
                description: 'Business & value related documents',
                documents: {
                    'commercial_invoice': { name: 'Commercial Invoice', required: true, issuer: 'Seller', description: 'Seller issue karta hai, Goods ki value, Customs duty isi par calculate hoti hai' },
                    'packing_list': { name: 'Packing List', required: true, issuer: 'Seller/Exporter', description: 'Goods ka detail, Boxes, weight, dimensions' },
                    'proforma_invoice': { name: 'Proforma Invoice', required: false, issuer: 'Seller', description: 'Quotation invoice' }
                }
            },
            
            // 3️⃣ CUSTOMS & CLEARING DOCUMENTS (Government / customs ke liye)
            'customs': {
                name: 'Customs & Clearing Documents',
                icon: '📄',
                description: 'Government / customs ke liye documents',
                documents: {
                    'shipping_bill': { name: 'Shipping Bill (Export)', required: true, issuer: 'Customs', description: 'Export customs declaration, Customs ke liye mandatory' },
                    'bill_of_entry': { name: 'Bill of Entry (Import)', required: true, issuer: 'Customs', description: 'Import customs declaration, Duty payment ke liye' },
                    'gd': { name: 'Goods Declaration (GD)', required: true, issuer: 'Pakistan Customs', description: 'Pakistan specific customs document' },
                    'customs_invoice': { name: 'Customs Invoice', required: true, issuer: 'Customs Agent', description: 'Customs valuation document' }
                }
            },
            
            // 4️⃣ BANK & TRADE DOCUMENTS (Payment & LC related)
            'banking': {
                name: 'Bank & Trade Documents',
                icon: '🏦',
                description: 'Payment & LC related documents',
                documents: {
                    'lc': { name: 'Letter of Credit (LC)', required: false, issuer: 'Bank', description: 'Bank ka payment guarantee, Buyer ke bank se seller ke bank ko' },
                    'bank_certificate': { name: 'Bank Certificate', required: true, issuer: 'Bank', description: 'Export proceeds proof, Pakistan mein SBP requirement' },
                    'form_e': { name: 'Form E (Pakistan)', required: true, issuer: 'SBP', description: 'Export ke liye mandatory, Foreign exchange declaration' },
                    'fbr_documents': { name: 'FBR Documents', required: true, issuer: 'FBR', description: 'Tax compliance documents' },
                    'sbp_documents': { name: 'SBP Documents', required: true, issuer: 'State Bank Pakistan', description: 'Foreign remittance compliance' }
                }
            },
            
            // 5️⃣ CERTIFICATES & SUPPORT DOCUMENTS (Special requirements)
            'certificates': {
                name: 'Certificates & Support Documents',
                icon: '📜',
                description: 'Special requirements certificates',
                documents: {
                    'coo': { name: 'Certificate of Origin (COO)', required: true, issuer: 'Chamber of Commerce', description: 'Goods kis country ke hain, Chamber of Commerce issue karta hai' },
                    'msds': { name: 'MSDS', required: false, issuer: 'Manufacturer', description: 'Dangerous goods ke liye' },
                    'phytosanitary': { name: 'Phytosanitary Certificate', required: false, issuer: 'Agriculture Department', description: 'Food / agriculture items ke liye' },
                    'health_certificate': { name: 'Health Certificate', required: false, issuer: 'Health Department', description: 'Food / medical items ke liye' },
                    'quality_certificate': { name: 'Quality Certificate', required: false, issuer: 'Testing Lab', description: 'Quality assurance certificate' },
                    'fumigation_certificate': { name: 'Fumigation Certificate', required: false, issuer: 'Fumigation Company', description: 'Pest control certificate' },
                    'insurance_certificate': { name: 'Insurance Certificate', required: false, issuer: 'Insurance Company', description: 'Cargo insurance proof' }
                }
            },
            
            // 6️⃣ INTERNAL / OFFICE DOCUMENTS (Company ke andar use)
            'internal': {
                name: 'Internal & Office Documents',
                icon: '📊',
                description: 'Company ke andar use hone wale documents',
                documents: {
                    'our_invoice': { name: 'Our Invoice', required: true, issuer: 'Our Company', description: 'Freight forwarder ki invoice' },
                    'job_file': { name: 'Job File', required: true, issuer: 'Operations', description: 'Complete job documentation' },
                    'job_cost_sheet': { name: 'Job Cost Sheet', required: true, issuer: 'Accounts', description: 'Job ka profit / loss' },
                    'debit_note': { name: 'Debit Note', required: false, issuer: 'Accounts', description: 'Adjustments ke liye - extra charges' },
                    'credit_note': { name: 'Credit Note', required: false, issuer: 'Accounts', description: 'Adjustments ke liye - refunds' },
                    'pod': { name: 'Proof of Delivery (POD)', required: true, issuer: 'Consignee', description: 'Delivery confirmation' },
                    'quotation': { name: 'Quotation', required: true, issuer: 'Sales', description: 'Rate quotation document' },
                    'booking_confirmation': { name: 'Booking Confirmation', required: true, issuer: 'Operations', description: 'Space booking confirmation' }
                }
            }
        };
    }

    // Get all document categories
    getDocumentCategories() {
        return Object.keys(this.documentTypes).map(key => ({
            key,
            ...this.documentTypes[key]
        }));
    }

    // Get documents by category
    getDocumentsByCategory(category) {
        if (!this.documentTypes[category]) return [];
        
        return Object.keys(this.documentTypes[category].documents).map(key => ({
            key,
            category,
            ...this.documentTypes[category].documents[key]
        }));
    }

    // Get all documents
    getAllDocuments() {
        const allDocs = [];
        Object.keys(this.documentTypes).forEach(category => {
            const docs = this.getDocumentsByCategory(category);
            allDocs.push(...docs);
        });
        return allDocs;
    }

    // Get required documents for a shipment type
    getRequiredDocuments(shipmentType, mode) {
        const required = [];
        
        // Common required documents
        required.push('commercial_invoice', 'packing_list');
        
        // Mode specific
        if (mode === 'Sea') {
            required.push('mbl', 'hbl', 'do');
        } else if (mode === 'Air') {
            required.push('mawb', 'hawb');
        }
        
        // Shipment type specific
        if (shipmentType === 'Export') {
            required.push('shipping_bill', 'form_e', 'coo');
        } else if (shipmentType === 'Import') {
            required.push('bill_of_entry', 'arrival_notice');
        }
        
        // Internal documents
        required.push('freight_invoice', 'job_file', 'cost_sheet');
        
        return required;
    }

    // Get document info with Urdu description
    getDocumentInfoWithDescription(docKey) {
        const info = this.getDocumentInfo(docKey);
        if (!info) return null;
        
        return {
            ...info,
            fullDescription: `${info.name}\n${info.description || ''}\nIssuer: ${info.issuer}`
        };
    }

    // Get documents summary for display
    getDocumentsSummary() {
        const categories = this.getDocumentCategories();
        return categories.map(cat => ({
            ...cat,
            totalDocs: Object.keys(this.documentTypes[cat.key].documents).length,
            requiredDocs: Object.values(this.documentTypes[cat.key].documents).filter(d => d.required).length
        }));
    }

    // Get document info
    getDocumentInfo(docKey) {
        for (const category of Object.keys(this.documentTypes)) {
            const docs = this.documentTypes[category].documents;
            if (docs[docKey]) {
                return {
                    key: docKey,
                    category,
                    categoryName: this.documentTypes[category].name,
                    categoryIcon: this.documentTypes[category].icon,
                    ...docs[docKey]
                };
            }
        }
        return null;
    }

    // Generate document checklist for job
    generateDocumentChecklist(jobNo, shipmentType, mode) {
        const requiredDocs = this.getRequiredDocuments(shipmentType, mode);
        const checklist = [];
        
        requiredDocs.forEach(docKey => {
            const docInfo = this.getDocumentInfo(docKey);
            if (docInfo) {
                checklist.push({
                    jobNo,
                    docKey,
                    docName: docInfo.name,
                    category: docInfo.category,
                    categoryName: docInfo.categoryName,
                    issuer: docInfo.issuer,
                    required: docInfo.required,
                    status: 'pending',
                    receivedDate: null,
                    remarks: ''
                });
            }
        });
        
        return checklist;
    }

    // Get document status summary
    getDocumentStatusSummary(documents) {
        const summary = {
            total: documents.length,
            received: documents.filter(d => d.status === 'received').length,
            pending: documents.filter(d => d.status === 'pending').length,
            missing: documents.filter(d => d.status === 'missing').length,
            completionRate: 0
        };
        
        summary.completionRate = summary.total > 0 ? 
            Math.round((summary.received / summary.total) * 100) : 0;
        
        return summary;
    }
}

// Enhanced Workflow Manager with Complete Documents
class DocumentEnhancedWorkflow extends CurrencyEnhancedWorkflow {
    constructor() {
        super();
        this.documentsManager = new ShippingDocumentsManager();
        this.initializeDocumentData();
    }

    initializeDocumentData() {
        const data = this.getData();
        if (!data.documentChecklists) data.documentChecklists = [];
        this.saveData(data);
    }

    // Override convertQuotationToJob to assign sales person and track commission
    convertQuotationToJob(quotationNo) {
        const job = super.convertQuotationToJob(quotationNo);
        
        if (job) {
            // Assign sales person from quotation or current user
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (currentUser && currentUser.role === 'sales') {
                job.salesPersonId = currentUser.id;
                job.salesPersonName = currentUser.name;
            }
            
            // Create document checklist for the job
            const checklist = this.documentsManager.generateDocumentChecklist(
                job.no, 
                job.type, 
                job.mode
            );
            
            const data = this.getData();
            data.documentChecklists.push({
                jobNo: job.no,
                documents: checklist,
                createdAt: new Date().toISOString()
            });
            this.saveData(data);
        }
        
        return job;
    }

    // Override createInvoice to calculate and add commission
    createInvoice(jobNo, invoiceData) {
        const invoice = super.createInvoice(jobNo, invoiceData);
        
        if (invoice) {
            const job = this.getJobs().find(j => j.no === jobNo);
            
            // Calculate commission for sales person
            if (job && job.salesPersonId && window.userManager) {
                const commission = window.userManager.calculateCommission(jobNo, job.salesPersonId);
                
                if (commission > 0) {
                    window.userManager.addCommission(
                        jobNo, 
                        job.salesPersonId, 
                        commission, 
                        `Commission for job ${jobNo} - ${job.customer}`
                    );
                }
            }
        }
        
        return invoice;
    }

    // Add shipping document with enhanced tracking
    addShippingDocument(jobNo, docData) {
        const document = super.addShippingDocument(jobNo, docData);
        
        if (document) {
            // Update document checklist
            this.updateDocumentChecklist(jobNo, docData.type, 'received', docData.receivedDate);
        }
        
        return document;
    }

    // Update document checklist status
    updateDocumentChecklist(jobNo, docType, status, receivedDate = null, remarks = '') {
        const data = this.getData();
        const checklist = data.documentChecklists.find(c => c.jobNo === jobNo);
        
        if (checklist) {
            const doc = checklist.documents.find(d => d.docKey === docType);
            if (doc) {
                doc.status = status;
                doc.receivedDate = receivedDate;
                doc.remarks = remarks;
                doc.updatedAt = new Date().toISOString();
            }
        }
        
        this.saveData(data);
    }

    // Get job document checklist
    getJobDocumentChecklist(jobNo) {
        const data = this.getData();
        const checklist = data.documentChecklists.find(c => c.jobNo === jobNo);
        return checklist ? checklist.documents : [];
    }

    // Get document completion status
    getDocumentCompletionStatus(jobNo) {
        const documents = this.getJobDocumentChecklist(jobNo);
        return this.documentsManager.getDocumentStatusSummary(documents);
    }

    // Check if job documents are complete
    areJobDocumentsComplete(jobNo) {
        const status = this.getDocumentCompletionStatus(jobNo);
        const requiredDocs = status.total - (status.missing || 0);
        return status.received >= requiredDocs;
    }

    // Generate document report
    generateDocumentReport(jobNo) {
        const documents = this.getJobDocumentChecklist(jobNo);
        const status = this.getDocumentCompletionStatus(jobNo);
        const categories = this.documentsManager.getDocumentCategories();
        
        const report = {
            jobNo,
            status,
            categories: categories.map(cat => ({
                ...cat,
                documents: documents.filter(d => d.category === cat.key),
                completed: documents.filter(d => d.category === cat.key && d.status === 'received').length
            }))
        };
        
        return report;
    }
}

// Initialize enhanced workflow with documents
window.workflowManager = new DocumentEnhancedWorkflow();
window.documentsManager = new ShippingDocumentsManager();