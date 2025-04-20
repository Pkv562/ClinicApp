let patientId;
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  patientId = urlParams.get('id');
  if (!patientId) {
    alert('No patient ID provided');
    window.location.href = '/patient-list';
    return;
  }

  const addFileButton = document.getElementById('addLabFile');
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

  const addButton = document.getElementById('addLabRecord');
  if (addButton) {
    addButton.addEventListener('click', handleFormSubmit);
  }
  
  const cancelButton = document.querySelector('.nav-page-header .primary-button:first-child');
  if (cancelButton) {
    cancelButton.addEventListener('click', function() {
      window.location.href = `/patients/patient-record?id=${patientId}`;
    });
  }
});

async function handleFormSubmit(e) {
  e.preventDefault();

  const submitButton = document.getElementById('addLabRecord');
  if (submitButton) submitButton.disabled = true;

  const labType = document.getElementById('labType')?.value.trim();
  const labDate = document.getElementById('labDate')?.value;
  const company = document.getElementById('company')?.value.trim();
  const orderedDate = document.getElementById('orderedDate')?.value;
  const receivedDate = document.getElementById('receivedDate')?.value;
  const reportedDate = document.getElementById('reportedDate')?.value;
  const doctor = document.getElementById('doctor')?.value.trim();
  const remarks = document.getElementById('remarks')?.value.trim();
  const impression = document.getElementById('impression')?.value.trim();
  const recommendation = document.getElementById('recommendation')?.value.trim();
  const notes = document.getElementById('notes')?.value.trim();

  if (!labType) {
    alert('Please enter a laboratory test type.');
    return;
  }

  if (!labDate) {
    alert('Please select a laboratory date.');
    return;
  }

  try {
    const formData = new FormData();

    formData.append('patient_id', patientId);
    formData.append('lab_type', labType);
    formData.append('lab_date', labDate);

    if (company) formData.append('company', company);
    if (orderedDate) formData.append('ordered_date', orderedDate);
    if (receivedDate) formData.append('received_date', receivedDate);
    if (reportedDate) formData.append('reported_date', reportedDate);
    if (doctor) formData.append('doctor', doctor);
    if (remarks) formData.append('remarks', remarks);
    if (impression) formData.append('impression', impression);
    if (recommendation) formData.append('recommendation', recommendation);
    if (notes) formData.append('notes', notes);

    if (selectedFile) {
      formData.append('lab_file', selectedFile);
    }

    const response = await fetch(`/api/patients/${patientId}/laboratory`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Server responded with:', result);
      throw new Error(result.message || 'Failed to add laboratory record');
    }

    window.location.href = `/patients/patient-record?id=${patientId}`;
  } catch (error) {
    console.error('Error:', error);
    alert(`Failed to add laboratory record: ${error.message}`);
    if (submitButton) submitButton.disabled = false;
  }
}
