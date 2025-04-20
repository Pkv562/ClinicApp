document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-btn');
    
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

        const data = {
            firstName: document.getElementById('firstName').value.trim(),
            middleName: document.getElementById('middleName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            age: (() => {
                const ageVal = document.getElementById('age').value.trim();
                const parsed = parseInt(ageVal, 10);
                return isNaN(parsed) ? null : parsed;
            })(),            
            birthDate: formatDate(document.getElementById('birthDate').value),
            contactNumber: document.getElementById('contactNumber').value.trim(),
            citizenship: document.getElementById('citizenship').value.trim(),
            address: document.getElementById('address').value.trim(),
            staffRole: document.getElementById('role').value.trim(),
            specialization: document.getElementById('specialization').value.trim(),
            licenseNo: document.getElementById('licenseNo').value.trim(),
            emFirstName: document.getElementById('emFirstName').value.trim(),
            emMiddleName: document.getElementById('emMiddleName').value.trim(),
            emLastName: document.getElementById('emLastName').value.trim(),
            emRelationship: document.getElementById('emRelationship').value.trim(),
            emContactNumber: document.getElementById('emContactNumber').value.trim()
        };

        try {
            const res = await fetch('/api/clinicians', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (res.ok) {
                alert('Clinician added successfully!');
                window.location.href = '/clinician-list';
            } else {
                alert('Error adding clinician: ' + (result.message || 'Unknown error'));
                console.error(result);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Failed to add clinician. Please try again.');
        }
    });
});