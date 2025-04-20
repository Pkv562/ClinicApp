document.addEventListener('DOMContentLoaded', async () => {
    let currentPatientId;
    let prescriptions = [];
    let doctors = []; // Add this line to store the doctors

    function getPatientIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    function formatDate(dateString) {
        if (!dateString) return '--/--/----';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }


    async function loadDoctors() {
        try {
            const response = await fetch('/api/doctors');
            if (!response.ok) {
                throw new Error('Failed to fetch doctors');
            }
            
            doctors = await response.json();
            const selectElement = document.getElementById('prescribedBy');
            
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
    
            doctors.forEach((doctor) => {
                const option = document.createElement('option');
                option.value = doctor.id; 
                option.textContent = `Dr. ${doctor.first_name} ${doctor.middle_name || ''} ${doctor.last_name}`.trim(); 
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }
    
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
            
            const response = await fetch(`/api/patients/${currentPatientId}/prescriptions`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch prescriptions');
            }
            
            prescriptions = await response.json();
            updatePrescriptionsTable();
            
        } catch (error) {
            console.error('Error loading prescriptions:', error);
            alert('Failed to load prescriptions');
        }
    }

    function updatePrescriptionsTable() {
        const tbody = document.querySelector('.patient-list-table tbody');
        tbody.innerHTML = '';
        
        if (prescriptions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10">No prescriptions found</td>
                </tr>
            `;
            return;
        }
        
        prescriptions.forEach((prescription) => {
            let doctorName = prescription.prescribed_by || '--';
            
            if (!isNaN(prescription.prescribed_by)) {
                const doctor = doctors.find(d => d.id === parseInt(prescription.prescribed_by));
                if (doctor) {
                    doctorName = `${doctor.first_name} ${doctor.middle_name || ''} ${doctor.last_name}`.trim();
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" data-id="${prescription.id}"></td>
                <td>${prescription.prescription_name}</td>
                <td>${prescription.amount}</td>
                <td>${prescription.frequency || '--'}</td>
                <td>${prescription.route || '--'}</td>
                <td>${prescription.prescription_status}</td>
                <td>${doctorName}</td>
                <td>${formatDate(prescription.start_date)}</td>
                <td>${formatDate(prescription.end_date)}</td>
                <td>
                    <button type="button" class="primary-button delete-prescription" data-id="${prescription.id}">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.querySelectorAll('.delete-prescription').forEach(button => {
            button.addEventListener('click', async function() {
                const prescriptionId = this.getAttribute('data-id');
                await deletePrescription(prescriptionId);
            });
        });
    }

    async function addPrescription() {
        const prescriptionData = {
            prescription_name: document.getElementById('prescription').value.trim(),
            amount: document.getElementById('amount').value.trim(),
            frequency: document.getElementById('frequency').value.trim(),
            route: document.getElementById('route').value.trim(),
            prescription_status: document.getElementById('status').value,
            prescribed_by: document.getElementById('prescribedBy').value, 
            start_date: document.getElementById('startDate').value,
            end_date: document.getElementById('endDate').value
        };

        if (!prescriptionData.prescription_name || !prescriptionData.amount) {
            alert('Prescription name and amount are required');
            return;
        }

        try {
            const response = await fetch(`/api/patients/${currentPatientId}/prescriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(prescriptionData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to add prescription');
            }
            
            const result = await response.json();
            prescriptions.unshift(result.prescription); 
            updatePrescriptionsTable();
            closePopup();
            
            document.getElementById('prescription').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('frequency').value = '';
            document.getElementById('route').value = '';
            document.getElementById('status').value = 'active';
            document.getElementById('prescribedBy').value = '';
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            
        } catch (error) {
            console.error('Error adding prescription:', error);
            alert('Failed to add prescription');
        }
    }

    async function deletePrescription(prescriptionId) {
        if (!confirm('Are you sure you want to delete this prescription?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete prescription');
            }
            
            prescriptions = prescriptions.filter(p => p.id != prescriptionId);
            updatePrescriptionsTable();
            
        } catch (error) {
            console.error('Error deleting prescription:', error);
            alert('Failed to delete prescription');
        }
    }

    await loadDoctors();
    await loadPrescriptions();

    document.getElementById('addPrescriptionButton').addEventListener('click', openPopup);
    
    const popupAddButton = document.querySelector('.popup-box .primary-button:nth-child(2)');
    if (popupAddButton) {
        popupAddButton.addEventListener('click', addPrescription);
    }
    
    window.openPopup = function() {
        document.getElementById('popup').style.display = 'flex';
    };
    
    window.closePopup = function() {
        document.getElementById('popup').style.display = 'none';
    };
});

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
  
  const patientId = getPatientIdFromUrl();
  
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

