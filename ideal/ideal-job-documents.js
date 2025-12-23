// Job Documents Generator System

class JobDocumentGenerator {
    constructor() {
        this.initializeData();
        this.documentTemplates = this.getDocumentTemplates();
    }

    initializeData() {
        const data = this.getData();
        if (!data.jobDocuments) data.jobDocuments = [];
        this.saveData(data);
    }

    getData() {
        return JSON.parse(localStorage.getItem('idealFreightData')) || {};
    }

    saveData(data) {
        localStorage.setItem('idealFreightData', JSON.stringify(data));
    }

    getDocumentTemplates() {
        return {
            'cf': {
                name: 'C&F Document',
                format: 'CLEARING & FORWARDING DOCUMENT',
                fields: ['jobNo', 'customer', 'vessel', 'port', 'cargo', 'weight', 'cbm']
            },
            'do': {
                name: 'Delivery Order',
                format: 'DELIVERY ORDER',
                fields: ['jobNo', 'customer', 'consignee', 'vessel', 'cargo', 'releaseDate']
            },
            'job-file': {
                name: 'Job File',
                format: 'COMPLETE JOB FILE',
                fields: ['jobNo', 'customer', 'origin', 'destination', 'cargo', 'documents']
            },
            'invoice': {
                name: 'Freight Invoice',
                format: 'FREIGHT FORWARDING INVOICE',
                fields: ['jobNo', 'customer', 'services', 'charges', 'total']
            },
            'certificate': {
                name: 'Certificate',
                format: 'FREIGHT CERTIFICATE',
                fields: ['jobNo', 'customer', 'cargo', 'certification']
            }
        };
    }

    generateDocument(jobNo, documentType, customData = {}) {
        const data = this.getData();
        const documentId = documentType.toUpperCase() + Date.now().toString().slice(-6);
        
        const job = window.workflowManager.getJobs().find(j => j.no === jobNo);
        if (!job) return null;

        const template = this.documentTemplates[documentType];
        if (!template) return null;

        const document = {
            id: documentId,
            jobNo,
            type: documentType,
            typeName: template.name,
            format: template.format,
            content: this.generateDocumentContent(job, template, customData),
            status: 'generated',
            createdAt: new Date().toISOString(),
            customData
        };

        data.jobDocuments.push(document);
        this.saveData(data);
        return document;
    }

    generateDocumentContent(job, template, customData) {
        const content = {
            header: {
                company: 'IDEAL FREIGHT SERVICES',
                address: 'Karachi, Pakistan',
                phone: '+92-21-1234567',
                email: 'info@idealfreight.com'
            },
            document: {
                title: template.format,
                id: customData.documentId || 'DOC' + Date.now().toString().slice(-6),
                date: new Date().toLocaleDateString('en-IN')
            },
            job: {
                jobNo: job.no,
                customer: job.customer,
                contact: job.contact,
                origin: job.origin,
                destination: job.destination,
                mode: job.mode,
                type: job.type,
                commodity: job.commodity,
                weight: job.weight || 'N/A',
                cbm: job.cbm || 'N/A'
            },
            vessel: customData.vessel || {
                name: job.mode === 'Sea' ? 'MV EXAMPLE' : 'EK 123',
                voyage: 'V001',
                eta: customData.eta || new Date().toISOString().split('T')[0]
            },
            charges: job.charges || {},
            customFields: customData
        };

        return content;
    }

    getJobDocuments(jobNo = null) {
        const documents = this.getData().jobDocuments || [];
        return jobNo ? documents.filter(d => d.jobNo === jobNo) : documents;
    }

    updateDocumentStatus(documentId, status) {
        const data = this.getData();
        const docIndex = data.jobDocuments.findIndex(d => d.id === documentId);
        
        if (docIndex !== -1) {
            data.jobDocuments[docIndex].status = status;
            data.jobDocuments[docIndex].updatedAt = new Date().toISOString();
            this.saveData(data);
            return data.jobDocuments[docIndex];
        }
        return null;
    }

    printDocument(documentId) {
        const documents = this.getJobDocuments();
        const document = documents.find(d => d.id === documentId);
        
        if (!document) return null;

        // Generate printable HTML content
        const printContent = this.generatePrintableContent(document);
        
        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        
        return document;
    }

    generatePrintableContent(document) {
        const content = document.content;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${document.typeName} - ${document.jobNo}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .document-title { font-size: 18px; font-weight: bold; margin: 20px 0; text-align: center; }
                    .section { margin: 15px 0; }
                    .field { margin: 5px 0; }
                    .label { font-weight: bold; display: inline-block; width: 150px; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${content.header.company}</h2>
                    <p>${content.header.address}</p>
                    <p>Phone: ${content.header.phone} | Email: ${content.header.email}</p>
                </div>
                
                <div class="document-title">${content.document.title}</div>
                
                <div class="section">
                    <div class="field"><span class="label">Document ID:</span> ${content.document.id}</div>
                    <div class="field"><span class="label">Date:</span> ${content.document.date}</div>
                    <div class="field"><span class="label">Job No:</span> ${content.job.jobNo}</div>
                </div>
                
                <div class="section">
                    <h4>Customer Information</h4>
                    <div class="field"><span class="label">Customer:</span> ${content.job.customer}</div>
                    <div class="field"><span class="label">Contact:</span> ${content.job.contact}</div>
                </div>
                
                <div class="section">
                    <h4>Shipment Details</h4>
                    <div class="field"><span class="label">Origin:</span> ${content.job.origin}</div>
                    <div class="field"><span class="label">Destination:</span> ${content.job.destination}</div>
                    <div class="field"><span class="label">Mode:</span> ${content.job.mode}</div>
                    <div class="field"><span class="label">Type:</span> ${content.job.type}</div>
                    <div class="field"><span class="label">Commodity:</span> ${content.job.commodity}</div>
                    <div class="field"><span class="label">Weight:</span> ${content.job.weight}</div>
                    <div class="field"><span class="label">CBM:</span> ${content.job.cbm}</div>
                </div>
                
                ${content.vessel ? `
                <div class="section">
                    <h4>Vessel/Flight Information</h4>
                    <div class="field"><span class="label">Vessel/Flight:</span> ${content.vessel.name}</div>
                    <div class="field"><span class="label">Voyage/Flight No:</span> ${content.vessel.voyage}</div>
                    <div class="field"><span class="label">ETA:</span> ${content.vessel.eta}</div>
                </div>
                ` : ''}
                
                <div class="footer">
                    <p>This document is computer generated and does not require signature.</p>
                    <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
                </div>
            </body>
            </html>
        `;
    }
}

window.jobDocumentGenerator = new JobDocumentGenerator();

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    loadJobDocumentsData();
});

function checkUserSession() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
}

function loadJobDocumentsData() {
    const documents = window.jobDocumentGenerator.getJobDocuments();
    
    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const cfDocuments = documents.filter(d => d.type === 'cf').length;
    const deliveryOrders = documents.filter(d => d.type === 'do').length;
    const jobFiles = documents.filter(d => d.type === 'job-file').length;
    const generatedToday = documents.filter(d => d.createdAt.startsWith(today)).length;
    
    document.getElementById('cfDocuments').textContent = cfDocuments;
    document.getElementById('deliveryOrders').textContent = deliveryOrders;
    document.getElementById('jobFiles').textContent = jobFiles;
    document.getElementById('generatedToday').textContent = generatedToday;
    
    displayJobDocuments(documents);
}

function displayJobDocuments(documents) {
    const tbody = document.getElementById('jobDocumentsTable');
    tbody.innerHTML = '';
    
    const jobs = window.workflowManager.getJobs();
    
    documents.forEach(document => {
        const job = jobs.find(j => j.no === document.jobNo);
        if (!job) return;
        
        const statusClass = getDocumentStatusClass(document.status);
        
        const row = `
            <tr>
                <td>
                    <strong>${document.id}</strong>
                    <br><small>${document.typeName}</small>
                </td>
                <td>
                    <strong>${document.jobNo}</strong>
                    <br><small>${job.type} | ${job.mode}</small>
                </td>
                <td>
                    <div><strong>${document.typeName}</strong></div>
                    <small>${document.format}</small>
                </td>
                <td>
                    <div><strong>${job.customer}</strong></div>
                    <small>${job.contact}</small>
                </td>
                <td>${formatDate(document.createdAt)}</td>
                <td><span class="status-${statusClass}">${document.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn-small" onclick="viewDocument('${document.id}')">👁️ View</button>
                    <button class="btn-small btn-primary" onclick="printDocument('${document.id}')">🖨️ Print</button>
                    <button class="btn-small" onclick="regenerateDocument('${document.id}')">🔄 Regenerate</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getDocumentStatusClass(status) {
    switch(status) {
        case 'generated': return 'success';
        case 'printed': return 'info';
        case 'sent': return 'warning';
        default: return 'default';
    }
}

function generateDocument() {
    const jobs = window.workflowManager.getJobs().filter(j => 
        ['in-progress', 'documented', 'invoiced'].includes(j.status)
    );
    
    if (jobs.length === 0) {
        alert('❌ No jobs available for document generation!');
        return;
    }
    
    let jobList = 'Select Job for Document Generation:\n\n';
    jobs.forEach(job => {
        jobList += `• ${job.no} - ${job.customer} (${job.mode})\n`;
    });
    
    const selectedJob = prompt(jobList + '\nEnter Job Number:', jobs[0].no);
    
    if (selectedJob) {
        const job = jobs.find(j => j.no === selectedJob);
        if (job) {
            showDocumentTypeSelection(selectedJob);
        }
    }
}

function showDocumentTypeSelection(jobNo) {
    const templates = window.jobDocumentGenerator.documentTemplates;
    
    let typeList = 'Select Document Type:\n\n';
    Object.keys(templates).forEach(key => {
        typeList += `• ${key} - ${templates[key].name}\n`;
    });
    
    const selectedType = prompt(typeList + '\nEnter Document Type:', 'cf');
    
    if (selectedType && templates[selectedType]) {
        const customData = getCustomDocumentData(selectedType);
        
        const document = window.jobDocumentGenerator.generateDocument(jobNo, selectedType, customData);
        
        if (document) {
            loadJobDocumentsData();
            alert(`✅ Document Generated!\n\n📄 Document: ${document.typeName}\n🆔 ID: ${document.id}\n💼 Job: ${jobNo}`);
        }
    }
}

function getCustomDocumentData(documentType) {
    const customData = {};
    
    switch(documentType) {
        case 'cf':
            customData.port = prompt('Enter Port Name:', 'Karachi Port');
            customData.clearanceDate = prompt('Enter Clearance Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            break;
        case 'do':
            customData.consignee = prompt('Enter Consignee Name:');
            customData.releaseDate = prompt('Enter Release Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            break;
        case 'vessel':
            customData.vesselName = prompt('Enter Vessel/Flight Name:');
            customData.voyageNo = prompt('Enter Voyage/Flight Number:');
            customData.eta = prompt('Enter ETA (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            break;
    }
    
    return customData;
}

function viewDocument(documentId) {
    const documents = window.jobDocumentGenerator.getJobDocuments();
    const document = documents.find(d => d.id === documentId);
    
    if (!document) return;
    
    const content = document.content;
    
    let details = `📄 Document Details\n\n`;
    details += `🆔 Document ID: ${document.id}\n`;
    details += `📋 Type: ${document.typeName}\n`;
    details += `💼 Job: ${document.jobNo}\n`;
    details += `👤 Customer: ${content.job.customer}\n`;
    details += `📅 Generated: ${formatDate(document.createdAt)}\n`;
    details += `📊 Status: ${document.status.toUpperCase()}\n\n`;
    
    details += `🚢 Shipment Details:\n`;
    details += `• Origin: ${content.job.origin}\n`;
    details += `• Destination: ${content.job.destination}\n`;
    details += `• Mode: ${content.job.mode}\n`;
    details += `• Commodity: ${content.job.commodity}\n`;
    
    if (content.vessel) {
        details += `\n🚢 Vessel/Flight:\n`;
        details += `• Name: ${content.vessel.name}\n`;
        details += `• Voyage: ${content.vessel.voyage}\n`;
        details += `• ETA: ${content.vessel.eta}\n`;
    }
    
    alert(details);
}

function printDocument(documentId) {
    const document = window.jobDocumentGenerator.printDocument(documentId);
    
    if (document) {
        window.jobDocumentGenerator.updateDocumentStatus(documentId, 'printed');
        loadJobDocumentsData();
        
        alert(`🖨️ Document Sent to Printer!\n\n📄 Document: ${document.typeName}\n🆔 ID: ${document.id}`);
    }
}

function regenerateDocument(documentId) {
    const documents = window.jobDocumentGenerator.getJobDocuments();
    const document = documents.find(d => d.id === documentId);
    
    if (!document) return;
    
    const confirm = window.confirm(
        `🔄 Regenerate Document\n\n` +
        `📄 Document: ${document.typeName}\n` +
        `🆔 ID: ${document.id}\n\n` +
        `This will create a new version. Continue?`
    );
    
    if (confirm) {
        const customData = getCustomDocumentData(document.type);
        const newDocument = window.jobDocumentGenerator.generateDocument(document.jobNo, document.type, customData);
        
        if (newDocument) {
            loadJobDocumentsData();
            alert(`✅ Document Regenerated!\n\n📄 New Document ID: ${newDocument.id}\n💼 Job: ${document.jobNo}`);
        }
    }
}

function showTemplates() {
    const templates = window.jobDocumentGenerator.documentTemplates;
    
    let templateList = '📋 Available Document Templates:\n\n';
    Object.keys(templates).forEach(key => {
        const template = templates[key];
        templateList += `📄 ${template.name} (${key})\n`;
        templateList += `   Format: ${template.format}\n`;
        templateList += `   Fields: ${template.fields.join(', ')}\n\n`;
    });
    
    alert(templateList);
}

function filterDocuments() {
    loadJobDocumentsData();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN');
}