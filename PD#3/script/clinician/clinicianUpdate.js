let clinicianData = null;

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}


function formatDateForInput(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

async function loadClinicianData() {
  try {
    const clinicianId = getQueryParam('id');
    
    if (!clinicianId) {
      showError('No clinician ID provided');
      return;
    }
    
    const response = await fetch(`/api/clinicians/${clinicianId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch clinician: ${response.statusText}`);
    }
    
    clinicianData = await response.json();
    
    populateFormFields();
    
  } catch (error) {
    console.error('Error loading clinician:', error);
    showError(`Error loading clinician: ${error.message}`);
  }
}

function populateFormFields() {
  if (!clinicianData) return;
  

  document.getElementById('firstName').value = clinicianData.first_name || '';
  document.getElementById('middleName').value = clinicianData.middle_name || '';
  document.getElementById('lastName').value = clinicianData.last_name || '';
  document.getElementById('age').value = clinicianData.age || '';
  document.getElementById('birthDate').value = formatDateForInput(clinicianData.birth_date);
  document.getElementById('contactNumber').value = clinicianData.contact_number || '';
  document.getElementById('citizenship').value = clinicianData.citizenship || '';
  document.getElementById('address').value = clinicianData.address || '';
  

  const roleSelect = document.getElementById('filter');
  if (roleSelect) {

    const roleValue = clinicianData.staff_role?.toLowerCase() || '';
    
    for (let i = 0; i < roleSelect.options.length; i++) {
      if (roleSelect.options[i].value.toLowerCase() === roleValue || 
          roleSelect.options[i].text.toLowerCase() === roleValue) {
        roleSelect.selectedIndex = i;
        break;
      }
    }
  }
  

  const specializationInput = document.querySelector('input[placeholder="Enter Age"]');
  if (specializationInput) {
    specializationInput.value = clinicianData.specialization || '';
  }
  
  const licenseInput = document.querySelector('input[placeholder="Enter Contact Number"]');
  if (licenseInput && licenseInput !== document.getElementById('contactNumber')) {
    licenseInput.value = clinicianData.license_no || '';
  }

  const emergencyInputs = document.querySelectorAll('main:nth-of-type(3) input');
  if (emergencyInputs.length >= 5) {
    emergencyInputs[0].value = clinicianData.em_first_name || '';
    emergencyInputs[1].value = clinicianData.em_middle_name || '';
    emergencyInputs[2].value = clinicianData.em_last_name || '';
    emergencyInputs[3].value = clinicianData.em_relationship || '';
    emergencyInputs[4].value = clinicianData.em_contact_number || '';
  }
}


function showError(message) {
  console.error(message);
  alert(`Error: ${message}`);
}

async function updateClinician(event) {
  event.preventDefault();
  
  try {
    const clinicianId = getQueryParam('id');
    
    if (!clinicianId) {
      showError('No clinician ID provided');
      return;
    }

    const formData = {
      firstName: document.getElementById('firstName').value,
      middleName: document.getElementById('middleName').value,
      lastName: document.getElementById('lastName').value,
      age: document.getElementById('age').value,
      birthDate: document.getElementById('birthDate').value,
      contactNumber: document.getElementById('contactNumber').value,
      citizenship: document.getElementById('citizenship').value,
      address: document.getElementById('address').value,
      staffRole: document.getElementById('filter').value,
      specialization: document.querySelector('input[placeholder="Enter Age"]').value,
      licenseNo: document.querySelector('input[placeholder="Enter Contact Number"]:not(#contactNumber)').value,
      emFirstName: document.querySelectorAll('main:nth-of-type(3) input')[0].value,
      emMiddleName: document.querySelectorAll('main:nth-of-type(3) input')[1].value,
      emLastName: document.querySelectorAll('main:nth-of-type(3) input')[2].value,
      emRelationship: document.querySelectorAll('main:nth-of-type(3) input')[3].value,
      emContactNumber: document.querySelectorAll('main:nth-of-type(3) input')[4].value
    };
    
    const response = await fetch(`/api/clinicians/${clinicianId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update clinician: ${response.statusText}`);
    }
    
    alert('Clinician updated successfully');
    

    window.location.href = `/clinician/clinician-view?id=${clinicianId}`;
    
  } catch (error) {
    console.error('Error updating clinician:', error);
    showError(`Error updating clinician: ${error.message}`);
  }
}

function initializeEventListeners() {

  const updateButton = document.querySelector('button.primary-button:nth-of-type(2)');
  if (updateButton) {
    updateButton.addEventListener('click', updateClinician);
  }
  

  const cancelButton = document.querySelector('button.primary-button:nth-of-type(1)');
  if (cancelButton) {
    cancelButton.addEventListener('click', function() {
      const clinicianId = getQueryParam('id');
      if (clinicianId) {
        window.location.href = `/clinician/clinician-view?id=${clinicianId}`;
      } else {
        window.location.href = '/clinician-list';
      }
    });
  }
  

  document.querySelector('a[href="#home-dashboard"]').href = '/';
  document.querySelector('a[href="#appointment-list"]').href = '/appointment-list';
  document.querySelector('a[href="#patient-list"]').href = '/patient-list';
  document.querySelector('a[href="#clinician-list"]').href = '/clinician-list';
}

document.addEventListener('DOMContentLoaded', function() {
  loadClinicianData();
  initializeEventListeners();
});