const XLSX = require('xlsx');
const { AppError } = require('../../shared/errors');
const repository = require('./departments.repository');

function slug(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 70);
}

async function ensureOrganization(userId = null) {
  const nodes = await repository.listNodes();
  const existing = nodes.find((node) => node.type === 'organization');
  if (existing) return existing;
  return repository.saveNode({ id: 0, nodeKey: 'organization', name: 'Organization', type: 'organization', description: 'Default organization root.', enabled: true }, userId);
}

async function listHierarchy(userId = null) {
  await ensureOrganization(userId);
  return { nodes: await repository.listNodes() };
}

async function saveNode(input, userId = null) {
  const type = input.type;
  if (!['organization', 'department', 'group'].includes(type)) throw new AppError('Invalid hierarchy level', 422);
  if (type === 'organization') {
    const organization = await ensureOrganization(userId);
    return { node: await repository.updateNode(organization.id, input, userId) };
  }
  const parent = await repository.findById(Number(input.parentId));
  if (!parent) throw new AppError('Choose a valid parent item', 422);
  if (parent.enabled === false) throw new AppError('Choose an enabled parent item', 422);
  const existing = await repository.findByNameAndParent(input.name, type, parent.id);
  if (existing && Number(input.id || 0) !== existing.id) throw new AppError(`${input.name} already exists under ${parent.name}`, 409);
  if (input.id) return { node: await repository.updateNode(Number(input.id), input, userId) };
  const nodeKey = `${type}_${slug(parent.nodeKey)}_${slug(input.name)}`.slice(0, 80);
  return { node: await repository.saveNode({ ...input, nodeKey, parentId: parent.id }, userId) };
}

async function deleteNode(id) {
  const node = await repository.findById(id);
  if (!node) throw new AppError('Department item not found', 404);
  if (node.type === 'organization') throw new AppError('The default Organization cannot be deleted', 422);
  if (await repository.childCount(id)) throw new AppError('Move or delete child items before deleting this item', 409);
  return { deletedCount: await repository.deleteNode(id) };
}

function createTemplate() {
  const rows = [
    { 'Parent Path': 'Organization', Name: 'Finance', Type: 'Department', Description: 'Finance department' },
    { 'Parent Path': 'Organization', Name: 'Shared Services', Type: 'Group', Description: 'Organization-wide shared services' },
    { 'Parent Path': 'Organization/Finance', Name: 'Accounts Payable', Type: 'Group', Description: 'Handles supplier payments' },
    { 'Parent Path': 'Organization/Finance/Accounts Payable', Name: 'Invoice Processing', Type: 'Department', Description: 'Nested unit example' }
  ];
  const sheet = XLSX.utils.json_to_sheet(rows, { header: ['Parent Path', 'Name', 'Type', 'Description'] });
  sheet['!cols'] = [{ wch: 48 }, { wch: 28 }, { wch: 18 }, { wch: 48 }];
  sheet['!autofilter'] = { ref: 'A1:D5' };
  const instructions = XLSX.utils.aoa_to_sheet([
    ['Department Hierarchy Import'],
    ['Organization is the single root. Departments and Groups can be nested beneath any item.'],
    ['Parent Path starts with Organization and uses / between levels. Rows may appear in any order.'],
    ['Type must be Department or Group. Name is required.'],
    ['Repeated names with the same Type and Parent Path are skipped.']
  ]);
  instructions['!cols'] = [{ wch: 100 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Departments');
  XLSX.utils.book_append_sheet(workbook, instructions, 'Instructions');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function importHierarchy(file, userId = null) {
  if (!file?.buffer) throw new AppError('Choose an Excel file to import', 422);
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets.Departments || workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) throw new AppError('The import file has no department rows', 422);
  const organization = await ensureOrganization(userId);
  let departmentsCreated = 0;
  let groupsCreated = 0;
  const pathMap = new Map([['organization', organization]]);
  const nodes = (await listHierarchy(userId)).nodes;
  const unresolvedNodes = nodes.filter((node) => node.type !== 'organization');
  while (unresolvedNodes.length) {
    let resolved = 0;
    for (let index = unresolvedNodes.length - 1; index >= 0; index -= 1) {
      const node = unresolvedNodes[index];
      const parentEntry = [...pathMap.entries()].find(([, parent]) => parent.id === node.parentId);
      if (!parentEntry) continue;
      pathMap.set(`${parentEntry[0]}/${node.name.toLowerCase()}`, node);
      unresolvedNodes.splice(index, 1);
      resolved += 1;
    }
    if (!resolved) break;
  }
  const pending = rows.map((row, index) => ({
    row: index + 2,
    parentPath: String(row['Parent Path'] || row.ParentPath || '').trim().replace(/^\/+|\/+$/g, ''),
    name: String(row.Name || '').trim(),
    type: String(row.Type || '').trim().toLowerCase(),
    description: String(row.Description || '').trim()
  })).filter((item) => item.name);
  while (pending.length) {
    let processed = 0;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const item = pending[index];
      const parentKey = (item.parentPath || 'Organization').toLowerCase();
      const parent = pathMap.get(parentKey);
      if (!parent) continue;
      if (!['department', 'group'].includes(item.type)) throw new AppError(`Row ${item.row}: Type must be Department or Group`, 422);
      let node = await repository.findByNameAndParent(item.name, item.type, parent.id);
      if (!node) {
        node = (await saveNode({ name: item.name, type: item.type, parentId: parent.id, description: item.description, enabled: true }, userId)).node;
        if (item.type === 'department') departmentsCreated += 1;
        else groupsCreated += 1;
      }
      pathMap.set(`${parentKey}/${item.name.toLowerCase()}`, node);
      pending.splice(index, 1);
      processed += 1;
    }
    if (!processed) throw new AppError(`Parent path not found for row ${pending[0].row}: ${pending[0].parentPath || 'Organization'}`, 422);
  }
  return { departmentsCreated, groupsCreated, hierarchy: await listHierarchy(userId) };
}

module.exports = { listHierarchy, saveNode, deleteNode, createTemplate, importHierarchy };
