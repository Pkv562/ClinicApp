document.addEventListener('DOMContentLoaded', async () => {
    let currentPatientId;
    let supplements = [];
    let doctors = [];

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
            const response = await fetch('/api/clinicians');
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
                const prefix = doctor.staff_role === 'doctor' ? 'Dr. ' : '';
                option.textContent = `${prefix}${doctor.first_name} ${doctor.middle_name || ''} ${doctor.last_name}`.trim();
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    async function loadSupplements() {
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

            await loadDoctors();
            
            const response = await fetch(`/api/patients/${currentPatientId}/supplements`);

            if (!response.ok) {
                throw new Error('Failed to fetch supplements');
            }

            supplements = await response.json();
            updateSupplementsTable();

        } catch (error) {
            console.error('Error loading supplements:', error);
            alert('Failed to load supplements');
        }
    }

     function updateSupplementsTable() {
        const tbody = document.querySelector('.patient-list-table tbody');
        tbody.innerHTML = '';

        if (supplements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10">No supplements found</td>
                </tr>
            `;
            return;
        }

        supplements.forEach((supplement) => {
            let doctorName = '--';
            
            if (supplement.prescribed_by) {
                const doctor = doctors.find(d => d.id === supplement.prescribed_by);
                if (doctor) {
                    const prefix = doctor.staff_role === 'doctor' ? 'Dr. ' : '';
                    doctorName = `${prefix}${doctor.first_name} ${doctor.middle_name || ''} ${doctor.last_name}`.trim();
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" data-id="${supplement.id}"></td>
                <td>${supplement.supplement_name}</td>
                <td>${supplement.amount}</td>
                <td>${supplement.frequency || '--'}</td>
                <td>${supplement.route || '--'}</td>
                <td>${supplement.supplement_status}</td>
                <td>${doctorName}</td>
                <td>${formatDate(supplement.start_date)}</td>
                <td>${formatDate(supplement.end_date)}</td>
                <td>
                    <button type="button" class="primary-button delete-supplement" data-id="${supplement.id}">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.querySelectorAll('.delete-supplement').forEach(button => {
            button.addEventListener('click', async function() {
                const supplementId = this.getAttribute('data-id');
                await deleteSupplement(supplementId);
            });
        });
    }

    async function addSupplement() {
        const supplementData = {
            supplement_name: document.getElementById('prescription').value.trim(),
            amount: document.getElementById('amount').value.trim(),
            frequency: document.getElementById('frequency').value.trim(),
            route: document.getElementById('route').value.trim(),
            supplement_status: document.getElementById('status').value,
            prescribed_by: document.getElementById('prescribedBy').value, 
            start_date: document.getElementById('startDate').value.trim() || null,
            end_date: document.getElementById('endDate').value.trim() || null
        };

        if (!supplementData.supplement_name || !supplementData.amount || !supplementData.prescribed_by) {
            alert('Supplement name, amount, and prescribing doctor are required');
            return;
        }

        try {
            const response = await fetch(`/api/patients/${currentPatientId}/supplements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(supplementData)
            });

            if (!response.ok) {
                throw new Error('Failed to add supplement');
            }

            const result = await response.json();
            supplements.unshift(result.prescription);
            updateSupplementsTable();
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
            console.error('Error adding supplement:', error);
            alert('Failed to add supplement');
        }
    }

    await loadDoctors();
    await loadSupplements();


    async function deleteSupplement(supplementId) {
        if (!confirm('Are you sure you want to delete this supplement?')) {
            return;
        }

        try {
            const response = await fetch(`/api/supplement/${supplementId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete supplement');
            }

            supplements = supplements.filter(s => s.id != supplementId);
            updateSupplementsTable();

        } catch (error) {
            console.error('Error deleting supplement:', error);
            alert('Failed to delete supplement');
        }
    }

    await loadSupplements();

    document.getElementById('addPrescriptionButton').addEventListener('click', openPopup);

    const popupAddButton = document.querySelector('.popup-box .primary-button:nth-child(2)');
    if (popupAddButton) {
        popupAddButton.addEventListener('click', addSupplement);
    }

    window.openPopup = function () {
        document.getElementById('popup').style.display = 'flex';
    };

    window.closePopup = function () {
        document.getElementById('popup').style.display = 'none';
    };
});

document.addEventListener('DOMContentLoaded', function () {
    const deletePatientBtn = document.getElementById('deletePatientBtn');

    if (deletePatientBtn) {
        deletePatientBtn.addEventListener('click', function () {
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

