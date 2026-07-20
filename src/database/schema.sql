CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  staff_id VARCHAR(80) NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('admin', 'manager', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  custom_fields JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_staff_id_unique (staff_id),
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
  module_status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  show_in_menu TINYINT(1) NOT NULL DEFAULT 0,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
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
  field_type ENUM('textbox', 'textarea', 'checkbox', 'dropdownbox', 'int', 'decimals', 'browser_button', 'date', 'attach_document', 'image', 'text', 'email', 'phone', 'password', 'number', 'select', 'country', 'owner') NOT NULL DEFAULT 'textbox',
  field_table ENUM('main', 'detail') NOT NULL DEFAULT 'main',
  detail_table_name VARCHAR(80) NULL,
  options_json JSON NULL,
  formula_expression TEXT NULL,
  formula_enabled TINYINT(1) NOT NULL DEFAULT 0,
  formula_js TEXT NULL,
  formula_function_name VARCHAR(80) NULL,
  formula_function_body TEXT NULL,
  formula_sql TEXT NULL,
  validation_json JSON NULL,
  lookup_json JSON NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  show_in_table TINYINT(1) NOT NULL DEFAULT 1,
  show_in_form TINYINT(1) NOT NULL DEFAULT 1,
  show_in_import TINYINT(1) NOT NULL DEFAULT 0,
  show_in_export TINYINT(1) NOT NULL DEFAULT 1,
  import_header VARCHAR(160) NULL,
  export_header VARCHAR(160) NULL,
  is_editable TINYINT(1) NOT NULL DEFAULT 1,
  disable_manual_input TINYINT(1) NOT NULL DEFAULT 0,
  is_searchable TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 100,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_module_fields_key_unique (module_id, field_key),
  KEY crm_module_fields_module_id_fk (module_id),
  CONSTRAINT crm_module_fields_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_browser_buttons (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  browser_key VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  source_module VARCHAR(80) NOT NULL,
  source_table VARCHAR(80) NOT NULL,
  value_field VARCHAR(80) NOT NULL DEFAULT 'id',
  display_field VARCHAR(80) NOT NULL,
  search_fields_json JSON NULL,
  return_fields_json JSON NULL,
  filter_json JSON NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_browser_buttons_key_unique (browser_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_module_form_layouts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id BIGINT UNSIGNED NOT NULL,
  layout_state ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  form_type ENUM('add', 'edit', 'detail') NOT NULL DEFAULT 'add',
  layout_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_module_form_layouts_unique (module_id, layout_state, form_type),
  KEY crm_module_form_layouts_module_id_fk (module_id),
  CONSTRAINT crm_module_form_layouts_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_forms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  form_key VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  fields_json JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_forms_key_unique (form_key),
  KEY crm_forms_created_by_fk (created_by),
  KEY crm_forms_updated_by_fk (updated_by),
  CONSTRAINT crm_forms_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT crm_forms_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_module_config_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id BIGINT UNSIGNED NOT NULL,
  version_number INT NOT NULL,
  action VARCHAR(80) NOT NULL,
  summary VARCHAR(255) NULL,
  snapshot_json JSON NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_module_config_versions_number_unique (module_id, version_number),
  KEY crm_module_config_versions_module_id_idx (module_id),
  KEY crm_module_config_versions_created_by_fk (created_by),
  CONSTRAINT crm_module_config_versions_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE,
  CONSTRAINT crm_module_config_versions_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_module_config_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id BIGINT UNSIGNED NOT NULL,
  version_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(80) NOT NULL,
  target_key VARCHAR(120) NULL,
  summary VARCHAR(255) NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  changed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY crm_module_config_audit_logs_module_id_idx (module_id),
  KEY crm_module_config_audit_logs_version_id_idx (version_id),
  KEY crm_module_config_audit_logs_changed_by_fk (changed_by),
  CONSTRAINT crm_module_config_audit_logs_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE,
  CONSTRAINT crm_module_config_audit_logs_version_id_fk FOREIGN KEY (version_id) REFERENCES crm_module_config_versions(id) ON DELETE SET NULL,
  CONSTRAINT crm_module_config_audit_logs_changed_by_fk FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_field_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(80) NOT NULL,
  subject_type ENUM('role', 'user') NOT NULL,
  subject_key VARCHAR(80) NOT NULL,
  can_view TINYINT(1) NOT NULL DEFAULT 0,
  can_create TINYINT(1) NOT NULL DEFAULT 0,
  can_edit TINYINT(1) NOT NULL DEFAULT 0,
  can_import TINYINT(1) NOT NULL DEFAULT 0,
  can_export TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_field_permissions_subject_unique (module_id, field_key, subject_type, subject_key),
  KEY crm_field_permissions_module_id_fk (module_id),
  CONSTRAINT crm_field_permissions_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_module_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id BIGINT UNSIGNED NOT NULL,
  subject_type ENUM('role', 'user') NOT NULL,
  subject_key VARCHAR(80) NOT NULL,
  can_view TINYINT(1) NOT NULL DEFAULT 0,
  can_create TINYINT(1) NOT NULL DEFAULT 0,
  can_edit TINYINT(1) NOT NULL DEFAULT 0,
  can_delete TINYINT(1) NOT NULL DEFAULT 0,
  can_import TINYINT(1) NOT NULL DEFAULT 0,
  can_export TINYINT(1) NOT NULL DEFAULT 0,
  can_configure TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_module_permissions_subject_unique (module_id, subject_type, subject_key),
  KEY crm_module_permissions_module_id_fk (module_id),
  CONSTRAINT crm_module_permissions_module_id_fk FOREIGN KEY (module_id) REFERENCES crm_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_api_connectors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  connector_key VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  base_url VARCHAR(500) NOT NULL,
  auth_type ENUM('none', 'api_key', 'bearer', 'basic', 'oauth') NOT NULL DEFAULT 'none',
  auth_config_json JSON NULL,
  default_headers_json JSON NULL,
  endpoints_json JSON NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_api_connectors_key_unique (connector_key),
  KEY crm_api_connectors_created_by_fk (created_by),
  KEY crm_api_connectors_updated_by_fk (updated_by),
  CONSTRAINT crm_api_connectors_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT crm_api_connectors_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_action_flows (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  flow_key VARCHAR(80) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(255) NULL,
  flow_status ENUM('draft', 'enabled', 'disabled') NOT NULL DEFAULT 'draft',
  current_version INT NOT NULL DEFAULT 1,
  trigger_category VARCHAR(80) NOT NULL DEFAULT 'record',
  trigger_type VARCHAR(80) NOT NULL DEFAULT 'record_created',
  trigger_module VARCHAR(80) NULL,
  flow_json JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY crm_action_flows_key_unique (flow_key),
  KEY crm_action_flows_status_idx (flow_status),
  KEY crm_action_flows_trigger_module_idx (trigger_module),
  KEY crm_action_flows_created_by_fk (created_by),
  KEY crm_action_flows_updated_by_fk (updated_by),
  CONSTRAINT crm_action_flows_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT crm_action_flows_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_action_flow_executions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  flow_id BIGINT UNSIGNED NOT NULL,
  flow_version INT NOT NULL,
  execution_status ENUM('queued', 'running', 'success', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
  trigger_payload_json JSON NULL,
  result_json JSON NULL,
  started_at TIMESTAMP NULL,
  finished_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY crm_action_flow_executions_flow_id_idx (flow_id),
  CONSTRAINT crm_action_flow_executions_flow_id_fk FOREIGN KEY (flow_id) REFERENCES crm_action_flows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
