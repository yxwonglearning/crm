const XLSX = require('xlsx');
const { AppError } = require('../../shared/errors');
const countriesRepository = require('../countries/countries.repository');
const customersRepository = require('../customers/customers.repository');
const { hydrateCustomerInput } = require('../customers/customers.service');
const moduleConfig = require('../sysadmin/module-config.service');
const permissions = require('../permissions/permissions.service');
const moduleRecordsRepository = require('../module-records/module-records.repository');
const { validateFieldValue } = require('../../shared/field-validation');

const recordRefHeader = 'Record Ref';

const systemHeaderMap = {
  companyName: 'Company Name',
  contactPerson: 'Contact Person',
  email: 'Email',
  countryId: 'Country',
  phoneNumber: 'Contact Number',
  status: 'Status',
  notes: 'Notes'
};

function mappedHeader(field, direction) {
  const customHeader = direction === 'export' ? field.exportHeader : field.importHeader;
  return String(customHeader || '').trim() || systemHeaderMap[field.fieldKey] || field.label;
}

function assertCustomPublishedModule(config) {
  const module = config?.module;
  if (!module) throw new AppError('Module not found', 404);
  if (module.system) throw new AppError('System modules use dedicated import/export', 422);
  if (module.status !== 'published') throw new AppError('Module is not published', 404);
  return module;
}

async function moduleFieldsForAction(moduleKey, action, user) {
  const config = await moduleConfig.getModuleConfig(moduleKey);
  const module = assertCustomPublishedModule(config);
  await permissions.assertModulePageActionAllowed(moduleKey, user, action);

  const activeFields = (config.fields || []).filter((field) => !field.archived);
  const permissionMap = await permissions.userFieldPermissions(moduleKey, user, activeFields);
  const visibilityKey = action === 'export' ? 'showInExport' : 'showInImport';
  const fields = activeFields
    .filter((field) => field[visibilityKey] !== false && (action !== 'import' || field.showInImport))
    .filter((field) => permissionMap.get(field.fieldKey)?.[action])
    .map((field) => ({
      ...field,
      header: mappedHeader(field, action)
    }));

  return { module, fields };
}

async function fieldsForAction(action, user = null) {
  const config = await moduleConfig.getModuleConfig('customers');
  const permissionMap = user
    ? await permissions.userFieldPermissions('customers', user, config.fields)
    : new Map(config.fields.map((field) => [field.fieldKey, { [action]: true }]));
  const visibilityKey = action === 'export' ? 'showInExport' : 'showInImport';
  return config.fields
    .filter((field) => field[visibilityKey])
    .filter((field) => permissionMap.get(field.fieldKey)?.[action])
    .map((field) => ({
      ...field,
      header: mappedHeader(field, action)
    }));
}

async function importFields(user = null) {
  return fieldsForAction('import', user);
}

async function exportFields(user = null) {
  return fieldsForAction('export', user);
}

function protectHeaderRow(worksheet, expectedHeaders) {
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  worksheet['!views'] = [{ state: 'frozen', ySplit: 1 }];
  worksheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(expectedHeaders.length - 1)}1` };
  worksheet['!protect'] = {
    password: 'crm',
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: true,
    deleteColumns: false,
    deleteRows: false,
    sort: true,
    autoFilter: true
  };

  expectedHeaders.forEach((_header, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
    if (!worksheet[cellAddress]) return;
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E8F1FA' } },
      protection: { locked: true }
    };
  });
}

function unlockEditableRows(worksheet, expectedHeaders) {
  for (let row = 1; row <= 500; row += 1) {
    for (let column = 0; column < expectedHeaders.length; column += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: column });
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' };
      }
      worksheet[cellAddress].s = {
        ...(worksheet[cellAddress].s || {}),
        protection: { locked: false }
      };
    }
  }
}

async function createCustomerTemplate(user = null) {
  const fields = await importFields(user);
  if (!fields.length) {
    throw new AppError('You do not have permission to import customer fields', 403);
  }
  const expectedHeaders = fields.map((field) => field.header);
  const example = {};
  fields.forEach((field) => {
    const examples = {
      companyName: 'Example Sdn Bhd',
      contactPerson: 'Jane Tan',
      email: 'jane@example.com',
      countryId: 'Malaysia',
      phoneNumber: '0123456789',
      status: 'lead',
      notes: 'Optional notes'
    };
    example[field.header] = examples[field.fieldKey] || '';
  });

  const worksheet = XLSX.utils.json_to_sheet([
    example
  ], { header: expectedHeaders });
  worksheet['!cols'] = fields.map((field) => ({ wch: field.type === 'textarea' ? 36 : Math.max(14, field.label.length + 8) }));
  protectHeaderRow(worksheet, expectedHeaders);
  unlockEditableRows(worksheet, expectedHeaders);

  const instructions = XLSX.utils.aoa_to_sheet([
    ['Customer Import Instructions'],
    ['Use the Customers sheet for import. Keep the column names unchanged.'],
    [],
    ['Column', 'Required', 'Example', 'Notes'],
    ...fields.map((field) => [
      field.header,
      field.required ? 'Yes' : 'No',
      example[field.header] || '',
      field.options?.length ? `Allowed values: ${field.options.join(', ')}` : `${field.label} field.`
    ])
  ]);
  instructions['!cols'] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 24 },
    { wch: 72 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  XLSX.utils.book_append_sheet(workbook, instructions, 'Instructions');
  return workbook;
}

function writeWorkbook(workbook) {
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
}

function requireFile(file) {
  if (!file) {
    throw new AppError('Excel file is required', 422);
  }
}

function normalizeModuleValue(field, value) {
  if (field.type === 'checkbox') {
    const text = String(value || '').trim().toLowerCase();
    return ['true', 'yes', 'y', '1', 'checked'].includes(text);
  }
  if (field.type === 'int' || field.type === 'number') {
    if (value === '' || value === null || value === undefined) return '';
    return Number.parseInt(value, 10);
  }
  if (field.type === 'decimals') {
    if (value === '' || value === null || value === undefined) return '';
    return Number(value);
  }
  return value ?? '';
}

function moduleExampleValue(field) {
  if (field.options?.length) return field.options[0];
  if (field.type === 'checkbox') return 'Yes';
  if (field.type === 'int' || field.type === 'number') return 1;
  if (field.type === 'decimals') return 1.5;
  if (field.type === 'date') return '2026-06-29';
  return field.required ? `Example ${field.label}` : '';
}

function moduleMainFields(fields) {
  return fields.filter((field) => field.tableType !== 'detail');
}

function moduleDetailGroups(fields) {
  const groups = new Map();
  fields
    .filter((field) => field.tableType === 'detail' && field.detailTableName)
    .forEach((field) => {
      if (!groups.has(field.detailTableName)) groups.set(field.detailTableName, []);
      groups.get(field.detailTableName).push(field);
    });
  return Array.from(groups.entries()).map(([tableName, tableFields], index) => ({
    tableName,
    sheetName: detailSheetName(tableName, index),
    fields: tableFields
  }));
}

function detailSheetName(tableName, index = 0) {
  const base = String(tableName || `Detail ${index + 1}`)
    .replace(/[\[\]\*\/\\\?:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || `Detail ${index + 1}`;
  return base.slice(0, 31);
}

function removeEmptySecondRow(worksheet, headers) {
  headers.forEach((_header, index) => {
    const address = XLSX.utils.encode_cell({ r: 1, c: index });
    delete worksheet[address];
  });
  worksheet['!ref'] = `A1:${XLSX.utils.encode_col(headers.length - 1)}1`;
}

async function createModuleTemplate(moduleKey, user = null) {
  const { module, fields } = await moduleFieldsForAction(moduleKey, 'import', user);
  if (!fields.length) {
    throw new AppError('You do not have permission to import fields for this module', 403);
  }

  const mainFields = moduleMainFields(fields);
  const detailGroups = moduleDetailGroups(fields);
  const expectedHeaders = [recordRefHeader, ...mainFields.map((field) => field.header)];
  const example = {
    [recordRefHeader]: 'REC-1',
    ...Object.fromEntries(mainFields.map((field) => [field.header, moduleExampleValue(field)]))
  };
  const worksheet = XLSX.utils.json_to_sheet([example], { header: expectedHeaders });
  worksheet['!cols'] = [{ wch: 14 }, ...mainFields.map((field) => ({ wch: field.type === 'textarea' ? 36 : Math.max(14, field.header.length + 8) }))];
  protectHeaderRow(worksheet, expectedHeaders);
  unlockEditableRows(worksheet, expectedHeaders);

  const instructions = XLSX.utils.aoa_to_sheet([
    [`${module.name} Import Instructions`],
    [`Use the ${module.name} sheet for main records. Keep the column names unchanged.`],
    [`Use ${recordRefHeader} to connect detail-sheet rows to their main record before database IDs exist.`],
    [],
    ['Sheet', 'Column', 'Required', 'Example', 'Notes'],
    ...mainFields.map((field) => [
      module.name.slice(0, 31) || 'Records',
      field.header,
      field.required ? 'Yes' : 'No',
      example[field.header] || '',
      field.options?.length ? `Allowed values: ${field.options.join(', ')}` : `${field.label} field.`
    ]),
    ...detailGroups.flatMap((group) => group.fields.map((field) => [
      group.sheetName,
      field.header,
      field.required ? 'Yes' : 'No',
      moduleExampleValue(field),
      field.options?.length ? `Allowed values: ${field.options.join(', ')}` : `${field.label} detail field.`
    ]))
  ]);
  instructions['!cols'] = [
    { wch: 24 },
    { wch: 24 },
    { wch: 12 },
    { wch: 24 },
    { wch: 72 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, module.name.slice(0, 31) || 'Records');
  detailGroups.forEach((group) => {
    const headers = [recordRefHeader, ...group.fields.map((field) => field.header)];
    const detailExample = {
      [recordRefHeader]: 'REC-1',
      ...Object.fromEntries(group.fields.map((field) => [field.header, moduleExampleValue(field)]))
    };
    const detailWorksheet = XLSX.utils.json_to_sheet([detailExample], { header: headers });
    detailWorksheet['!cols'] = [{ wch: 14 }, ...group.fields.map((field) => ({ wch: field.type === 'textarea' ? 36 : Math.max(14, field.header.length + 8) }))];
    protectHeaderRow(detailWorksheet, headers);
    unlockEditableRows(detailWorksheet, headers);
    XLSX.utils.book_append_sheet(workbook, detailWorksheet, group.sheetName);
  });
  XLSX.utils.book_append_sheet(workbook, instructions, 'Instructions');
  return workbook;
}

async function parseModuleRows(moduleKey, file, user) {
  requireFile(file);
  const { module, fields } = await moduleFieldsForAction(moduleKey, 'import', user);
  const mainFields = moduleMainFields(fields);
  const detailGroups = moduleDetailGroups(fields);
  const expectedHeaders = [recordRefHeader, ...mainFields.map((field) => field.header)];
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError('Excel file does not contain any sheets', 422);
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  const detailRows = {};
  detailGroups.forEach((group) => {
    const detailWorksheet = workbook.Sheets[group.sheetName];
    const headers = [recordRefHeader, ...group.fields.map((field) => field.header)];
    if (!detailWorksheet) {
      detailRows[group.tableName] = [];
      return;
    }
    const parsedRows = XLSX.utils.sheet_to_json(detailWorksheet, { defval: '' });
    if (parsedRows.length) {
      validateHeaders(parsedRows, headers, `${group.sheetName} sheet`);
    }
    detailRows[group.tableName] = parsedRows.filter((row) => headers.some((header) => String(row[header] || '').trim()));
  });
  return {
    module,
    fields,
    mainFields,
    detailGroups,
    expectedHeaders,
    rows: rows.filter((row) => expectedHeaders.some((header) => String(row[header] || '').trim())),
    detailRows
  };
}

async function importModuleRecords(moduleKey, file, user = null) {
  const { fields, mainFields, detailGroups, expectedHeaders, rows, detailRows } = await parseModuleRows(moduleKey, file, user);
  if (!fields.length) {
    throw new AppError('You do not have permission to import fields for this module', 403);
  }
  validateHeaders(rows, expectedHeaders, 'main sheet');

  const created = [];
  const errors = [];
  const createdByRef = new Map();

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const recordRef = String(row[recordRefHeader] || `ROW-${rowNumber}`).trim() || `ROW-${rowNumber}`;
    const customFields = {};
    try {
      mainFields.forEach((field) => {
        customFields[field.fieldKey] = normalizeModuleValue(field, row[field.header]);
      });
      for (const field of mainFields) {
        await validateFieldValue(field, customFields[field.fieldKey], customFields, {
          uniqueChecker: field.validationRules?.unique
            ? (uniqueField, value) => moduleRecordsRepository.countFieldValue(moduleKey, uniqueField, value)
            : null
        });
      }
      const id = await moduleRecordsRepository.createRecord(moduleKey, customFields, user?.id);
      const recordDetailTables = {};
      for (const group of detailGroups) {
        const rowsForRecord = (detailRows[group.tableName] || [])
          .filter((detailRow) => String(detailRow[recordRefHeader] || '').trim() === recordRef)
          .map((detailRow) => Object.fromEntries(group.fields.map((field) => [
            field.fieldKey,
            normalizeModuleValue(field, detailRow[field.header])
          ])));
        for (const detailRow of rowsForRecord) {
          for (const field of group.fields) {
            await validateFieldValue(field, detailRow[field.fieldKey], detailRow);
          }
        }
        recordDetailTables[group.tableName] = rowsForRecord;
      }
      await moduleRecordsRepository.replaceDetailRows(id, fields, recordDetailTables);
      createdByRef.set(recordRef, id);
      created.push({ row: rowNumber, id });
    } catch (error) {
      errors.push({ row: rowNumber, message: error.message });
    }
  }

  Object.entries(detailRows).forEach(([tableName, tableRows]) => {
    tableRows.forEach((row, index) => {
      const recordRef = String(row[recordRefHeader] || '').trim();
      if (recordRef && !createdByRef.has(recordRef)) {
        errors.push({ row: `${tableName}:${index + 2}`, message: `No main record was imported for ${recordRef}` });
      }
    });
  });

  return {
    createdCount: created.length,
    errorCount: errors.length,
    created,
    errors
  };
}

async function parseRows(file, user) {
  const fields = await importFields(user);
  const expectedHeaders = fields.map((field) => field.header);
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError('Excel file does not contain any sheets', 422);
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return {
    fields,
    expectedHeaders,
    rows: rows.filter((row) => (
      expectedHeaders.some((header) => String(row[header] || '').trim())
    ))
  };
}

function validateHeaders(rows, expectedHeaders, label = 'Excel template') {
  if (!rows.length) {
    throw new AppError(`${label} has no rows`, 422);
  }

  const headers = Object.keys(rows[0]);
  const missing = expectedHeaders.filter((header) => !headers.includes(header));
  if (missing.length) {
    throw new AppError(`${label} is missing required columns`, 422, { missing });
  }
}

function rowValue(row, fields, fieldKey, fallbackHeader = '') {
  const field = fields.find((item) => item.fieldKey === fieldKey);
  const header = field?.header || fallbackHeader;
  return header ? row[header] : '';
}

async function countryMap() {
  const countries = await countriesRepository.listCountries();
  return new Map(countries.map((country) => [country.name.toLowerCase(), country]));
}

function exportValue(customer, field) {
  const values = {
    companyName: customer.company_name,
    contactPerson: customer.contact_person,
    email: customer.email,
    countryId: customer.country_name,
    phoneNumber: customer.phone_number,
    status: customer.status,
    notes: customer.notes,
    ownerUserId: customer.owner_name
  };
  if (Object.prototype.hasOwnProperty.call(values, field.fieldKey)) {
    return values[field.fieldKey] ?? '';
  }
  if (!field.dataKey) {
    return customer.custom_fields?.[field.fieldKey] ?? '';
  }
  return customer[field.dataKey] ?? '';
}

async function createCustomerExport(user = null) {
  const fields = await exportFields(user);
  if (!fields.length) {
    throw new AppError('You do not have permission to export customer fields', 403);
  }

  const customersService = require('../customers/customers.service');
  const customers = await customersService.listCustomers({}, user);
  const rows = customers.map((customer) => Object.fromEntries(
    fields.map((field) => [field.header, exportValue(customer, field)])
  ));
  const headers = fields.map((field) => field.header);
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}], { header: headers });
  if (!rows.length) {
    headers.forEach((header, index) => {
      const address = XLSX.utils.encode_cell({ r: 1, c: index });
      delete worksheet[address];
    });
    worksheet['!ref'] = `A1:${XLSX.utils.encode_col(headers.length - 1)}1`;
  }
  worksheet['!cols'] = fields.map((field) => ({ wch: field.type === 'textarea' ? 36 : Math.max(14, field.header.length + 6) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  return workbook;
}

async function createModuleExport(moduleKey, user = null) {
  const { module, fields } = await moduleFieldsForAction(moduleKey, 'export', user);
  if (!fields.length) {
    throw new AppError('You do not have permission to export fields for this module', 403);
  }

  const mainFields = moduleMainFields(fields);
  const detailGroups = moduleDetailGroups(fields);
  const records = await moduleRecordsRepository.listRecords(moduleKey, mainFields, {});
  const rows = records.map((record) => Object.fromEntries(
    [[recordRefHeader, record.id], ...mainFields.map((field) => [field.header, record.customFields?.[field.fieldKey] ?? ''])]
  ));
  const headers = [recordRefHeader, ...mainFields.map((field) => field.header)];
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}], { header: headers });
  if (!rows.length) {
    removeEmptySecondRow(worksheet, headers);
  }
  worksheet['!cols'] = [{ wch: 14 }, ...mainFields.map((field) => ({ wch: field.type === 'textarea' ? 36 : Math.max(14, field.header.length + 6) }))];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, module.name.slice(0, 31) || 'Records');
  for (const group of detailGroups) {
    const detailRows = [];
    for (const record of records) {
      const detailTables = await moduleRecordsRepository.detailRowsByRecordId(record.id, group.fields);
      (detailTables[group.tableName] || []).forEach((row) => {
        detailRows.push(Object.fromEntries([
          [recordRefHeader, record.id],
          ...group.fields.map((field) => [field.header, row[field.fieldKey] ?? ''])
        ]));
      });
    }
    const detailHeaders = [recordRefHeader, ...group.fields.map((field) => field.header)];
    const detailWorksheet = XLSX.utils.json_to_sheet(detailRows.length ? detailRows : [{}], { header: detailHeaders });
    if (!detailRows.length) {
      removeEmptySecondRow(detailWorksheet, detailHeaders);
    }
    detailWorksheet['!cols'] = [{ wch: 14 }, ...group.fields.map((field) => ({ wch: field.type === 'textarea' ? 36 : Math.max(14, field.header.length + 6) }))];
    XLSX.utils.book_append_sheet(workbook, detailWorksheet, group.sheetName);
  }
  return workbook;
}

async function importCustomers(file, user) {
  requireFile(file);
  const { fields, expectedHeaders, rows } = await parseRows(file, user);
  if (!fields.length) {
    throw new AppError('You do not have permission to import customer fields', 403);
  }
  validateHeaders(rows, expectedHeaders);

  const countries = await countryMap();
  const created = [];
  const errors = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    try {
      const countryName = String(rowValue(row, fields, 'countryId', 'Country') || '').trim().toLowerCase();
      const country = countries.get(countryName);
      if (!country) {
        throw new AppError(`Unknown country "${rowValue(row, fields, 'countryId', 'Country')}"`, 422);
      }

      const input = {
        companyName: rowValue(row, fields, 'companyName', 'Company Name'),
        contactPerson: rowValue(row, fields, 'contactPerson', 'Contact Person'),
        email: rowValue(row, fields, 'email', 'Email') || '',
        countryId: country.id,
        phoneNumber: rowValue(row, fields, 'phoneNumber', 'Contact Number'),
        status: String(rowValue(row, fields, 'status', 'Status') || 'lead').toLowerCase(),
        notes: rowValue(row, fields, 'notes', 'Notes') || ''
      };
      fields
        .filter((field) => !systemHeaderMap[field.fieldKey])
        .forEach((field) => {
          input[field.fieldKey] = row[field.header] || '';
        });
      const customer = await hydrateCustomerInput(input, user, { action: 'import' });
      const id = await customersRepository.createCustomer(customer);
      created.push({ row: rowNumber, id });
    } catch (error) {
      errors.push({ row: rowNumber, message: error.message });
    }
  }

  return {
    createdCount: created.length,
    errorCount: errors.length,
    created,
    errors
  };
}

module.exports = {
  importCustomers,
  createCustomerTemplate,
  createCustomerExport,
  createModuleTemplate,
  createModuleExport,
  importModuleRecords,
  writeWorkbook
};
