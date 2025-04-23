let allClinicians = [];
let filteredClinicians = [];

function formatDate(dateString) {
  if (!dateString) return 'No appointments';
  
  const date = new Date(dateString);
  const today = new Date();
  
  const formattedDate = date.toLocaleDateString();
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  
  return `${formattedDate} at ${formattedHours}:${formattedMinutes}${ampm}`;
}

async function loadClinicians() {
  try {
    document.getElementById('patientTableBody').innerHTML = 
      '<tr><td colspan="7">Loading clinicians...</td></tr>';
    
    const response = await fetch('/api/clinicians');
    
    if (!response.ok) {
      throw new Error('Failed to fetch clinicians');
    }
    
    allClinicians = await response.json();
    applyRoleFilter();
    
  } catch (error) {
    console.error('Error loading clinicians:', error);
    document.getElementById('patientTableBody').innerHTML = 
      `<tr><td colspan="7">Error loading clinicians: ${error.message}</td></tr>`;
  }
}

function applyRoleFilter() {
  const filterValue = document.getElementById('roleFilter').value.toLowerCase();
  
  if (filterValue === 'all') {
    filteredClinicians = [...allClinicians];
  } else {
    filteredClinicians = allClinicians.filter(clinician => {
      const role = (clinician.staff_role || '').toLowerCase();
      return role.includes(filterValue);
    });
  }
  
  sortClinicians('name_asc'); 
}

function displayClinicians() {
  const tableBody = document.getElementById('patientTableBody');
  tableBody.innerHTML = '';
  
  if (filteredClinicians.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7">No clinicians found matching the selected filter</td></tr>';
    return;
  }
  
  filteredClinicians.forEach(async (clinician) => {
    const fullName = [clinician.first_name, clinician.middle_name, clinician.last_name]
      .filter(Boolean)
      .join(' ');
    
    const roleClass = getRoleClass(clinician.staff_role);
    
    const row = document.createElement('tr');
    row.className = roleClass;
    
    let nextAppointment = 'No appointments scheduled';
    
    row.innerHTML = `
      <td><input type="checkbox" data-id="${clinician.id}" aria-label="Select ${fullName}"></td>
      <td>${fullName}</td>
      <td>${clinician.staff_role || 'Unknown'}</td>
      <td>${nextAppointment}</td>
      <td>${clinician.contact_number || 'Not provided'}</td>
      <td>${clinician.address || 'Not provided'}</td>
      <td>
        <button type="button" class="primary-button view-clinician" data-id="${clinician.id}">
          View
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
  
  attachViewButtonListeners();
}

function attachViewButtonListeners() {
  document.querySelectorAll('.view-clinician').forEach(button => {
    button.addEventListener('click', function() {
      const clinicianId = this.getAttribute('data-id');
      window.location.href = `/clinician/clinician-view?id=${clinicianId}`;
    });
  });
}


function getRoleClass(role) {
  if (!role) return '';
  
  const roleLower = role.toLowerCase();
  if (roleLower.includes('doctor')) {
    return 'doctor-row';
  } else if (roleLower.includes('midwife')) {
    return 'midwife-row';
  } else if (roleLower.includes('nurse')) {
    return 'nurse-row';
  }
  
  return '';
}

function sortClinicians(criteria) {
  switch(criteria) {
    case 'name_asc':
      filteredClinicians.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      break;
    case 'name_desc':
      filteredClinicians.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameB.localeCompare(nameA);
      });
      break;
    case 'role':
      filteredClinicians.sort((a, b) => {
        return (a.staff_role || '').localeCompare(b.staff_role || '');
      });
      break;
    case 'role_desc':
      filteredClinicians.sort((a, b) => {
        return (b.staff_role || '').localeCompare(a.staff_role || '');
      });
      break;
  }
  
  displayClinicians();
}

function searchClinicians(query) {
  if (!query) {
    filteredClinicians = [...allClinicians];
  } else {
    query = query.toLowerCase();
    filteredClinicians = allClinicians.filter(clinician => {
      const fullName = `${clinician.first_name} ${clinician.middle_name || ''} ${clinician.last_name}`.toLowerCase();
      const contact = (clinician.contact_number || '').toLowerCase();
      const address = (clinician.address || '').toLowerCase();
      const role = (clinician.staff_role || '').toLowerCase();
      const specialization = (clinician.specialization || '').toLowerCase();
      
      return fullName.includes(query) || 
             contact.includes(query) || 
             address.includes(query) ||
             role.includes(query) ||
             specialization.includes(query);
    });
  }
  
  sortClinicians(document.getElementById('filter').value || 'name_asc');
}

document.addEventListener('DOMContentLoaded', function() {

  loadClinicians();

  const searchInput = document.getElementById('patientSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchClinicians(this.value);
    });
  }

  const filterElement = document.getElementById('filter');
  if (filterElement) {
    filterElement.addEventListener('change', function() {
      sortClinicians(this.value);
    });
  }

  const roleFilterElement = document.getElementById('roleFilter');
  if (roleFilterElement) {
    roleFilterElement.addEventListener('change', function() {
      applyRoleFilter();
    });
  }

  const selectAllCheckbox = document.getElementById('selectAllPatients');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
      const allCheckboxes = document.querySelectorAll('#patientTableBody input[type="checkbox"]');
      allCheckboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
    });
  }

  const refreshButton = document.getElementById('refreshClinicianList');
  if (refreshButton) {
    refreshButton.addEventListener('click', loadClinicians);
  }

  const addClinicianButton = document.getElementById('addClinicianButton');
  if (addClinicianButton) {
    addClinicianButton.addEventListener('click', function() {
      window.location.href = '/clinician/clinician-add';
    });
  }

  const addPatientButton = document.getElementById("addClinicianBtn");
  if(addPatientButton) {
      addPatientButton.addEventListener('click', function() {
          window.location.href = `/clinician/clinician-add`;
      });
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      loadClinicians();
    }
  });
});