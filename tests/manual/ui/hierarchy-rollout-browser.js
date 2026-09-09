// Run against the authenticated local app. Fixtures stay in browser memory and are restored.
async page => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const backup = await page.evaluate(() => ({
    departmentNodes: structuredClone(state.departmentNodes),
    activeDepartmentNodeId: state.activeDepartmentNodeId,
    pageViewPermissionModule: state.pageViewPermissionModule,
    pageViewPermissionMatrix: structuredClone(state.pageViewPermissionMatrix),
    apiConnectorCategories: structuredClone(state.apiConnectorCategories),
    apiConnectors: structuredClone(state.apiConnectors),
    activeApiTab: state.activeApiTab,
    activeApiCategory: state.activeApiCategory,
    apiCategorySearch: state.apiCategorySearch,
    apiTreeExpanded: structuredClone(state.apiTreeExpanded),
    menuConfigDraft: structuredClone(state.menuConfigDraft),
    selectedMenuItemKey: state.selectedMenuItemKey,
    visibleView: Array.from(document.querySelectorAll('.view')).find((view) => !view.hidden)?.id || '',
    adminSectionHidden: Array.from(document.querySelectorAll('.admin-section')).map((section) => [section.id, section.hidden])
  }));
  const departments = [
    { id: 1, nodeKey: 'organization', name: 'Organization', type: 'organization', parentId: null, parentName: '', enabled: true },
    { id: 2, nodeKey: 'operations', name: 'Operations', type: 'department', parentId: 1, parentName: 'Organization', enabled: true },
    { id: 3, nodeKey: 'finance', name: 'Finance', type: 'department', parentId: 1, parentName: 'Organization', enabled: true },
    { id: 4, nodeKey: 'monitoring', name: 'Workflow Monitoring', type: 'group', parentId: 2, parentName: 'Operations', enabled: true },
    { id: 5, nodeKey: 'regional', name: 'Regional Monitoring With A Deliberately Long Label', type: 'group', parentId: 4, parentName: 'Workflow Monitoring', enabled: true },
    { id: 6, nodeKey: 'approval', name: 'Approval Requests', type: 'group', parentId: 2, parentName: 'Operations', enabled: true }
  ];
  try {
    await page.evaluate((nodes) => {
      state.departmentNodes = structuredClone(nodes);
      state.activeDepartmentNodeId = 5;
      renderDepartmentWorkspace();
    }, departments);
    check(await page.locator('#departmentTree .department-tree-node').count() === 6, 'Organization Structure must render every recursive node');
    check(await page.locator('#departmentTree .department-tree-node.is-hierarchy-path').count() === 4, 'selected department path must include each actual ancestor');
    check(await page.locator('#departmentTree .department-tree-item[aria-expanded]').count() === 0, 'static Organization Structure must not gain disclosure behavior');
    const departmentSiblingColors = await page.locator('#departmentTree .department-tree-node[data-hierarchy-key="4"], #departmentTree .department-tree-node[data-hierarchy-key="6"]').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node, '::after').borderBottomColor));
    check(departmentSiblingColors[0] !== departmentSiblingColors[1], 'inactive Organization sibling branch must remain muted');
    await page.evaluate(() => {
      document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== 'sysadminView'; });
      document.querySelectorAll('.admin-section').forEach((section) => { section.hidden = section.id !== 'adminDepartmentsSection'; });
    });
    await page.locator('#departmentTree').screenshot({ path: 'output/playwright/hierarchy-organization.png' });

    await page.evaluate((nodes) => {
      state.departmentNodes = structuredClone(nodes);
      state.pageViewPermissionModule = 'customers';
      state.pageViewPermissionMatrix = {
        roles: ['admin', 'manager', 'user'],
        actions: ['view'],
        permissions: { view: { departments: ['5', '3'], roles: [], users: [] } }
      };
      renderPageViewPermissionModal();
      document.querySelector('#pageViewPermissionModal').hidden = false;
    }, departments);
    const departmentPicker = page.locator('[data-permission-picker="departments"]');
    check(await departmentPicker.locator('input:checked').count() === 2, 'permission rollout must preserve exact checked IDs');
    check(await departmentPicker.locator('.permission-department-entry.is-hierarchy-path').count() === 5, 'multiple checked nodes must produce the union of their ancestry paths');
    await departmentPicker.locator('input[value="2"]').click();
    check(await departmentPicker.locator('input:checked').count() === 3, 'checking an ancestor must add only that exact permission value');
    check(!await departmentPicker.locator('input[value="4"]').isChecked(), 'checking an ancestor must not cascade to an unchecked descendant');
    await departmentPicker.locator('input[value="2"]').click();
    await departmentPicker.locator('[data-permission-search]').fill('Regional Monitoring');
    check(await departmentPicker.locator('.permission-department-entry:not([hidden])').count() === 4, 'permission search must retain the matching node and its ancestors');
    check(await departmentPicker.locator('.permission-department-entry.is-hierarchy-visible-last').count() >= 1, 'filtered permission branches must identify their last visible node');
    check(await departmentPicker.locator('input:checked').count() === 2, 'permission search must not change checkbox values');
    await departmentPicker.locator('[data-permission-search]').fill('');
    await departmentPicker.screenshot({ path: 'output/playwright/hierarchy-permissions.png' });
    await page.evaluate(() => { document.querySelector('#pageViewPermissionModal').hidden = true; });

    await page.evaluate(() => {
      state.apiConnectorCategories = [
        { categoryKey: 'finance', name: 'Finance', description: 'Finance APIs' },
        { categoryKey: 'operations', name: 'Operations', description: 'Operations APIs' }
      ];
      state.apiConnectors = [
        { connectorKey: 'erp', name: 'ERP', categoryKey: 'finance', endpoints: [{ key: 'invoice' }] },
        { connectorKey: 'ops', name: 'Operations', categoryKey: 'operations', endpoints: [{ key: 'monitor' }] }
      ];
      state.activeApiTab = 'connectors';
      state.activeApiCategory = 'operations';
      state.apiCategorySearch = '';
      state.apiTreeExpanded = { connectors: true, interfaces: true };
      renderApiCategoryNavigation();
    });
    check(await page.locator('#apiHierarchyNav .api-tree-group').count() === 2, 'API must retain its two current hierarchy roots');
    check(await page.locator('#apiHierarchyNav .api-tree-child-node').count() === 6, 'each API root must retain categories plus Uncategorized');
    check(await page.locator('#apiHierarchyNav .api-tree-child.is-selected').count() === 1, 'only the selected API category may receive strongest emphasis');
    check(await page.locator('#apiHierarchyNav .api-tree-group.has-selected-descendant').count() === 1, 'only the active API scope may receive ancestor-path indication');
    await page.evaluate(() => {
      document.querySelectorAll('.admin-section').forEach((section) => { section.hidden = section.id !== 'adminApiSection'; });
    });
    await page.locator('#apiHierarchyNav [data-api-category-scope="connectors"][data-api-category="finance"]').click();
    check(await page.evaluate(() => state.activeApiTab === 'connectors' && state.activeApiCategory === 'finance'), 'clicking an API category must retain selection and filtering state changes');
    await page.locator('#apiCategorySearch').fill('Operations');
    check(await page.locator('#apiHierarchyNav .api-tree-child-node').count() === 2, 'API category search must filter both existing scope trees');
    await page.locator('#apiCategorySearch').fill('');
    await page.locator('#apiHierarchyNav').screenshot({ path: 'output/playwright/hierarchy-api-categories.png' });

    const menuItems = [
      { key: 'root', type: 'group', parentKey: null, label: 'Operations', icon: 'settings', enabled: true, order: 1, visibility: {} },
      { key: 'child_a', type: 'item', parentKey: 'root', label: 'Approval Requests', icon: 'approval', enabled: true, order: 1, destination: { type: 'view', key: 'customersView' }, visibility: {} },
      { key: 'child_group', type: 'group', parentKey: 'root', label: 'Workflow', icon: 'settings', enabled: true, order: 2, visibility: {} },
      { key: 'deep_group', type: 'group', parentKey: 'child_group', label: 'Regional', icon: 'settings', enabled: true, order: 1, visibility: {} },
      { key: 'deep_leaf', type: 'item', parentKey: 'deep_group', label: 'Workflow Monitoring', icon: 'approval', enabled: true, order: 1, destination: { type: 'view', key: 'workflowMonitoringView' }, visibility: {} }
    ];
    await page.evaluate((items) => {
      state.menuConfigDraft = { schemaVersion: 1, defaultModuleGroupKey: 'root', items: structuredClone(items) };
      state.selectedMenuItemKey = 'deep_leaf';
      renderMenuConfig();
    }, menuItems);
    check(await page.locator('#menuConfigTree .menu-tree-node').count() === 5, 'Menu Configuration must retain recursive rows');
    check(await page.locator('#menuConfigTree .menu-tree-node.is-hierarchy-path').count() === 4, 'Menu Configuration must emphasize only the selected ancestry path');
    check(await page.locator('#menuConfigTree .menu-tree-item[draggable="true"]').count() === 5, 'all existing menu rows must remain draggable');
    check(await page.locator('#menuConfigTree .menu-tree-item').first().evaluate((row) => getComputedStyle(row).zIndex === '1'), 'interactive menu rows must remain above connectors');
    check(await page.locator('#menuConfigTree .hierarchy-branch > .menu-tree-node').first().evaluate((node) => getComputedStyle(node, '::after').pointerEvents === 'none'), 'menu connectors must not intercept drag or pointer input');
    await page.evaluate(() => {
      document.querySelectorAll('.admin-section').forEach((section) => { section.hidden = section.id !== 'adminMenuConfigurationSection'; });
    });
    await page.evaluate(() => {
      const source = document.querySelector('#menuConfigTree [data-menu-item-key="child_a"]');
      const target = document.querySelector('#menuConfigTree [data-menu-item-key="child_group"]');
      const transfer = new DataTransfer();
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
      const bounds = target.getBoundingClientRect();
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, clientY: bounds.top + (bounds.height / 2), dataTransfer: transfer }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientY: bounds.top + (bounds.height / 2), dataTransfer: transfer }));
      source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: transfer }));
    });
    check(await page.evaluate(() => state.menuConfigDraft.items.find((item) => item.key === 'child_a')?.parentKey === 'child_group'), 'desktop drag/drop must still move a menu item inside a group');
    await page.evaluate((items) => {
      state.menuConfigDraft.items = structuredClone(items);
      state.selectedMenuItemKey = 'deep_leaf';
      renderMenuConfig();
    }, menuItems);
    await page.evaluate(() => showMenuDropTarget(document.querySelector('#menuConfigTree [data-menu-item-key="child_group"]'), 'inside'));
    check(await page.locator('#menuConfigTree [data-menu-item-key="child_group"]').evaluate((row) => row.classList.contains('is-drop-inside')), 'inside-group drop feedback must remain available');
    await page.evaluate(() => showMenuDropTarget(null, 'after'));
    await page.locator('#menuConfigTree').screenshot({ path: 'output/playwright/hierarchy-menu-configuration.png' });

    await page.setViewportSize({ width: 680, height: 900 });
    check(await departmentPicker.evaluate((picker) => picker.scrollWidth <= picker.clientWidth), 'permission hierarchy must not create horizontal overflow at narrow width');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    check(await page.locator('#menuConfigTree .menu-tree-node').first().evaluate((node) => parseFloat(getComputedStyle(node, '::after').transitionDuration) === 0), 'hierarchy connectors must honor reduced motion');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.screenshot({ path: 'output/playwright/hierarchy-rollout-surfaces.png', fullPage: true });
  } finally {
    await page.evaluate((saved) => {
      Object.assign(state, saved);
      renderDepartmentWorkspace();
      if (state.pageViewPermissionMatrix) renderPageViewPermissionModal();
      renderApiCategoryNavigation();
      if (state.menuConfigDraft) renderMenuConfig();
      document.querySelector('#pageViewPermissionModal').hidden = true;
      document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== saved.visibleView; });
      saved.adminSectionHidden.forEach(([id, hidden]) => {
        const section = document.getElementById(id);
        if (section) section.hidden = hidden;
      });
    }, backup);
  }
  return 'PASS: Organization Structure, Permissions, API categories, Menu Configuration, narrow width, and reduced motion; browser state restored.';
}
