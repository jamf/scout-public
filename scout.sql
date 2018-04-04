# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.6.37)
# Database: scout
# Generation Time: 2018-04-04 03:58:30 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table devices
# ------------------------------------------------------------

DROP TABLE IF EXISTS `devices`;

CREATE TABLE `devices` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `server_id` int(11) DEFAULT NULL,
  `device_type` varchar(128) DEFAULT NULL,
  `jss_id` int(11) DEFAULT NULL,
  `jss_name` varchar(255) DEFAULT NULL,
  `jss_serial` varchar(255) DEFAULT NULL,
  `jss_last_inventory` varchar(512) DEFAULT NULL,
  `jss_udid` varchar(512) DEFAULT NULL,
  `jss_os_version` varchar(255) DEFAULT NULL,
  `jss_managed` tinyint(1) DEFAULT NULL,
  `jss_Model` varchar(255) DEFAULT NULL,
  `last_update_epoch` int(11) DEFAULT NULL,
  `expanded_inventory` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table computer_inventory
# ------------------------------------------------------------

DROP TABLE IF EXISTS `computer_inventory`;

CREATE TABLE `computer_inventory` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `jss_device_id` int(11) DEFAULT NULL,
  `mac_address` varchar(255) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `last_reported_ip` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `udid` varchar(255) DEFAULT NULL,
  `jamf_version` varchar(255) DEFAULT NULL,
  `mdm_capable` tinyint(1) DEFAULT NULL,
  `managed` tinyint(1) DEFAULT NULL,
  `managment_username` varchar(255) DEFAULT NULL,
  `enrolled_via_dep` tinyint(1) DEFAULT NULL,
  `user_approved_enrollment` tinyint(1) DEFAULT NULL,
  `report_date` varchar(255) DEFAULT NULL,
  `last_contact_time` varchar(255) DEFAULT NULL,
  `initial_entry_date` varchar(255) DEFAULT NULL,
  `last_cloud_backup_date_utc` varchar(255) DEFAULT NULL,
  `last_enrolled_date_utc` varchar(255) DEFAULT NULL,
  `itunes_store_account_is_active` tinyint(1) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `realname` varchar(255) DEFAULT NULL,
  `email_address` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `building` varchar(255) DEFAULT NULL,
  `room` varchar(255) DEFAULT NULL,
  `make` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `os_name` varchar(255) DEFAULT NULL,
  `os_verison` varchar(255) DEFAULT NULL,
  `os_build` varchar(255) DEFAULT NULL,
  `master_password_set` tinyint(1) DEFAULT NULL,
  `active_directory_status` varchar(255) DEFAULT NULL,
  `processor_type` varchar(255) DEFAULT NULL,
  `processor_architechture` varchar(255) DEFAULT NULL,
  `processor_speed` varchar(255) DEFAULT NULL,
  `number_processors` varchar(255) DEFAULT NULL,
  `number_cores` varchar(255) DEFAULT NULL,
  `total_ram` varchar(255) DEFAULT NULL,
  `boot_rom` varchar(255) DEFAULT NULL,
  `battery_capacity` varchar(255) DEFAULT NULL,
  `cache_size` varchar(255) DEFAULT NULL,
  `available_ram_slots` varchar(255) DEFAULT NULL,
  `ble_capable` tinyint(1) DEFAULT NULL,
  `sip_status` varchar(255) DEFAULT NULL,
  `gatekeeper_status` varchar(255) DEFAULT NULL,
  `institutional_recovery_key` varchar(255) DEFAULT NULL,
  `disk_encryption_configuration` varchar(255) DEFAULT NULL,
  `filevault_2_users` varchar(255) DEFAULT NULL,
  `boot_disk` varchar(255) DEFAULT NULL,
  `boot_model` varchar(255) DEFAULT NULL,
  `boot_revision` varchar(255) DEFAULT NULL,
  `boot_serial_number` varchar(255) DEFAULT NULL,
  `boot_size` varchar(255) DEFAULT NULL,
  `boot_drive_capacity_mb` varchar(255) DEFAULT NULL,
  `boot_ smart_status` varchar(255) DEFAULT NULL,
  `boot_partition_encrypted` varchar(255) DEFAULT NULL,
  `mapped_printer_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table patch_servers
# ------------------------------------------------------------

DROP TABLE IF EXISTS `patch_servers`;

CREATE TABLE `patch_servers` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `base_url` varchar(512) DEFAULT NULL,
  `cron_update` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table servers
# ------------------------------------------------------------

DROP TABLE IF EXISTS `servers`;

CREATE TABLE `servers` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `url` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `cron_update` varchar(255) DEFAULT NULL,
  `org_name` varchar(255) DEFAULT NULL,
  `activation_code` varchar(255) DEFAULT NULL,
  `expanded_inventory` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `hash` varchar(512) DEFAULT NULL,
  `notifications` tinyint(1) DEFAULT '1',
  `can_edit` tinyint(1) DEFAULT '1',
  `mdm_commands` tinyint(1) DEFAULT '1',
  `can_delete` tinyint(1) DEFAULT '1',
  `can_create` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
