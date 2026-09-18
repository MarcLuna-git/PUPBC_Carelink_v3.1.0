-- MySQL dump 10.13  Distrib 9.1.0, for Win64 (x86_64)
--
-- Host: localhost    Database: pupbc_carelink_v3
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_audience` enum('all','students','nurses','admins') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `announcements_created_by_foreign` (`created_by`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointment_checkins`
--

DROP TABLE IF EXISTS `appointment_checkins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_checkins` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checked_in_at` timestamp NOT NULL,
  `chief_complaint` text COLLATE utf8mb4_unicode_ci,
  `checkin_status` enum('confirmed','no_show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmed',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `appointment_checkins_appointment_id_foreign` (`appointment_id`),
  KEY `appointment_checkins_user_id_foreign` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment_checkins`
--

LOCK TABLES `appointment_checkins` WRITE;
/*!40000 ALTER TABLE `appointment_checkins` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointment_checkins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointment_slots`
--

DROP TABLE IF EXISTS `appointment_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_slots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `time_slot` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_slots` int NOT NULL DEFAULT '10',
  `booked_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `appointment_slots_date_time_slot_unique` (`date`,`time_slot`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment_slots`
--

LOCK TABLES `appointment_slots` WRITE;
/*!40000 ALTER TABLE `appointment_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointment_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointment_date` date NOT NULL,
  `time_slot` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `concern` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reference_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `approved_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `queue_number` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `queue_type` enum('regular','priority') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'regular',
  `checked_in_at` timestamp NULL DEFAULT NULL,
  `no_show` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `appointments_reference_number_unique` (`reference_number`),
  KEY `appointments_approved_by_foreign` (`approved_by`),
  KEY `appointments_user_id_status_index` (`user_id`,`status`),
  KEY `appointments_appointment_date_status_index` (`appointment_date`,`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES ('e6b9ef0b-4420-4ff9-8218-28f9cd986f8a','9db42e2e-4d2f-41e0-8472-56b931b41c6b','Consultation','2026-09-24','8:00 AM',NULL,'completed','APT-HRRFCEJD','8827e93a-67e0-44d2-98dc-5a9cf477b3b3','2026-07-09 22:09:13',NULL,'2026-07-09 05:08:56','2026-07-09 23:09:54',NULL,NULL,'regular',NULL,0),('ea4faf82-02f8-420c-98b3-dd0cf7a415d7','9db42e2e-4d2f-41e0-8472-56b931b41c6b','Consultation','2026-07-10','8:00 AM','masakit gani ang puso ko','approved','APT-AKK8LMON','9db42e2e-4d2f-41e0-8472-56b931b41c6b','2026-07-09 23:08:24',NULL,'2026-07-09 23:05:00','2026-07-09 23:08:24',NULL,NULL,'regular',NULL,0);
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_foreign` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('78356fe3-8778-448e-bc50-89c09ace5f1a','8827e93a-67e0-44d2-98dc-5a9cf477b3b3','appointment_approved','Approved appointment APT-HRRFCEJD','192.168.1.3',NULL,'2026-07-09 22:09:17','2026-07-09 22:09:17'),('a670ef88-231f-4329-83b4-bb01d9b4ef5a','9db42e2e-4d2f-41e0-8472-56b931b41c6b','appointment_approved','Approved appointment APT-AKK8LMON','192.168.1.3',NULL,'2026-07-09 23:08:24','2026-07-09 23:08:24');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations`
--

DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointment_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nurse_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chief_complaint` text COLLATE utf8mb4_unicode_ci,
  `vital_signs` json DEFAULT NULL COMMENT '{bp, hr, rr, temp, o2_sat}',
  `general_remarks` text COLLATE utf8mb4_unicode_ci,
  `medical_certificate` tinyint(1) NOT NULL DEFAULT '0',
  `medical_certificate_ref` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `follow_up_required` tinyint(1) NOT NULL DEFAULT '0',
  `follow_up_date` date DEFAULT NULL,
  `status` enum('in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_progress',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_appointment_id_foreign` (`appointment_id`),
  KEY `consultations_user_id_created_at_index` (`user_id`,`created_at`),
  KEY `consultations_nurse_id_created_at_index` (`nurse_id`,`created_at`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations`
--

LOCK TABLES `consultations` WRITE;
/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_verifications`
--

DROP TABLE IF EXISTS `email_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `email_verifications_user_id_is_used_index` (`user_id`,`is_used`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_verifications`
--

LOCK TABLES `email_verifications` WRITE;
/*!40000 ALTER TABLE `email_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `health_profiles`
--

DROP TABLE IF EXISTS `health_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health_profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emergency_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_relationship` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medical_history` json DEFAULT NULL,
  `allergy_details` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `other_medical_history` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medications` text COLLATE utf8mb4_unicode_ci,
  `hospitalized` tinyint(1) NOT NULL DEFAULT '0',
  `hospitalization_date` date DEFAULT NULL,
  `hospitalization_diagnosis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `surgery` tinyint(1) NOT NULL DEFAULT '0',
  `surgery_date` date DEFAULT NULL,
  `surgery_diagnosis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `had_covid` tinyint(1) NOT NULL DEFAULT '0',
  `covid_date` date DEFAULT NULL,
  `covid_diagnosis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `occupation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marital_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tobacco_use` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tobacco_amount` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tobacco_duration` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alcohol_use` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `other_substance_use` text COLLATE utf8mb4_unicode_ci,
  `has_disability` tinyint(1) NOT NULL DEFAULT '0',
  `disability_details` text COLLATE utf8mb4_unicode_ci,
  `last_menstrual_period` date DEFAULT NULL,
  `has_children` tinyint(1) NOT NULL DEFAULT '0',
  `number_of_children` int DEFAULT NULL,
  `age_first_pregnancy` int DEFAULT NULL,
  `gravidity` tinyint(1) NOT NULL DEFAULT '0',
  `term` tinyint(1) NOT NULL DEFAULT '0',
  `premature` tinyint(1) NOT NULL DEFAULT '0',
  `abortion` tinyint(1) NOT NULL DEFAULT '0',
  `living_children` tinyint(1) NOT NULL DEFAULT '0',
  `family_history` json DEFAULT NULL,
  `consent_signature` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agree_privacy` tinyint(1) NOT NULL DEFAULT '0',
  `agree_terms` tinyint(1) NOT NULL DEFAULT '0',
  `consent_date` date DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `health_profiles_user_id_foreign` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `health_profiles`
--

LOCK TABLES `health_profiles` WRITE;
/*!40000 ALTER TABLE `health_profiles` DISABLE KEYS */;
INSERT INTO `health_profiles` VALUES ('4730c020-70cd-4791-b47e-e65a2556fffc','9db42e2e-4d2f-41e0-8472-56b931b41c6b','Eric Luna','Parent','09157504741','\"[]\"','seafood, dust',NULL,NULL,0,NULL,NULL,0,NULL,NULL,0,NULL,NULL,'student','Single','Never',NULL,NULL,'Occasional',NULL,0,NULL,NULL,0,NULL,NULL,0,0,0,0,0,'\"[\\\"Asthma\\\"]\"','Marc Laurence Luna',1,1,'2026-07-09','2026-07-09 04:42:40','2026-07-09 04:42:40','2026-07-09 04:58:53'),('5487739e-89f1-4e96-a152-40d34ea7321c','dd7549fb-4d14-4c87-b4f6-f8d429eaaeaf','Marc Laurence Luna','Spouse','09931024169','\"[]\"','Seafood',NULL,NULL,0,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'Single','Never',NULL,NULL,'None',NULL,0,NULL,'2026-06-30',0,NULL,NULL,0,0,0,0,0,'\"[\\\"Asthma\\\"]\"','Emery Cagas Luna',1,1,'2026-07-10','2026-07-09 19:41:45','2026-07-09 19:41:45','2026-07-09 19:41:45');
/*!40000 ALTER TABLE `health_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicines`
--

DROP TABLE IF EXISTS `medicines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicines` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `generic_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `minimum_stock` int NOT NULL DEFAULT '10',
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tablet',
  `dosage` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `added_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medicines_added_by_foreign` (`added_by`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicines`
--

LOCK TABLES `medicines` WRITE;
/*!40000 ALTER TABLE `medicines` DISABLE KEYS */;
/*!40000 ALTER TABLE `medicines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2019_12_14_000001_create_personal_access_tokens_table',1),(2,'2024_01_01_000000_create_users_table',1),(3,'2026_07_04_180904_create_student_profiles_table',1),(4,'2026_07_04_180948_create_health_profiles_table',1),(5,'2026_07_04_181046_create_appointments_table',1),(6,'2026_07_04_181119_create_consultations_table',1),(7,'2026_07_05_104955_create_appointment_checkins_table',1),(8,'2026_07_05_105927_create_notifications_table',1),(9,'2026_07_05_110006_create_audit_logs_table',1),(10,'2026_07_05_110023_create_qr_codes_table',1),(11,'2026_07_05_110041_create_otp_codes_table',1),(12,'2026_07_05_110058_create_announcements_table',1),(13,'2026_07_07_001137_create_email_verifications_table',1),(14,'2026_07_09_071005_create_medicines_table',1),(15,'2026_07_09_132041_update_appointments_for_kiosk',2),(16,'2026_07_10_062727_create_appointment_slots_table',3);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL,
  `read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_read_index` (`user_id`,`read`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('0d3c5f26-c8d3-409d-8760-a47e7a88f1ca','9db42e2e-4d2f-41e0-8472-56b931b41c6b','appointment_approved','Appointment Approved','Your appointment on Sep 24, 2026 at 8:00 AM has been approved.',NULL,1,'2026-07-09 22:10:09','2026-07-09 22:09:17','2026-07-09 22:10:09'),('63c4c401-45bd-4bea-a2fe-22ec39625c6b','9db42e2e-4d2f-41e0-8472-56b931b41c6b','appointment_approved','Appointment Approved','Your appointment on Jul 10, 2026 at 8:00 AM has been approved.',NULL,1,'2026-07-09 23:11:04','2026-07-09 23:08:24','2026-07-09 23:11:04');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_codes`
--

DROP TABLE IF EXISTS `otp_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_codes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('email_verification','password_reset') COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `otp_codes_user_id_type_is_used_index` (`user_id`,`type`,`is_used`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_codes`
--

LOCK TABLES `otp_codes` WRITE;
/*!40000 ALTER TABLE `otp_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `otp_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qr_codes`
--

DROP TABLE IF EXISTS `qr_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qr_codes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_code_hash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_code_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_scanned_at` timestamp NULL DEFAULT NULL,
  `scan_count` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qr_codes_qr_code_hash_unique` (`qr_code_hash`),
  KEY `qr_codes_user_id_foreign` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qr_codes`
--

LOCK TABLES `qr_codes` WRITE;
/*!40000 ALTER TABLE `qr_codes` DISABLE KEYS */;
INSERT INTO `qr_codes` VALUES ('76d17979-d4ed-4b30-9ffa-5a4d359af8f3','9db42e2e-4d2f-41e0-8472-56b931b41c6b','572b361530adf3197d8131f1a2a1fab98f49cf1ec307936390d6f6549808ade6',NULL,NULL,0,1,NULL,'2026-07-09 04:15:05','2026-07-09 04:15:05'),('0305a9d3-a6ad-44d2-8b79-aeda81ace76d','dd7549fb-4d14-4c87-b4f6-f8d429eaaeaf','f8594f31f235e748abd89aaa7ae2a6bbea14688e4465bd83036810343aa57594',NULL,NULL,0,1,NULL,'2026-07-09 19:39:48','2026-07-09 19:39:48');
/*!40000 ALTER TABLE `qr_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_profiles`
--

DROP TABLE IF EXISTS `student_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `profile_picture` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_relationship` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_contact` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_profiles_user_id_foreign` (`user_id`),
  KEY `student_profiles_course_index` (`course`),
  KEY `student_profiles_year_index` (`year`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_profiles`
--

LOCK TABLES `student_profiles` WRITE;
/*!40000 ALTER TABLE `student_profiles` DISABLE KEYS */;
INSERT INTO `student_profiles` VALUES ('99a61ae7-424a-4430-b613-dc3367d0597d','9db42e2e-4d2f-41e0-8472-56b931b41c6b','BSIT','4th Year','4-1','2004-09-24','male','09931024169',NULL,NULL,NULL,NULL,NULL,'2026-07-09 04:15:03','2026-07-09 04:15:03'),('5546c271-aac8-4124-becf-4e493918b9b1','dd7549fb-4d14-4c87-b4f6-f8d429eaaeaf','BSTourism','1st Year','1-1','2004-09-24','female','09949228450',NULL,NULL,NULL,NULL,NULL,'2026-07-09 19:39:48','2026-07-09 19:39:48');
/*!40000 ALTER TABLE `student_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birthday` date DEFAULT NULL,
  `gender` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('student','nurse','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `status` enum('pending','active','inactive','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_student_id_unique` (`student_id`),
  KEY `users_email_status_index` (`email`,`status`),
  KEY `users_student_id_status_index` (`student_id`,`status`),
  KEY `users_role_status_index` (`role`,`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('8827e93a-67e0-44d2-98dc-5a9cf477b3b3',NULL,'Head',NULL,'Nurse',NULL,NULL,NULL,NULL,NULL,NULL,'pupbc.clinic@iskolarngbayan.pup.edu.ph','2026-07-09 04:11:49','$2y$10$uk4Va.SwE5plqG2SoP5OhukXTYZsavUhsKNCw.vvqpjSlcmb4ebOG','nurse','active',NULL,NULL,NULL,'2026-07-09 04:11:50','2026-07-09 04:11:50',NULL),('9db42e2e-4d2f-41e0-8472-56b931b41c6b','2023-00057-BN-0','Marc Laurence','Arevalo','Luna','2004-09-24','male','BSIT','4th Year','4-1','09931024169','marclaurenaluna@iskolarngbayan.pup.edu.ph','2026-07-09 04:15:02','$2y$10$30kfnjMJXD4yFwMdEX4x0OjtXgrx2ZC/iEHscFsxI3u6WkzIbdgwu','student','pending','2026-07-10 17:51:39','127.0.0.1',NULL,'2026-07-09 04:15:03','2026-07-10 17:51:39',NULL),('dd7549fb-4d14-4c87-b4f6-f8d429eaaeaf','2023-00051-BN-0','Emery','Cagas','Luna','2004-09-24','female','BSTourism','1st Year','1-1','09949228450','emerycagas@iskolarngbayan.pup.edu.ph','2026-07-09 19:39:48','$2y$10$S3jDpFSIdeQZRu0IgFMxCeH2LiPBdmXdUR0qL9OFSkGtNoHKOKbSq','student','pending','2026-07-09 19:40:10','192.168.1.11',NULL,'2026-07-09 19:39:48','2026-07-09 19:40:10',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-11 10:30:12
