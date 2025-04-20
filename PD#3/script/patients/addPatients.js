document.addEventListener('DOMContentLoaded', () => {
    let allergiesList = [];
    let profilePhotoFile = null;

    const saveBtn = document.getElementById('save-btn');
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const photoPreview = document.getElementById('photoPreview');
    const previewContainer = document.getElementById('previewContainer');
    const removePhotoBtn = document.getElementById('removePhoto');

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

    removePhotoBtn.addEventListener('click', () => {
        profilePhotoFile = null;
        profilePhotoInput.value = '';
        photoPreview.src = '';
        previewContainer.style.display = 'none';
    });

    function openPopup() {
        document.getElementById('popup').style.display = 'flex';
        document.querySelector('#popup input[type="text"]').value = '';
        document.querySelector('#popup select').value = 'mild';
    }

    function closePopup() {
        document.getElementById('popup').style.display = 'none';
    }

    function addAllergy() {
        const allergyName = document.querySelector('#popup input[type="text"]').value;
        const severity = document.querySelector('#popup select').value;
        
        if (allergyName) {
            allergiesList.push({
                name: allergyName,
                severity: severity
            });
            
            updateAllergiesTable();
            closePopup();
        } else {
            alert('Please enter an allergy name');
        }
    }

    function updateAllergiesTable() {
        const tbody = document.querySelector('.patient-list-table tbody');
        tbody.innerHTML = '';
        
        allergiesList.forEach((allergy, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" aria-label="Select ${allergy.name}"></td>
                <td>${allergy.name}</td>
                <td>${allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}</td>
                <td>
                    <button type="button" class="primary-button" onclick="removeAllergy(${index})">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function removeAllergy(index) {
        allergiesList.splice(index, 1);
        updateAllergiesTable();
    }

    window.openPopup = openPopup;
    window.closePopup = closePopup;
    window.addAllergy = addAllergy;
    window.removeAllergy = removeAllergy;

    saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const formatDate = (dateString) => {
            if (!dateString) return null;

            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString;
            }
            
            if (dateString.includes('/')) {
                const [month, day, year] = dateString.split('/');
                
                if (!month || !day || !year) return null;
                if (year.length !== 4) return null; 
                
                const paddedMonth = month.padStart(2, '0');
                const paddedDay = day.padStart(2, '0');
                
                const date = new Date(`${year}-${paddedMonth}-${paddedDay}`);
                if (isNaN(date.getTime())) return null;
                
                return `${year}-${paddedMonth}-${paddedDay}`;
            }
            
            return null;
        };

        const formData = new FormData();

        const patientData = {
            firstName: document.querySelector('input[name="firstName"]').value.trim(),
            middleName: document.querySelector('input[name="middleName"]').value.trim(),
            lastName: document.querySelector('input[name="lastName"]').value.trim(),
            age: parseInt(document.getElementById('age').value.trim()) || null,
            birthDate: formatDate(document.getElementById('birthDate').value),
            contactNumber: document.getElementById('contactNumber').value.trim(),
            citizenship: document.getElementById('citizenship').value.trim(),
            address: document.getElementById('address').value.trim(),
            member: document.getElementById('member').value.trim(),
            socialSecurity: document.getElementById('socialSecurity').value.trim(),
            gravidity: parseInt(document.getElementById('gravidity').value.trim()) || null,
            parity: parseInt(document.getElementById('parity').value.trim()) || null,
            lastMenstrualPeriod: formatDate(document.getElementById('lastMenstrualPeriod').value),
            expectedDateOfConfinement: formatDate(document.getElementById('expectedDateOfConfinement').value),
            note: document.getElementById('note').value.trim(),
            ecFirstName: document.getElementById('emergencyFirstName').value.trim(),
            ecMiddleName: document.getElementById('emergencyMiddleName').value.trim(),
            ecLastName: document.getElementById('emergencyLastName').value.trim(),
            relationship: document.getElementById('emergencyRelationship').value.trim(),
            ecContactNumber: document.getElementById('emergencyContactNumber').value.trim(),
            allergies: JSON.stringify(allergiesList)
        };
        
        for (const [key, value] of Object.entries(patientData)) {
            formData.append(key, value);
        }

        if (profilePhotoFile) {
            formData.append('profilePhoto', profilePhotoFile);
        }

        try {
            const res = await fetch('/api/patients', {
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            if (res.ok) {
                alert('Patient added successfully!');
                window.location.href = '/patient-list';
            } else {
                alert('Error adding patient: ' + (result.message || 'Unknown error'));
                console.error(result);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Failed to add patient. Please try again.');
        }
    });
});

const cancelButton = document.getElementById("cancelBtn");
if(cancelButton) {
    cancelButton.addEventListener('click', function() {
        window.location.href = `/patient-list`;
    });
}