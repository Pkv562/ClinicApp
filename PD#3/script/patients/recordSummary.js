const urlParams = new URLSearchParams(window.location.search);
const recordId = urlParams.get('id');
let patientId = null;

async function previewFile(labId) {
  try {
    const response = await fetch(`/api/laboratory/${labId}`);
    const data = await response.json();

    console.log('Raw preview data:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch lab record');
    }

    const filePath = data.file_path;
    console.log('file_path value:', filePath);

    if (typeof filePath !== 'string' || filePath.trim() === '') {
      alert('No file attached to this record.');
      return;
    }

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const content = document.createElement('div');
    content.style.backgroundColor = 'white';
    content.style.padding = '20px';
    content.style.borderRadius = '8px';
    content.style.maxWidth = '90%';
    content.style.maxHeight = '90%';
    content.style.overflow = 'auto';
    content.style.position = 'relative';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => document.body.removeChild(modal);

    content.appendChild(closeBtn);

    const fileExt = filePath.split('.').pop().toLowerCase();

    if (['pdf'].includes(fileExt)) {
      const iframe = document.createElement('iframe');
      iframe.src = filePath;
      iframe.style.width = '800px';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      content.appendChild(iframe);
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
      const img = document.createElement('img');
      img.src = filePath;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '80vh';
      content.appendChild(img);
    } else {
      const message = document.createElement('p');
      message.textContent = `Unsupported file type: ${fileExt}`;
      content.appendChild(message);
    }

    modal.appendChild(content);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

  } catch (error) {
    console.error('Error previewing file:', error);
    // alert('Could not preview file: ' + error.message);
  }
}



document.addEventListener('DOMContentLoaded', function() {
  if (!recordId) {
    console.error('No record ID found in URL');
    alert('Record ID is missing from the URL. Please try again.');
    setTimeout(() => {
      window.location.href = '/patient-list';
    }, 2000);
    return;
  }
  
  fetchLabRecord();
  
  setupButtons();
});

async function fetchLabRecord() {
  try {
    const response = await fetch(`/api/laboratory/${recordId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch laboratory record');
    }
    
    const labRecord = await response.json();
    console.log('Fetched lab record:', labRecord);
    
    patientId = labRecord.patient_id;

    displayLabRecord(labRecord);
  } catch (error) {
    console.error('Error:', error);
    alert(`Failed to load laboratory record: ${error.message}`);
  }
}

function displayLabRecord(record) {

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  document.getElementById('labType').textContent = record.lab_type || 'N/A';
  document.getElementById('labDate').textContent = formatDate(record.lab_date);
  document.getElementById('company').textContent = record.company || 'N/A';
  document.getElementById('orderedDate').textContent = formatDate(record.ordered_date);
  document.getElementById('receivedDate').textContent = formatDate(record.received_date);
  document.getElementById('reportedDate').textContent = formatDate(record.reported_date);
  document.getElementById('doctor').textContent = record.doctor || 'N/A';
  document.getElementById('remarks').textContent = record.remarks || 'N/A';
  document.getElementById('impression').textContent = record.impression || 'N/A';
  document.getElementById('recommendation').textContent = record.recommendation || 'N/A';
  document.getElementById('notes').textContent = record.notes || 'N/A';
}

function setupButtons() {

  const updateButton = document.getElementById('updateRecordBtn');
  if (updateButton) {
    updateButton.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = `/patients/record-update?id=${recordId}`;
    });
  }

  const previewButton = document.getElementById('previewFileBtn');
  if (previewButton) {
    previewButton.addEventListener('click', function(e) {
      e.preventDefault();
      previewFile(recordId);
    });
  }

  const closeButton = document.getElementById('CloseRecordBtn');
  if (closeButton) {
    closeButton.addEventListener('click', function(e) {
      e.preventDefault();
      if (patientId) {
        window.location.href = `/patients/patient-record?id=${patientId}`;
      } else {
        window.history.back();
      }
    });
  }
}

const cancelButton = document.getElementById("CloseRecordBtn");
if(cancelButton) {
    cancelButton.addEventListener('click', function() {
        console.log("Cancel button clicked\n");
        window.location.href = `/patients/record-summary?id=${patientId}`;
    });
}

const updateButton = document.getElementById("updateRecordBtn");
if(updateButton) {
    updateButton.addEventListener('click', function() {
        console.log("Cancel button clicked\n");
        window.location.href = `/patients/record-update?id=${patientId}`;
    });
}