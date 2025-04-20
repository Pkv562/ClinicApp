
   let currentPatientId;
   let patientData;


   function getPatientIdFromUrl() {
     const urlParams = new URLSearchParams(window.location.search);
     return urlParams.get('id');
   }

   function formatDate(dateString) {
     if (!dateString) return '--/--/----';
     const date = new Date(dateString);
     return date.toLocaleDateString();
   }

   async function loadPatientData() {
     currentPatientId = getPatientIdFromUrl();
     
     if (!currentPatientId) {
       alert('No patient ID provided');
       return;
     }

     try {
       const response = await fetch(`/api/patients/${currentPatientId}`);
       
       if (!response.ok) {
         throw new Error('Failed to fetch patient data');
       }
       
       patientData = await response.json();
       displayPatientData(patientData);
       displayAllergies(patientData.allergies);

       const updateLink = document.getElementById('updatePatientLink');
      if (updateLink) {
        updateLink.href = `patient-update?id=${currentPatientId}`;
      }
       
     } catch (error) {
       console.error('Error loading patient data:', error);
     }
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
    

     document.getElementById('patientFullName').textContent = `${patient.first_name} ${patient.middle_name} ${patient.last_name}`;
     

     const emergencyContact = `${patient.ec_first_name} ${patient.ec_middle_name} ${patient.ec_last_name} (${patient.ec_relationship}) ${patient.ec_contact_number}`;
     document.getElementById('emergencyContact').textContent = emergencyContact;

     document.getElementById('firstName').textContent = patient.first_name || '--';
     document.getElementById('middleName').textContent = patient.middle_name || '--';
     document.getElementById('lastName').textContent = patient.last_name || '--';
     document.getElementById('age').textContent = patient.age || '--';
     document.getElementById('birthDate').textContent = formatDate(patient.birth_date);
     document.getElementById('contactNumber').textContent = patient.contact_number || '--';
     document.getElementById('citizenship').textContent = patient.citizenship || '--';
     document.getElementById('address').textContent = patient.address || '--';
     document.getElementById('member').textContent = patient.member || '--';
     document.getElementById('socialSecurity').textContent = patient.social_security || '--';
     document.getElementById('gravidity').textContent = patient.gravidity || '--';
     document.getElementById('parity').textContent = patient.parity || '--';
     document.getElementById('lastMenstrualPeriod').textContent = formatDate(patient.last_menstrual_period);
     document.getElementById('expectedDateOfConfinement').textContent = formatDate(patient.expected_date_of_confinement);
     document.getElementById('note').textContent = patient.note || '--';

   }

   function displayAllergies(allergies) {
     const tableBody = document.getElementById('allergiesTableBody');
     tableBody.innerHTML = '';
     
     if (!allergies || allergies.length === 0) {
       const row = document.createElement('tr');
       row.innerHTML = `<td colspan="4">No allergies recorded</td>`;
       tableBody.appendChild(row);
       return;
     }
     
     allergies.forEach(allergy => {
       const row = document.createElement('tr');
       row.innerHTML = `
       <td><input type="checkbox" data-name="${allergy.allergy_name}" aria-label="Select allergy"></td>
       <td>${allergy.allergy_name}</td>
       <td>${allergy.severity}</td>
       <td>
         <button type="button" class="primary-button delete-allergy-btn" data-name="${allergy.allergy_name}">
           Delete
         </button>
       </td>
     `;
       tableBody.appendChild(row);
     });
     
     document.querySelectorAll('.delete-allergy-btn').forEach(button => {
       button.addEventListener('click', function() {
         const allergyId = this.getAttribute('data-name');
         deleteAllergy(allergyId);
       });
     });
   }

   async function deleteAllergy(allergyName) {
    if (!confirm(`Are you sure you want to delete "${allergyName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/allergies/${currentPatientId}/${encodeURIComponent(allergyName)}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete allergy');
        }

        patientData.allergies = patientData.allergies.filter(
            allergy => allergy.allergy_name !== allergyName
        );
        displayAllergies(patientData.allergies);

    } catch (error) {
        console.error('Error deleting allergy:', error);
        alert('Failed to delete allergy');
    }
}

   async function addAllergy() {
     const allergyName = document.getElementById('allergyName').value.trim();
     const allergySeverity = document.getElementById('allergySeverity').value;
     
     if (!allergyName) {
       alert('Please enter allergy name');
       return;
     }
     
     try {
       const response = await fetch(`/api/patients/${currentPatientId}/allergies`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           name: allergyName,
           severity: allergySeverity
         })
       });
       
       if (!response.ok) {
         throw new Error('Failed to add allergy');
       }
       
       const result = await response.json();
       
       if (!patientData.allergies) {
         patientData.allergies = [];
       }
       patientData.allergies.push(result.allergy);
       
       displayAllergies(patientData.allergies);
       closePopup();
       

       document.getElementById('allergyName').value = '';
       document.getElementById('allergySeverity').value = 'mild';
       
     } catch (error) {
       console.error('Error adding allergy:', error);
       alert('Failed to add allergy');
     }
   }

   function openPopup() {
     document.getElementById('popup').style.display = 'flex';
   }

   function closePopup() {
     document.getElementById('popup').style.display = 'none';
   }

   document.addEventListener('DOMContentLoaded', function() {
     loadPatientData();
  
     document.getElementById('addAllergyBtn').addEventListener('click', addAllergy);

    //  document.getElementById('deletePatientBtn').addEventListener('click', function() {
    //    alert('Delet1 functionality will be implemented later');
    //  });
     
     document.getElementById('selectAllAllergies').addEventListener('change', function() {
       const allCheckboxes = document.querySelectorAll('#allergiesTableBody input[type="checkbox"]');
       allCheckboxes.forEach(checkbox => {
         checkbox.checked = this.checked;
       });
     });
   });

   function updateNavigationLinks() {
    const patientId = getPatientIdFromUrl();
    if (!patientId) return;
    
    const navLinks = document.querySelectorAll('.nav-page-header a, .page-actions a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes('?')) {
            link.setAttribute('href', `${href}?id=${patientId}`);
        }
    });
}

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

const updateButton = document.getElementById("update-btn");
if(updateButton) {
    updateButton.addEventListener('click', function() {
        window.location.href = `/patients/patient-update?id=${patientId}`;
    });
}

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

