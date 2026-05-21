# Deployment Guide: Parts Management DB

Deploying this PHP application to a live host provider (like HostGator, GoDaddy, DigitalOcean, or AWS) is extremely straightforward due to its zero-framework dependency structure.

This guide focuses on deploying using standard cPanel Shared Hosting environments since it is the most common for basic PHP/MySQL architectures, but the rules apply to standard VPS integrations as well.

\---

## 1\. Hosting Requirements

Before you begin, ensure your hosting provider meets these minimal configurations:

* **PHP Version**: `8.0` or higher recommended.
* **Enabled PHP Extensions**: `pdo`, `pdo\\\_mysql`, `fileinfo` (for uploading images)
* **Database**: MySQL `5.7+` or MariaDB `10.4+`
* **Web Server**: Apache or Nginx

## 2\. Setting Up The Database

1. Log in to your Host Provider control panel (e.g., cPanel).
2. Navigate to your **MySQL Databases** section.
3. **Create a Database**: Give it a name (e.g., `company\\\_partsdb`), and note this name down.
4. **Create a Database User**: Generate a User and strict Password (e.g., `parts\\\_user` / `pAssword123!`), and assign it to the created Database. **Grant All Privileges** to this user for this database.
5. Launch **phpMyAdmin** (or any database GUI provided).
6. Select your new database and locate the **Import** tab.
7. Upload the local `schema.sql` file located in your project repository to instantiate all tables (`PART`, `HT\\\_JOBS`, `PART\\\_LIST`) into your live database.

*Note: Depending on recent local updates you might need to adjust the `HT\\\_JOBS` schema ENUMS from `close` to `completed` natively, or let the local codebase dictate insertion updates.*

## 3\. Uploading Codebase

1. Gather all files in your primary `Parts\\\_DB` folder locally (index.php, jobs.php, assets folder, uploads folder, etc.).
2. Go back to your hosting **File Manager**.
3. Navigate to your Domain's public root directory (Usually listed as `public\\\_html/` or `www/`).
4. Upload all files into this root folder.

   * *Tip: Compress your files locally into a single `.zip` file, upload it into `public\\\_html/`, and Extract it natively in the File Manager to save upload time.*

## 4\. Configuring The Connection (`config.php`)

Now that your files and database live securely on the host, bridge them to talk to each other:

1. Inside your hosting file manager, locate the `config.php` file and choose **Edit**.
2. Replace your local development variables with your newly created live Host Databases credentials:

```php
<?php
$host = 'localhost'; // Usually 'localhost' locally resolves directly on cPanel hosts. (Otherwise, use host IP)
$db   = 'your\\\_cpanel\\\_database\\\_name'; 
$user = 'your\\\_cpanel\\\_database\\\_user'; 
$pass = 'your\\\_secure\\\_password'; 
$charset = 'utf8mb4';

// Please leave the $dsn and PDO execution blocks alone.
```

3. Click **Save**.

## 5\. Directory Permissions

For users to be able to seamlessly upload photo proofs:

1. Locate the `uploads/` folder in your File Manager.
2. Select it and click **Change Permissions** (sometimes labeled as properties).
3. Ensure its permission status is set up strictly allowing write access **(Set to `755`)** so the `upload\\\_photo.php` endpoint can accurately place files fetched inside without receiving `403 Forbidden` restriction kicks.

## 6\. Access and Verify

1. Navigate securely to your domain link: `https://yourdomain.com`
2. Explore the live UI. Verify database structures by attempting to 'Create a New Job' or attaching a mockup Part and picture upload to test `pdo` validation loops seamlessly.

🎉 **Congratulations! Your system is fully operational online.**

