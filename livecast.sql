-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 23, 2020 at 08:06 AM
-- Server version: 10.4.14-MariaDB
-- PHP Version: 7.4.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `livecast`
--

-- --------------------------------------------------------

--
-- Table structure for table `ca_cast_record`
--

CREATE TABLE `ca_cast_record` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `record_type` varchar(10) NOT NULL,
  `cast_id` varchar(100) NOT NULL,
  `date_created` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `ca_last_seen`
--

CREATE TABLE `ca_last_seen` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(10) NOT NULL,
  `date_created` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `ca_live_broadcaster`
--

CREATE TABLE `ca_live_broadcaster` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `date_created` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `ca_live_watcher`
--

CREATE TABLE `ca_live_watcher` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `date_created` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `ca_socket_users`
--

CREATE TABLE `ca_socket_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `token` varchar(100) NOT NULL,
  `socket_id` varchar(100) NOT NULL,
  `date_created` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `ca_streaming_files`
--

CREATE TABLE `ca_streaming_files` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `file` varchar(100) NOT NULL,
  `cast_id` varchar(100) NOT NULL,
  `date_created` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(10) NOT NULL,
  `name` varchar(50) NOT NULL,
  `image` varchar(500) NOT NULL,
  `date_created` varchar(50) NOT NULL,
  `auth_key` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `name`, `image`, `date_created`, `auth_key`) VALUES
(1, 'user1@mail.com', '123', 'User 1', 'profile.jpg', '2020-11-27 12:00:00', '589623'),
(2, 'user2@mail.com', '123', 'User 2', 'profile.jpg', '2020-11-27 12:00:00', '369852'),
(3, 'user3@mail.com', '123', 'User 3', 'profile.jpg', '2020-11-27 12:00:00', '123456'),
(4, 'user4@mail.com', '123', 'User 4', 'profile.jpg', '2020-11-27 12:00:00', '654321');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ca_cast_record`
--
ALTER TABLE `ca_cast_record`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`record_type`,`cast_id`);

--
-- Indexes for table `ca_last_seen`
--
ALTER TABLE `ca_last_seen`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ca_live_broadcaster`
--
ALTER TABLE `ca_live_broadcaster`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `ca_live_watcher`
--
ALTER TABLE `ca_live_watcher`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ca_socket_users`
--
ALTER TABLE `ca_socket_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `socket_id` (`socket_id`);

--
-- Indexes for table `ca_streaming_files`
--
ALTER TABLE `ca_streaming_files`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`auth_key`),
  ADD KEY `email` (`email`),
  ADD KEY `password` (`password`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ca_cast_record`
--
ALTER TABLE `ca_cast_record`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ca_last_seen`
--
ALTER TABLE `ca_last_seen`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ca_live_broadcaster`
--
ALTER TABLE `ca_live_broadcaster`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ca_live_watcher`
--
ALTER TABLE `ca_live_watcher`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ca_socket_users`
--
ALTER TABLE `ca_socket_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ca_streaming_files`
--
ALTER TABLE `ca_streaming_files`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
