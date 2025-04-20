const urlParams = new URLSearchParams(window.location.search);
const recordId = urlParams.get('id');
let selectedFile = null;

function toNullable(value) {
  return value && value.trim() !== '' ? value : null;
}

document.addEventListener('DOMContentLoaded', function() {
  if (!recordId) {
    console.error('No record ID found in URL');
    
    const patientId = urlParams.get('patientId');
    if (patientId) {
      console.log('Patient ID found, redirecting to patient record page');
      window.location.href = `/patients/patient-record?id=${patientId}`;
      return;
    }
    
    alert('Record ID is missing from the URL. Please try again.');
    setTimeout(() => {
      window.location.href = '/patient-list';
    }, 2000);
    return;
  }

  const addFileButton = document.getElementById('addLabBtn');
  const fileInput = document.getElementById('labFileInput');
  const filePreview = document.getElementById('filePreview');
  const fileName = document.getElementById('fileName');
  const removeFileButton = document.getElementById('removeFile');

  if (addFileButton) {
    addFileButton.addEventListener('click', () => fileInput.click());
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        fileName.textContent = selectedFile.name;
        filePreview.style.display = 'block';
      }
    });
  }

  if (removeFileButton) {
    removeFileButton.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      filePreview.style.display = 'none';
    });
  }
  
  console.log('Fetching laboratory record ID:', recordId);
  fetchLabRecord();
  
  const updateButton = document.querySelector('.nav-page-header .primary-button:last-child');
  updateButton.addEventListener('click', handleFormSubmit);
  
  const cancelButton = document.querySelector('.nav-page-header .primary-button:first-child');
  cancelButton.addEventListener('click', function() {
    window.history.back();
  });
});

async function fetchLabRecord() {
  try {
    console.log(`Fetching from: /api/laboratory/${recordId}`);
    
    const response = await fetch(`/api/laboratory/${recordId}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response not OK:', response.status, errorText);
      throw new Error(`Failed to fetch laboratory record: ${response.status}`);
    }
    
    const labRecord = await response.json();
    console.log('Fetched lab record:', labRecord);
    fillFormWithData(labRecord);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load laboratory record. Please try again.');
  }
}

function fillFormWithData(record) {
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  document.getElementById('firstName').value = record.lab_type || '';
  document.getElementById('birthDate').value = formatDateForInput(record.lab_date);
  document.getElementById('lastName').value = record.company || '';

  const dateInputs = document.querySelectorAll('.date-input-w input[type="date"]');
  if (dateInputs.length >= 3) {
    dateInputs[0].value = formatDateForInput(record.ordered_date);
    dateInputs[1].value = formatDateForInput(record.received_date);
    dateInputs[2].value = formatDateForInput(record.reported_date);
  } else {
    console.error('Could not find all date input fields');
  }

  const doctorInput = document.querySelector('.form-row:nth-child(3) input');
  const remarksInput = document.querySelector('.form-row:nth-child(4) input');
  const impressionInput = document.querySelector('.form-row:nth-child(5) input');
  const recommendationInput = document.getElementById('note');
  const notesInput = document.querySelector('.form-row:nth-child(7) input');
  
  if (doctorInput) doctorInput.value = record.doctor || '';
  if (remarksInput) remarksInput.value = record.remarks || '';
  if (impressionInput) impressionInput.value = record.impression || '';
  if (recommendationInput) recommendationInput.value = record.recommendation || '';
  if (notesInput) notesInput.value = record.notes || '';
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const submitButton = document.getElementById('labFileInput');
  if (submitButton) submitButton.disabled = true;

  const labType = document.getElementById('firstName').value.trim();
  const labDate = document.getElementById('birthDate').value;
  const company = document.getElementById('lastName').value.trim();

  if (!labType) {
    alert('Please enter a laboratory test type.');
    if (submitButton) submitButton.disabled = false;
    return;
  }
  
  if (!labDate) {
    alert('Please enter a laboratory date.');
    if (submitButton) submitButton.disabled = false;
    return;
  }

  const dateInputs = document.querySelectorAll('.date-input-w input[type="date"]');
  const orderedDate = dateInputs[0]?.value || null;
  const receivedDate = dateInputs[1]?.value || null;
  const reportedDate = dateInputs[2]?.value || null;

  const doctorInput = document.querySelector('.form-row:nth-child(3) input');
  const remarksInput = document.querySelector('.form-row:nth-child(4) input');
  const impressionInput = document.querySelector('.form-row:nth-child(5) input');
  const recommendationInput = document.getElementById('note');
  const notesInput = document.querySelector('.form-row:nth-child(7) input');

  const doctor = doctorInput?.value.trim() || '';
  const remarks = remarksInput?.value.trim() || '';
  const impression = impressionInput?.value.trim() || '';
  const recommendation = recommendationInput?.value.trim() || '';
  const notes = notesInput?.value.trim() || '';

  try {
    console.log(`Sending update to: /api/laboratory/${recordId}`);
    
    let response;
    
    if (selectedFile) {
      const formData = new FormData();
      formData.append('lab_type', labType);
      formData.append('company', company);
      formData.append('lab_date', labDate);
      formData.append('ordered_date', orderedDate || '');
      formData.append('received_date', receivedDate || '');
      formData.append('reported_date', reportedDate || '');
      formData.append('doctor', doctor);
      formData.append('remarks', remarks);
      formData.append('impression', impression);
      formData.append('recommendation', recommendation);
      formData.append('notes', notes);
      formData.append('lab_file', selectedFile);
      
      response = await fetch(`/api/laboratory/${recordId}`, {
        method: 'PUT',
        body: formData
      });
    } else {
      response = await fetch(`/api/laboratory/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lab_type: labType,
          company,
          lab_date: labDate,
          ordered_date: orderedDate || null,
          received_date: receivedDate || null,
          reported_date: reportedDate || null,
          doctor,
          remarks,
          impression,
          recommendation,
          notes
        })
      });
    }
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Update failed:', response.status, errorData);
      throw new Error(`Failed to update laboratory record: ${response.status}`);
    }
    
    alert('Laboratory record updated successfully!');
    
    try {
      const labResponse = await fetch(`/api/laboratory/${recordId}`);
      const labRecord = await labResponse.json();
      if (labRecord.patient_id) {
        window.location.href = `/patients/patient-record?id=${labRecord.patient_id}`;
      } else {

        window.location.href = `/patients/record-summary?id=${recordId}`;
      }
    } catch (error) {
      window.location.href = `/patients/record-summary?id=${recordId}`;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to update laboratory record. Please try again.');
    if (submitButton) submitButton.disabled = false;
  }
}