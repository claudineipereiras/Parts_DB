CREATE DATABASE IF NOT EXISTS parts_db;
USE parts_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_registered DATETIME DEFAULT CURRENT_TIMESTAMP,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Inactive', 'Requested') DEFAULT 'Requested',
    role ENUM('Admin', 'User') DEFAULT 'User'
);

CREATE TABLE IF NOT EXISTS brand (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS escooter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_brand INT,
    model VARCHAR(255) NOT NULL,
    description TEXT,
    date_launched DATE,
    battery_voltage VARCHAR(50),
    battery_capacity VARCHAR(50),
    motor_watt VARCHAR(50),
    charger_voltage VARCHAR(50),
    status ENUM('Active', 'Inactive', 'Discontinued') DEFAULT 'Active',
    FOREIGN KEY (id_brand) REFERENCES brand(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS parts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    id_make INT,
    id_model INT,
    photo_path VARCHAR(255),
    status ENUM('Active', 'Inactive', 'Discontinued') DEFAULT 'Active',
    FOREIGN KEY (id_make) REFERENCES brand(id) ON DELETE SET NULL,
    FOREIGN KEY (id_model) REFERENCES escooter(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS compatibility (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku_part VARCHAR(255),
    id_escooter INT,
    FOREIGN KEY (sku_part) REFERENCES parts(sku) ON DELETE CASCADE,
    FOREIGN KEY (id_escooter) REFERENCES escooter(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagram (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_escooter INT,
    diagram_picture VARCHAR(255),
    FOREIGN KEY (id_escooter) REFERENCES escooter(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS list_diagram (
    id_part INT,
    id_diagram INT,
    diagram_number VARCHAR(50),
    PRIMARY KEY (id_part, id_diagram),
    FOREIGN KEY (id_part) REFERENCES parts(id) ON DELETE CASCADE,
    FOREIGN KEY (id_diagram) REFERENCES diagram(id) ON DELETE CASCADE
);
