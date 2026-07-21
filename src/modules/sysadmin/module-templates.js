const sharedStatusOptions = ['Active', 'Inactive'];

const templates = [
  {
    key: 'companies',
    name: 'Companies',
    description: 'Organizations, ownership, contact details, and lifecycle status.',
    fields: [
      { fieldKey: 'companyName', label: 'Company Name', type: 'textbox', required: true, searchable: true },
      { fieldKey: 'companyCode', label: 'Company Code', type: 'textbox', searchable: true, validationRules: { unique: true } },
      { fieldKey: 'companyType', label: 'Company Type', type: 'dropdownbox', options: ['Customer', 'Prospect', 'Partner', 'Supplier'] },
      { fieldKey: 'industry', label: 'Industry', type: 'textbox', searchable: true },
      { fieldKey: 'website', label: 'Website', type: 'textbox' },
      { fieldKey: 'mainPhone', label: 'Main Phone', type: 'phone' },
      { fieldKey: 'email', label: 'Email', type: 'email' },
      { fieldKey: 'address', label: 'Address', type: 'textarea', showInTable: false },
      { fieldKey: 'country', label: 'Country', type: 'country' },
      { fieldKey: 'owner', label: 'Owner', type: 'owner' },
      { fieldKey: 'status', label: 'Status', type: 'dropdownbox', options: sharedStatusOptions, required: true },
      { fieldKey: 'notes', label: 'Notes', type: 'textarea', showInTable: false }
    ]
  },
  {
    key: 'contacts',
    name: 'Contacts',
    description: 'People, their company details, communication channels, and ownership.',
    fields: [
      { fieldKey: 'firstName', label: 'First Name', type: 'textbox', required: true, searchable: true },
      { fieldKey: 'lastName', label: 'Last Name', type: 'textbox', required: true, searchable: true },
      { fieldKey: 'company', label: 'Company', type: 'textbox', searchable: true },
      { fieldKey: 'jobTitle', label: 'Job Title', type: 'textbox' },
      { fieldKey: 'department', label: 'Department', type: 'textbox' },
      { fieldKey: 'workEmail', label: 'Work Email', type: 'email', searchable: true },
      { fieldKey: 'workPhone', label: 'Work Phone', type: 'phone' },
      { fieldKey: 'mobilePhone', label: 'Mobile Phone', type: 'phone' },
      { fieldKey: 'preferredContactMethod', label: 'Preferred Contact Method', type: 'dropdownbox', options: ['Email', 'Work Phone', 'Mobile Phone'] },
      { fieldKey: 'owner', label: 'Owner', type: 'owner' },
      { fieldKey: 'status', label: 'Status', type: 'dropdownbox', options: sharedStatusOptions, required: true },
      { fieldKey: 'notes', label: 'Notes', type: 'textarea', showInTable: false }
    ]
  },
  {
    key: 'sales_opportunities',
    name: 'Sales Opportunities',
    description: 'Pipeline value, stage, expected close date, and ownership.',
    fields: [
      { fieldKey: 'opportunityName', label: 'Opportunity Name', type: 'textbox', required: true, searchable: true },
      { fieldKey: 'company', label: 'Company', type: 'textbox', required: true, searchable: true },
      { fieldKey: 'primaryContact', label: 'Primary Contact', type: 'textbox', searchable: true },
      { fieldKey: 'stage', label: 'Stage', type: 'dropdownbox', options: ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'], required: true },
      { fieldKey: 'estimatedValue', label: 'Estimated Value', type: 'decimals' },
      { fieldKey: 'currency', label: 'Currency', type: 'dropdownbox', options: ['SGD', 'USD', 'MYR', 'EUR', 'GBP'] },
      { fieldKey: 'probability', label: 'Probability (%)', type: 'int', validationRules: { minValue: 0, maxValue: 100 } },
      { fieldKey: 'expectedCloseDate', label: 'Expected Close Date', type: 'date' },
      { fieldKey: 'source', label: 'Source', type: 'dropdownbox', options: ['Referral', 'Website', 'Outbound', 'Partner', 'Event', 'Other'] },
      { fieldKey: 'owner', label: 'Owner', type: 'owner' },
      { fieldKey: 'status', label: 'Status', type: 'dropdownbox', options: ['Open', 'Won', 'Lost'], required: true },
      { fieldKey: 'notes', label: 'Notes', type: 'textarea', showInTable: false }
    ]
  }
];

function listModuleTemplates() {
  return templates.map(({ fields, ...template }) => ({ ...template, fieldCount: fields.length }));
}

function findModuleTemplate(templateKey) {
  return templates.find((template) => template.key === templateKey) || null;
}

module.exports = { listModuleTemplates, findModuleTemplate };
