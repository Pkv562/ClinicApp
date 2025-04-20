-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: appointment_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `Appointment_ID` int NOT NULL AUTO_INCREMENT,
  `Appointment_Date` date NOT NULL,
  `Appointment_Time` time DEFAULT NULL,
  `Service_Type` enum('Prenatal_Care','Postpartum_Care') NOT NULL,
  `Height` decimal(5,2) DEFAULT NULL COMMENT 'In centimeters',
  `Weight` decimal(5,2) DEFAULT NULL COMMENT 'In kilograms',
  `Temperature` decimal(4,2) DEFAULT NULL COMMENT 'In Celsius',
  `Blood_Pressure` varchar(10) DEFAULT NULL COMMENT 'Format: 120/80',
  `Pulse_Rate` int DEFAULT NULL,
  `Respiration_Rate` int DEFAULT NULL,
  `Oxygen_Saturation` decimal(5,2) DEFAULT NULL COMMENT 'Percentage',
  `Gestational_Age` int DEFAULT NULL COMMENT 'In weeks',
  `Supplement_Name` varchar(100) DEFAULT NULL,
  `Supplement_Strength` varchar(50) DEFAULT NULL,
  `Supplement_Amount` varchar(50) DEFAULT NULL,
  `Supplement_Frequency` varchar(50) DEFAULT NULL,
  `Supplement_Route` varchar(50) DEFAULT NULL,
  `Appointment_Status` enum('Scheduled','Completed','Canceled') DEFAULT 'Scheduled',
  `Payment_Status` enum('Pending','Completed','Failed') DEFAULT 'Pending',
  `Created_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Appointment_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `basicappointments`
--

DROP TABLE IF EXISTS `basicappointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `basicappointments` (
  `Appointment_ID` int NOT NULL AUTO_INCREMENT,
  `Patient_ID` int NOT NULL,
  `Appointment_Date` date DEFAULT NULL,
  PRIMARY KEY (`Appointment_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `basicappointments`
--

LOCK TABLES `basicappointments` WRITE;
/*!40000 ALTER TABLE `basicappointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `basicappointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinician`
--

DROP TABLE IF EXISTS `clinician`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinician` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `age` int DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `citizenship` varchar(50) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  `staff_role` varchar(50) DEFAULT NULL,
  `specialization` varchar(50) DEFAULT NULL,
  `license_no` varchar(30) DEFAULT NULL,
  `em_first_name` varchar(50) DEFAULT NULL,
  `em_middle_name` varchar(50) DEFAULT NULL,
  `em_last_name` varchar(50) DEFAULT NULL,
  `em_relationship` varchar(50) DEFAULT NULL,
  `em_contact_number` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `clinician_chk_1` CHECK ((`age` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinician`
--

LOCK TABLES `clinician` WRITE;
/*!40000 ALTER TABLE `clinician` DISABLE KEYS */;
INSERT INTO `clinician` VALUES (1,'Joseph','Petalio','Petalio',20,'2022-02-10','','','','doctor','20','','','','','',''),(2,'Sophia','','Mendoza',20,'2025-10-10','013113','','','midwife','','','','','','','');
/*!40000 ALTER TABLE `clinician` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_allergies`
--

DROP TABLE IF EXISTS `patient_allergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_allergies` (
  `patient_id` int NOT NULL,
  `allergy_name` varchar(50) DEFAULT NULL,
  `severity` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_allergies`
--

LOCK TABLES `patient_allergies` WRITE;
/*!40000 ALTER TABLE `patient_allergies` DISABLE KEYS */;
INSERT INTO `patient_allergies` VALUES (13,'polen','severe'),(16,'glass','severe');
/*!40000 ALTER TABLE `patient_allergies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_laboratory`
--

DROP TABLE IF EXISTS `patient_laboratory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_laboratory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `lab_type` varchar(50) NOT NULL,
  `company` varchar(50) DEFAULT NULL,
  `lab_date` date DEFAULT NULL,
  `ordered_date` date DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `reported_date` date DEFAULT NULL,
  `doctor` varchar(100) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `impression` varchar(2000) DEFAULT NULL,
  `recommendation` varchar(2000) DEFAULT NULL,
  `notes` varchar(2000) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_laboratory`
--

LOCK TABLES `patient_laboratory` WRITE;
/*!40000 ALTER TABLE `patient_laboratory` DISABLE KEYS */;
INSERT INTO `patient_laboratory` VALUES (4,13,'Blood','St. Luke\'s Diagnostics','1111-11-11',NULL,NULL,NULL,'Dr. John Smith','','','','',NULL),(5,13,'Urinalysis','Hi-Precision Lab','1111-11-11',NULL,NULL,NULL,'Dr. Mary Johnson','','','','',NULL),(34,16,'Urinalysis','St. Luke\'s Diagnostics','1111-11-11','1111-11-11','1111-11-11','1111-11-11','Dr. John Smith','Clear, normal color','Normal findings','No follow-up needed','Hydration adequate','/files/patients/labRecords/lab-1745137943850-549236627.pdf'),(35,16,'Blood','St. Luke\'s Diagnostics','1111-11-11','1111-11-11',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'/files/patients/labRecords/lab-1745141308711-342221520.pdf');
/*!40000 ALTER TABLE `patient_laboratory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_prescription`
--

DROP TABLE IF EXISTS `patient_prescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_prescription` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `prescription_name` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `frequency` varchar(50) DEFAULT NULL,
  `route` varchar(50) DEFAULT NULL,
  `prescription_status` varchar(20) DEFAULT NULL,
  `prescribed_by` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_prescribed_by` (`prescribed_by`),
  CONSTRAINT `fk_prescribed_by` FOREIGN KEY (`prescribed_by`) REFERENCES `clinician` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_prescription`
--

LOCK TABLES `patient_prescription` WRITE;
/*!40000 ALTER TABLE `patient_prescription` DISABLE KEYS */;
INSERT INTO `patient_prescription` VALUES (7,13,'Bioflue',100.00,'3x a day','oral','active',1,'2025-10-10','2025-11-10'),(8,16,'bioflue',100.00,'3x a day','oral','active',1,'1111-11-11','1111-11-11');
/*!40000 ALTER TABLE `patient_prescription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_supplements`
--

DROP TABLE IF EXISTS `patient_supplements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_supplements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `supplement_name` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `frequency` varchar(50) DEFAULT NULL,
  `route` varchar(50) DEFAULT NULL,
  `supplement_status` varchar(20) DEFAULT NULL,
  `prescribed_by` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Ps_prescribed_by` (`prescribed_by`),
  CONSTRAINT `Ps_prescribed_by` FOREIGN KEY (`prescribed_by`) REFERENCES `clinician` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_supplements`
--

LOCK TABLES `patient_supplements` WRITE;
/*!40000 ALTER TABLE `patient_supplements` DISABLE KEYS */;
INSERT INTO `patient_supplements` VALUES (4,13,'ascof',100.00,'3x a day','oral','active',2,'2025-10-10','2026-10-10'),(5,13,'Celine',20.00,'2x a day','oral','active',1,'2025-10-10','2025-11-10'),(6,16,'Vit C',10.00,'3x a day','oral','active',2,'1111-11-11','1111-11-11');
/*!40000 ALTER TABLE `patient_supplements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) DEFAULT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `citizenship` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `member` varchar(50) DEFAULT NULL,
  `social_security` varchar(20) DEFAULT NULL,
  `gravidity` int DEFAULT NULL,
  `parity` int DEFAULT NULL,
  `last_menstrual_period` date DEFAULT NULL,
  `expected_date_of_confinement` date DEFAULT NULL,
  `note` text,
  `ec_first_name` varchar(50) DEFAULT NULL,
  `ec_middle_name` varchar(50) DEFAULT NULL,
  `ec_last_name` varchar(50) DEFAULT NULL,
  `ec_relationship` varchar(50) DEFAULT NULL,
  `ec_contact_number` varchar(20) DEFAULT NULL,
  `appointment_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `profile_photo_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (13,'Sophia','Grace','Ramizer',21,'2004-12-24','09345678901','Filipino','Manila','4Pcs','0239',1,2,'2025-10-09','2026-10-09','Normal status','Patrick Kurt','Orbon','Villamer','husband','09686255210',NULL,'2025-04-18 06:28:25',NULL),(16,'Isabella','Grace','Cruz',24,NULL,NULL,'Filipino','Manila','4Pcs',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-04-19 11:32:36','files/patients/profilePictures/profile-1745142652967-984876608.jpg'),(18,'Isabella','Marie','Cruz',NULL,NULL,'','','','','',NULL,NULL,NULL,NULL,'','','','','','',NULL,'2025-04-19 14:03:30','files/patients/profilePictures/profile-1745071410059-495168380.jpg');
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-20 18:10:00
