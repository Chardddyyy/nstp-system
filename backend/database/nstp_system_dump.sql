-- MySQL dump 10.13  Distrib 9.6.0, for macos26.2 (arm64)
--
-- Host: localhost    Database: nstp_system
-- ------------------------------------------------------
-- Server version	9.6.0

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
-- Current Database: `nstp_system`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `nstp_system` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `nstp_system`;

--
-- Table structure for table `active_visitors`
--

DROP TABLE IF EXISTS `active_visitors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `active_visitors` VALUES ('0462a968-2a22-46a2-8e52-ff7f853d4a71','/','Web Client Ping','2026-09-25 04:02:58','2026-09-25 04:02:59'),('479edb07-7c7e-423a-83c9-dbb020265038','/','Web Client Ping','2026-10-02 03:26:03','2026-10-29 01:42:32'),('549340d0-17ec-4431-9556-091f8ba75b12','/login','Web Client Ping','2026-10-13 23:21:01','2026-10-13 23:24:47'),('70cbf0a9-110c-4955-8f13-7816f0a0dc12','/login','Web Client Ping','2026-10-13 23:24:58','2026-10-13 23:24:58'),('ab258dbe-ffab-4cce-913b-6283ef284363','/login','Web Client Ping','2026-10-13 23:20:41','2026-10-13 23:20:41'),('dca09422-a26a-424f-ae5e-58fa2d157b7e','/nstp-system/enrollment','Web Client Ping','2026-09-25 01:20:00','2026-09-28 01:01:00'),('test_client_1','/','Web Client Ping','2026-09-06 14:57:40','2026-09-06 14:57:40'),('vid_0oknsgqgmueu7dae','/','Web Client Ping','2026-09-24 01:12:19','2026-09-24 01:12:19'),('vid_1ghopud4mtdu0fx3','/','Web Client Ping','2026-08-29 03:39:27','2026-09-03 03:58:29'),('vid_5nyovuw34msju3peg','/nstp-system/profile','Web Client Ping','2026-08-25 15:51:53','2026-09-17 12:03:42'),('vid_6zsy0i0snmserdhkz','/','Web Client Ping','2026-09-01 12:36:19','2026-09-08 07:14:32'),('vid_8q6lqv500mt8wt1rt','/nstp-system/login','Web Client Ping','2026-08-25 16:58:50','2026-08-25 16:58:50'),('vid_d4ekhpdomttqoj0g','/','Web Client Ping','2026-09-09 06:50:32','2026-09-09 06:50:56'),('vid_d9m7g7zlmto833nr','/nstp-system/','Web Client Ping','2026-09-05 10:11:07','2026-09-05 10:13:42'),('vid_e2d7x2ylymszirsfi','/nstp-system/login','Web Client Ping','2026-08-25 15:46:35','2026-08-26 09:26:36'),('vid_fvsb5ds40mt8wtaju','/nstp-system/login','Web Client Ping','2026-08-25 16:59:01','2026-08-25 16:59:01'),('vid_lshg29s6mttr5hgd','/','Web Client Ping','2026-09-09 06:58:38','2026-09-09 06:59:03'),('vid_lw9498i7jmt4b3g9q','/nstp-system/','Web Client Ping','2026-08-29 03:39:27','2026-09-03 03:58:33'),('vid_n5b5g0g7mtrybg83','/','Web Client Ping','2026-09-09 12:21:46','2026-09-14 10:33:20'),('vid_okgqjbkjmtinid8u','/','Web Client Ping','2026-09-01 12:36:17','2026-09-01 12:36:18'),('vid_pgr5agicmtd1to13','/','Web Client Ping','2026-08-28 14:30:22','2026-09-05 09:34:56'),('vid_szej4la25mt9cx56l','/nstp-system/login','Web Client Ping','2026-08-26 00:29:55','2026-08-26 00:29:55'),('vid_t30cm1cpmue7fyhi','/nstp-system/admin/dashboard','Web Client Ping','2026-09-24 01:21:47','2026-09-29 17:42:46'),('vid_vcgiefmuwmt8wteyi','/nstp-system/login','Web Client Ping','2026-08-25 16:59:07','2026-08-25 16:59:07'),('vid_z109ft59nmt8wvsqw','/nstp-system/login','Web Client Ping','2026-08-25 17:00:58','2026-08-25 17:00:58'),('vis_test_1787703152233','/audit-test','Web Client Ping','2026-08-26 00:12:32','2026-08-26 00:12:32'),('vis_test_1787703196813','/audit-test','Web Client Ping','2026-08-26 00:13:17','2026-08-26 00:13:17'),('vis_test_1787703232548','/audit-test','Web Client Ping','2026-08-26 00:13:52','2026-08-26 00:13:52'),('vis_test_1787741847161','/audit-test','Web Client Ping','2026-08-26 10:57:27','2026-08-26 10:57:27'),('vis_test_1787741882902','/audit-test','Web Client Ping','2026-08-26 10:58:03','2026-08-26 10:58:03'),('vis_test_1787741953775','/audit-test','Web Client Ping','2026-08-26 10:59:14','2026-08-26 10:59:14'),('vis_test_1788069995917','/audit-test','Web Client Ping','2026-08-30 06:06:36','2026-08-30 06:06:36'),('vis_test_1788070032916','/audit-test','Web Client Ping','2026-08-30 06:07:13','2026-08-30 06:07:13'),('vis_test_1788839582569','/audit-test','Web Client Ping','2026-09-08 03:53:02','2026-09-08 03:53:02');
/*!40000 ALTER TABLE `active_visitors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `archived_years`
--

DROP TABLE IF EXISTS `archived_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=1033 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'login_success',1,'role: admin','::1','2026-05-28 19:29:42'),(2,'login_success',1,'role: admin','::1','2026-05-28 19:42:44'),(3,'login_success',1,'role: admin','::1','2026-05-28 19:58:24'),(4,'login_success',3,'role: instructor','::1','2026-05-28 20:01:10'),(5,'login_success',3,'role: instructor','::1','2026-05-28 20:01:40'),(6,'login_success',1,'role: admin','::1','2026-05-28 20:03:29'),(7,'login_success',1,'role: admin','::1','2026-05-29 01:33:23'),(9,'login_failed',NULL,'email: admin@cvsu.edu.ph','::1','2026-05-29 01:57:19'),(10,'login_success',1,'role: admin','::1','2026-05-29 01:57:22'),(12,'login_failed',NULL,'email: cwts@cvsu.edu.ph','::1','2026-05-29 02:00:09'),(13,'login_failed',NULL,'email: cwts@cvsu.edu.ph','::1','2026-05-29 02:00:14'),(14,'login_failed',NULL,'email: cwts@cvsu.edu.ph','::1','2026-05-29 02:00:19'),(15,'login_failed',NULL,'email: cwts@cvsu.edu.ph','::1','2026-05-29 02:00:30'),(16,'login_failed',NULL,'email: admin@cvsu.edu.ph','::1','2026-05-29 02:00:53'),(17,'login_success',1,'role: admin','::1','2026-05-29 02:10:34'),(18,'password_changed',1,NULL,'::1','2026-05-29 02:11:15'),(19,'login_failed',NULL,'email: admin@cvsu.edu.ph','::1','2026-05-29 02:11:24'),(20,'login_success',1,'role: admin','::1','2026-05-29 02:11:31'),(21,'password_changed',1,NULL,'::1','2026-05-29 02:11:47'),(22,'login_success',1,'role: admin','::1','2026-05-29 04:40:29'),(23,'login_success',1,'role: admin','::1','2026-05-29 05:07:29'),(24,'login_success',2,'role: instructor','::1','2026-05-29 05:07:41'),(25,'login_success',1,'role: admin','::1','2026-05-29 05:19:21'),(26,'login_success',2,'role: instructor','::1','2026-05-29 05:19:33'),(27,'login_success',2,'role: instructor','::1','2026-05-29 05:24:40'),(28,'login_success',3,'role: instructor','::1','2026-05-29 05:24:49'),(29,'login_failed',NULL,'email: rotc@cvsu.edu.ph','::1','2026-05-29 05:37:35'),(30,'login_success',4,'role: instructor','::1','2026-05-29 05:37:39'),(31,'login_success',3,'role: instructor','::1','2026-05-29 05:37:52'),(32,'login_success',4,'role: instructor','::1','2026-05-29 05:50:39'),(33,'login_success',3,'role: instructor','::1','2026-05-29 05:50:47'),(34,'login_success',1,'role: admin','::1','2026-05-29 08:08:36'),(36,'login_success',2,'role: instructor','::1','2026-05-29 08:28:58'),(37,'login_success',1,'role: admin','::1','2026-05-29 09:30:57'),(38,'login_success',1,'role: admin','::1','2026-05-29 10:13:02'),(39,'login_success',1,'role: admin','::1','2026-05-29 14:51:49'),(40,'login_success',1,'role: admin','::1','2026-05-29 17:38:13'),(42,'login_success',1,'role: admin','::1','2026-05-29 17:49:53'),(43,'login_success',1,'role: admin','::1','2026-05-29 18:04:20'),(44,'login_success',2,'role: instructor','::1','2026-05-29 18:06:38'),(45,'login_success',3,'role: instructor','::1','2026-05-29 18:08:26'),(46,'login_success',4,'role: instructor','::1','2026-05-29 18:09:31'),(47,'login_success',1,'role: admin','::1','2026-05-29 18:10:29'),(48,'login_success',1,'role: admin','::1','2026-05-30 01:42:29'),(49,'login_success',1,'role: admin','::1','2026-05-30 01:52:40'),(50,'login_success',1,'role: admin','::1','2026-05-30 03:02:59'),(51,'login_success',1,'role: admin','::1','2026-05-30 08:05:38'),(52,'login_success',1,'role: admin','::1','2026-05-30 09:06:42'),(53,'login_success',1,'role: admin','::1','2026-05-30 14:29:28'),(54,'login_success',1,'role: admin','::1','2026-06-04 02:46:58'),(56,'login_failed',NULL,'email: Richard123456@gmail.com','::1','2026-06-04 02:51:30'),(57,'login_failed',NULL,'email: Richard123456@gmail.com','::1','2026-06-04 02:51:32'),(58,'login_failed',NULL,'email: Richard123@gmail.com','::1','2026-06-04 02:52:07'),(59,'login_failed',NULL,'email: Richard123@gmail.com','::1','2026-06-04 02:52:11'),(60,'login_success',5,'role: instructor','::1','2026-06-04 02:52:58'),(61,'login_success',1,'role: admin','::1','2026-06-04 02:54:00'),(62,'login_success',1,'role: admin','::1','2026-06-04 02:57:51'),(63,'login_success',1,'role: admin','::1','2026-06-04 03:01:32'),(64,'login_success',NULL,'role: instructor','::1','2026-06-04 03:17:09'),(65,'login_success',1,'role: admin','::1','2026-06-04 03:18:19'),(66,'login_success',NULL,'role: instructor','::1','2026-06-04 03:24:00'),(67,'login_success',1,'role: admin','::1','2026-06-04 03:28:24'),(68,'login_success',1,'role: admin','::1','2026-06-11 07:49:19'),(71,'login_success',1,'role: admin','::1','2026-06-15 04:16:17'),(72,'login_success',1,'role: admin','::1','2026-06-15 04:19:52'),(73,'login_success',4,'role: instructor','::1','2026-06-15 04:21:22'),(74,'login_success',1,'role: admin','::1','2026-06-15 05:19:57'),(75,'login_success',1,'role: admin','::1','2026-06-15 05:21:58'),(76,'login_success',1,'role: admin','::1','2026-06-15 05:28:52'),(79,'login_success',1,'role: admin','::1','2026-06-15 05:39:09'),(80,'login_success',1,'role: admin','::1','2026-06-15 05:39:15'),(81,'login_success',1,'role: admin','::1','2026-06-15 05:55:06'),(83,'login_success',2,'role: instructor','::1','2026-06-15 05:55:58'),(84,'login_success',1,'role: admin','::1','2026-06-15 05:59:59'),(85,'login_success',1,'role: admin','::1','2026-06-16 15:09:50'),(87,'login_success',2,'role: instructor','::1','2026-06-16 15:53:25'),(88,'login_success',1,'role: admin','::1','2026-06-16 16:10:14'),(89,'login_success',1,'role: admin','::1','2026-06-17 00:20:35'),(90,'login_success',1,'role: admin','::1','2026-06-17 04:44:32'),(91,'login_success',1,'role: admin','::1','2026-06-19 02:20:32'),(92,'login_success',1,'role: admin','::1','2026-06-19 10:24:53'),(94,'login_success',1,'role: admin','::1','2026-06-19 11:06:22'),(95,'login_success',1,'role: admin','::1','2026-06-26 09:26:37'),(96,'login_success',1,'role: admin','::1','2026-06-26 09:37:01'),(97,'login_success',1,'role: admin','::1','2026-06-26 10:11:38'),(99,'login_success',2,'role: instructor','::1','2026-06-26 10:42:08'),(100,'login_failed',NULL,'email: rotc@cvsu.edu.p','::1','2026-06-26 10:42:25'),(101,'login_success',4,'role: instructor','::1','2026-06-26 10:42:34'),(102,'login_success',4,'role: instructor','::1','2026-06-26 10:51:05'),(103,'login_success',1,'role: admin','::1','2026-06-26 10:52:24'),(104,'login_success',1,'role: admin','::1','2026-07-19 08:24:57'),(105,'login_failed',NULL,'email: admin@cvsu.edu.ph','::1','2026-07-19 08:29:08'),(106,'login_success',1,'role: admin','::1','2026-07-19 08:29:10'),(108,'login_failed',NULL,'email: admin@cvsu.edu.ph','::1','2026-07-19 09:01:32'),(109,'login_success',1,'role: admin','::1','2026-07-19 09:01:38'),(110,'login_success',1,'role: admin','::1','2026-08-04 12:39:49'),(111,'login_failed',NULL,'email: admin@cvsu.edu.ph','::1','2026-08-04 12:43:36'),(112,'login_success',1,'role: admin','::1','2026-08-04 12:43:39'),(113,'login_success',1,'role: admin','::1','2026-08-04 14:40:02'),(114,'login_success',1,'role: admin','::1','2026-08-04 14:55:20'),(115,'login_success',1,'role: admin','::1','2026-08-04 15:12:10'),(116,'login_success',1,'role: admin','::1','2026-08-05 08:19:09'),(117,'login_success',1,'role: admin','::1','2026-08-05 11:20:23'),(118,'login_success',2,'role: instructor','::1','2026-08-05 11:26:21'),(119,'login_success',1,'role: admin','::1','2026-08-05 11:28:35'),(120,'login_success',2,'role: instructor','::1','2026-08-05 11:28:46'),(121,'login_success',1,'role: admin','::1','2026-08-05 11:33:37'),(122,'login_success',1,'role: admin','::1','2026-08-05 12:33:57'),(123,'login_success',1,'role: instructor','::1','2026-08-05 15:52:20'),(124,'login_success',1,'role: admin','::1','2026-08-05 16:13:19'),(125,'login_success',1,'role: admin','::1','2026-08-05 16:51:56'),(126,'login_success',1,'role: admin','::1','2026-08-05 16:52:28'),(127,'login_success',2,'role: instructor','::1','2026-08-05 17:12:41'),(128,'login_success',1,'role: admin','::1','2026-08-05 17:27:23'),(129,'login_success',1,'role: admin','::1','2026-08-06 18:55:04'),(130,'login_success',1,'role: admin','::1','2026-08-06 19:19:02'),(131,'login_success',1,'role: admin','::1','2026-08-06 19:21:50'),(133,'login_success',1,'role: admin','::1','2026-08-06 20:21:03'),(134,'login_failed',NULL,'email: cwts@cvsu.edu.ph','::1','2026-08-06 20:24:42'),(135,'login_success',2,'role: instructor','::1','2026-08-06 20:24:45'),(136,'login_success',1,'role: admin','::1','2026-08-06 20:29:06'),(138,'login_success',1,'role: admin','::1','2026-08-07 01:51:05'),(139,'login_success',1,'role: admin','127.0.0.1','2026-08-08 02:52:42'),(140,'login_success',1,'role: admin','127.0.0.1','2026-08-08 02:55:32'),(141,'login_success',1,'role: admin','127.0.0.1','2026-08-08 13:08:24'),(142,'login_success',1,'role: admin','127.0.0.1','2026-08-08 13:11:27'),(143,'login_success',2,'role: instructor','127.0.0.1','2026-08-08 13:16:51'),(144,'login_success',4,'role: instructor','127.0.0.1','2026-08-08 13:17:50'),(145,'login_failed',NULL,'email: admin@cvsu.edu.ph','127.0.0.1','2026-08-08 13:25:09'),(146,'login_success',1,'role: admin','127.0.0.1','2026-08-08 13:25:17'),(147,'login_success',4,'role: instructor','127.0.0.1','2026-08-08 13:32:15'),(148,'login_success',4,'role: instructor','127.0.0.1','2026-08-08 14:09:20'),(149,'login_success',1,'role: admin','127.0.0.1','2026-08-08 14:59:40'),(150,'login_success',4,'role: instructor','127.0.0.1','2026-08-08 14:59:49'),(151,'login_success',1,'role: admin','127.0.0.1','2026-08-08 16:38:02'),(152,'login_success',2,'role: instructor','127.0.0.1','2026-08-08 16:38:55'),(153,'login_success',1,'role: admin','127.0.0.1','2026-08-08 16:47:30'),(154,'login_success',1,'role: admin','127.0.0.1','2026-08-08 16:52:32'),(155,'login_success',1,'role: admin','127.0.0.1','2026-08-08 16:57:08'),(156,'login_success',1,'role: admin','127.0.0.1','2026-08-08 16:57:28'),(157,'login_success',1,'role: admin','127.0.0.1','2026-08-09 02:09:04'),(158,'login_success',1,'role: admin','127.0.0.1','2026-08-09 02:15:55'),(159,'login_success',1,'role: admin','127.0.0.1','2026-08-09 02:36:08'),(161,'login_success',1,'role: admin','127.0.0.1','2026-08-09 02:52:52'),(162,'login_success',1,'role: admin','127.0.0.1','2026-08-09 03:19:31'),(163,'login_success',1,'role: admin','127.0.0.1','2026-08-09 03:27:35'),(164,'login_success',1,'role: admin','127.0.0.1','2026-08-09 03:33:13'),(165,'login_failed',NULL,'email: admin@cvsu.edu.ph','127.0.0.1','2026-08-09 03:46:46'),(166,'login_success',1,'role: admin','127.0.0.1','2026-08-09 03:46:55'),(168,'login_success',1,'role: admin','127.0.0.1','2026-08-09 04:35:41'),(169,'login_success',4,'role: instructor','127.0.0.1','2026-08-09 18:39:53'),(170,'login_success',4,'role: instructor','127.0.0.1','2026-08-09 19:02:47'),(171,'login_success',4,'role: instructor','127.0.0.1','2026-08-09 19:07:04'),(172,'login_success',4,'role: instructor','127.0.0.1','2026-08-09 19:08:53'),(173,'login_success',4,'role: instructor','127.0.0.1','2026-08-09 19:29:53'),(174,'login_success',1,'role: admin','127.0.0.1','2026-08-09 19:33:05'),(175,'login_success',1,'role: admin','127.0.0.1','2026-08-10 02:36:45'),(176,'login_success',1,'role: admin','127.0.0.1','2026-08-10 02:36:58'),(177,'login_success',4,'role: instructor','127.0.0.1','2026-08-10 02:51:51'),(178,'login_failed',NULL,'wrong_password: admin@cvsu.edu.ph','127.0.0.1','2026-08-10 03:17:07'),(179,'login_success',1,'role: admin','127.0.0.1','2026-08-10 03:25:25'),(180,'login_success',1,'role: admin','127.0.0.1','2026-08-10 03:45:51'),(181,'login_success',1,'role: admin','127.0.0.1','2026-08-12 05:59:48'),(182,'login_success',1,'role: admin','127.0.0.1','2026-08-12 06:04:47'),(183,'login_success',1,'role: admin','127.0.0.1','2026-08-18 12:16:29'),(187,'login_success',1,'role: admin','127.0.0.1','2026-08-18 12:48:17'),(188,'login_success',1,'role: admin','127.0.0.1','2026-08-18 13:04:01'),(189,'login_success',1,'role: admin','127.0.0.1','2026-08-18 15:24:32'),(190,'login_success',1,'role: admin','127.0.0.1','2026-08-18 15:38:27'),(191,'login_success',1,'role: admin','127.0.0.1','2026-08-18 15:49:34'),(192,'login_success',2,'role: instructor','127.0.0.1','2026-08-18 15:50:51'),(193,'login_success',1,'role: admin','127.0.0.1','2026-08-18 16:57:58'),(194,'login_success',1,'role: admin','127.0.0.1','2026-08-18 17:07:25'),(196,'login_success',1,'role: admin','127.0.0.1','2026-08-18 17:19:14'),(197,'login_success',1,'role: admin','127.0.0.1','2026-08-18 17:28:17'),(198,'login_success',1,'role: admin','127.0.0.1','2026-08-18 17:38:51'),(199,'login_success',1,'role: admin','127.0.0.1','2026-08-18 17:39:37'),(200,'login_success',1,'role: admin','127.0.0.1','2026-08-18 17:48:14'),(203,'login_success',2,'role: instructor','127.0.0.1','2026-08-18 17:51:03'),(204,'login_success',1,'role: admin','127.0.0.1','2026-08-18 17:52:22'),(205,'login_success',2,'role: instructor','127.0.0.1','2026-08-18 18:30:01'),(206,'login_success',1,'role: admin','127.0.0.1','2026-08-18 18:35:18'),(207,'login_success',2,'role: instructor','127.0.0.1','2026-08-18 18:45:40'),(208,'login_success',1,'role: admin','127.0.0.1','2026-08-18 18:52:58'),(211,'login_success',1,'role: admin','127.0.0.1','2026-08-18 19:39:38'),(212,'login_success',1,'role: admin','127.0.0.1','2026-08-18 19:43:54'),(213,'login_success',1,'role: admin','127.0.0.1','2026-08-18 19:57:52'),(214,'login_success',2,'role: instructor','127.0.0.1','2026-08-18 20:09:53'),(221,'login_success',1,'role: admin','127.0.0.1','2026-08-18 20:35:18'),(222,'login_success',2,'role: instructor','127.0.0.1','2026-08-18 20:36:34'),(229,'login_success',1,'role: admin','127.0.0.1','2026-08-19 02:56:57'),(230,'login_success',1,'role: admin','127.0.0.1','2026-08-19 03:10:44'),(231,'login_success',4,'role: instructor','127.0.0.1','2026-08-19 03:13:28'),(232,'login_success',4,'role: instructor','127.0.0.1','2026-08-19 03:16:28'),(233,'login_failed',NULL,'wrong_password: rotc@cvsu.edu.ph','127.0.0.1','2026-08-19 03:19:57'),(234,'login_success',4,'role: instructor','127.0.0.1','2026-08-19 03:20:05'),(235,'login_success',1,'role: admin','127.0.0.1','2026-08-19 03:21:05'),(236,'login_success',4,'role: instructor','127.0.0.1','2026-08-19 03:29:18'),(237,'login_success',2,'role: instructor','127.0.0.1','2026-08-19 03:29:40'),(238,'login_success',1,'role: admin','127.0.0.1','2026-08-19 03:30:54'),(239,'login_success',4,'role: instructor','127.0.0.1','2026-08-19 03:33:32'),(240,'login_success',4,'role: instructor','127.0.0.1','2026-08-19 03:38:05'),(245,'login_success',1,'role: admin','127.0.0.1','2026-08-19 06:21:53'),(246,'login_success',1,'role: admin','127.0.0.1','2026-08-19 06:23:39'),(247,'login_success',2,'role: instructor','127.0.0.1','2026-08-19 06:26:37'),(248,'login_success',2,'role: instructor','127.0.0.1','2026-08-19 06:27:28'),(249,'login_success',1,'role: admin','127.0.0.1','2026-08-19 06:31:18'),(250,'login_success',2,'role: instructor','127.0.0.1','2026-08-19 06:52:33'),(251,'login_success',1,'role: admin','127.0.0.1','2026-08-19 10:33:29'),(252,'login_success',1,'role: admin','127.0.0.1','2026-08-19 10:48:58'),(254,'login_success',1,'role: admin','127.0.0.1','2026-08-20 12:54:25'),(255,'login_success',1,'role: admin','127.0.0.1','2026-08-20 12:54:40'),(256,'login_success',1,'role: admin','127.0.0.1','2026-08-20 15:53:27'),(257,'login_success',1,'role: admin','127.0.0.1','2026-08-20 15:59:16'),(258,'login_success',1,'role: admin','127.0.0.1','2026-08-20 15:59:38'),(259,'login_success',1,'role: admin','127.0.0.1','2026-08-20 15:59:59'),(260,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:00:10'),(261,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:00:20'),(262,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:00:30'),(263,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:00:36'),(264,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:00:42'),(265,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:01:38'),(266,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:01:42'),(267,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:04:32'),(268,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:04:50'),(269,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:05:00'),(270,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:05:07'),(271,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:05:12'),(272,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:05:16'),(273,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:13:21'),(274,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:14:04'),(275,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:56:17'),(276,'login_success',1,'role: admin','127.0.0.1','2026-08-20 16:56:28'),(277,'login_success',1,'role: admin','127.0.0.1','2026-08-20 17:01:59'),(278,'login_success',1,'role: admin','127.0.0.1','2026-08-20 17:02:06'),(282,'login_success',1,'role: admin','127.0.0.1','2026-08-20 18:30:33'),(283,'login_success',1,'role: admin','127.0.0.1','2026-08-20 18:48:25'),(284,'login_success',1,'role: admin','127.0.0.1','2026-08-20 19:45:04'),(285,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:13:19'),(286,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:13:29'),(287,'login_prompt_active_session',1,'prompt_concurrent_login: admin@cvsu.edu.ph','127.0.0.1','2026-08-21 04:13:29'),(288,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:13:34'),(289,'login_prompt_active_session',1,'prompt_concurrent_login: admin@cvsu.edu.ph','127.0.0.1','2026-08-21 04:14:05'),(290,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:14:06'),(291,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:14:16'),(292,'login_prompt_active_session',1,'prompt_concurrent_login: admin@cvsu.edu.ph','127.0.0.1','2026-08-21 04:14:31'),(293,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:14:31'),(294,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:14:35'),(295,'login_failed',NULL,'email_not_found: admin@cvsu.edu','127.0.0.1','2026-08-21 04:57:16'),(296,'login_failed',NULL,'wrong_password: admin@cvsu.edu.ph','127.0.0.1','2026-08-21 04:57:28'),(297,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:57:34'),(298,'login_blocked_active_session',1,'blocked_concurrent_login: admin@cvsu.edu.ph','127.0.0.1','2026-08-21 04:57:34'),(299,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:57:52'),(300,'login_blocked_active_session',1,'blocked_concurrent_login: admin@cvsu.edu.ph','127.0.0.1','2026-08-21 04:58:59'),(301,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:58:59'),(302,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:59:08'),(303,'login_blocked_active_session',1,'blocked_concurrent_login: admin@cvsu.edu.ph','127.0.0.1','2026-08-21 04:59:08'),(304,'login_success',1,'role: admin','127.0.0.1','2026-08-21 04:59:16'),(305,'login_blocked_active_session',1,'blocked_concurrent_login: admin@cvsu.edu.ph','127.0.0.1','2026-08-21 04:59:16'),(306,'login_success',1,'role: admin','127.0.0.1','2026-08-21 05:17:31'),(307,'login_success',1,'role: admin','127.0.0.1','2026-08-21 05:53:22'),(308,'login_success',1,'role: admin','127.0.0.1','2026-08-21 06:10:55'),(309,'login_success',1,'role: admin','127.0.0.1','2026-08-21 06:13:10'),(310,'password_reset_success',NULL,'email: richardbelen99@gmail.com','127.0.0.1','2026-08-21 08:28:42'),(311,'login_success',2,'role: instructor','127.0.0.1','2026-08-21 09:39:08'),(312,'login_success',1,'role: admin','127.0.0.1','2026-08-22 12:06:49'),(313,'login_success',1,'role: admin','127.0.0.1','2026-08-22 12:10:00'),(315,'login_success',1,'role: admin','127.0.0.1','2026-08-22 15:05:40'),(316,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-22 15:06:45'),(317,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-22 15:06:46'),(318,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-22 15:06:47'),(320,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-22 15:24:31'),(321,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-22 15:24:31'),(322,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-22 15:24:32'),(323,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-22 15:24:33'),(324,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-22 15:24:33'),(325,'login_success',4,'role: instructor','127.0.0.1','2026-08-22 15:27:41'),(328,'login_success',1,'role: admin','127.0.0.1','2026-08-22 15:55:32'),(329,'login_success',2,'role: instructor','127.0.0.1','2026-08-22 16:54:33'),(330,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-23 12:30:49'),(331,'login_success',1,'role: admin','127.0.0.1','2026-08-23 12:30:53'),(332,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-23 12:31:26'),(333,'login_success',1,'role: admin','127.0.0.1','2026-08-23 12:31:26'),(334,'login_success',1,'role: admin','127.0.0.1','2026-08-23 12:31:33'),(335,'login_success',1,'role: admin','127.0.0.1','2026-08-23 12:35:08'),(336,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:34'),(337,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:34'),(338,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:35'),(339,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:36'),(340,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:37'),(341,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:43'),(342,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:48'),(343,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:49'),(344,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:50'),(345,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:51'),(346,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:52'),(347,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:52'),(348,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:52'),(349,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:52'),(350,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:53'),(351,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:53'),(352,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:53'),(353,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:53'),(354,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:53'),(355,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:54'),(356,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:35:54'),(357,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-23 12:36:13'),(358,'login_success',1,'role: admin','127.0.0.1','2026-08-24 03:52:35'),(359,'login_success',1,'role: admin','127.0.0.1','2026-08-24 04:06:00'),(360,'login_success',1,'role: admin','127.0.0.1','2026-08-24 04:18:10'),(361,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-24 04:18:34'),(362,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-24 04:18:35'),(363,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-24 04:18:35'),(364,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-24 04:18:40'),(365,'login_success',1,'role: admin','127.0.0.1','2026-08-25 11:55:46'),(366,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-25 11:55:46'),(367,'login_success',1,'role: admin','127.0.0.1','2026-08-25 11:55:54'),(369,'login_success',1,'role: admin','127.0.0.1','2026-08-25 14:54:27'),(370,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-25 14:54:27'),(371,'login_success',1,'role: admin','127.0.0.1','2026-08-25 14:55:14'),(372,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-25 14:56:39'),(373,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-25 14:56:50'),(374,'login_success',1,'role: admin','127.0.0.1','2026-08-25 15:00:19'),(375,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-25 15:00:46'),(376,'login_success',1,'role: admin','127.0.0.1','2026-08-25 15:00:46'),(377,'login_success',1,'role: admin','127.0.0.1','2026-08-25 15:00:48'),(378,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-25 15:02:46'),(379,'login_success',1,'role: admin','127.0.0.1','2026-08-25 15:02:46'),(380,'login_success',1,'role: admin','127.0.0.1','2026-08-25 15:02:48'),(381,'login_success',1,'role: admin','127.0.0.1','2026-08-25 15:14:00'),(382,'login_success',1,'role: admin','127.0.0.1','2026-08-25 15:16:18'),(383,'login_success',1,'role: admin','127.0.0.1','2026-08-25 15:38:18'),(384,'login_success',4,'role: instructor','127.0.0.1','2026-08-25 15:50:30'),(385,'login_prompt_active_session',4,'prompt_concurrent_login: rotc@cvsu.edu.ph','127.0.0.1','2026-08-25 15:51:02'),(386,'login_success',4,'role: instructor','127.0.0.1','2026-08-25 15:51:02'),(387,'login_success',4,'role: instructor','127.0.0.1','2026-08-25 15:51:09'),(388,'login_success',2,'role: instructor','127.0.0.1','2026-08-25 16:00:39'),(391,'login_failed',NULL,'wrong_password: admin@cvsu.edu.ph','127.0.0.1','2026-08-26 00:11:00'),(392,'login_failed',NULL,'email_not_found: cwts@cvsu.edu.ph','127.0.0.1','2026-08-26 00:11:01'),(393,'login_failed',NULL,'wrong_password: admin@cvsu.edu.ph','127.0.0.1','2026-08-26 00:12:32'),(394,'login_success',2,'role: instructor','127.0.0.1','2026-08-26 00:12:33'),(395,'login_success',3,'role: instructor','127.0.0.1','2026-08-26 00:12:34'),(396,'login_success',4,'role: instructor','127.0.0.1','2026-08-26 00:12:34'),(397,'login_success',5,'role: admin','127.0.0.1','2026-08-26 00:13:18'),(398,'login_success',2,'role: instructor','127.0.0.1','2026-08-26 00:13:19'),(399,'login_success',3,'role: instructor','127.0.0.1','2026-08-26 00:13:20'),(400,'login_success',4,'role: instructor','127.0.0.1','2026-08-26 00:13:20'),(402,'login_success',5,'role: admin','127.0.0.1','2026-08-26 00:13:54'),(403,'login_success',2,'role: instructor','127.0.0.1','2026-08-26 00:13:54'),(404,'login_success',3,'role: instructor','127.0.0.1','2026-08-26 00:13:55'),(405,'login_success',4,'role: instructor','127.0.0.1','2026-08-26 00:13:56'),(409,'login_success',1,'role: admin','127.0.0.1','2026-08-26 00:15:30'),(412,'login_success',1,'role: admin','127.0.0.1','2026-08-26 00:16:39'),(413,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-26 00:16:39'),(414,'login_success',1,'role: admin','127.0.0.1','2026-08-26 00:16:42'),(415,'password_reset_success',NULL,'staff_email: clarkebelen28@gmail.com','127.0.0.1','2026-08-26 00:30:29'),(416,'login_success',2,'role: instructor','127.0.0.1','2026-08-26 00:30:42'),(417,'login_success',1,'role: admin','127.0.0.1','2026-08-26 00:34:07'),(418,'login_success',1,'role: admin','127.0.0.1','2026-08-26 00:58:04'),(419,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-26 00:58:04'),(420,'login_success',1,'role: admin','127.0.0.1','2026-08-26 00:58:06'),(421,'login_failed',NULL,'wrong_password: clarkebelen28@gmail.com','127.0.0.1','2026-08-26 01:07:52'),(422,'login_failed',NULL,'wrong_password: clarkebelen28@gmail.com','127.0.0.1','2026-08-26 01:08:05'),(423,'login_success',2,'role: instructor','127.0.0.1','2026-08-26 01:09:54'),(426,'login_success',1,'role: admin','127.0.0.1','2026-08-26 01:12:01'),(427,'login_success',5,'role: admin','127.0.0.1','2026-08-26 10:56:18'),(429,'login_success',5,'role: admin','127.0.0.1','2026-08-26 10:57:06'),(431,'login_success',5,'role: admin','127.0.0.1','2026-08-26 10:57:28'),(432,'login_success',2,'role: instructor','127.0.0.1','2026-08-26 10:57:29'),(433,'login_success',3,'role: instructor','127.0.0.1','2026-08-26 10:57:29'),(434,'login_success',4,'role: instructor','127.0.0.1','2026-08-26 10:57:30'),(438,'login_success',5,'role: admin','127.0.0.1','2026-08-26 10:58:03'),(439,'login_success',2,'role: instructor','127.0.0.1','2026-08-26 10:58:04'),(440,'login_success',3,'role: instructor','127.0.0.1','2026-08-26 10:58:05'),(441,'login_success',4,'role: instructor','127.0.0.1','2026-08-26 10:58:06'),(445,'login_success',5,'role: admin','127.0.0.1','2026-08-26 10:59:14'),(446,'login_success',2,'role: instructor','127.0.0.1','2026-08-26 10:59:15'),(447,'login_success',3,'role: instructor','127.0.0.1','2026-08-26 10:59:16'),(448,'login_success',4,'role: instructor','127.0.0.1','2026-08-26 10:59:17'),(452,'login_success',1,'role: admin','127.0.0.1','2026-08-26 15:32:32'),(456,'login_failed',NULL,'wrong_password: clarkebelen28@gmail.com','127.0.0.1','2026-08-26 16:29:53'),(457,'login_failed',NULL,'wrong_password: clarkebelen28@gmail.com','127.0.0.1','2026-08-26 16:30:02'),(458,'login_success',2,'role: instructor','127.0.0.1','2026-08-26 16:30:10'),(459,'login_success',1,'role: admin','127.0.0.1','2026-08-26 16:31:41'),(460,'login_success',1,'role: admin','127.0.0.1','2026-08-27 06:02:37'),(461,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-27 06:02:37'),(462,'login_success',1,'role: admin','127.0.0.1','2026-08-27 06:03:51'),(463,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-27 07:07:27'),(464,'login_success',1,'role: admin','127.0.0.1','2026-08-27 07:07:27'),(465,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-27 07:07:30'),(466,'login_success',1,'role: admin','127.0.0.1','2026-08-27 07:07:30'),(467,'login_failed',NULL,'wrong_password: clarkebelen28@gmail.com','127.0.0.1','2026-08-27 07:08:10'),(468,'login_success',2,'role: instructor','127.0.0.1','2026-08-27 07:08:18'),(469,'login_success',1,'role: admin','127.0.0.1','2026-08-27 07:09:38'),(470,'login_prompt_active_session',1,'prompt_concurrent_login: richardbelen99@gmail.com','127.0.0.1','2026-08-27 08:26:41'),(471,'login_success',1,'role: admin','127.0.0.1','2026-08-27 08:26:41'),(472,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-27 08:40:24'),(473,'login_success',1,'role: admin','127.0.0.1','2026-08-27 08:40:27'),(474,'login_success',1,'role: admin','127.0.0.1','2026-08-27 09:15:59'),(475,'login_success',1,'role: admin','127.0.0.1','2026-08-27 12:55:23'),(476,'login_success',1,'role: admin','127.0.0.1','2026-08-27 14:40:28'),(477,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:32'),(478,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:33'),(479,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:33'),(480,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:33'),(481,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:33'),(482,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:33'),(483,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:34'),(484,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:34'),(485,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:34'),(486,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-08-27 14:40:34'),(487,'login_success',1,'role: admin','127.0.0.1','2026-08-27 15:01:57'),(488,'login_success',1,'role: admin','127.0.0.1','2026-08-27 15:38:28'),(489,'login_failed',NULL,'email_not_found: richardbelen99@gmai.com','127.0.0.1','2026-08-27 15:39:31'),(490,'login_failed',NULL,'email_not_found: richardbelen99@gmai.com','127.0.0.1','2026-08-27 15:39:37'),(491,'login_success',1,'role: admin','127.0.0.1','2026-08-27 15:39:51'),(492,'login_success',1,'role: admin','127.0.0.1','2026-08-27 15:48:56'),(497,'login_success',1,'role: admin','127.0.0.1','2026-08-27 17:16:54'),(499,'login_success',1,'role: admin','127.0.0.1','2026-08-28 01:47:08'),(501,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-28 15:30:40'),(502,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-28 15:30:56'),(503,'login_success',1,'role: admin','127.0.0.1','2026-08-28 15:31:08'),(506,'login_success',1,'role: admin','127.0.0.1','2026-08-28 15:49:52'),(507,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-08-28 15:50:00'),(508,'login_success',1,'role: admin','127.0.0.1','2026-08-28 15:55:01'),(510,'login_success',1,'role: admin','127.0.0.1','2026-08-28 16:21:11'),(514,'login_success',1,'role: admin','127.0.0.1','2026-08-28 23:03:34'),(516,'login_success',1,'role: admin','127.0.0.1','2026-08-29 03:43:47'),(517,'login_success',1,'role: admin','127.0.0.1','2026-08-29 03:43:53'),(518,'login_success',2,'role: instructor','127.0.0.1','2026-08-29 03:50:18'),(519,'login_success',2,'role: instructor','127.0.0.1','2026-08-29 03:50:20'),(520,'login_success',1,'role: admin','127.0.0.1','2026-08-29 04:45:25'),(521,'login_success',2,'role: instructor','127.0.0.1','2026-08-29 10:57:44'),(522,'login_success',1,'role: admin','127.0.0.1','2026-08-29 11:03:09'),(523,'login_success',1,'role: admin','127.0.0.1','2026-08-29 16:16:26'),(525,'login_success',4,'role: instructor','127.0.0.1','2026-08-29 16:39:57'),(526,'login_failed',NULL,'wrong_password: admin@cvsu.edu.ph','127.0.0.1','2026-08-30 06:06:36'),(527,'login_success',2,'role: instructor','127.0.0.1','2026-08-30 06:06:37'),(528,'login_success',3,'role: instructor','127.0.0.1','2026-08-30 06:06:38'),(529,'login_success',4,'role: instructor','127.0.0.1','2026-08-30 06:06:39'),(530,'login_failed',NULL,'wrong_password: admin@cvsu.edu.ph','127.0.0.1','2026-08-30 06:06:44'),(531,'login_failed',NULL,'wrong_password: admin@cvsu.edu.ph','127.0.0.1','2026-08-30 06:06:52'),(532,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:06:52'),(533,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:06:52'),(534,'login_success',1,'role: admin','127.0.0.1','2026-08-30 06:07:13'),(535,'login_success',2,'role: instructor','127.0.0.1','2026-08-30 06:07:14'),(536,'login_success',3,'role: instructor','127.0.0.1','2026-08-30 06:07:15'),(537,'login_success',4,'role: instructor','127.0.0.1','2026-08-30 06:07:16'),(541,'login_success',1,'role: admin','127.0.0.1','2026-08-30 06:07:48'),(543,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:10:40'),(544,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:11:29'),(545,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:11:37'),(546,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:11:48'),(547,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:11:57'),(548,'password_reset_success',NULL,'staff_email: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:12:54'),(549,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:16:13'),(550,'login_success',1,'role: admin','127.0.0.1','2026-08-30 06:16:43'),(551,'login_success',1,'role: admin','127.0.0.1','2026-08-30 06:18:32'),(552,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:21:02'),(553,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:21:10'),(554,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:21:15'),(555,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:21:20'),(556,'login_success',1,'role: admin','127.0.0.1','2026-08-30 06:22:47'),(557,'login_success',1,'role: admin','127.0.0.1','2026-08-30 06:22:48'),(558,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:31:23'),(559,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 06:31:54'),(560,'login_success',1,'role: admin','127.0.0.1','2026-08-30 08:33:30'),(561,'login_success',1,'role: admin','127.0.0.1','2026-08-30 08:34:52'),(562,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 12:20:58'),(563,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 12:25:40'),(564,'login_failed',NULL,'email_not_found: richardbelen@gmail.com','127.0.0.1','2026-08-30 12:25:48'),(565,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 12:26:00'),(566,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 12:26:08'),(567,'login_success',1,'role: admin','127.0.0.1','2026-08-30 12:26:41'),(568,'password_changed',1,NULL,'127.0.0.1','2026-08-30 12:27:01'),(569,'login_success',1,'role: admin','127.0.0.1','2026-08-30 12:27:24'),(570,'password_reset_success',NULL,'staff_email: richardbelen99@gmail.com','127.0.0.1','2026-08-30 12:28:19'),(571,'login_success',1,'role: admin','127.0.0.1','2026-08-30 12:28:29'),(572,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-08-30 17:53:07'),(573,'login_success',1,'role: admin','127.0.0.1','2026-08-30 17:55:14'),(575,'login_success',1,'role: admin','127.0.0.1','2026-08-30 18:09:15'),(576,'login_success',1,'role: admin','127.0.0.1','2026-08-30 18:22:17'),(577,'login_success',1,'role: admin','127.0.0.1','2026-08-31 12:46:43'),(579,'login_success',1,'role: admin','127.0.0.1','2026-08-31 22:54:18'),(581,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: 2026-09-01T09:07, closeAt: ','127.0.0.1','2026-08-31 23:05:30'),(582,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: 2026-09-01T09:07, closeAt: ','127.0.0.1','2026-08-31 23:05:51'),(583,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: 2026-09-01T09:07, closeAt: ','127.0.0.1','2026-08-31 23:05:53'),(585,'login_success',1,'role: admin','127.0.0.1','2026-09-05 09:48:51'),(586,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: 2026-09-01T09:07, closeAt: ','127.0.0.1','2026-09-05 10:03:45'),(587,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: 2026-09-01T09:07, closeAt: ','127.0.0.1','2026-09-05 10:03:46'),(588,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: 2026-09-01T09:07, closeAt: ','127.0.0.1','2026-09-05 10:03:49'),(589,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: 2026-09-01T09:07, closeAt: ','127.0.0.1','2026-09-05 10:03:50'),(590,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-09-05 10:04:46'),(591,'login_success',2,'role: instructor','127.0.0.1','2026-09-05 10:14:34'),(593,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-09-05 12:10:21'),(594,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-09-05 12:10:31'),(595,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-09-05 12:10:40'),(596,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-09-05 12:11:55'),(597,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-09-05 12:12:06'),(598,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-09-05 12:16:28'),(599,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-09-05 12:16:58'),(600,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-09-05 12:17:30'),(601,'password_reset_success',NULL,'staff_email: richardbelen99@gmail.com','127.0.0.1','2026-09-05 12:18:06'),(602,'login_success',1,'role: admin','127.0.0.1','2026-09-05 12:18:14'),(603,'password_changed',1,NULL,'127.0.0.1','2026-09-05 12:22:08'),(612,'login_success',1,'role: admin','127.0.0.1','2026-09-05 12:59:43'),(613,'login_success',1,'role: admin','127.0.0.1','2026-09-05 16:40:18'),(614,'login_success',2,'role: instructor','127.0.0.1','2026-09-05 16:41:20'),(619,'login_success',1,'role: admin','127.0.0.1','2026-09-06 14:10:20'),(620,'login_success',2,'role: instructor','127.0.0.1','2026-09-06 14:54:59'),(621,'login_success',1,'role: admin','127.0.0.1','2026-09-08 03:53:04'),(622,'login_success',2,'role: instructor','127.0.0.1','2026-09-08 03:53:04'),(623,'login_success',3,'role: instructor','127.0.0.1','2026-09-08 03:53:05'),(624,'login_success',4,'role: instructor','127.0.0.1','2026-09-08 03:53:06'),(628,'login_success',1,'role: admin','127.0.0.1','2026-09-08 03:54:35'),(629,'login_success',1,'role: admin','127.0.0.1','2026-09-08 03:55:12'),(632,'login_success',2,'role: instructor','127.0.0.1','2026-09-08 04:22:57'),(637,'login_success',2,'role: instructor','127.0.0.1','2026-09-08 04:40:25'),(643,'login_success',1,'role: admin','127.0.0.1','2026-09-08 04:48:21'),(645,'login_success',1,'role: admin','127.0.0.1','2026-09-08 09:36:42'),(646,'login_success',3,'role: instructor','127.0.0.1','2026-09-08 14:53:53'),(653,'login_success',1,'role: admin','127.0.0.1','2026-09-08 15:42:16'),(654,'login_success',1,'role: admin','127.0.0.1','2026-09-09 12:21:49'),(655,'login_success',1,'role: admin','127.0.0.1','2026-09-09 13:11:08'),(656,'login_success',1,'role: admin','127.0.0.1','2026-09-09 13:14:28'),(657,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:11:07'),(658,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:11:10'),(659,'login_success',2,'role: instructor','127.0.0.1','2026-09-11 03:11:11'),(660,'login_failed',NULL,'wrong_password: admin@gmail.com','127.0.0.1','2026-09-11 03:11:12'),(661,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:11:27'),(662,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:11:30'),(663,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:11:30'),(664,'login_success',2,'role: instructor','127.0.0.1','2026-09-11 03:11:31'),(665,'login_failed',NULL,'wrong_password: admin@gmail.com','127.0.0.1','2026-09-11 03:11:32'),(666,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:12:00'),(667,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:12:09'),(668,'login_success',2,'role: instructor','127.0.0.1','2026-09-11 03:12:13'),(669,'login_success',3,'role: instructor','127.0.0.1','2026-09-11 03:12:18'),(670,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:12:25'),(671,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:12:30'),(672,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:12:35'),(673,'login_success',2,'role: instructor','127.0.0.1','2026-09-11 03:12:56'),(674,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:13:37'),(675,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:13:38'),(676,'login_success',2,'role: instructor','127.0.0.1','2026-09-11 03:13:39'),(677,'login_failed',NULL,'wrong_password: admin@gmail.com','127.0.0.1','2026-09-11 03:13:40'),(678,'login_success',1,'role: admin','127.0.0.1','2026-09-11 03:13:47'),(679,'login_success',1,'role: admin','127.0.0.1','2026-09-11 04:27:27'),(683,'login_success',1,'role: admin','127.0.0.1','2026-09-11 10:39:49'),(684,'login_success',1,'role: admin','127.0.0.1','2026-09-11 10:39:52'),(685,'login_success',2,'role: instructor','127.0.0.1','2026-09-11 10:39:53'),(686,'login_failed',NULL,'wrong_password: admin@gmail.com','127.0.0.1','2026-09-11 10:39:54'),(687,'login_success',1,'role: admin','127.0.0.1','2026-09-13 13:17:16'),(689,'login_success',1,'role: admin','127.0.0.1','2026-09-13 13:30:24'),(690,'login_success',1,'role: admin','127.0.0.1','2026-09-13 13:30:27'),(691,'login_success',2,'role: instructor','127.0.0.1','2026-09-13 13:30:27'),(692,'login_failed',NULL,'wrong_password: admin@gmail.com','127.0.0.1','2026-09-13 13:30:29'),(693,'login_success',1,'role: admin','127.0.0.1','2026-09-13 13:32:10'),(694,'login_success',1,'role: admin','127.0.0.1','2026-09-13 13:32:11'),(695,'login_success',2,'role: instructor','127.0.0.1','2026-09-13 13:32:12'),(696,'login_failed',NULL,'wrong_password: admin@gmail.com','127.0.0.1','2026-09-13 13:32:13'),(697,'login_success',1,'role: admin','127.0.0.1','2026-09-13 13:49:57'),(698,'login_success',1,'role: admin','127.0.0.1','2026-09-13 13:50:00'),(699,'login_success',2,'role: instructor','127.0.0.1','2026-09-13 13:50:00'),(700,'login_failed',NULL,'wrong_password: admin@gmail.com','127.0.0.1','2026-09-13 13:50:01'),(701,'login_success',1,'role: admin','127.0.0.1','2026-09-13 13:50:41'),(702,'login_success',1,'role: admin','127.0.0.1','2026-09-13 14:02:26'),(703,'login_success',1,'role: admin','127.0.0.1','2026-09-13 14:02:26'),(704,'login_success',2,'role: instructor','127.0.0.1','2026-09-13 14:02:27'),(705,'login_failed',NULL,'wrong_password: admin@gmail.com','127.0.0.1','2026-09-13 14:02:28'),(706,'login_success',1,'role: admin','127.0.0.1','2026-09-13 16:03:50'),(707,'login_success',1,'role: admin','127.0.0.1','2026-09-13 16:04:28'),(708,'login_success',1,'role: admin','127.0.0.1','2026-09-14 02:29:57'),(709,'login_success',1,'role: admin','127.0.0.1','2026-09-14 07:00:02'),(710,'login_success',1,'role: admin','127.0.0.1','2026-09-15 09:44:21'),(711,'login_success',1,'role: admin','127.0.0.1','2026-09-16 06:49:38'),(712,'login_success',1,'role: admin','127.0.0.1','2026-09-16 06:54:14'),(713,'login_success',1,'role: admin','127.0.0.1','2026-09-16 07:01:39'),(714,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-09-16 07:03:17'),(715,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-09-16 07:03:18'),(717,'login_success',2,'role: instructor','127.0.0.1','2026-09-16 07:18:23'),(720,'login_success',1,'role: admin','127.0.0.1','2026-09-16 14:34:12'),(721,'login_success',1,'role: admin','127.0.0.1','2026-09-16 15:11:36'),(722,'login_success',1,'role: admin','127.0.0.1','2026-09-16 15:55:57'),(723,'login_success',1,'role: admin','127.0.0.1','2026-09-16 15:56:14'),(724,'login_success',1,'role: admin','127.0.0.1','2026-09-24 01:24:24'),(725,'login_success',1,'role: admin','127.0.0.1','2026-09-24 01:33:42'),(726,'login_success',1,'role: admin','127.0.0.1','2026-09-24 01:39:13'),(727,'login_success',1,'role: admin','127.0.0.1','2026-09-24 02:09:46'),(728,'login_success',1,'role: admin','127.0.0.1','2026-09-24 02:32:35'),(730,'login_success',1,'role: admin','127.0.0.1','2026-09-24 03:14:15'),(731,'login_success',1,'role: admin','127.0.0.1','2026-09-24 03:23:44'),(732,'login_success',1,'role: admin','127.0.0.1','2026-09-24 03:39:26'),(733,'login_success',1,'role: admin','127.0.0.1','2026-09-24 03:39:31'),(734,'login_success',1,'role: admin','127.0.0.1','2026-09-24 03:47:30'),(735,'login_success',1,'role: admin','127.0.0.1','2026-09-24 07:21:13'),(736,'login_success',1,'role: admin','127.0.0.1','2026-09-24 07:21:24'),(737,'login_success',1,'role: admin','127.0.0.1','2026-09-24 09:10:09'),(738,'login_success',1,'role: admin','127.0.0.1','2026-09-25 01:28:08'),(739,'login_success',1,'role: admin','127.0.0.1','2026-09-25 01:28:08'),(740,'login_success',1,'role: admin','127.0.0.1','2026-09-25 01:28:14'),(741,'login_success',1,'role: admin','127.0.0.1','2026-09-25 01:28:27'),(744,'login_success',2,'role: instructor','127.0.0.1','2026-09-25 01:44:16'),(745,'login_success',1,'role: admin','127.0.0.1','2026-09-25 01:48:08'),(746,'login_success',2,'role: instructor','127.0.0.1','2026-09-25 01:48:12'),(747,'login_success',2,'role: instructor','127.0.0.1','2026-09-25 01:59:12'),(748,'login_success',1,'role: admin','127.0.0.1','2026-09-25 04:26:05'),(749,'login_success',1,'role: admin','127.0.0.1','2026-09-25 04:27:55'),(750,'login_success',1,'role: admin','127.0.0.1','2026-09-27 07:49:38'),(751,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-09-27 07:50:49'),(752,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-09-27 07:50:50'),(753,'login_success',2,'role: instructor','127.0.0.1','2026-09-27 07:55:07'),(754,'login_success',1,'role: admin','127.0.0.1','2026-09-27 11:47:02'),(755,'login_success',2,'role: instructor','127.0.0.1','2026-09-27 15:16:59'),(756,'login_success',1,'role: admin','127.0.0.1','2026-09-27 15:18:27'),(757,'login_success',1,'role: admin','127.0.0.1','2026-09-27 15:26:29'),(758,'login_success',2,'role: instructor','127.0.0.1','2026-09-27 15:39:17'),(759,'login_success',2,'role: instructor','127.0.0.1','2026-09-27 15:39:35'),(760,'login_success',1,'role: admin','127.0.0.1','2026-09-27 15:40:20'),(761,'login_success',1,'role: admin','127.0.0.1','2026-09-28 00:56:46'),(762,'login_success',1,'role: admin','127.0.0.1','2026-09-28 00:57:36'),(764,'login_success',1,'role: admin','127.0.0.1','2026-09-28 03:37:10'),(765,'login_success',1,'role: admin','127.0.0.1','2026-09-28 03:50:54'),(766,'login_success',1,'role: admin','127.0.0.1','2026-09-29 09:54:53'),(767,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-09-29 09:57:25'),(768,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-09-29 09:57:26'),(769,'login_success',2,'role: instructor','127.0.0.1','2026-09-29 10:05:35'),(770,'login_success',2,'role: instructor','127.0.0.1','2026-09-29 10:15:27'),(771,'login_success',1,'role: admin','127.0.0.1','2026-09-29 10:15:41'),(772,'login_success',4,'role: instructor','127.0.0.1','2026-09-29 10:17:57'),(773,'login_success',1,'role: admin','127.0.0.1','2026-09-29 10:30:09'),(774,'login_success',1,'role: admin','127.0.0.1','2026-09-29 10:52:29'),(775,'login_success',1,'role: admin','127.0.0.1','2026-09-29 10:52:37'),(776,'login_success',2,'role: instructor','127.0.0.1','2026-09-29 10:54:11'),(777,'login_success',1,'role: admin','127.0.0.1','2026-09-29 10:54:22'),(778,'login_success',1,'role: admin','127.0.0.1','2026-09-29 11:05:02'),(779,'login_success',1,'role: admin','127.0.0.1','2026-09-29 11:05:29'),(780,'login_success',1,'role: admin','127.0.0.1','2026-09-29 11:06:38'),(781,'login_success',1,'role: admin','127.0.0.1','2026-09-29 11:06:53'),(782,'login_success',1,'role: admin','127.0.0.1','2026-09-29 11:07:15'),(783,'login_success',1,'role: admin','127.0.0.1','2026-09-29 11:07:35'),(784,'login_success',1,'role: admin','127.0.0.1','2026-09-29 11:27:11'),(785,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 12:36:17'),(786,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 12:36:50'),(787,'admin_2fa_failed',1,'Wrong OTP attempt 1','127.0.0.1','2026-09-29 12:37:24'),(788,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 12:47:17'),(789,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 12:48:00'),(790,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 12:50:33'),(791,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 12:56:27'),(792,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 12:57:06'),(793,'admin_2fa_prompted',1,'Sent to cvsunaicnstp@gmail.com','127.0.0.1','2026-09-29 13:45:28'),(794,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 13:51:28'),(795,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 13:58:46'),(796,'admin_2fa_prompted',1,'Sent to richardbelen99@gmail.com','127.0.0.1','2026-09-29 14:01:13'),(797,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 16:18:25'),(798,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 16:34:12'),(799,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 16:36:58'),(800,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 16:47:57'),(801,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-09-29 16:47:58'),(802,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 16:49:44'),(803,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-09-29 16:49:44'),(804,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 17:20:12'),(805,'admin_2fa_failed',1,'Wrong OTP attempt 1','127.0.0.1','2026-09-29 17:20:38'),(806,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 17:36:27'),(807,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-09-29 17:36:54'),(808,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 17:37:24'),(809,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 17:41:06'),(810,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-09-29 17:41:23'),(811,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-09-29 17:41:45'),(812,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-09-29 17:41:56'),(813,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-02 03:36:33'),(814,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-02 03:36:44'),(815,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-02 03:42:40'),(816,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-02 03:42:50'),(817,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-04 09:08:08'),(818,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-04 09:09:03'),(819,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-04 09:26:17'),(820,'admin_2fa_failed',1,'Wrong OTP attempt 1','127.0.0.1','2026-10-04 09:26:31'),(821,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-04 09:26:39'),(822,'login_success',2,'role: instructor','127.0.0.1','2026-10-04 09:56:19'),(823,'login_success',2,'role: instructor','127.0.0.1','2026-10-04 10:09:32'),(824,'login_success',2,'role: instructor','127.0.0.1','2026-10-04 10:09:40'),(825,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-04 10:09:50'),(826,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-04 10:10:00'),(827,'login_success',2,'role: instructor','127.0.0.1','2026-10-04 10:13:16'),(828,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-04 10:13:22'),(829,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-04 10:13:54'),(830,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-07 05:28:52'),(831,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-07 05:29:10'),(832,'login_success',2,'role: instructor','127.0.0.1','2026-10-07 05:29:51'),(833,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-08 08:38:04'),(834,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-08 08:38:18'),(835,'login_success',2,'role: instructor','127.0.0.1','2026-10-08 08:50:19'),(836,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-08 08:56:56'),(837,'admin_2fa_failed',1,'Wrong OTP attempt 1','127.0.0.1','2026-10-08 08:57:05'),(838,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-08 08:57:16'),(839,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-08 08:58:02'),(840,'admin_2fa_failed',1,'Wrong OTP attempt 1','127.0.0.1','2026-10-08 08:58:04'),(841,'admin_2fa_failed',1,'Wrong OTP attempt 2','127.0.0.1','2026-10-08 08:58:07'),(842,'admin_2fa_failed',1,'Wrong OTP attempt 3','127.0.0.1','2026-10-08 08:58:09'),(843,'admin_2fa_failed',1,'Wrong OTP attempt 4','127.0.0.1','2026-10-08 08:58:10'),(844,'admin_2fa_failed',1,'Wrong OTP attempt 5','127.0.0.1','2026-10-08 08:58:11'),(845,'admin_2fa_locked',1,'Too many incorrect attempts','127.0.0.1','2026-10-08 08:58:11'),(846,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-08 08:58:17'),(847,'admin_2fa_failed',1,'Wrong OTP attempt 1','127.0.0.1','2026-10-08 08:58:20'),(848,'admin_2fa_failed',1,'Wrong OTP attempt 2','127.0.0.1','2026-10-08 08:58:21'),(849,'admin_2fa_failed',1,'Wrong OTP attempt 3','127.0.0.1','2026-10-08 08:58:21'),(850,'admin_2fa_failed',1,'Wrong OTP attempt 4','127.0.0.1','2026-10-08 08:58:22'),(851,'admin_2fa_failed',1,'Wrong OTP attempt 5','127.0.0.1','2026-10-08 08:58:22'),(852,'admin_2fa_locked',1,'Too many incorrect attempts','127.0.0.1','2026-10-08 08:58:23'),(853,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-08 08:59:24'),(854,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-08 08:59:28'),(855,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-08 08:59:43'),(856,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 00:01:41'),(857,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 00:02:36'),(858,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-12 00:02:53'),(859,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 00:22:30'),(860,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 11:56:04'),(861,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 11:57:00'),(862,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 11:57:32'),(863,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 11:58:03'),(864,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 11:59:22'),(865,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-12 12:01:19'),(866,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-12 12:02:02'),(867,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 12:02:08'),(868,'instructor_2fa_prompted',3,'Sending to lts@gmail.com','127.0.0.1','2026-10-12 12:10:39'),(869,'instructor_2fa_prompted',4,'Sending to rotc@gmail.com','127.0.0.1','2026-10-12 12:10:45'),(870,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-12 12:10:50'),(871,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-12 12:10:55'),(872,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-12 12:11:06'),(873,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 12:29:24'),(874,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-12 12:29:44'),(875,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-12 12:47:22'),(876,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-12 12:47:25'),(877,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 12:47:31'),(878,'instructor_2fa_prompted',3,'Sending to lts@gmail.com','127.0.0.1','2026-10-12 12:47:33'),(879,'instructor_2fa_prompted',4,'Sending to rotc@gmail.com','127.0.0.1','2026-10-12 12:47:37'),(880,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-12 12:47:45'),(881,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 12:49:39'),(882,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-12 12:49:51'),(883,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-12 13:07:42'),(884,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-12 13:08:02'),(885,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 13:28:17'),(886,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-12 13:28:36'),(887,'instructor_2fa_prompted',3,'Sending to lts@gmail.com','127.0.0.1','2026-10-12 14:04:24'),(888,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-12 14:04:26'),(889,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-12 14:04:45'),(890,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-12 14:17:27'),(891,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-12 14:17:43'),(892,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-13 22:46:34'),(893,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-13 22:46:47'),(894,'user_account_deleted',1,'{\"deletedUserId\":\"8\",\"deletedRole\":\"admin\",\"deletedEmail\":\"aray@gmail.com\",\"deletedName\":\"aray\",\"deletedByAdminId\":1}','127.0.0.1','2026-10-13 22:54:12'),(895,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:50'),(896,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:50'),(897,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:51'),(898,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:51'),(899,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:51'),(900,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:51'),(901,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:51'),(902,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:52'),(903,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:52'),(904,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:52'),(905,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:52'),(906,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:52'),(907,'update_enrollment_schedule',1,'mode: FORCE_CLOSE, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:52'),(908,'update_enrollment_schedule',1,'mode: FORCE_OPEN, openAt: , closeAt: ','127.0.0.1','2026-10-13 22:55:53'),(909,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-13 23:18:49'),(910,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-13 23:19:14'),(911,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-14 00:16:28'),(912,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-14 00:16:40'),(913,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-14 00:36:05'),(914,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-14 00:36:14'),(915,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-14 03:34:55'),(916,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-17 07:16:42'),(917,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-17 07:16:57'),(918,'admin_2fa_failed',1,'Wrong OTP attempt 1','127.0.0.1','2026-10-17 07:17:05'),(919,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-17 07:17:21'),(920,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-17 08:47:31'),(921,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-17 08:47:53'),(927,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-17 09:43:22'),(928,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-17 09:43:37'),(929,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-17 10:36:22'),(930,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-17 10:36:36'),(931,'password_reset_success',NULL,'staff_email: richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:27:23'),(932,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:27:27'),(933,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:27:40'),(934,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:27:47'),(935,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:28:20'),(936,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-18 00:28:28'),(937,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:28:52'),(938,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-18 00:29:03'),(940,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-18 00:31:27'),(941,'password_reset_success',NULL,'staff_email: belenjoshua58@gmail.com','127.0.0.1','2026-10-18 00:31:50'),(942,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:47:14'),(943,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-18 00:47:24'),(944,'password_reset_success',NULL,'staff_email: richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:48:02'),(945,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:48:11'),(946,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:48:16'),(947,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:50:26'),(948,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:50:26'),(949,'password_reset_success',NULL,'staff_email: richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:50:35'),(950,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 00:50:35'),(951,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 01:02:15'),(952,'password_reset_success',NULL,'staff_email: richardbelen99@gmail.com','127.0.0.1','2026-10-18 01:03:51'),(953,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-18 01:03:57'),(954,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 01:04:01'),(955,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-18 01:04:13'),(956,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-18 01:29:14'),(957,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-18 01:29:21'),(958,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-18 01:29:30'),(959,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-18 13:33:51'),(960,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-18 13:34:03'),(961,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-19 00:54:55'),(962,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-19 01:00:06'),(963,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-19 01:04:03'),(964,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-19 01:04:30'),(965,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-19 03:24:48'),(966,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-19 03:24:54'),(967,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-19 03:25:16'),(968,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-19 08:40:12'),(969,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-19 08:40:33'),(970,'login_failed',NULL,'email_not_found: invalid@example.com','127.0.0.1','2026-10-23 02:46:12'),(971,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-23 02:50:26'),(972,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-23 02:51:02'),(973,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-27 23:49:06'),(974,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-27 23:49:14'),(978,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-27 23:52:57'),(979,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-27 23:53:08'),(980,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-27 23:54:19'),(981,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-27 23:54:22'),(982,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-27 23:54:33'),(986,'login_failed',NULL,'wrong_password: belenjoshua58@gmail.com','127.0.0.1','2026-10-27 23:57:05'),(987,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-27 23:57:09'),(988,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-27 23:58:01'),(991,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 05:08:15'),(992,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 05:08:37'),(993,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-28 05:12:45'),(994,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-28 05:13:03'),(996,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 05:18:00'),(997,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 05:18:14'),(998,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 06:09:21'),(999,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 06:09:37'),(1000,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-28 06:13:43'),(1001,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 06:13:47'),(1002,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 06:13:59'),(1005,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-28 07:31:16'),(1006,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 07:31:24'),(1007,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 07:31:38'),(1008,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 07:36:26'),(1009,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 07:36:43'),(1010,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 07:48:11'),(1011,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 07:48:38'),(1012,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-28 07:53:03'),(1013,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-28 07:53:14'),(1015,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 10:50:20'),(1016,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 10:50:29'),(1017,'login_failed',NULL,'wrong_password: richardbelen99@gmail.com','127.0.0.1','2026-10-28 11:01:50'),(1018,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 11:02:04'),(1019,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 11:02:14'),(1020,'instructor_2fa_prompted',2,'Sending to belenjoshua58@gmail.com','127.0.0.1','2026-10-28 11:03:27'),(1021,'admin_2fa_success',2,'2FA successfully verified','127.0.0.1','2026-10-28 11:03:36'),(1022,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 11:04:13'),(1023,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 11:04:37'),(1024,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 11:24:33'),(1025,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 11:24:46'),(1026,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-28 11:41:01'),(1027,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-28 11:41:10'),(1028,'admin_2fa_prompted',1,'Sending to richardbelen99@gmail.com','127.0.0.1','2026-10-29 00:59:12'),(1029,'admin_2fa_success',1,'2FA successfully verified','127.0.0.1','2026-10-29 00:59:23');
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `current_batch` VALUES (1,'2026-2027 1st Semester','2026-03-17 03:14:06','2026-09-08 08:34:07','1st Semester',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `current_batch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollments`
--

DROP TABLE IF EXISTS `enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `system_settings` VALUES ('enrollment_schedule','{\"mode\":\"FORCE_OPEN\",\"openAt\":\"\",\"closeAt\":\"\",\"academicYear\":\"2026-2027\",\"semester\":\"1st Semester\",\"customNotice\":\"Online Enrollment is now open.\"}','2026-10-13 22:55:53'),('last_backup_daily_midnight','2026-10-28T16:00:31.433Z','2026-10-28 16:00:31'),('last_backup_manual','2026-08-22T15:06:11.050Z','2026-08-22 15:06:11'),('telemetry_cumulative_visitors','{\"visitors\":[\"vid_t30cm1cpmue7fyhi\",\"vid_8q6lqv500mt8wt1rt\",\"vid_fvsb5ds40mt8wtaju\",\"vid_vcgiefmuwmt8wteyi\",\"vid_z109ft59nmt8wvsqw\",\"vid_szej4la25mt9cx56l\",\"vid_e2d7x2ylymszirsfi\",\"vid_okgqjbkjmtinid8u\",\"vid_1ghopud4mtdu0fx3\",\"vid_lw9498i7jmt4b3g9q\",\"vid_pgr5agicmtd1to13\",\"vid_d9m7g7zlmto833nr\",\"test_client_1\",\"vid_6zsy0i0snmserdhkz\",\"vid_d4ekhpdomttqoj0g\",\"vid_lshg29s6mttr5hgd\",\"vid_n5b5g0g7mtrybg83\",\"vid_5nyovuw34msju3peg\",\"vid_0oknsgqgmueu7dae\",\"0462a968-2a22-46a2-8e52-ff7f853d4a71\",\"dca09422-a26a-424f-ae5e-58fa2d157b7e\",\"479edb07-7c7e-423a-83c9-dbb020265038\",\"ab258dbe-ffab-4cce-913b-6283ef284363\",\"549340d0-17ec-4431-9556-091f8ba75b12\",\"70cbf0a9-110c-4955-8f13-7816f0a0dc12\"],\"totalCount\":25,\"totalVisitors\":25,\"updatedAt\":\"2026-10-29T01:54:37.587Z\"}','2026-10-29 01:54:37');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `users` VALUES (1,'richardbelen99@gmail.com','$2a$12$sP0tr8FOwf936kJEFyv6b.AzlgXX6635ZvRQybH3tHACk6u0VPJUO','admin','NSTP Administrator','NSTP Office','avatar-4',NULL,'','Testing','2026-03-13 16:04:59','2026-10-29 01:54:55','2026-10-29 09:54:55',NULL),(2,'belenjoshua58@gmail.com','$2a$12$tx.XRJ496jMUdCtKYNey9uKpjV4LzW9pMwTRkcGtjQCyg88yr4Wzm','instructor','CWTS Facilitator','CWTS','avatar-2',NULL,NULL,'CWTS Safe Update','2026-03-13 16:04:59','2026-10-28 11:03:56',NULL,NULL),(3,'lts@gmail.com','$2a$12$xJbobWiihuTYz2G//fbSoeH0wnp4x5jerDoszxc9irWqgNVZee3ne','instructor','LTS Facilitator','LTS','avatar-6',NULL,NULL,NULL,'2026-03-13 16:04:59','2026-10-18 00:39:31',NULL,NULL),(4,'rotc@gmail.com','$2a$12$2q1kcf1G9bYuNr2/07tCk.LOw.EBT7l4fiMYKxIXDyo4PT3s4KkWS','instructor','ROTC Training Staff','ROTC','avatar-8',NULL,NULL,NULL,'2026-03-13 16:04:59','2026-10-18 00:39:31',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'nstp_system'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-29  9:55:45
