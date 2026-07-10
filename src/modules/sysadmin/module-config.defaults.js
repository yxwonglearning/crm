const customerModule = {
  moduleKey: 'customers',
  name: 'Customers',
  description: 'Company records with country-aware contact numbers.'
};

const customerFields = [
  {
    fieldKey: 'companyName',
    dataKey: 'company_name',
    label: 'Company',
    type: 'text',
    required: true,
    showInTable: true,
    showInForm: true,
    showInImport: true,
    searchable: true,
    sortOrder: 10,
    locked: true
  },
  {
    fieldKey: 'email',
    dataKey: 'email',
    label: 'Email',
    type: 'email',
    required: false,
    showInTable: true,
    showInForm: true,
    showInImport: true,
    searchable: true,
    sortOrder: 20,
    locked: true
  },
  {
    fieldKey: 'contactPerson',
    dataKey: 'contact_person',
    label: 'Contact',
    type: 'text',
    required: true,
    showInTable: true,
    showInForm: true,
    showInImport: true,
    searchable: true,
    sortOrder: 30,
    locked: true
  },
  {
    fieldKey: 'phoneNumber',
    dataKey: 'international_phone',
    label: 'Phone',
    type: 'phone',
    required: true,
    showInTable: true,
    showInForm: true,
    showInImport: true,
    searchable: false,
    sortOrder: 40,
    locked: true
  },
  {
    fieldKey: 'countryId',
    dataKey: 'country_name',
    label: 'Country',
    type: 'browser_button',
    lookupConfig: {
      browserButtonKey: 'countries',
      triggerCondition: 'on_select',
      sourceModule: 'countries',
      sourceTable: 'countries',
      sourceTables: [
        { moduleKey: 'countries', tableName: 'countries', alias: 'a' }
      ],
      primaryKeyField: 'id',
      sourceWhere: '',
      fieldMappings: [
        { sourceField: 'name', targetField: '__lookupDisplay' },
        { sourceField: 'dial_code', targetField: '__dialCodeDisplay' }
      ]
    },
    required: true,
    showInTable: true,
    showInForm: true,
    showInImport: true,
    searchable: false,
    sortOrder: 50,
    locked: true
  },
  {
    fieldKey: 'status',
    dataKey: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: ['lead', 'active', 'inactive'],
    showInTable: true,
    showInForm: true,
    showInImport: true,
    searchable: false,
    sortOrder: 60,
    locked: true
  },
  {
    fieldKey: 'ownerUserId',
    dataKey: 'owner_name',
    label: 'Owner',
    type: 'owner',
    required: false,
    showInTable: true,
    showInForm: true,
    showInImport: false,
    searchable: false,
    sortOrder: 70,
    locked: true
  },
  {
    fieldKey: 'notes',
    dataKey: 'notes',
    label: 'Notes',
    type: 'textarea',
    required: false,
    showInTable: false,
    showInForm: true,
    showInImport: true,
    searchable: false,
    sortOrder: 80,
    locked: true
  }
];

const userModule = {
  moduleKey: 'users',
  name: 'Users',
  description: 'CRM user accounts and access settings.'
};

const userFields = [
  {
    fieldKey: 'name',
    dataKey: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    showInTable: true,
    showInForm: true,
    showInImport: false,
    searchable: true,
    sortOrder: 10,
    locked: true
  },
  {
    fieldKey: 'email',
    dataKey: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    showInTable: true,
    showInForm: true,
    showInImport: false,
    searchable: true,
    sortOrder: 20,
    locked: true
  },
  {
    fieldKey: 'password',
    dataKey: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    showInTable: false,
    showInForm: true,
    showInImport: false,
    searchable: false,
    sortOrder: 30,
    locked: true
  },
  {
    fieldKey: 'role',
    dataKey: 'role',
    label: 'Role',
    type: 'select',
    required: true,
    options: ['user', 'manager', 'admin'],
    showInTable: true,
    showInForm: true,
    showInImport: false,
    searchable: false,
    sortOrder: 40,
    locked: true
  },
  {
    fieldKey: 'status',
    dataKey: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: ['active', 'inactive'],
    showInTable: true,
    showInForm: true,
    showInImport: false,
    searchable: false,
    sortOrder: 50,
    locked: true
  }
];

module.exports = { customerModule, customerFields, userModule, userFields };
