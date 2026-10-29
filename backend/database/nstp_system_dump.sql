-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for osx10.10 (x86_64)
--
-- Host: localhost    Database: nstp_system
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `active_visitors`
--

DROP TABLE IF EXISTS `active_visitors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `active_visitors` (
  `visitor_id` varchar(128) NOT NULL,
  `page_url` varchar(500) NOT NULL,
  `user_agent` text,
  `first_seen` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`visitor_id`),
  KEY `idx_active_visitors_last_seen` (`last_seen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `active_visitors`
--

LOCK TABLES `active_visitors` WRITE;
/*!40000 ALTER TABLE `active_visitors` DISABLE KEYS */;
INSERT INTO `active_visitors` VALUES ('0462a968-2a22-46a2-8e52-ff7f853d4a71','/','Web Client Ping','2026-09-25 04:02:58','2026-09-25 04:02:59'),('479edb07-7c7e-423a-83c9-dbb020265038','/','Web Client Ping','2026-10-02 03:26:03','2026-10-29 03:00:26'),('549340d0-17ec-4431-9556-091f8ba75b12','/login','Web Client Ping','2026-10-13 23:21:01','2026-10-13 23:24:47'),('70cbf0a9-110c-4955-8f13-7816f0a0dc12','/login','Web Client Ping','2026-10-13 23:24:58','2026-10-13 23:24:58'),('ab258dbe-ffab-4cce-913b-6283ef284363','/login','Web Client Ping','2026-10-13 23:20:41','2026-10-13 23:20:41'),('dca09422-a26a-424f-ae5e-58fa2d157b7e','/nstp-system/enrollment','Web Client Ping','2026-09-25 01:20:00','2026-09-28 01:01:00'),('test_client_1','/','Web Client Ping','2026-09-06 14:57:40','2026-09-06 14:57:40'),('vid_0oknsgqgmueu7dae','/','Web Client Ping','2026-09-24 01:12:19','2026-09-24 01:12:19'),('vid_1ghopud4mtdu0fx3','/','Web Client Ping','2026-08-29 03:39:27','2026-09-03 03:58:29'),('vid_5nyovuw34msju3peg','/nstp-system/profile','Web Client Ping','2026-08-25 15:51:53','2026-09-17 12:03:42'),('vid_6zsy0i0snmserdhkz','/','Web Client Ping','2026-09-01 12:36:19','2026-09-08 07:14:32'),('vid_8q6lqv500mt8wt1rt','/nstp-system/login','Web Client Ping','2026-08-25 16:58:50','2026-08-25 16:58:50'),('vid_d4ekhpdomttqoj0g','/','Web Client Ping','2026-09-09 06:50:32','2026-09-09 06:50:56'),('vid_d9m7g7zlmto833nr','/nstp-system/','Web Client Ping','2026-09-05 10:11:07','2026-09-05 10:13:42'),('vid_e2d7x2ylymszirsfi','/nstp-system/login','Web Client Ping','2026-08-25 15:46:35','2026-08-26 09:26:36'),('vid_fvsb5ds40mt8wtaju','/nstp-system/login','Web Client Ping','2026-08-25 16:59:01','2026-08-25 16:59:01'),('vid_lshg29s6mttr5hgd','/','Web Client Ping','2026-09-09 06:58:38','2026-09-09 06:59:03'),('vid_lw9498i7jmt4b3g9q','/nstp-system/','Web Client Ping','2026-08-29 03:39:27','2026-09-03 03:58:33'),('vid_n5b5g0g7mtrybg83','/','Web Client Ping','2026-09-09 12:21:46','2026-09-14 10:33:20'),('vid_okgqjbkjmtinid8u','/','Web Client Ping','2026-09-01 12:36:17','2026-09-01 12:36:18'),('vid_pgr5agicmtd1to13','/','Web Client Ping','2026-08-28 14:30:22','2026-09-05 09:34:56'),('vid_szej4la25mt9cx56l','/nstp-system/login','Web Client Ping','2026-08-26 00:29:55','2026-08-26 00:29:55'),('vid_t30cm1cpmue7fyhi','/nstp-system/admin/dashboard','Web Client Ping','2026-09-24 01:21:47','2026-09-29 17:42:46'),('vid_vcgiefmuwmt8wteyi','/nstp-system/login','Web Client Ping','2026-08-25 16:59:07','2026-08-25 16:59:07'),('vid_z109ft59nmt8wvsqw','/nstp-system/login','Web Client Ping','2026-08-25 17:00:58','2026-08-25 17:00:58'),('vis_test_1787703152233','/audit-test','Web Client Ping','2026-08-26 00:12:32','2026-08-26 00:12:32'),('vis_test_1787703196813','/audit-test','Web Client Ping','2026-08-26 00:13:17','2026-08-26 00:13:17'),('vis_test_1787703232548','/audit-test','Web Client Ping','2026-08-26 00:13:52','2026-08-26 00:13:52'),('vis_test_1787741847161','/audit-test','Web Client Ping','2026-08-26 10:57:27','2026-08-26 10:57:27'),('vis_test_1787741882902','/audit-test','Web Client Ping','2026-08-26 10:58:03','2026-08-26 10:58:03'),('vis_test_1787741953775','/audit-test','Web Client Ping','2026-08-26 10:59:14','2026-08-26 10:59:14'),('vis_test_1788069995917','/audit-test','Web Client Ping','2026-08-30 06:06:36','2026-08-30 06:06:36'),('vis_test_1788070032916','/audit-test','Web Client Ping','2026-08-30 06:07:13','2026-08-30 06:07:13'),('vis_test_1788839582569','/audit-test','Web Client Ping','2026-09-08 03:53:02','2026-09-08 03:53:02');
/*!40000 ALTER TABLE `active_visitors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `archived_years`
--

DROP TABLE IF EXISTS `archived_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `archived_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` varchar(100) NOT NULL,
  `students` int DEFAULT '0',
  `reports` int DEFAULT '0',
  `archived_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archived_years`
--

LOCK TABLES `archived_years` WRITE;
/*!40000 ALTER TABLE `archived_years` DISABLE KEYS */;
/*!40000 ALTER TABLE `archived_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_records`
--

DROP TABLE IF EXISTS `attendance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendance_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) NOT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `activity_name` varchar(255) DEFAULT 'NSTP Session',
  `scan_type` varchar(50) DEFAULT 'TIME_IN',
  `scanned_by` int DEFAULT NULL,
  `scanned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) DEFAULT 'Present',
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_attendance_student` (`student_id`),
  KEY `idx_attendance_dept` (`department`),
  KEY `idx_attendance_date` (`scanned_at`),
  KEY `idx_attendance_scan_type` (`scan_type`,`scanned_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_records`
--

LOCK TABLES `attendance_records` WRITE;
/*!40000 ALTER TABLE `attendance_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action` varchar(100) NOT NULL,
  `user_id` int DEFAULT NULL,
  `detail` text,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_created` (`created_at`),
  KEY `idx_audit_action` (`action`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-29 02:49:00'),(2,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-29 02:49:41'),(3,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-29 02:50:02'),(4,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-29 02:50:20'),(5,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-29 02:54:41'),(6,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-29 02:54:56'),(7,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-29 02:56:16'),(8,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-29 02:56:27');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_audit_logs_no_update` BEFORE UPDATE ON `audit_logs` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit logs are immutable: UPDATE operations are strictly prohibited.';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_audit_logs_no_delete` BEFORE DELETE ON `audit_logs` FOR EACH ROW BEGIN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Audit logs are immutable: DELETE operations are strictly prohibited.';
        END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `calendar_events`
--

DROP TABLE IF EXISTS `calendar_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `calendar_events` (
  `id` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `date` varchar(30) NOT NULL,
  `track` varchar(50) DEFAULT 'All Tracks',
  `category` varchar(50) DEFAULT 'Training',
  `description` text,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_events`
--

LOCK TABLES `calendar_events` WRITE;
/*!40000 ALTER TABLE `calendar_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendar_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calls`
--

DROP TABLE IF EXISTS `calls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `calls` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` varchar(255) NOT NULL,
  `caller_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `call_type` enum('voice','video') DEFAULT 'voice',
  `status` enum('ringing','connected','ended','declined','missed') DEFAULT 'ringing',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `connected_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `duration` int DEFAULT '0',
  `offer_sdp` mediumtext,
  `answer_sdp` mediumtext,
  `caller_ice` json DEFAULT NULL,
  `receiver_ice` json DEFAULT NULL,
  `group_call_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `idx_calls_receiver_status` (`receiver_id`,`status`),
  KEY `idx_calls_caller` (`caller_id`),
  KEY `idx_calls_group_call` (`group_call_id`),
  CONSTRAINT `calls_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calls_ibfk_2` FOREIGN KEY (`caller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calls_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calls`
--

LOCK TABLES `calls` WRITE;
/*!40000 ALTER TABLE `calls` DISABLE KEYS */;
/*!40000 ALTER TABLE `calls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation_participants`
--

DROP TABLE IF EXISTS `conversation_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversation_participants` (
  `conversation_id` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`,`user_id`),
  KEY `idx_conv_participants_user` (`user_id`),
  CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversation_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation_participants`
--

LOCK TABLES `conversation_participants` WRITE;
/*!40000 ALTER TABLE `conversation_participants` DISABLE KEYS */;
INSERT INTO `conversation_participants` VALUES ('group-all-instructors',1,'2026-08-09 18:39:56'),('group-all-instructors',2,'2026-08-09 18:39:56'),('group-all-instructors',3,'2026-08-09 18:39:56'),('group-all-instructors',4,'2026-08-09 18:39:56');
/*!40000 ALTER TABLE `conversation_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversations` (
  `id` varchar(255) NOT NULL,
  `participant_1_id` int DEFAULT NULL,
  `participant_2_id` int DEFAULT NULL,
  `is_group` tinyint(1) DEFAULT '0',
  `group_name` varchar(255) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `last_message` text,
  `last_message_time` timestamp NULL DEFAULT NULL,
  `last_sender_id` int DEFAULT NULL,
  `last_sender_name` varchar(255) DEFAULT NULL,
  `unread_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_conversations_p1` (`participant_1_id`),
  KEY `idx_conversations_p2` (`participant_2_id`),
  KEY `idx_conversations_group` (`is_group`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`participant_1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`participant_2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES ('1-2',1,2,0,NULL,NULL,NULL,NULL,2,NULL,0,'2026-09-05 16:13:32'),('1-3',1,3,0,NULL,NULL,NULL,NULL,1,NULL,0,'2026-09-05 16:13:22'),('1-4',1,4,0,NULL,NULL,NULL,NULL,1,NULL,0,'2026-09-05 16:13:27'),('2-3',3,2,0,NULL,NULL,NULL,NULL,2,NULL,0,'2026-09-08 15:12:40'),('2-4',2,4,0,NULL,NULL,NULL,NULL,2,NULL,0,'2026-09-25 02:00:24'),('3-4',3,4,0,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-09-08 15:12:46'),('group-all-instructors',NULL,NULL,1,'All Instructors',NULL,NULL,NULL,1,NULL,0,'2026-08-09 18:39:55');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `current_batch`
--

DROP TABLE IF EXISTS `current_batch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `current_batch` (
  `id` int NOT NULL DEFAULT '1',
  `year` varchar(100) NOT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `semester` varchar(50) DEFAULT NULL,
  `start_month` varchar(20) DEFAULT NULL,
  `end_month` varchar(20) DEFAULT NULL,
  `start_date` varchar(30) DEFAULT NULL,
  `end_date` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `current_batch`
--

LOCK TABLES `current_batch` WRITE;
/*!40000 ALTER TABLE `current_batch` DISABLE KEYS */;
INSERT INTO `current_batch` VALUES (1,'2024-2025 1st Semester','2026-03-17 03:14:06','2026-10-29 02:12:42','1st Semester','2024-08','2024-12','2024-08-15','2024-12-20');
/*!40000 ALTER TABLE `current_batch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollments`
--

DROP TABLE IF EXISTS `enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(255) NOT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `middleName` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `department` enum('ROTC','CWTS','LTS') NOT NULL,
  `studentId` varchar(50) DEFAULT NULL,
  `contactNumber` varchar(50) DEFAULT NULL,
  `homeAddress` text,
  `address` text,
  `birthDate` date DEFAULT NULL,
  `birthMonth` varchar(2) DEFAULT NULL,
  `birthDay` varchar(2) DEFAULT NULL,
  `birthYear` varchar(4) DEFAULT NULL,
  `age` varchar(10) DEFAULT NULL,
  `civilStatus` varchar(50) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `height` varchar(10) DEFAULT NULL,
  `weight` varchar(10) DEFAULT NULL,
  `facebookAccount` varchar(255) DEFAULT NULL,
  `bloodType` varchar(10) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `program` varchar(100) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `yearLevel` varchar(50) DEFAULT NULL,
  `emergencyContact` varchar(255) DEFAULT NULL,
  `emergencyNumber` varchar(50) DEFAULT NULL,
  `status` enum('Pending','Approved','Declined') DEFAULT 'Pending',
  `registration_photo` longtext,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `municipality` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `registeredVoter` varchar(20) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `nstp_serial_id` varchar(50) DEFAULT NULL,
  `qr_token` varchar(100) DEFAULT NULL,
  `nstp_section` varchar(50) DEFAULT NULL,
  `id_photo_2x2` longtext,
  `reg_form` longtext,
  `suffix` varchar(50) DEFAULT NULL,
  `photo` longtext,
  `is_flagged_regform` tinyint(1) DEFAULT '0',
  `regform_flag_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_enrollments_status` (`status`),
  KEY `idx_enrollments_department` (`department`),
  KEY `idx_enrollments_studentid` (`studentId`),
  KEY `idx_enrollments_email` (`email`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollments`
--

LOCK TABLES `enrollments` WRITE;
/*!40000 ALTER TABLE `enrollments` DISABLE KEYS */;
/*!40000 ALTER TABLE `enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` varchar(255) NOT NULL,
  `sender_id` int NOT NULL,
  `text` text,
  `type` varchar(20) DEFAULT 'text',
  `image_url` longtext,
  `file_url` longtext,
  `file_name` varchar(255) DEFAULT NULL,
  `audio_url` longtext,
  `duration` varchar(50) DEFAULT NULL,
  `reactions` json DEFAULT NULL,
  `edited` tinyint(1) DEFAULT '0',
  `deleted_snapshot` json DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_for` json DEFAULT NULL,
  `deleted_for_everyone` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_conversation` (`conversation_id`,`created_at`),
  KEY `idx_messages_sender` (`sender_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (1,'richardbelen99@gmail.com','398170','2026-08-21 06:28:35',1,'2026-08-21 06:13:35'),(2,'richardbelen99@gmail.com','304114','2026-08-21 06:42:53',1,'2026-08-21 06:27:53'),(3,'richardbelen99@gmail.com','296590','2026-08-21 06:45:17',1,'2026-08-21 06:30:17'),(4,'richardbelen99@gmail.com','156682','2026-08-21 07:04:01',1,'2026-08-21 06:49:01'),(5,'richardbelen99@gmail.com','210733','2026-08-21 07:04:49',1,'2026-08-21 06:49:49'),(6,'admin@cvsu.edu.ph','580812','2026-08-21 07:10:35',1,'2026-08-21 06:55:35'),(7,'admin@cvsu.edu.ph','741154','2026-08-21 07:18:28',1,'2026-08-21 07:03:28'),(8,'richardbelen99@gmail.com','529813','2026-08-21 07:19:54',1,'2026-08-21 07:04:54'),(9,'admin@cvsu.edu.ph','747174','2026-08-21 07:24:05',1,'2026-08-21 07:09:05'),(10,'richardbelen99@gmail.com','780755','2026-08-21 07:28:56',1,'2026-08-21 07:13:56'),(11,'richardbelen99@gmail.com','936060','2026-08-21 08:41:48',1,'2026-08-21 08:26:48'),(12,'richardbelen99@gmail.com','621229','2026-08-21 08:43:09',1,'2026-08-21 08:28:09'),(13,'richardbelen99@gmail.com','579463','2026-08-21 08:43:50',1,'2026-08-21 08:28:50'),(14,'richardbelen99@gmail.com','351211','2026-08-21 08:50:36',1,'2026-08-21 08:35:36'),(15,'richardbelen99@gmail.com','312119','2026-08-21 08:58:24',1,'2026-08-21 08:43:24'),(16,'richardbelen99@gmail.com','756522','2026-08-21 09:18:18',1,'2026-08-21 09:03:18'),(17,'richardbelen99@gmail.com','857280','2026-08-21 09:19:56',1,'2026-08-21 09:04:56'),(18,'richardbelen99@gmail.com','465358','2026-08-21 09:19:58',1,'2026-08-21 09:04:58'),(19,'admin@cvsu.edu.ph','819424','2026-08-21 09:40:52',1,'2026-08-21 09:10:52'),(20,'richardbelen99@gmail.com','819424','2026-08-21 09:40:52',1,'2026-08-21 09:10:52'),(21,'admin@cvsu.edu.ph','605378','2026-08-21 09:41:16',1,'2026-08-21 09:11:16'),(22,'richardbelen99@gmail.com','605378','2026-08-21 09:41:16',1,'2026-08-21 09:11:16'),(23,'admin@cvsu.edu.ph','641144','2026-08-21 09:52:15',1,'2026-08-21 09:22:15'),(24,'richardbelen99@gmail.com','641144','2026-08-21 09:52:16',1,'2026-08-21 09:22:16'),(25,'admin@cvsu.edu.ph','234517','2026-08-21 10:03:11',1,'2026-08-21 09:33:11'),(26,'richardbelen99@gmail.com','234517','2026-08-21 10:03:12',1,'2026-08-21 09:33:12'),(27,'richardbelen17@gmail.com','676968','2026-08-21 10:04:21',0,'2026-08-21 09:34:21'),(28,'clarkebelen28@gmail.com','711750','2026-08-21 10:10:07',1,'2026-08-21 09:40:07'),(29,'clarkebelen28@gmail.com','936654','2026-08-21 10:10:35',1,'2026-08-21 09:40:35'),(30,'clarkebelen28@gmail.com','733448','2026-08-21 10:15:08',1,'2026-08-21 09:45:08'),(31,'clarkebelen28@gmail.com','301574','2026-08-21 10:22:51',1,'2026-08-21 09:52:51'),(32,'belenjoshua58@gmail.com','311490','2026-08-21 10:28:38',1,'2026-08-21 09:58:38'),(33,'clarkebelen28@gmail.com','333181','2026-08-21 10:29:10',1,'2026-08-21 09:59:10'),(34,'clarkebelen28@gmail.com','589115','2026-08-21 10:30:29',1,'2026-08-21 10:00:29'),(35,'belenjoshua58@gmail.com','194862','2026-08-21 10:37:41',1,'2026-08-21 10:07:41'),(36,'clarkebelen28@gmail.com','978757','2026-08-21 10:54:01',1,'2026-08-21 10:24:01'),(37,'admin@cvsu.edu.ph','211380','2026-08-21 11:13:45',1,'2026-08-21 10:43:45'),(38,'clarkebelen28@gmail.com','572473','2026-08-21 12:32:07',1,'2026-08-21 12:02:07'),(39,'clarkebelen28@gmail.com','967570','2026-08-21 12:33:46',1,'2026-08-21 12:03:46'),(40,'clarkebelen28@gmail.com','102113','2026-08-21 12:32:15',1,'2026-08-21 12:22:15'),(41,'richardbelen99@gmail.com','900695','2026-08-21 12:41:12',1,'2026-08-21 12:31:12'),(42,'richardbelen99@gmail.com','376814','2026-08-21 17:24:35',1,'2026-08-21 17:14:35'),(43,'richardbelen99@gmail.com','281002','2026-08-22 11:33:46',1,'2026-08-22 11:23:46'),(44,'clarkebelen28@gmail.com','729934','2026-08-22 11:34:08',1,'2026-08-22 11:24:08'),(45,'clarkebelen28@gmail.com','749641','2026-08-22 11:35:52',1,'2026-08-22 11:25:52'),(46,'clarkebelen28@gmail.com','825454','2026-08-22 12:12:57',1,'2026-08-22 12:02:57'),(47,'clarkebelen28@gmail.com','923133','2026-08-22 13:36:14',1,'2026-08-22 13:26:14'),(48,'clarkebelen28@gmail.com','288967','2026-08-22 13:48:07',1,'2026-08-22 13:38:07'),(49,'clarkebelen28@gmail.com','122422','2026-08-22 13:49:30',1,'2026-08-22 13:39:30'),(50,'clarkebelen28@gmail.com','550868','2026-08-22 13:53:13',1,'2026-08-22 13:43:13'),(51,'clarkebelen28@gmail.com','810425','2026-08-22 13:53:25',1,'2026-08-22 13:43:25'),(52,'clarkebelen28@gmail.com','199485','2026-08-22 13:54:34',1,'2026-08-22 13:44:34'),(53,'richardbelen99@gmail.com','448418','2026-08-22 13:56:36',1,'2026-08-22 13:46:36'),(54,'richardbelen99@gmail.com','171341','2026-08-22 13:59:29',1,'2026-08-22 13:49:29'),(55,'clarkebelen28@gmail.com','920164','2026-08-22 14:00:43',1,'2026-08-22 13:50:43'),(56,'clarkebelen28@gmail.com','249418','2026-08-22 14:02:51',1,'2026-08-22 13:52:51'),(57,'richardbelen99@gmail.com','517601','2026-08-22 14:05:11',1,'2026-08-22 13:55:11'),(58,'admin@cvsu.edu.ph','300151','2026-08-22 14:05:11',0,'2026-08-22 13:55:11'),(59,'richardbelen99@gmail.com','920612','2026-08-22 15:04:29',1,'2026-08-22 14:54:29'),(60,'belenjoshua58@gmail.com','149396','2026-08-22 15:11:23',1,'2026-08-22 15:01:23'),(61,'clarkebelen28@gmail.com','932589','2026-08-22 15:15:39',1,'2026-08-22 15:05:39'),(62,'richardbelen99@gmail.com','904184','2026-08-22 15:28:48',1,'2026-08-22 15:18:48'),(63,'clarkebelen28@gmail.com','689042','2026-08-22 16:06:31',1,'2026-08-22 15:56:31'),(64,'clarkebelen28@gmail.com','609448','2026-08-22 16:18:56',1,'2026-08-22 16:08:56'),(65,'clarkebelen28@gmail.com','803503','2026-08-22 16:20:40',1,'2026-08-22 16:10:40'),(66,'clarkebelen28@gmail.com','132101','2026-08-22 16:31:41',1,'2026-08-22 16:21:41'),(67,'richardbelen99@gmail.com','788408','2026-08-22 16:45:23',1,'2026-08-22 16:35:23'),(68,'clarkebelen28@gmail.com','707691','2026-08-22 16:46:52',1,'2026-08-22 16:36:52'),(69,'clarkebelen28@gmail.com','405369','2026-08-22 16:48:34',1,'2026-08-22 16:38:34'),(70,'richardbelen99@gmail.com','495962','2026-08-22 16:48:47',1,'2026-08-22 16:38:47'),(71,'clarkebelen28@gmail.com','921666','2026-08-22 16:49:21',1,'2026-08-22 16:39:21'),(72,'richardbelen99@gmail.com','463367','2026-08-22 16:49:43',1,'2026-08-22 16:39:43'),(73,'richardbelen99@gmail.com','519828','2026-08-22 16:53:07',1,'2026-08-22 16:43:07'),(74,'marjancereza13@gmail.com','436385','2026-08-22 16:53:24',0,'2026-08-22 16:43:24'),(75,'ajmacalindong8@gmail.com','663020','2026-08-22 16:53:24',0,'2026-08-22 16:43:24'),(76,'sampleuser2026@gmail.com','911968','2026-08-22 16:53:24',0,'2026-08-22 16:43:24'),(77,'richardbelen99@gmail.com','939463','2026-08-22 16:56:54',1,'2026-08-22 16:46:54'),(78,'clarkebelen28@gmail.com','116581','2026-08-22 16:56:54',1,'2026-08-22 16:46:54'),(79,'clarkebelen28@gmail.com','959802','2026-08-22 16:58:16',1,'2026-08-22 16:48:16'),(80,'clarkebelen28@gmail.com','740858','2026-08-22 17:00:10',1,'2026-08-22 16:50:10'),(81,'clarkebelen28@gmail.com','991130','2026-08-22 17:08:10',1,'2026-08-22 16:58:10'),(82,'clarkebelen28@gmail.com','963520','2026-08-22 17:08:52',1,'2026-08-22 16:58:52'),(83,'clarkebelen28@gmail.com','729714','2026-08-22 17:13:02',1,'2026-08-22 17:03:02'),(84,'clarkebelen28@gmail.com','882546','2026-08-22 17:14:33',1,'2026-08-22 17:04:33'),(85,'clarkebelen28@gmail.com','622017','2026-08-22 17:18:20',1,'2026-08-22 17:08:20'),(86,'clarkebelen28@gmail.com','945436','2026-08-22 17:20:11',1,'2026-08-22 17:10:11'),(87,'clarkebelen28@gmail.com','352539','2026-08-22 17:21:36',1,'2026-08-22 17:11:36'),(88,'clarkebelen28@gmail.com','351051','2026-08-22 17:34:36',1,'2026-08-22 17:24:36'),(89,'clarkebelen28@gmail.com','457160','2026-08-22 17:35:17',1,'2026-08-22 17:25:17'),(90,'clarkebelen28@gmail.com','998972','2026-08-22 17:38:37',1,'2026-08-22 17:28:37'),(91,'clarkebelen28@gmail.com','602725','2026-08-22 17:40:18',1,'2026-08-22 17:30:18'),(92,'clarkebelen28@gmail.com','823402','2026-08-24 04:11:50',1,'2026-08-24 04:01:50'),(93,'clarkebelen28@gmail.com','765000','2026-08-24 04:27:24',1,'2026-08-24 04:17:24'),(94,'clarkebelen28@gmail.com','219600','2026-08-25 16:05:07',1,'2026-08-25 15:55:07'),(95,'richardbelen99@gmail.com','402882','2026-08-25 16:22:06',1,'2026-08-25 16:12:06'),(96,'clarkebelen28@gmail.com','605431','2026-08-25 16:30:37',1,'2026-08-25 16:20:37'),(97,'clarkebelen28@gmail.com','724891','2026-08-25 16:37:52',1,'2026-08-25 16:27:52'),(98,'clarkebelen28@gmail.com','695521','2026-08-25 16:38:12',1,'2026-08-25 16:28:12'),(99,'clarkebelen28@gmail.com','803243','2026-08-25 16:41:06',1,'2026-08-25 16:31:06'),(100,'richardbelen99@gmail.com','310946','2026-08-25 16:41:55',1,'2026-08-25 16:31:55'),(101,'richardbelen99@gmail.com','272809','2026-08-25 16:46:26',1,'2026-08-25 16:36:26'),(102,'clarkebelen28@gmail.com','741034','2026-08-25 17:08:23',1,'2026-08-25 16:58:23'),(103,'clarkebelen28@gmail.com','907515','2026-08-26 00:39:09',1,'2026-08-26 00:29:09'),(104,'clarkebelen28@gmail.com','112654','2026-08-26 01:18:15',0,'2026-08-26 01:08:15'),(105,'richardbelen99@gmail.com','439235','2026-08-27 14:48:11',1,'2026-08-27 14:38:11'),(106,'richardbelen99@gmail.com','140431','2026-08-28 14:44:35',1,'2026-08-28 14:34:35'),(107,'richardbelen99@gmail.com','331648','2026-08-29 00:35:15',1,'2026-08-29 00:25:15'),(108,'richardbelen99@gmail.com','407049','2026-08-30 06:22:23',1,'2026-08-30 06:12:23'),(109,'richardbelen99@gmail.com','473390','2026-08-30 12:37:41',1,'2026-08-30 12:27:41'),(110,'richardbelen99@gmail.com','978718','2026-09-05 12:22:10',1,'2026-09-05 12:12:10'),(111,'richardbelen99@gmail.com','464383','2026-09-05 12:26:42',1,'2026-09-05 12:16:42'),(112,'richardbelen99@gmail.com','900152','2026-09-05 12:27:00',1,'2026-09-05 12:17:00'),(113,'richardbelen99@gmail.com','845417','2026-09-05 12:27:32',1,'2026-09-05 12:17:32'),(114,'richardbelen99@gmail.com','593973','2026-09-29 11:43:47',1,'2026-09-29 11:33:47'),(115,'richardbelen99@gmail.com','424899','2026-09-29 13:08:40',1,'2026-09-29 12:58:40'),(116,'richardbelen99@gmail.com','408159','2026-09-29 16:34:32',1,'2026-09-29 16:24:32'),(117,'richardbelen99@gmail.com','537509','2026-09-29 16:46:07',1,'2026-09-29 16:36:07'),(118,'richardbelen99@gmail.com','629977','2026-09-29 16:58:03',1,'2026-09-29 16:48:03'),(119,'richardbelen99@gmail.com','969117','2026-09-29 17:32:05',1,'2026-09-29 17:22:05'),(120,'richardbelen99@gmail.com','969117','2026-09-29 17:32:20',1,'2026-09-29 17:22:20'),(121,'richardbelen99@gmail.com','122718','2026-09-29 17:44:09',1,'2026-09-29 17:34:09'),(122,'richardbelen99@gmail.com','821661','2026-09-29 17:44:33',1,'2026-09-29 17:34:33'),(123,'richardbelen99@gmail.com','821661','2026-09-29 17:47:29',1,'2026-09-29 17:37:29'),(124,'richardbelen99@gmail.com','550688','2026-10-18 08:36:12',1,'2026-10-18 08:26:12'),(125,'belenjoshua58@gmail.com','478177','2026-10-18 08:41:31',1,'2026-10-18 08:31:31'),(126,'richardbelen99@gmail.com','418622','2026-10-18 08:57:42',1,'2026-10-18 08:47:42'),(127,'richardbelen99@gmail.com','101775','2026-10-18 09:00:35',1,'2026-10-18 08:50:35'),(128,'richardbelen99@gmail.com','294127','2026-10-18 09:12:18',1,'2026-10-18 09:02:18'),(129,'richardbelen99@gmail.com','294127','2026-10-18 09:13:27',1,'2026-10-18 09:03:27');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_comments`
--

DROP TABLE IF EXISTS `report_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `report_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `user_id` int NOT NULL,
  `text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_report_comments_report` (`report_id`),
  CONSTRAINT `report_comments_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `report_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_comments`
--

LOCK TABLES `report_comments` WRITE;
/*!40000 ALTER TABLE `report_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_submissions`
--

DROP TABLE IF EXISTS `report_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `report_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `instructor_id` int NOT NULL,
  `content` text,
  `file_data` longtext,
  `file_name` varchar(255) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_report_submissions_report` (`report_id`),
  KEY `idx_report_submissions_instructor` (`instructor_id`),
  CONSTRAINT `report_submissions_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `report_submissions_ibfk_2` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_submissions`
--

LOCK TABLES `report_submissions` WRITE;
/*!40000 ALTER TABLE `report_submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `department` varchar(50) DEFAULT NULL,
  `status` enum('Draft','Submitted','Reviewed') DEFAULT 'Draft',
  `due_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `batch_year` varchar(100) DEFAULT NULL,
  `reference_file_data` longtext,
  `reference_file_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_reports_department` (`department`),
  KEY `idx_reports_batch_year` (`batch_year`),
  KEY `idx_reports_status` (`status`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_notifications_log`
--

DROP TABLE IF EXISTS `sms_notifications_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sms_notifications_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipient_phone` varchar(50) NOT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  `event_type` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(50) DEFAULT 'PENDING',
  `provider` varchar(50) DEFAULT 'LOG',
  `error_details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_notifications_log`
--

LOCK TABLES `sms_notifications_log` WRITE;
/*!40000 ALTER TABLE `sms_notifications_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_notifications_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_grades`
--

DROP TABLE IF EXISTS `student_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `studentId` varchar(50) NOT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `department` varchar(50) NOT NULL,
  `semester` varchar(50) NOT NULL DEFAULT '1st Semester',
  `school_year` varchar(50) NOT NULL DEFAULT '2025-2026',
  `nstp_section` varchar(50) DEFAULT NULL,
  `midterm_grade` varchar(20) DEFAULT NULL,
  `final_grade` varchar(20) DEFAULT NULL,
  `remarks` varchar(50) DEFAULT NULL,
  `instructor_id` int DEFAULT NULL,
  `instructor_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_sem_sy` (`studentId`,`semester`,`school_year`),
  KEY `idx_grades_dept` (`department`),
  KEY `idx_grades_sem` (`semester`),
  KEY `idx_grades_sy` (`school_year`),
  KEY `idx_grades_section` (`nstp_section`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_grades`
--

LOCK TABLES `student_grades` WRITE;
/*!40000 ALTER TABLE `student_grades` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentId` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `department` enum('ROTC','CWTS','LTS') NOT NULL,
  `status` enum('Active','Inactive','Completed') DEFAULT 'Active',
  `semester` varchar(50) DEFAULT NULL,
  `schoolYear` varchar(50) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `program` varchar(100) DEFAULT NULL,
  `year` varchar(50) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `contactNumber` varchar(50) DEFAULT NULL,
  `address` text,
  `birthDate` date DEFAULT NULL,
  `birthMonth` varchar(2) DEFAULT NULL,
  `birthDay` varchar(2) DEFAULT NULL,
  `birthYear` varchar(4) DEFAULT NULL,
  `age` varchar(10) DEFAULT NULL,
  `civilStatus` varchar(50) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `height` varchar(10) DEFAULT NULL,
  `weight` varchar(10) DEFAULT NULL,
  `facebookAccount` varchar(255) DEFAULT NULL,
  `emergencyContact` varchar(255) DEFAULT NULL,
  `emergencyNumber` varchar(50) DEFAULT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `middleName` varchar(100) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `municipality` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `registeredVoter` varchar(20) DEFAULT NULL,
  `registrationPhoto` longtext,
  `registration_photo` longtext,
  `profilePicture` longtext,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bloodType` varchar(10) DEFAULT NULL,
  `nstp_serial_id` varchar(50) DEFAULT NULL,
  `qr_token` varchar(100) DEFAULT NULL,
  `id_issued_at` datetime DEFAULT NULL,
  `nstp_section` varchar(50) DEFAULT NULL,
  `id_photo_2x2` longtext,
  `reg_form` longtext,
  `suffix` varchar(50) DEFAULT NULL,
  `photo` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `studentId` (`studentId`),
  KEY `idx_students_department` (`department`),
  KEY `idx_students_status` (`status`),
  KEY `idx_students_program` (`program`),
  KEY `idx_students_semester` (`semester`),
  KEY `idx_students_schoolyear` (`schoolYear`),
  KEY `idx_students_section` (`section`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('enrollment_schedule','{\"mode\": \"FORCE_OPEN\", \"openAt\": \"\", \"closeAt\": \"\", \"semester\": \"1st Semester\", \"academicYear\": \"2024-2025\", \"customNotice\": \"Online Enrollment for Academic Year 2024-2025 is now open.\"}','2026-10-29 02:12:42'),('last_backup_daily_midnight','2026-10-28T16:00:31.433Z','2026-10-28 16:00:31'),('last_backup_manual','2026-08-22T15:06:11.050Z','2026-08-22 15:06:11'),('telemetry_cumulative_visitors','{\"visitors\":[\"vid_t30cm1cpmue7fyhi\",\"vid_8q6lqv500mt8wt1rt\",\"vid_fvsb5ds40mt8wtaju\",\"vid_vcgiefmuwmt8wteyi\",\"vid_z109ft59nmt8wvsqw\",\"vid_szej4la25mt9cx56l\",\"vid_e2d7x2ylymszirsfi\",\"vid_okgqjbkjmtinid8u\",\"vid_1ghopud4mtdu0fx3\",\"vid_lw9498i7jmt4b3g9q\",\"vid_pgr5agicmtd1to13\",\"vid_d9m7g7zlmto833nr\",\"test_client_1\",\"vid_6zsy0i0snmserdhkz\",\"vid_d4ekhpdomttqoj0g\",\"vid_lshg29s6mttr5hgd\",\"vid_n5b5g0g7mtrybg83\",\"vid_5nyovuw34msju3peg\",\"vid_0oknsgqgmueu7dae\",\"0462a968-2a22-46a2-8e52-ff7f853d4a71\",\"dca09422-a26a-424f-ae5e-58fa2d157b7e\",\"479edb07-7c7e-423a-83c9-dbb020265038\",\"ab258dbe-ffab-4cce-913b-6283ef284363\",\"549340d0-17ec-4431-9556-091f8ba75b12\",\"70cbf0a9-110c-4955-8f13-7816f0a0dc12\"],\"totalCount\":25,\"totalVisitors\":25,\"updatedAt\":\"2026-10-29T01:54:37.587Z\"}','2026-10-29 01:54:37');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','instructor') NOT NULL,
  `name` varchar(255) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `avatar` varchar(50) DEFAULT 'default',
  `profilePicture` text,
  `phone` varchar(50) DEFAULT NULL,
  `bio` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_active_at` datetime DEFAULT NULL,
  `current_session_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'richardbelen99@gmail.com','$2a$12$sP0tr8FOwf936kJEFyv6b.AzlgXX6635ZvRQybH3tHACk6u0VPJUO','admin','NSTP Administrator','NSTP Office','avatar-4',NULL,'','Testing','2026-03-13 16:04:59','2026-10-29 02:56:04',NULL,NULL),(2,'belenjoshua58@gmail.com','$2a$12$tx.XRJ496jMUdCtKYNey9uKpjV4LzW9pMwTRkcGtjQCyg88yr4Wzm','instructor','CWTS Facilitator','CWTS','avatar-2',NULL,NULL,'CWTS Safe Update','2026-03-13 16:04:59','2026-10-29 03:03:55','2026-10-29 11:03:55',NULL),(3,'lts@gmail.com','$2a$12$xJbobWiihuTYz2G//fbSoeH0wnp4x5jerDoszxc9irWqgNVZee3ne','instructor','LTS Facilitator','LTS','avatar-6',NULL,NULL,NULL,'2026-03-13 16:04:59','2026-10-18 00:39:31',NULL,NULL),(4,'rotc@gmail.com','$2a$12$2q1kcf1G9bYuNr2/07tCk.LOw.EBT7l4fiMYKxIXDyo4PT3s4KkWS','instructor','ROTC Training Staff','ROTC','avatar-8',NULL,NULL,NULL,'2026-03-13 16:04:59','2026-10-18 00:39:31',NULL,NULL);
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

-- Dump completed on 2026-10-29 11:03:55
