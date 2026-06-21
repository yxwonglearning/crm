CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  custom_fields JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS countries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  iso2 CHAR(2) NOT NULL,
  dial_code VARCHAR(8) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY countries_iso2_unique (iso2),
  UNIQUE KEY countries_name_unique (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_name VARCHAR(190) NOT NULL,
  contact_person VARCHAR(160) NOT NULL,
  email VARCHAR(190) NULL,
  country_id BIGINT UNSIGNED NOT NULL,
  phone_country_code VARCHAR(8) NOT NULL,
  phone_number VARCHAR(40) NOT NULL,
  status ENUM('lead', 'active', 'inactive') NOT NULL DEFAULT 'lead',
  notes TEXT NULL,
  custom_fields JSON NULL,
  owner_user_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY customers_company_name_idx (company_name),
  KEY customers_email_idx (email),
  KEY customers_country_id_fk (country_id),
  KEY customers_owner_user_id_fk (owner_user_id),
  CONSTRAINT customers_country_id_fk FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT customers_owner_user_id_fk FOREIGN KEY (owner_user_id) REFERENCES users(id),
  CONSTRAINT customers_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT customers_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_modules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_key VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_modules_key_unique (module_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_module_fields (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(80) NOT NULL,
  data_key VARCHAR(80) NULL,
  label VARCHAR(120) NOT NULL,
  field_type ENUM('text', 'email', 'phone', 'password', 'number', 'date', 'select', 'textarea', 'country', 'owner', 'checkbox') NOT NULL DEFAULT 'text',
  options_json JSON NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  show_in_table TINYINT(1) NOT NULL DEFAULT 1,
  show_in_form TINYINT(1) NOT NULL DEFAULT 1,
  show_in_import TINYINT(1) NOT NULL DEFAULT 0,
  is_searchable TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 100,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_module_fields_key_unique (module_id, field_key),
  KEY crm_module_fields_module_id_fk (module_id),
  CONSTRAINT crm_module_fields_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
