import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js'; 
import multer from 'multer';
import fs from 'fs';
import mysql from 'mysql2/promise';


const app = express();

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/styles', express.static('styles'));
app.use('/assets', express.static('assets'));
app.use('/script', express.static('script'));
app.use('/files', express.static('files'));

//MySQL connection
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadDir;
      if (file.fieldname === 'profilePhoto') {  // Changed from 'profile_picture' to match
        uploadDir = path.join(__dirname, 'files', 'patients', 'profilePictures');
      } else if (file.fieldname === 'lab_file') {
        uploadDir = path.join(__dirname, 'files', 'patients', 'labRecords');
      } else {
        return cb(new Error('Invalid file upload field'), false);
      }

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);

      if (file.fieldname === 'profilePhoto') {  // Changed from 'profile_picture' to match
        cb(null, 'profile-' + uniqueSuffix + ext);
      } else {
        cb(null, 'lab-' + uniqueSuffix + ext);
      }
    }
  });

  const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'profilePhoto') {  // This is correct
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Profile picture must be an image!'), false);
        }
    } else if (file.fieldname === 'lab_file') {
        // This part is fine
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Lab records must be PDF or image (JPEG, PNG)!'), false);
        }
    } else {
        cb(new Error('Invalid file upload field'), false);
    }
};
  
  const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 
    }
  });

  app.post('/api/patients', upload.single('profilePhoto'), async (req, res) => {
      const profilePhotoPath = req.file ? 
          path.join('files', 'patients', 'profilePictures', req.file.filename).replace(/\\/g, '/') : 
          null;

      let allergies;
      try {
          allergies = req.body.allergies ? JSON.parse(req.body.allergies) : [];
      } catch (error) {
          console.error('Error parsing allergies:', error);
          allergies = [];
      }
      
      const {
          firstName, middleName, lastName,
          age, birthDate, contactNumber,
          citizenship, address, member,
          socialSecurity, gravidity, parity,
          lastMenstrualPeriod, expectedDateOfConfinement, note,
          ecFirstName, ecMiddleName, ecLastName,
          relationship, ecContactNumber
      } = req.body;
  
      const connection = await pool.getConnection();
      
      try {
          await connection.beginTransaction();

          const toIntOrNull = (value) => {
            if (typeof value === 'string') value = value.trim();
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? null : parsed;
        };

        function formatDate(inputDate) {
            if (!inputDate || inputDate.trim() === '') return null;
            const date = new Date(inputDate);
            return isNaN(date) ? null : date.toISOString().split('T')[0];
        }

        const safeAge = toIntOrNull(age);
        const safeGravidity = toIntOrNull(gravidity);
        const safeParity = toIntOrNull(parity);

        const formattedBirthDate = formatDate(birthDate);
        const formattedLMP = formatDate(lastMenstrualPeriod);
        const formattedEDC = formatDate(expectedDateOfConfinement);
          
        const [patientResult] = await connection.query(`
            INSERT INTO patients (
                first_name, middle_name, last_name,
                age, birth_date, contact_number,
                citizenship, address, member,
                social_security, gravidity, parity,
                last_menstrual_period, expected_date_of_confinement, note,
                ec_first_name, ec_middle_name, ec_last_name,
                ec_relationship, ec_contact_number, profile_photo_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            firstName, middleName, lastName,
            safeAge, formattedBirthDate, contactNumber,
            citizenship, address, member,
            socialSecurity, safeGravidity, safeParity,
            formattedLMP, formattedEDC, note,
            ecFirstName, ecMiddleName, ecLastName,
            relationship, ecContactNumber, profilePhotoPath
        ]);
          
          const patientId = patientResult.insertId;
          
          if (allergies && allergies.length > 0) {
              for (const allergy of allergies) {
                  await connection.query(`
                      INSERT INTO patient_allergies (
                          patient_id, allergy_name, severity
                      ) VALUES (?, ?, ?)
                  `, [patientId, allergy.name, allergy.severity]);
              }
          }
          
          await connection.commit();
          res.status(201).json({ 
              message: 'Patient added successfully', 
              id: patientId,
              profilePhoto: profilePhotoPath
          });
      } catch (error) {
          await connection.rollback();
          
          // If an error occurs and a file was uploaded, delete it
          if (req.file) {
              fs.unlink(req.file.path, (err) => {
                  if (err) console.error('Error deleting file:', err);
              });
          }
          
          console.error('Error adding patient:', error);
          res.status(500).json({ message: 'Failed to add patient', error: error.message });
      } finally {
          connection.release();
      }
  });


  app.post('/api/patients/:id/photo', upload.single('profilePhoto'), async (req, res) => {
    const patientId = req.params.id;
    
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const profilePhotoPath = path.join('files', 'patients', 'profilePictures', req.file.filename).replace(/\\/g, '/');
    
    try {
        // Get current photo path
        const [rows] = await pool.query(
            'SELECT profile_photo_path FROM patients WHERE id = ?',
            [patientId]
        );
        
        if (rows.length === 0) {
            throw new Error('Patient not found');
        }
        
        const oldPhotoPath = rows[0].profile_photo_path;
        
        // Update database
        await pool.query(
            'UPDATE patients SET profile_photo_path = ? WHERE id = ?',
            [profilePhotoPath, patientId]
        );
        
        // Delete old file if exists
        if (oldPhotoPath) {
            const fullOldPath = path.join(__dirname, oldPhotoPath);
            if (fs.existsSync(fullOldPath)) {
                fs.unlink(fullOldPath, (err) => {
                    if (err) console.error('Error deleting old profile photo:', err);
                });
            }
        }
        
        res.status(200).json({ 
            message: 'Profile photo updated successfully', 
            profilePhotoPath: profilePhotoPath 
        });
        
    } catch (error) {
        // Delete uploaded file if error occurs
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        
        console.error('Error updating profile photo:', error);
        res.status(500).json({ message: 'Failed to update profile photo', error: error.message });
    }
});

// Also update your GET endpoint to include profile_photo_path
app.get('/api/patients/:id', async (req, res) => {
    const patientId = req.params.id;
    
    const connection = await pool.getConnection();
    
    try {
        // Get patient details including profile photo path
        const [patientRows] = await connection.query(
            `SELECT *, profile_photo_path FROM patients WHERE id = ?`,
            [patientId]
        );
        
        if (patientRows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        
        const patient = patientRows[0];
        
        // Get patient allergies
        const [allergiesRows] = await connection.query(
            `SELECT * FROM patient_allergies WHERE patient_id = ?`,
            [patientId]
        );
        
        patient.allergies = allergiesRows;
        
        res.status(200).json(patient);
    } catch (error) {
        console.error('Error getting patient data:', error);
        res.status(500).json({ message: 'Failed to get patient data', error: error.message });
    } finally {
        connection.release();
    }
});


//allergies routes

app.post('/api/patients/:id/allergies', async (req, res) => {
    const patientId = req.params.id;
    const { name, severity } = req.body;
    
    try {
        const [result] = await pool.query(`
            INSERT INTO patient_allergies (patient_id, allergy_name, severity)
            VALUES (?, ?, ?)
        `, [patientId, name, severity]);
        
        res.status(201).json({ 
            message: 'Allergy added successfully', 
            id: result.insertId,
            allergy: { id: result.insertId, allergy_name: name, severity }
        });
    } catch (error) {
        console.error('Error adding allergy:', error);
        res.status(500).json({ message: 'Failed to add allergy', error: error.message });
    }
});

app.delete('/api/allergies/:patientId/:allergyName', async (req, res) => {
    const { patientId, allergyName } = req.params;
    
    try {
        await pool.query(
            `DELETE FROM patient_allergies 
             WHERE patient_id = ? AND allergy_name = ?`, 
            [patientId, allergyName]
        );
        res.json({ message: 'Allergy deleted successfully' });
    } catch (error) {
        console.error('Error deleting allergy:', error);
        res.status(500).json({ 
            message: 'Failed to delete allergy', 
            error: error.message 
        });
    }
});


app.get('/api/patients', async (req, res) => {
    try {
        const [patients] = await pool.query(`
            SELECT id, first_name, middle_name, last_name, contact_number, address, member as status 
            FROM patients
        `);
        
        for (const patient of patients) {
            const [appointments] = await pool.query(`
                SELECT appointment_date FROM BasicAppointments 
                WHERE patient_id = ? 
                ORDER BY appointment_date DESC LIMIT 1
            `, [patient.id]);
            
            patient.last_appointment = appointments.length > 0 ? appointments[0].appointment_date : null;
        }
        
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Failed to fetch patients', error: error.message });
    }
});

app.put('/api/patients/:id', async (req, res) => {
    const patientId = req.params.id;
    const {
        firstName, middleName, lastName,
        age, birthDate, contactNumber,
        citizenship, address, member,
        socialSecurity, gravidity, parity,
        lastMenstrualPeriod, expectedDateOfConfinement, note,
        ecFirstName, ecMiddleName, ecLastName,
        relationship, ecContactNumber
    } = req.body;

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const sanitize = (value, type = 'string') => {
            if (value === '') {
                return type === 'number' ? null : null;
            }
            return value;
        };

        const sanitizedData = [
            sanitize(firstName),
            sanitize(middleName),
            sanitize(lastName),
            sanitize(age, 'number'),
            sanitize(birthDate),
            sanitize(contactNumber),
            sanitize(citizenship),
            sanitize(address),
            sanitize(member),
            sanitize(socialSecurity),
            sanitize(gravidity, 'number'),
            sanitize(parity, 'number'),
            sanitize(lastMenstrualPeriod),
            sanitize(expectedDateOfConfinement),
            sanitize(note),
            sanitize(ecFirstName),
            sanitize(ecMiddleName),
            sanitize(ecLastName),
            sanitize(relationship),
            sanitize(ecContactNumber),
            patientId
        ];
        
        await connection.query(`
            UPDATE patients SET
                first_name = ?,
                middle_name = ?,
                last_name = ?,
                age = ?,
                birth_date = ?,
                contact_number = ?,
                citizenship = ?,
                address = ?,
                member = ?,
                social_security = ?,
                gravidity = ?,
                parity = ?,
                last_menstrual_period = ?,
                expected_date_of_confinement = ?,
                note = ?,
                ec_first_name = ?,
                ec_middle_name = ?,
                ec_last_name = ?,
                ec_relationship = ?,
                ec_contact_number = ?
            WHERE id = ?
        `, sanitizedData);
        
        await connection.commit();
        res.json({ message: 'Patient updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating patient:', error);
        res.status(500).json({ message: 'Failed to update patient', error: error.message });
    } finally {
        connection.release();
    }
});

//prescription routes

// Get all prescriptions for a patient
app.get('/api/patients/:id/prescriptions', async (req, res) => {
    const patientId = req.params.id;
    
    try {
        const [prescriptions] = await pool.query(`
            SELECT * FROM patient_prescription 
            WHERE patient_id = ?
            ORDER BY start_date DESC
        `, [patientId]);
        
        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ 
            message: 'Failed to fetch prescriptions', 
            error: error.message 
        });
    }
});

// Add new prescription
app.post('/api/patients/:id/prescriptions', async (req, res) => {
    const patientId = req.params.id;
    const {
        prescription_name,
        amount,
        frequency,
        route,
        prescription_status,
        prescribed_by,
        start_date,
        end_date
    } = req.body;

    try {
        const [result] = await pool.query(`
            INSERT INTO patient_prescription (
                patient_id,
                prescription_name,
                amount,
                frequency,
                route,
                prescription_status,
                prescribed_by,
                start_date,
                end_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            patientId,
            prescription_name,
            amount,
            frequency,
            route,
            prescription_status,
            prescribed_by,
            start_date,
            end_date
        ]);
        
        // Make sure we return the complete object with ID
        res.status(201).json({ 
            message: 'Prescription added successfully',
            id: result.insertId,
            prescription: {
                id: result.insertId,
                patient_id: patientId,
                prescription_name,
                amount,
                frequency,
                route,
                prescription_status,
                prescribed_by,
                start_date,
                end_date
            }
        });
    } catch (error) {
        console.error('Error adding prescription:', error);
        res.status(500).json({ 
            message: 'Failed to add prescription', 
            error: error.message 
        });
    }
});

// Delete prescription
app.delete('/api/prescriptions/:id', async (req, res) => {
    const prescriptionId = req.params.id;
    
    try {
        await pool.query(`
            DELETE FROM patient_prescription 
            WHERE id = ?
        `, [prescriptionId]);
        
        res.json({ message: 'Prescription deleted successfully' });
    } catch (error) {
        console.error('Error deleting prescription:', error);
        res.status(500).json({ 
            message: 'Failed to delete prescription', 
            error: error.message 
        });
    }
});

//supplements routes

// Get all supplements for a patient
app.get('/api/patients/:id/supplements', async (req, res) => {
    const patientId = req.params.id;
    
    try {
        const [prescriptions] = await pool.query(`
            SELECT * FROM patient_supplements
            WHERE patient_id = ?
            ORDER BY start_date DESC
        `, [patientId]);
        
        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ 
            message: 'Failed to fetch prescriptions', 
            error: error.message 
        });
    }
});

// Add new prescription
app.post('/api/patients/:id/supplements', async (req, res) => {
    const patientId = req.params.id;
    const {
        supplement_name,
        amount,
        frequency,
        route,
        supplement_status,
        prescribed_by,
        start_date,
        end_date
    } = req.body;

    try {
        const [result] = await pool.query(`
            INSERT INTO patient_supplements (
                patient_id,
                supplement_name,
                amount,
                frequency,
                route,
                supplement_status,
                prescribed_by,
                start_date,
                end_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            patientId,
            supplement_name,
            amount,
            frequency,
            route,
            supplement_status,
            prescribed_by,
            start_date,
            end_date
        ]);
        
        // Make sure we return the complete object with ID
        res.status(201).json({ 
            message: 'Prescription added successfully',
            id: result.insertId,
            prescription: {
                id: result.insertId,
                patient_id: patientId,
                supplement_name,
                amount,
                frequency,
                route,
                supplement_status,
                prescribed_by,
                start_date,
                end_date
            }
        });
    } catch (error) {
        console.error('Error adding supplement:', error);
        res.status(500).json({ 
            message: 'Failed to add supplement', 
            error: error.message 
        });
    }
});

// Delete prescription
app.delete('/api/supplement/:id', async (req, res) => {
    const prescriptionId = req.params.id;
    
    try {
        await pool.query(`
            DELETE FROM patient_supplements
            WHERE id = ?
        `, [prescriptionId]);
        
        res.json({ message: 'Supplement deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplement:', error);
        res.status(500).json({ 
            message: 'Failed to delete supplement', 
            error: error.message 
        });
    }
});

//laboratory routes

// Get all laboratory records for a patient
app.get('/api/patients/:id/laboratory', async (req, res) => {
    const patientId = req.params.id;
    
    try {
        const [labRecords] = await pool.query(`
            SELECT * FROM patient_laboratory 
            WHERE patient_id = ?
            ORDER BY lab_date DESC
        `, [patientId]);
        
        res.json(labRecords);
    } catch (error) {
        console.error('Error fetching laboratory records:', error);
        res.status(500).json({ 
            message: 'Failed to fetch laboratory records', 
            error: error.message 
        });
    }
});

// Add new laboratory record
app.post('/api/patients/:id/laboratory', upload.fields([
    { name: 'lab_file', maxCount: 1 }
  ]), async (req, res) => {
      const patientId = parseInt(req.params.id);
      
      if (!patientId || isNaN(patientId)) {
          return res.status(400).json({ 
              message: 'Invalid patient ID' 
          });
      }
      
      const {
          lab_type,
          company,
          lab_date,
          ordered_date,
          received_date,
          reported_date,
          doctor,
          remarks,
          impression,
          recommendation,
          notes
      } = req.body;
  
      try {
          const [result] = await pool.query(`
              INSERT INTO patient_laboratory (
                  patient_id,
                  lab_type,
                  company,
                  lab_date,
                  ordered_date,
                  received_date,
                  reported_date,
                  doctor,
                  remarks,
                  impression,
                  recommendation,
                  notes,
                  file_path
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
              patientId,
              lab_type,
              company,
              lab_date,
              ordered_date,
              received_date,
              reported_date,
              doctor,
              remarks,
              impression,
              recommendation,
              notes,
              req.files?.lab_file ? `/files/patients/labRecords/${req.files.lab_file[0].filename}` : null
          ]);
          
          res.status(201).json({ 
              message: 'Laboratory record added successfully',
              id: result.insertId,
              labRecord: {
                  id: result.insertId,
                  patient_id: patientId,
                  lab_type,
                  company,
                  lab_date,
                  ordered_date,
                  received_date,
                  reported_date,
                  doctor,
                  remarks,
                  impression,
                  recommendation,
                  notes,
                  file_path: req.files?.lab_file ? `/files/patients/labRecords/${req.files.lab_file[0].filename}` : null
              }
          });
      } catch (error) {
          console.error('Error adding laboratory record:', error);
          res.status(500).json({ 
              message: 'Failed to add laboratory record', 
              error: error.message 
          });
      }
  });

// Get a specific laboratory record
app.get('/api/laboratory/:id', async (req, res) => {
    const labId = req.params.id;
    
    try {
        const [labRecords] = await pool.query(`
            SELECT * FROM patient_laboratory 
            WHERE id = ?
        `, [labId]);
        
        if (labRecords.length === 0) {
            return res.status(404).json({ message: 'Laboratory record not found' });
        }
        
        res.json(labRecords[0]);
    } catch (error) {
        console.error('Error fetching laboratory record:', error);
        res.status(500).json({ 
            message: 'Failed to fetch laboratory record', 
            error: error.message 
        });
    }
});

app.put('/api/laboratory/:id', upload.single('lab_file'), async (req, res) => {
    const labId = req.params.id;
    
    const parseDate = (dateStr) => {
      return dateStr && dateStr !== '' ? dateStr : null;
    };

    try {
        if (!req.body.lab_type) {
            return res.status(400).json({ message: 'Laboratory type is required' });
        }
        
        if (!req.body.lab_date) {
            return res.status(400).json({ message: 'Laboratory date is required' });
        }

        await pool.query(`
            UPDATE patient_laboratory SET
                lab_type = ?,
                company = ?,
                lab_date = ?,
                ordered_date = ?,
                received_date = ?,
                reported_date = ?,
                doctor = ?,
                remarks = ?,
                impression = ?,
                recommendation = ?,
                notes = ?,
                file_path = COALESCE(?, file_path)
            WHERE id = ?
        `, [
            req.body.lab_type,
            req.body.company || null,
            parseDate(req.body.lab_date),  
            parseDate(req.body.ordered_date),
            parseDate(req.body.received_date),
            parseDate(req.body.reported_date),
            req.body.doctor || null,
            req.body.remarks || null,
            req.body.impression || null,
            req.body.recommendation || null,
            req.body.notes || null,
            req.file ? `/files/patients/labRecords/${req.file.filename}` : null,
            labId
        ]);
        
        res.json({ message: 'Laboratory record updated successfully' });
    } catch (error) {
        console.error('Error updating laboratory record:', error);
        res.status(500).json({ 
            message: 'Failed to update laboratory record', 
            error: error.message,
            sqlMessage: error.sqlMessage || 'Unknown SQL error'
        });
    }
});

// Delete a laboratory record
app.delete('/api/laboratory/:id', async (req, res) => {
    const labId = req.params.id;
    
    try {
        await pool.query(`
            DELETE FROM patient_laboratory 
            WHERE id = ?
        `, [labId]);
        
        res.json({ message: 'Laboratory record deleted successfully' });
    } catch (error) {
        console.error('Error deleting laboratory record:', error);
        res.status(500).json({ 
            message: 'Failed to delete laboratory record', 
            error: error.message 
        });
    }
});

//delete patient

// Delete a patient and all associated records
app.delete('/api/patients/:id', async (req, res) => {
    const patientId = req.params.id;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        await connection.query('DELETE FROM patient_allergies WHERE patient_id = ?', [patientId]);
        await connection.query('DELETE FROM patient_prescription WHERE patient_id = ?', [patientId]);
        await connection.query('DELETE FROM patient_supplements WHERE patient_id = ?', [patientId]);
        await connection.query('DELETE FROM patient_laboratory WHERE patient_id = ?', [patientId]);
        
        await connection.query('DELETE FROM patients WHERE id = ?', [patientId]);
        
        await connection.commit();
        res.json({ message: 'Patient and all associated records deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting patient:', error);
        res.status(500).json({ 
            message: 'Failed to delete patient', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

//clinician mysql

// Get all clinicians
app.get('/api/clinicians', async (req, res) => {
    try {
        const [clinicians] = await pool.query(`
            SELECT * FROM clinician
        `);
        
        res.json(clinicians);
    } catch (error) {
        console.error('Error fetching clinicians:', error);
        res.status(500).json({ message: 'Failed to fetch clinicians', error: error.message });
    }
});

// Get specific clinician by ID
app.get('/api/clinicians/:id', async (req, res) => {
    const clinicianId = req.params.id;
    
    try {
        const [clinicianRows] = await pool.query(`
            SELECT * FROM clinician WHERE id = ?
        `, [clinicianId]);
        
        if (clinicianRows.length === 0) {
            return res.status(404).json({ message: 'Clinician not found' });
        }
        
        res.json(clinicianRows[0]);
    } catch (error) {
        console.error('Error fetching clinician:', error);
        res.status(500).json({ message: 'Failed to fetch clinician', error: error.message });
    }
});

// Add a new clinician
app.post('/api/clinicians', async (req, res) => {
    const {
        firstName, middleName, lastName,
        age, birthDate, contactNumber,
        citizenship, address, staffRole,
        specialization, licenseNo,
        emFirstName, emMiddleName, emLastName,
        emRelationship, emContactNumber
    } = req.body;

    try {
        const [result] = await pool.query(`
            INSERT INTO clinician (
                first_name, middle_name, last_name,
                age, birth_date, contact_number,
                citizenship, address, staff_role,
                specialization, license_no,
                em_first_name, em_middle_name, em_last_name,
                em_relationship, em_contact_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            firstName, middleName, lastName,
            age, birthDate, contactNumber,
            citizenship, address, staffRole,
            specialization, licenseNo,
            emFirstName, emMiddleName, emLastName,
            emRelationship, emContactNumber
        ]);
        
        res.status(201).json({ 
            message: 'Clinician added successfully', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('Error adding clinician:', error);
        res.status(500).json({ message: 'Failed to add clinician', error: error.message });
    }
});

// Update clinician
app.put('/api/clinicians/:id', async (req, res) => {
    const clinicianId = req.params.id;
    const {
        firstName, middleName, lastName,
        age, birthDate, contactNumber,
        citizenship, address, staffRole,
        specialization, licenseNo,
        emFirstName, emMiddleName, emLastName,
        emRelationship, emContactNumber
    } = req.body;

    try {
        await pool.query(`
            UPDATE clinician SET
                first_name = ?, middle_name = ?, last_name = ?,
                age = ?, birth_date = ?, contact_number = ?,
                citizenship = ?, address = ?, staff_role = ?,
                specialization = ?, license_no = ?,
                em_first_name = ?, em_middle_name = ?, em_last_name = ?,
                em_relationship = ?, em_contact_number = ?
            WHERE id = ?
        `, [
            firstName, middleName, lastName,
            age, birthDate, contactNumber,
            citizenship, address, staffRole,
            specialization, licenseNo,
            emFirstName, emMiddleName, emLastName,
            emRelationship, emContactNumber,
            clinicianId
        ]);
        
        res.json({ message: 'Clinician updated successfully' });
    } catch (error) {
        console.error('Error updating clinician:', error);
        res.status(500).json({ message: 'Failed to update clinician', error: error.message });
    }
});

// Delete clinician
app.delete('/api/clinicians/:id', async (req, res) => {
    const clinicianId = req.params.id;
    
    try {
        await pool.query('DELETE FROM clinician WHERE id = ?', [clinicianId]);
        res.json({ message: 'Clinician deleted successfully' });
    } catch (error) {
        console.error('Error deleting clinician:', error);
        res.status(500).json({ message: 'Failed to delete clinician', error: error.message });
    }
});

// Get only doctors
app.get('/api/doctors', async (req, res) => {
    try {
        const [doctors] = await pool.query(`
            SELECT * FROM clinician
            WHERE staff_role = 'doctor'
        `);
        
        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
    }
});

app.get('/api/clinicians/:id/prescriptions', async (req, res) => {
    const clinicianId = req.params.id;
    
    try {
        const [prescriptions] = await pool.query(`
            SELECT pp.*, 
                   p.first_name AS patient_first_name, 
                   p.middle_name AS patient_middle_name, 
                   p.last_name AS patient_last_name
            FROM patient_prescription pp
            JOIN patients p ON pp.patient_id = p.id
            WHERE pp.prescribed_by = ?
            ORDER BY pp.start_date DESC
        `, [clinicianId]);
        
        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching clinician prescriptions:', error);
        res.status(500).json({ 
            message: 'Failed to fetch prescriptions', 
            error: error.message 
        });
    }
});

// Get all supplements prescribed by a specific clinician
app.get('/api/clinicians/:id/supplements', async (req, res) => {
    const clinicianId = req.params.id;
    
    try {
        const [supplements] = await pool.query(`
            SELECT ps.*, 
                   p.first_name AS patient_first_name, 
                   p.middle_name AS patient_middle_name, 
                   p.last_name AS patient_last_name
            FROM patient_supplements ps
            JOIN patients p ON ps.patient_id = p.id
            WHERE ps.prescribed_by = ?
            ORDER BY ps.start_date DESC
        `, [clinicianId]);
        
        res.json(supplements);
    } catch (error) {
        console.error('Error fetching clinician supplements:', error);
        res.status(500).json({ 
            message: 'Failed to fetch supplements', 
            error: error.message 
        });
    }
});

//patients routes

app.get('/patient-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', "patient-list.html"));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'dashboard', "dashboard.html"));
});

app.get('/appointment-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'appointments', "appointments.html"));
});

app.get('/clinician-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'clinician', "clinician-list.html"));
});

app.get('/patients/patient-add', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', 'patient-add.html'));
});

app.get('/patients/patient-view', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', 'patient-view-information.html'));
});

app.get('/patients/patient-prescription', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', 'patient-prescription.html'));
});

app.get('/patients/patient-supplement', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', 'patient-supplement.html'));
});

app.get('/patients/patient-record', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', 'patient-record.html'));
});

app.get('/patients/patient-update', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', "patient-update.html")); 
});

app.get('/patients/record-add', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', "record-add.html")); 
});

app.get('/patients/record-summary', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', "record-summary.html")); 
});

app.get('/patients/record-update', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'patients', "record-update.html")); 
});

//clinician routes

app.get('/clinician/clinician-add', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'clinician', "clinician-add.html")); 
});

app.get('/clinician/clinician-view', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'clinician', "clinician-view.html")); 
});

app.get('/clinician/clinician-update', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'clinician', "clinician-update.html")); 
});

app.get('/clinician/clinician-update', (req, res) => { 
    res.sendFile(path.join(__dirname, 'pages', 'clinician', "clinician-update.html")); 
});

app.get('/clinician/clinician-prescription', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'clinician', "clinician-prescription.html")); 
});

app.get('/clinician/clinician-supplement', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'clinician', "clinician-supplement.html")); 
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});