-- Parts DB v3.0 Schema

CREATE DATABASE IF NOT EXISTS parts_db;
USE parts_db;

-- Users Table
CREATE TABLE IF NOT EXISTS USERS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_registered DATETIME DEFAULT CURRENT_TIMESTAMP,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    last_otp VARCHAR(6),
    status ENUM('Active', 'Inactive', 'Requested') DEFAULT 'Requested'
);

-- Make Table (e.g., Honda, Yamaha)
CREATE TABLE IF NOT EXISTS MAKE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);

-- Models Table
CREATE TABLE IF NOT EXISTS MODELS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    id_make INT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    FOREIGN KEY (id_make) REFERENCES MAKE(id) ON DELETE CASCADE
);

-- Parts Table
CREATE TABLE IF NOT EXISTS PARTS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    id_make INT,
    id_model INT,
    photo_path VARCHAR(255),
    status ENUM('In Stock', 'Out of Stock', 'Discontinued') DEFAULT 'In Stock',
    FOREIGN KEY (id_make) REFERENCES MAKE(id) ON DELETE SET NULL,
    FOREIGN KEY (id_model) REFERENCES MODELS(id) ON DELETE SET NULL
);

-- Compatibility Table
CREATE TABLE IF NOT EXISTS COMPATIBILITY (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku01 VARCHAR(100),
    sku02 VARCHAR(100),
    sku03 VARCHAR(100),
    sku04 VARCHAR(100),
    sku05 VARCHAR(100)
);

-- Diagrams Table
CREATE TABLE IF NOT EXISTS DIAGRAMS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date_revision DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    diagram_picture VARCHAR(255),
    id_model INT,
    FOREIGN KEY (id_model) REFERENCES MODELS(id) ON DELETE CASCADE
);

-- Diagram Parts Mapping
CREATE TABLE IF NOT EXISTS DIAGRAM_PARTS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_diagram INT,
    position_number INT,
    sku VARCHAR(100),
    x_pos INT, -- For hotspots
    y_pos INT, -- For hotspots
    FOREIGN KEY (id_diagram) REFERENCES DIAGRAMS(id) ON DELETE CASCADE,
    FOREIGN KEY (sku) REFERENCES PARTS(sku) ON DELETE CASCADE
);
