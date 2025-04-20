const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', function() {
  fetchLabRecords();
  loadPrescriptions();
});

async function loadPrescriptions() {
  currentPatientId = getPatientIdFromUrl();
  
  if (!currentPatientId) {
      alert('No patient ID provided');
      window.location.href = '/patient-list';
      return;
  }

  function displayPatientData(patient) {
    const avatarImg = document.querySelector('.patient-avatar');
    if (avatarImg) {
      if (patient.profile_photo_path) {
        const filename = patient.profile_photo_path.split('/').pop();
        console.log("Original filename:", filename);

        const photoPath = `/files/patients/profilePictures/${filename}`;
        console.log("Trying path:", photoPath);
        
        avatarImg.src = photoPath;
        avatarImg.alt = `${patient.first_name} ${patient.last_name}`;

        avatarImg.onerror = function() {
          console.error("Failed to load image from:", this.src);
          this.src = '/patients/profilePictures/default-avatar.png';

          this.onerror = function() {
            console.error("Failed to load default image as well");
            this.style.display = 'none';
          };
        };
      } else {
        avatarImg.src = '/patients/profilePictures/default-avatar.png';
        avatarImg.alt = 'Default avatar';
        
        avatarImg.onerror = function() {
          console.error("Failed to load default image:", this.src);
          this.style.display = 'none';
        };
      }
    }
}

  try {
      const patientResponse = await fetch(`/api/patients/${currentPatientId}`);
      if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          displayPatientData(patientData);  
          const fullNameElement = document.querySelector('.overview-header h1');
          if (fullNameElement) {
              fullNameElement.textContent = `${patientData.first_name} ${patientData.middle_name || ''} ${patientData.last_name}`.trim();
          }

          const emergencyContactElement = document.querySelector('.alert-content strong');
          if (emergencyContactElement && patientData.ec_first_name) {
              emergencyContactElement.textContent = `${patientData.ec_first_name} ${patientData.ec_last_name} (${patientData.ec_relationship}) ${patientData.ec_contact_number}`;
          }
      }
      
  } catch (error) {
      console.error('Error loading patient info:', error);
      alert('Failed to load patient info');
  }
}

async function fetchLabRecords() {
  try {
    const response = await fetch(`/api/patients/${patientId}/laboratory`);
    if (!response.ok) {
      throw new Error('Failed to fetch laboratory records');
    }
    
    const labRecords = await response.json();
    displayLabRecords(labRecords);
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayLabRecords(records) {
  const formSection = document.querySelector('.form-section');

  formSection.innerHTML = '';
  
  if (records.length === 0) {
    formSection.innerHTML = '<p class="no-records">No laboratory records found.</p>';
    return;
  }
  
  const table = document.createElement('table');
  table.className = 'records-table';
  
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Type</th>
      <th>Company</th>
      <th>Doctor</th>
      <th>Ordered Date</th>
      <th>Received Date</th>
      <th>Actions</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  
  records.forEach(record => {
    const tr = document.createElement('tr');
    
    const orderedDate = record.ordered_date ? new Date(record.ordered_date).toLocaleDateString() : 'N/A';
    const receivedDate = record.received_date ? new Date(record.received_date).toLocaleDateString() : 'N/A';
    
    tr.innerHTML = `
      <td>${record.lab_type || 'N/A'}</td>
      <td>${record.company || 'N/A'}</td>
      <td>${record.doctor || 'N/A'}</td>
      <td>${orderedDate}</td>
      <td>${receivedDate}</td>
      <td class="action-btns">
        <button class="view-btn" data-id="${record.id}">View</button>
        <button class="edit-btn" data-id="${record.id}">Edit</button>
        <button class="delete-btn" data-id="${record.id}">Delete</button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  formSection.appendChild(table);
  
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const recordId = this.getAttribute('data-id');
      window.location.href = `/patients/record-summary?id=${recordId}`;
    });
  });
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const recordId = this.getAttribute('data-id');
      window.location.href = `/patients/record-update?id=${recordId}`;
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      if (confirm('Are you sure you want to delete this record?')) {
        const recordId = this.getAttribute('data-id');
        try {
          const response = await fetch(`/api/laboratory/${recordId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete record');
          }
          
          fetchLabRecords();
        } catch (error) {
          console.error('Error:', error);
          alert('Failed to delete record. Please try again.');
        }
      }
    });
  });
}

const style = document.createElement('style');
style.textContent = `
  .records-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  .records-table th, .records-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  .records-table th {
    background-color: #f5f5f5;
    font-weight: 600;
  }
  
  .records-table tr:hover {
    background-color: #f9f9f9;
  }
  
  .action-btns {
    display: flex;
    gap: 8px;
  }
  
  .view-btn, .edit-btn, .delete-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid var(--card-stroke);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--secondary-color);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }
  
  .view-btn {
    background-color: white;
    color: black;
  }
  
  .edit-btn {
    background-color: white;
    color: black;
  }
  
  .delete-btn {
    background-color: white;
    color: black;
  }
  
  .no-records {
    text-align: center;
    padding: 20px;
    color: #666;
  }
`;

document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {

  const deletePatientBtn = document.getElementById('deletePatientBtn');
  
  if (deletePatientBtn) {
      deletePatientBtn.addEventListener('click', function() {
      
          const urlParams = new URLSearchParams(window.location.search);
          const patientId = urlParams.get('id');
          
          if (!patientId) {
              alert('Patient ID not found');
              return;
          }
          
      
          if (confirm('Are you sure you want to delete this patient? This will delete ALL patient data including medical records, prescriptions, and other information. This action cannot be undone.')) {
          
              fetch(`/api/patients/${patientId}`, {
                  method: 'DELETE',
                  headers: {
                      'Content-Type': 'application/json'
                  }
              })
              .then(response => {
                  if (!response.ok) {
                      throw new Error('Failed to delete patient');
                  }
                  return response.json();
              })
              .then(data => {
                  alert('Patient deleted successfully');
             
                  window.location.href = '/patient-list';
              })
              .catch(error => {
                  console.error('Error:', error);
                  alert('Error deleting patient: ' + error.message);
              });
          }
      });
  }
});

function getPatientIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

const InfoButton = document.getElementById("full-info");
if(InfoButton) {
    InfoButton.addEventListener('click', function() {
        console.log("Cancel button clicked\n");
        window.location.href = `/patients/patient-view?id=${patientId}`;
    });
}

const PrescriptionButton = document.getElementById("prescription-btn");
if(PrescriptionButton) {
    PrescriptionButton.addEventListener('click', function() {
        window.location.href = `/patients/patient-prescription?id=${patientId}`;
    });
}

const SupplementButton = document.getElementById("supplement-btn");
if(SupplementButton) {
    SupplementButton.addEventListener('click', function() {
        window.location.href = `/patients/patient-supplement?id=${patientId}`;
    });
}

const LaboratoryButton = document.getElementById("laboratory-btn");
if(LaboratoryButton) {
    LaboratoryButton.addEventListener('click', function() {
        window.location.href = `/patients/patient-record?id=${patientId}`;
    });
}

const addLabButton = document.getElementById("addRecordBtn");
if(addLabButton) {
    addLabButton.addEventListener('click', function() {
        window.location.href = `/patients/record-add?id=${patientId}`;
    });
}


