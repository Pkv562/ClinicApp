
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

    async function fetchSupplements() {
      try {
        const response = await fetch(`/api/clinicians/${clinicianId}/supplements`);
        if (!response.ok) throw new Error('Failed to fetch supplements');
        
        const supplements = await response.json();
        renderSupplementsTable(supplements);
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('supplements-table-body').innerHTML = 
          `<tr><td colspan="9" class="text-center">Error loading supplements: ${error.message}</td></tr>`;
      }
    }

    function renderSupplementsTable(supplements) {
      const tableBody = document.getElementById('supplements-table-body');
      
      if (supplements.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No supplements found</td></tr>';
        return;
      }
      
      const rows = supplements.map(supplement => {
        const startDate = new Date(supplement.start_date).toLocaleDateString();
        const endDate = supplement.end_date ? new Date(supplement.end_date).toLocaleDateString() : 'N/A';
        
        return `
          <tr>
            <td>${supplement.patient_first_name} ${supplement.patient_middle_name ? supplement.patient_middle_name.charAt(0) + '. ' : ''}${supplement.patient_last_name}</td>
            <td>${supplement.supplement_name}</td>
            <td>${supplement.amount}</td>
            <td>${supplement.frequency}</td>
            <td>${supplement.route}</td>
            <td>${supplement.supplement_status}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>
              <button class="action-button" onclick="viewPatient(${supplement.patient_id})">
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
      const rows = document.querySelectorAll('#supplements-table-body tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });

    document.getElementById('filter').addEventListener('change', function(e) {
      fetchSupplements().then(() => {
        const sortBy = e.target.value;
        const tableBody = document.getElementById('supplements-table-body');
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
    fetchSupplements();