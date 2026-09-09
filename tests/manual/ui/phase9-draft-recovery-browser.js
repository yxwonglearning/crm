// Run through playwright-cli run-code --filename, signed in with Menu Configuration open.
// No real save/publish: save responses below are intercepted. Fixtures are restored.
async page => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const menu = await page.evaluate(() => structuredClone(state.menuConfigDraft));
  const bar = name => name === 'workflow'
    ? page.locator('.workflow-canvas-toolbar [data-builder-history=workflow]')
    : page.locator(`[data-builder-history=${name}]:visible`).first();
  const settled = name => page.waitForFunction(name => builderDrafts.get(name)?.dirty, name);
  try {
    const initialCount = await page.locator('#menuConfigTree [data-menu-item-key]').count();
    await page.locator('#menuConfigInspector [data-remove-menu-item]').click();
    await settled('menu');
    check(await page.locator('#confirmationModal').isHidden(), 'Reversible menu deletion must not prompt');
    check(await page.locator('#menuConfigTree [data-menu-item-key]').count() < initialCount, 'Menu entry removed');
    await bar('menu').getByRole('button', { name: 'Undo', exact: true }).click();
    check(await page.evaluate(() => JSON.stringify(state.menuConfigDraft)) === JSON.stringify(menu), 'Undo restores full menu policy');
    await bar('menu').getByRole('button', { name: 'Redo', exact: true }).click();
    check(await page.locator('#menuConfigTree [data-menu-item-key]').count() < initialCount, 'Redo reapplies removal');
    await bar('menu').getByRole('button', { name: 'Undo', exact: true }).click();
    await page.locator('#menuConfigInspector [data-menu-field=label]').fill('Phase 9 temporary label');
    await settled('menu');
    const edited = await page.evaluate(() => JSON.stringify(state.menuConfigDraft));
    await page.getByRole('button', { name: 'Modules CRM objects and publish state' }).click();
    await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
    check(await page.locator('#adminMenuConfigurationSection').isVisible(), 'Stay must retain active builder');
    check(await page.evaluate(() => JSON.stringify(state.menuConfigDraft)) === edited, 'Stay must retain edits');
    check(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; }), 'Dirty reload is guarded');

    await page.route('**/api/menu/configuration/draft', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Intentional Phase 9 save failure' }) }));
    await page.locator('#saveMenuConfig').click();
    await page.waitForFunction(() => document.querySelector('#toastMessage').textContent.includes('Phase 9'));
    check(await page.evaluate(() => builderDrafts.get('menu').dirty), 'Failed save keeps dirty state');
    await page.unroute('**/api/menu/configuration/draft');
    await page.route('**/api/menu/configuration/draft', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ config: JSON.parse(route.request().postData()) }) }));
    await page.locator('#saveMenuConfig').click();
    await page.waitForFunction(() => !builderDrafts.get('menu').dirty);
    check(await bar('menu').getByRole('button', { name: 'Undo', exact: true }).isDisabled(), 'Successful save resets draft history');
    await page.unroute('**/api/menu/configuration/draft');
    await page.locator('#menuConfigInspector [data-menu-field=label]').fill('Discard this label');
    await settled('menu');
    await page.getByRole('button', { name: 'Modules CRM objects and publish state' }).click();
    await page.screenshot({ path: 'output/playwright/phase9-leave-warning.png' });
    await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#adminMenuConfigurationSection').hidden);
    check(await page.evaluate(() => JSON.stringify(state.menuConfigDraft)) === edited, 'Discard restores latest successful save baseline');
  } finally {
    await page.unroute('**/api/menu/configuration/draft');
    await page.evaluate(saved => { state.menuConfigDraft = saved; renderMenuConfig(); beginBuilderDraft('menu'); dismissToast(); }, menu);
  }

  await page.getByRole('button', { name: 'Approval Workflow Stages, approvers, and publish state' }).click();
  await page.locator('#newWorkflowDefinitionButton').click();
  await page.locator('#openWorkflowRouteDesigner').click();
  const workflow = await page.evaluate(() => builderDraftAdapter('workflow').read());
  try {
    await page.locator('#addWorkflowStageButton').click();
    await settled('workflow');
    const added = await page.evaluate(() => structuredClone(state.workflowBuilderGraph));
    await page.locator('[data-remove-workflow-node]').click();
    await page.waitForFunction(count => state.workflowBuilderGraph.nodes.length < count, added.nodes.length);
    await bar('workflow').getByRole('button', { name: 'Undo', exact: true }).click();
    check(await page.evaluate(() => JSON.stringify(state.workflowBuilderGraph)) === JSON.stringify(added), 'Workflow node undo restores graph');
    await page.screenshot({ path: 'output/playwright/phase9-workflow-undo.png' });
    await page.locator('#closeWorkflowRouteDesigner').click();
    await page.getByRole('button', { name: 'Modules CRM objects and publish state' }).click();
    await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
    check(await page.locator('#workflowDefinitionForm').isVisible(), 'Workflow navigation cancelled');
  } finally {
    await page.evaluate(saved => { builderDraftAdapter('workflow').restore(saved); beginBuilderDraft('workflow'); closeWorkflowRouteDesigner(); }, workflow);
  }
  return 'PASS: menu undo/redo and policy recovery, no deletion prompt, keep/discard navigation, reload guard, failed/successful mocked saves, workflow node undo and dirty navigation. No configuration saved to server.';
}
