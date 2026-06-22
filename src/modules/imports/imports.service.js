const XLSX = require('xlsx');
const { AppError } = require('../../shared/errors');
const countriesRepository = require('../countries/countries.repository');
const customersRepository = require('../customers/customers.repository');
const { hydrateCustomerInput } = require('../customers/customers.service');
const moduleConfig = require('../sysadmin/module-config.service');
const permissions = require('../permissions/permissions.service');

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

function validateHeaders(rows, expectedHeaders) {
  if (!rows.length) {
    throw new AppError('Excel file has no customer rows', 422);
  }

  const headers = Object.keys(rows[0]);
  const missing = expectedHeaders.filter((header) => !headers.includes(header));
  if (missing.length) {
    throw new AppError('Excel template is missing required columns', 422, { missing });
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

module.exports = { importCustomers, createCustomerTemplate, createCustomerExport, writeWorkbook };
