let clinicianData = null;

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function formatDate(dateString) {
  if (!dateString) return 'No date available';
  
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

async function loadClinicianData() {
  try {
    const clinicianId = getQueryParam('id');
    
    if (!clinicianId) {
      showError('No clinician ID provided');
      return;
    }

    document.getElementById('clinician-full-name').textContent = 'Loading...';
    
    const response = await fetch(`/api/clinicians/${clinicianId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch clinician: ${response.statusText}`);
    }
    
    clinicianData = await response.json();

    updateClinicianUI();

    updateUIBasedOnRole();
    
  } catch (error) {
    console.error('Error loading clinician:', error);
    showError(`Error loading clinician: ${error.message}`);
  }
}

function updateClinicianUI() {
  if (!clinicianData) return;

  const fullName = [clinicianData.first_name, clinicianData.middle_name, clinicianData.last_name]
    .filter(Boolean)
    .join(' ');
    
  document.getElementById('clinician-full-name').textContent = fullName;
  

  document.getElementById('clinician-status').textContent = clinicianData.status || 'Active';
  document.getElementById('clinician-specialization').textContent = clinicianData.specialization || 'Not specified';
  document.getElementById('clinician-next-appointment').textContent = 'No upcoming appointments'; 
  document.getElementById('clinician-license').textContent = clinicianData.license_no || 'Not provided';
  
 
  const emergencyContact = `In case of an emergency, please contact <strong>${clinicianData.em_first_name || ''} ${clinicianData.em_last_name || ''} (${clinicianData.em_relationship || 'Contact'}) ${clinicianData.em_contact_number || ''}</strong>`;
  document.getElementById('clinician-emergency-contact').innerHTML = emergencyContact;
  

  document.getElementById('clinician-first-name').textContent = clinicianData.first_name || 'Not provided';
  document.getElementById('clinician-middle-name').textContent = clinicianData.middle_name || 'Not provided';
  document.getElementById('clinician-last-name').textContent = clinicianData.last_name || 'Not provided';
  document.getElementById('clinician-age').textContent = clinicianData.age || 'Not provided';
  document.getElementById('clinician-birth-date').textContent = clinicianData.birth_date ? formatDate(clinicianData.birth_date) : 'Not provided';
  document.getElementById('clinician-contact-number').textContent = clinicianData.contact_number || 'Not provided';
  document.getElementById('clinician-citizenship').textContent = clinicianData.citizenship || 'Not provided';
  document.getElementById('clinician-address').textContent = clinicianData.address || 'Not provided';
  document.getElementById('clinician-role').textContent = clinicianData.staff_role || 'Not provided';
  document.getElementById('clinician-specialization-full').textContent = clinicianData.specialization || 'Not provided';
  document.getElementById('clinician-license-no').textContent = clinicianData.license_no || 'Not provided';
}

function updateUIBasedOnRole() {
  if (!clinicianData) return;
  
  const isDoctor = clinicianData.staff_role && 
                  (clinicianData.staff_role.toLowerCase() === 'doctor' || 
                   clinicianData.staff_role.toLowerCase().includes('doctor'));
  
  const doctorOnlyElements = document.querySelectorAll('.doctor-only-element');
  
  doctorOnlyElements.forEach(element => {
    if (isDoctor) {
      element.style.display = ''; 
    } else {
      element.style.display = 'none';
    }
  });
}

function showError(message) {
  console.error(message);
  document.getElementById('clinician-full-name').textContent = 'Error loading clinician';
  
  alert(`Error: ${message}`);
}


function initializeEventListeners() {

  document.getElementById('full-info-btn').addEventListener('click', function() {
  
    window.scrollTo({
      top: document.querySelector('.card-container').offsetTop,
      behavior: 'smooth'
    });
  });
  

  document.getElementById('last-appointments-btn').addEventListener('click', function() {
 
    const clinicianId = getQueryParam('id');
    if (clinicianId) {
      window.location.href = `/clinician/clinician-appointments?id=${clinicianId}`;
    }
  });

  document.getElementById('prescription-btn').addEventListener('click', function() {
    const clinicianId = getQueryParam('id');
    if (clinicianId) {
      window.location.href = `/clinician/clinician-prescription?id=${clinicianId}`;
    }
  });

  document.getElementById('supplement-btn').addEventListener('click', function() {
    const clinicianId = getQueryParam('id');
    if (clinicianId) {
      window.location.href = `/clinician/clinician-supplement?id=${clinicianId}`;
    }
  });
  
  document.getElementById('update-clinician-btn').addEventListener('click', function() {
    const clinicianId = getQueryParam('id');
    if (clinicianId) {
      window.location.href = `/clinician/clinician-update?id=${clinicianId}`;
    }
  });
  
  document.getElementById('delete-clinician-btn').addEventListener('click', function() {
    if (confirm('Are you sure you want to delete this clinician? This action cannot be undone.')) {
      deleteClinicianData();
    }
  });
  
  document.getElementById('set-appointment-btn').addEventListener('click', function() {
    const clinicianId = getQueryParam('id');
    if (clinicianId) {
      window.location.href = `/appointment-add?clinicianId=${clinicianId}`;
    }
  });
}

async function deleteClinicianData() {
  try {
    const clinicianId = getQueryParam('id');
    
    if (!clinicianId) {
      showError('No clinician ID provided');
      return;
    }
    
    const response = await fetch(`/api/clinicians/${clinicianId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete clinician: ${response.statusText}`);
    }

    alert('Clinician deleted successfully');
    window.location.href = '/clinician-list';
    
  } catch (error) {
    console.error('Error deleting clinician:', error);
    showError(`Error deleting clinician: ${error.message}`);
  }
}


document.addEventListener('DOMContentLoaded', function() {
  loadClinicianData();
  initializeEventListeners();
  
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      loadClinicianData();
    }
  });
});