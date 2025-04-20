
    const clinicianId = new URLSearchParams(window.location.search).get('id') || localStorage.getItem('clinicianId') || 1;

    async function fetchClinicianDetails() {
      try {
        const response = await fetch(`/api/clinicians/${clinicianId}`);
        if (!response.ok) throw new Error('Failed to fetch clinician details');
        
        const clinician = await response.json();
        document.getElementById('clinician-name').textContent = 
          `${clinician.first_name} ${clinician.middle_name ? clinician.middle_name.charAt(0) + '. ' : ''}${clinician.last_name}`;
        document.getElementById('clinician-role').textContent = clinician.staff_role || 'Clinician';
      } catch (error) {
        console.error('Error:', error);
      }
    }

    async function fetchPrescriptions() {
      try {
        const response = await fetch(`/api/clinicians/${clinicianId}/prescriptions`);
        if (!response.ok) throw new Error('Failed to fetch prescriptions');
        
        const prescriptions = await response.json();
        renderPrescriptionsTable(prescriptions);
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('prescriptions-table-body').innerHTML = 
          `<tr><td colspan="9" class="text-center">Error loading prescriptions: ${error.message}</td></tr>`;
      }
    }

    function renderPrescriptionsTable(prescriptions) {
      const tableBody = document.getElementById('prescriptions-table-body');
      
      if (prescriptions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No prescriptions found</td></tr>';
        return;
      }
      
      const rows = prescriptions.map(prescription => {
        const startDate = new Date(prescription.start_date).toLocaleDateString();
        const endDate = prescription.end_date ? new Date(prescription.end_date).toLocaleDateString() : 'N/A';
        
        return `
          <tr>
            <td>${prescription.patient_first_name} ${prescription.patient_middle_name ? prescription.patient_middle_name.charAt(0) + '. ' : ''}${prescription.patient_last_name}</td>
            <td>${prescription.prescription_name}</td>
            <td>${prescription.amount}</td>
            <td>${prescription.frequency}</td>
            <td>${prescription.route}</td>
            <td>${prescription.prescription_status}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>
              <button class="action-button" onclick="viewPatient(${prescription.patient_id})">
                View Patient
              </button>
            </td>
          </tr>
        `;
      }).join('');
      
      tableBody.innerHTML = rows;
    }

    function viewPatient(patientId) {
      window.location.href = `/patients/patient-view?id=${patientId}`;
    }

    document.getElementById('search-input').addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#prescriptions-table-body tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });

    document.getElementById('filter').addEventListener('change', function(e) {
      fetchPrescriptions().then(() => {
        const sortBy = e.target.value;
        const tableBody = document.getElementById('prescriptions-table-body');
        const rows = Array.from(tableBody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
          if (sortBy === 'newest') {
            const dateA = new Date(a.children[6].textContent);
            const dateB = new Date(b.children[6].textContent);
            return dateB - dateA;
          } else if (sortBy === 'oldest') {
            const dateA = new Date(a.children[6].textContent);
            const dateB = new Date(b.children[6].textContent);
            return dateA - dateB;
          } else if (sortBy === 'patient-az') {
            return a.children[0].textContent.localeCompare(b.children[0].textContent);
          } else if (sortBy === 'patient-za') {
            return b.children[0].textContent.localeCompare(a.children[0].textContent);
          }
          return 0;
        });
        
        while (tableBody.firstChild) {
          tableBody.removeChild(tableBody.firstChild);
        }
        
        rows.forEach(row => tableBody.appendChild(row));
      });
    });

    fetchClinicianDetails();
    fetchPrescriptions();