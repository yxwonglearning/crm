// Signed-in local admin. In-memory fixtures only; no server saves or publishes.
async page => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const bar = name => page.locator(`[data-builder-history=${name}]:visible`).first();
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/action-flows')),
    page.getByRole('button', { name: 'Automation Flow Triggers, conditions, actions' }).click()
  ]);
  await page.waitForLoadState('networkidle');
  const flows = await page.evaluate(() => structuredClone(state.actionFlows));
  try {
    await page.evaluate(() => {
      state.actionFlows.push({ flowKey: 'phase9_test', name: 'Phase 9 recovery test', status: 'draft', triggerType: 'manual', triggerModule: 'customers', definition: {
        nodes: [{ id: 'trigger', category: 'trigger', type: 'manual', label: 'Start', x: 200, y: 200, config: {} }, { id: 'value', category: 'data_mapping', type: 'set_variable', label: 'Value', x: 400, y: 200, config: {} }],
        edges: [{ from: 'trigger', to: 'value' }]
      } });
      openActionFlowCanvas('phase9_test');
      state.selectedActionFlowNodeId = 'value'; renderActionFlowStudio();
    });
    const baseline = await page.evaluate(() => JSON.stringify(actionFlowDefinition()));
    check(await page.locator('#removeActionFlowNode').isVisible(), await page.locator('#removeActionFlowNode').evaluate(el => JSON.stringify(Array.from((function* () { for (let e = el; e; e = e.parentElement) yield e; })()).map(e => ({ id: e.id, hidden: e.hidden, display: getComputedStyle(e).display, rect: e.getBoundingClientRect().toJSON() })))));
    await page.locator('#removeActionFlowNode').click();
    await page.waitForFunction(() => builderDrafts.get('automation').dirty);
    await bar('automation').getByRole('button', { name: 'Undo', exact: true }).click();
    check(await page.evaluate(() => JSON.stringify(actionFlowDefinition())) === baseline, 'Automation undo restores node and connection');
    await bar('automation').getByRole('button', { name: 'Redo', exact: true }).click();
    await page.locator('#backToActionFlowManagement').click();
    await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
    check(await page.locator('#actionFlowStudio').isVisible(), 'Automation back keeps editing');
    await page.locator('#backToActionFlowManagement').click();
    await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
    check(await page.evaluate(() => JSON.stringify(actionFlowDefinition())) === baseline, 'Automation discard restores original definition');
  } finally {
    await page.evaluate(saved => { state.actionFlows = saved; builderDrafts.delete('automation'); showActionFlowManagement(); }, flows);
  }

  await page.getByRole('button', { name: 'Form Builder Fields, forms, table columns' }).click();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Form Design', exact: true }).click();
  const form = await page.evaluate(() => ({ layouts: structuredClone(state.formDesignLayouts), key: formDesignStorageKey(state.activeConfigModule), stored: localStorage.getItem(formDesignStorageKey(state.activeConfigModule)) }));
  try {
    const before = await page.locator('#formDesignCanvas .form-design-preview-field').evaluateAll(cards => cards.map(c => c.dataset.designField));
    await page.locator('#formDesignCanvas .form-design-preview-field').first().press('Enter');
    await page.getByRole('button', { name: 'Move down', exact: true }).click();
    await page.waitForFunction(() => builderDrafts.get('form').dirty);
    await bar('form').getByRole('button', { name: 'Undo', exact: true }).click();
    check(JSON.stringify(await page.locator('#formDesignCanvas .form-design-preview-field').evaluateAll(cards => cards.map(c => c.dataset.designField))) === JSON.stringify(before), 'Form undo restores visible order');
    await bar('form').getByRole('button', { name: 'Redo', exact: true }).click();
    await page.locator('#cancelFormDesignButton').click();
    await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
    check(await page.locator('#formDesignDrawer').isVisible(), 'Form stays open after cancelled close');
    await page.locator('#cancelFormDesignButton').click();
    await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#formDesignDrawer').hidden);
  } finally {
    await page.evaluate(saved => {
      state.formDesignLayouts = saved.layouts;
      if (saved.stored === null) localStorage.removeItem(saved.key); else localStorage.setItem(saved.key, saved.stored);
      builderDrafts.delete('form'); closeFormDesignDrawer();
    }, form);
  }

  await page.getByRole('button', { name: 'Dashboard Builder Dashboards and publish state' }).click();
  await page.waitForLoadState('networkidle');
  const dashboard = await page.evaluate(() => ({ config: structuredClone(state.dashboardConfiguration), active: state.activeDashboardKey, dashboards: structuredClone(state.dashboards) }));
  try {
    await page.evaluate(() => {
      state.activeDashboardKey = 'phase9_test';
      state.dashboards.push({ dashboardKey: 'phase9_test', name: 'Recovery test', status: 'draft' });
      state.dashboardConfiguration = { widgets: [], filters: [], permissions: [] };
      state.dashboardManagementMode = 'studio';
      document.querySelector('#dashboardManagement').hidden = true;
      document.querySelector('#dashboardBuilderStudio').hidden = false;
      addDashboardWidget();
      state.dashboardLayoutHistory = []; state.dashboardLayoutFuture = [];
      beginBuilderDraft('dashboard'); renderDashboardCanvas();
    });
    const before = await page.evaluate(() => JSON.stringify(state.dashboardConfiguration.widgets));
    await page.locator('#removeDashboardWidgetButton').click();
    await page.waitForFunction(() => state.dashboardConfiguration.widgets.length === 0);
    await page.locator('#undoDashboardLayoutButton').click();
    check(await page.evaluate(() => JSON.stringify(state.dashboardConfiguration.widgets)) === before, 'Existing widget undo remains functional');
    await page.locator('#redoDashboardLayoutButton').click();
    await page.locator('#backToDashboardManagement').click();
    await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
    check(await page.evaluate(() => JSON.stringify(state.dashboardConfiguration.widgets)) === before, 'Dashboard discard restores baseline');
  } finally {
    await page.evaluate(saved => { state.dashboardConfiguration = saved.config; state.dashboards = saved.dashboards; state.activeDashboardKey = saved.active; builderDrafts.delete('dashboard'); showDashboardManagement(); }, dashboard);
  }
  return 'PASS: automation node/edge undo-redo and leave guard; form visible-order undo-redo and close guard; existing dashboard widget undo and discard. Fixtures restored, no server changes.';
}
