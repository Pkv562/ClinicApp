let allPatients = [];
let filteredPatients = [];

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

async function loadPatients() {
  try {
    const response = await fetch('/api/patients');
    
    if (!response.ok) {
      throw new Error('Failed to fetch patients');
    }
    
    allPatients = await response.json();
    filteredPatients = [...allPatients];
  
    sortPatients('name_asc');
    
    displayPatients();
  } catch (error) {
    console.error('Error loading patients:', error);
    document.getElementById('patientTableBody').innerHTML = 
      `<tr><td colspan="7">Error loading patients: ${error.message}</td></tr>`;
  }
}

function displayPatients() {
  const tableBody = document.getElementById('patientTableBody');
  tableBody.innerHTML = '';
  
  if (filteredPatients.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7">No patients found</td></tr>';
    return;
  }
  
  filteredPatients.forEach(patient => {
    const fullName = [patient.first_name, patient.middle_name, patient.last_name]
      .filter(Boolean)
      .join(' ');
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox" data-id="${patient.id}" aria-label="Select ${fullName}"></td>
      <td>${fullName}</td>
      <td>${patient.status || 'Unknown'}</td>
      <td>${formatDate(patient.last_appointment)}</td>
      <td>${patient.contact_number || 'Not provided'}</td>
      <td>${patient.address || 'Not provided'}</td>
      <td>
        <button type="button" class="primary-button view-patient" data-id="${patient.id}">
          View
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
  
  document.querySelectorAll('.view-patient').forEach(button => {
    button.addEventListener('click', function() {
      const patientId = this.getAttribute('data-id');
      window.location.href = `/patients/patient-view?id=${patientId}`;
    });
  });
}

function sortPatients(criteria) {
  switch(criteria) {
    case 'name_asc':
      filteredPatients.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      break;
    case 'name_desc':
      filteredPatients.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameB.localeCompare(nameA);
      });
      break;
    case 'appointment_desc':
      filteredPatients.sort((a, b) => {
        const dateA = a.last_appointment ? new Date(a.last_appointment) : new Date(0);
        const dateB = b.last_appointment ? new Date(b.last_appointment) : new Date(0);
        return dateB - dateA;
      });
      break;
    case 'status':
      filteredPatients.sort((a, b) => {
        return (a.status || '').localeCompare(b.status || '');
      });
      break;
  }
  
  displayPatients();
}

function searchPatients(query) {
  if (!query) {
    filteredPatients = [...allPatients];
  } else {
    query = query.toLowerCase();
    filteredPatients = allPatients.filter(patient => {
      const fullName = `${patient.first_name} ${patient.middle_name || ''} ${patient.last_name}`.toLowerCase();
      const contact = (patient.contact_number || '').toLowerCase();
      const address = (patient.address || '').toLowerCase();
      
      return fullName.includes(query) || 
             contact.includes(query) || 
             address.includes(query);
    });
  }
  
  sortPatients(document.getElementById('filter').value);
}

document.addEventListener('DOMContentLoaded', function() {
  loadPatients();
  
  const searchInput = document.getElementById('patientSearch');
  searchInput.addEventListener('input', function() {
    searchPatients(this.value);
  });
  
  document.getElementById('filter').addEventListener('change', function() {
    sortPatients(this.value);
  });
  
  document.getElementById('selectAllPatients').addEventListener('change', function() {
    const allCheckboxes = document.querySelectorAll('#patientTableBody input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = this.checked;
    });
  });
});