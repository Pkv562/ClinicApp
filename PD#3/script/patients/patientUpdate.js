let profilePhotoFile = null;
const profilePhotoInput = document.getElementById('profilePhotoInput');
const photoPreview = document.getElementById('photoPreview');
const previewContainer = document.getElementById('previewContainer');
const removePhotoBtn = document.getElementById('removePhoto');
const updatePhotoBtn = document.getElementById('updatePhotoBtn'); // Add this button to your HTML
let currentPatientId;

// Set up profile photo functionality
if (profilePhotoInput && photoPreview) {
    profilePhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            profilePhotoFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}

if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
        profilePhotoFile = null;
        profilePhotoInput.value = '';
        photoPreview.src = '';
        previewContainer.style.display = 'none';
    });
}

// Function to update profile photo
async function updateProfilePhoto() {
    if (!profilePhotoFile) {
        alert('Please select a photo to upload');
        return;
    }

    if (!currentPatientId) {
        alert('Patient ID not found. Please refresh the page and try again.');
        return;
    }

    const formData = new FormData();
    formData.append('profilePhoto', profilePhotoFile);  // Field name matches server

    try {
        const updatePhotoBtn = document.getElementById('updatePhotoBtn');
        if (updatePhotoBtn) updatePhotoBtn.textContent = 'Uploading...';

        const response = await fetch(`/api/patients/${currentPatientId}/photo`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile photo');
        }

        const result = await response.json();
        
        // Update the photo preview
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
            photoPreview.src = `/${result.profilePhotoPath}?t=${Date.now()}`;
        }

        // Update the avatar in the UI
        const avatarImg = document.querySelector('.patient-avatar');
        if (avatarImg) {
            avatarImg.src = `/${result.profilePhotoPath}?t=${Date.now()}`;
        }

        // Reset the file input
        profilePhotoInput.value = '';
        profilePhotoFile = null;
        previewContainer.style.display = 'none';
        
        alert('Profile photo updated successfully!');
    } catch (error) {
        console.error('Error updating profile photo:', error);
        alert(`Failed to update profile photo: ${error.message}`);
    } finally {
        const updatePhotoBtn = document.getElementById('updatePhotoBtn');
        if (updatePhotoBtn) updatePhotoBtn.textContent = 'Update Photo';
    }
}

// Add event listener for the update button
if (updatePhotoBtn) {
    updatePhotoBtn.addEventListener('click', updateProfilePhoto);
}

document.addEventListener('DOMContentLoaded', async () => {
    let allergiesList = [];

    function getPatientIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    currentPatientId = getPatientIdFromUrl();

    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    const updatePhotoBtn = document.getElementById('updatePhotoBtn');
    if (updatePhotoBtn) {
        updatePhotoBtn.addEventListener('click', updateProfilePhoto);
    }

    async function loadPatientData() {
        currentPatientId = getPatientIdFromUrl();
        
        if (!currentPatientId) {
            alert('No patient ID provided');
            window.location.href = '/patient-list';
            return;
        }

        try {
            const response = await fetch(`/api/patients/${currentPatientId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch patient data');
            }
            
            const patientData = await response.json();
            populateForm(patientData);
            
            if (patientData.allergies) {
                allergiesList = patientData.allergies;
                updateAllergiesTable();
            }
            
        } catch (error) {
            console.error('Error loading patient data:', error);
            alert('Failed to load patient data');
        }
    }

    function populateForm(patient) {
        document.getElementById('firstName').value = patient.first_name || '';
        document.getElementById('middleName').value = patient.middle_name || '';
        document.getElementById('lastName').value = patient.last_name || '';
        document.getElementById('age').value = patient.age || '';
        document.getElementById('birthDate').value = formatDateForInput(patient.birth_date);
        document.getElementById('contactNumber').value = patient.contact_number || '';
        document.getElementById('citizenship').value = patient.citizenship || '';
        document.getElementById('address').value = patient.address || '';
        document.getElementById('member').value = patient.member || '';
        document.getElementById('socialSecurity').value = patient.social_security || '';
        document.getElementById('gravidity').value = patient.gravidity || '';
        document.getElementById('parity').value = patient.parity || '';
        document.getElementById('lastMenstrualPeriod').value = formatDateForInput(patient.last_menstrual_period);
        document.getElementById('expectedDateOfConfinement').value = formatDateForInput(patient.expected_date_of_confinement);
        document.getElementById('note').value = patient.note || '';
        
        document.getElementById('emergencyFirstName').value = patient.ec_first_name || '';
        document.getElementById('emergencyMiddleName').value = patient.ec_middle_name || '';
        document.getElementById('emergencyLastName').value = patient.ec_last_name || '';
        document.getElementById('emergencyRelationship').value = patient.ec_relationship || '';
        document.getElementById('emergencyContactNumber').value = patient.ec_contact_number || '';
    }

    function updateAllergiesTable() {
        const tbody = document.querySelector('.patient-list-table tbody');
        tbody.innerHTML = '';
        
        allergiesList.forEach((allergy, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" aria-label="Select ${allergy.allergy_name || allergy.name}"></td>
                <td>${allergy.allergy_name || allergy.name}</td>
                <td>${(allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1))}</td>
                <td>
                    <button type="button" class="primary-button delete-allergy" data-index="${index}">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.querySelectorAll('.delete-allergy').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeAllergy(index);
            });
        });
    }

    async function addAllergy() {
        const allergyName = document.querySelector('#popup input[type="text"]').value.trim();
        const severity = document.querySelector('#popup select').value;
        
        if (!allergyName) {
            alert('Please enter an allergy name');
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
                    severity: severity
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add allergy');
            }
            
            const result = await response.json();
            allergiesList.push(result.allergy);
            updateAllergiesTable();
            closePopup();
            
        } catch (error) {
            console.error('Error adding allergy:', error);
            alert('Failed to add allergy');
        }
    }

    async function removeAllergy(index) {
        const allergy = allergiesList[index];
        const allergyId = allergy.id;
        
        if (!allergyId) {
            alert('Cannot delete allergy: Missing ID');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this allergy?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/allergies/${currentPatientId}/${allergyId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete allergy');
            }
            
            allergiesList.splice(index, 1);
            updateAllergiesTable();
            
        } catch (error) {
            console.error('Error deleting allergy:', error);
            alert('Failed to delete allergy');
        }
    }

    async function saveUpdatedPatient() {
        const formatDate = (dateString) => {
            if (!dateString) return null;
            return dateString;
        };

        const data = {
            firstName: document.getElementById('firstName').value.trim(),
            middleName: document.getElementById('middleName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            age: document.getElementById('age').value.trim(),
            birthDate: formatDate(document.getElementById('birthDate').value),
            contactNumber: document.getElementById('contactNumber').value.trim(),
            citizenship: document.getElementById('citizenship').value.trim(),
            address: document.getElementById('address').value.trim(),
            member: document.getElementById('member').value.trim(),
            socialSecurity: document.getElementById('socialSecurity').value.trim(),
            gravidity: document.getElementById('gravidity').value.trim(),
            parity: document.getElementById('parity').value.trim(),
            lastMenstrualPeriod: formatDate(document.getElementById('lastMenstrualPeriod').value),
            expectedDateOfConfinement: formatDate(document.getElementById('expectedDateOfConfinement').value),
            note: document.getElementById('note').value.trim(),
            ecFirstName: document.getElementById('emergencyFirstName').value.trim(),
            ecMiddleName: document.getElementById('emergencyMiddleName').value.trim(),
            ecLastName: document.getElementById('emergencyLastName').value.trim(),
            relationship: document.getElementById('emergencyRelationship').value.trim(),
            ecContactNumber: document.getElementById('emergencyContactNumber').value.trim()
        };

        try {
            const res = await fetch(`/api/patients/${currentPatientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (res.ok) {
                alert('Patient updated successfully!');
                window.location.href = `/patients/patient-view?id=${currentPatientId}`;
            } else {
                alert('Error updating patient: ' + (result.message || 'Unknown error'));
                console.error(result);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Failed to update patient. Please try again.');
        }
    }

    await loadPatientData();

    const cancelButton = document.getElementById("cancel-update");
    if(cancelButton) {
        cancelButton.addEventListener('click', function() {
            console.log("Cancel button clicked\n");
            window.location.href = `/patients/patient-view?id=${currentPatientId}`;
        });
    }

    const updateButton = document.getElementById('updatePatientButton');
    if (updateButton) {
        updateButton.addEventListener('click', saveUpdatedPatient);
    }
    
    const addAllergyButton = document.querySelector('#popup .primary-button:last-child');
    if (addAllergyButton) {
        addAllergyButton.addEventListener('click', addAllergy);
    }

    const openPopupButton = document.getElementById('addAllergyButton');
    if (openPopupButton) {
        openPopupButton.addEventListener('click', function() {
            openPopup();
        });
    }

    window.openPopup = function() {
        document.getElementById('popup').style.display = 'flex';
        document.querySelector('#popup input[type="text"]').value = '';
        document.querySelector('#popup select').value = 'mild';
    };
    
    window.closePopup = function() {
        document.getElementById('popup').style.display = 'none';
    };
});
