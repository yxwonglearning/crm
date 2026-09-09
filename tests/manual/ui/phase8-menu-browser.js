// Run with Menu Configuration open. Test fixtures exist in memory only; no save/publish.
async page => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const backup = await page.evaluate(() => ({ draft: structuredClone(state.menuConfigDraft), selected: state.selectedMenuItemKey }));
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: ['touchEnd', 'touchCancel'].includes(type) ? [] : [{ x, y, id: 1 }] });
  const order = () => page.locator('#menuConfigTree [data-menu-item-key]').evaluateAll(rows => rows.map(row => row.dataset.menuItemKey));
  try {
    await page.evaluate(() => {
      const items = Array.from({ length: 20 }, (_, i) => ({ key: `phase8_${i}`, type: 'item', label: `Test item ${i + 1}`, enabled: i !== 4, order: i + 1, parentKey: null, destination: { type: 'module', key: 'customers' }, visibility: { roles: ['admin'], userIds: [], departmentIds: [] } }));
      items.push(...['one', 'two'].map((key, i) => ({ key: `group_${key}`, type: 'group', label: `Test group ${key}`, enabled: true, order: 21 + i, parentKey: null, visibility: { roles: [], userIds: [], departmentIds: [] } })));
      state.menuConfigDraft.items = items;
      state.selectedMenuItemKey = items[0].key;
      renderMenuConfig();
    });
    const policy = await page.evaluate(() => JSON.stringify(state.menuConfigDraft.items.map(({ order, parentKey, ...rest }) => rest)));
    await page.locator('#menuMoveGroup').selectOption('group_two');
    await page.locator('[data-move-menu=into]').focus();
    await page.keyboard.press('Enter');
    check(await page.evaluate(() => state.menuConfigDraft.items[0].parentKey) === 'group_two', 'Use selected destination, not first group');
    check((await page.locator('#menuConfigAnnouncement').innerText()).includes('Test group two'), 'Announce destination');
    await page.locator('[data-move-menu=out]').click();
    check(await page.evaluate(() => state.menuConfigDraft.items[0].parentKey) === null, 'Move out returns to root');
    await page.evaluate(() => { state.menuConfigDraft.items[0].order = 0; renderMenuConfig(); });
    const initial = await order();
    const first = page.locator('#menuConfigTree [data-menu-item-key]').nth(0);
    const second = page.locator('#menuConfigTree [data-menu-item-key]').nth(1);
    await first.scrollIntoViewIfNeeded();
    const grip = await first.locator('.menu-tree-grip').boundingBox();
    const target = await second.boundingBox();
    const x = grip.x + grip.width / 2, y = grip.y + grip.height / 2;
    const tx = target.x + target.width / 2, ty = target.y + target.height - 8;
    await touch('touchStart', x, y);
    await touch('touchMove', tx, ty);
    check(await page.locator('#menuConfigTree .is-drop-after').count() === 1, 'Touch insertion destination visible');
    await touch('touchCancel');
    check(JSON.stringify(await order()) === JSON.stringify(initial), 'Cancelled touch preserves menu');
    await touch('touchStart', x, y);
    await touch('touchMove', tx, ty);
    await touch('touchEnd');
    check((await order())[1] === initial[0], 'Real touch move updates menu order');
    await first.scrollIntoViewIfNeeded();
    const nextGrip = await first.locator('.menu-tree-grip').boundingBox();
    const tree = await page.locator('#menuConfigTree').boundingBox();
    const beforeScroll = await page.locator('#menuConfigTree').evaluate(el => el.scrollTop);
    await touch('touchStart', nextGrip.x + nextGrip.width / 2, nextGrip.y + nextGrip.height / 2);
    await touch('touchMove', tree.x + tree.width / 2, tree.y + tree.height - 5);
    await page.waitForFunction(before => document.querySelector('#menuConfigTree').scrollTop > before + 20, beforeScroll);
    await touch('touchCancel');
    check(await page.evaluate(() => JSON.stringify(state.menuConfigDraft.items.map(({ order, parentKey, ...rest }) => rest))) === policy, 'Visibility and destinations unchanged');
    await first.scrollIntoViewIfNeeded();
    const beforeNative = await order();
    const secondBounds = await second.boundingBox();
    await first.dragTo(second, { targetPosition: { x: 40, y: secondBounds.height - 5 } });
    check((await order())[1] === beforeNative[0], 'Native mouse drag commits requested insertion');
  } finally {
    await touch('touchCancel').catch(() => {});
    await cdp.detach();
    await page.evaluate(saved => { state.menuConfigDraft = saved.draft; state.selectedMenuItemKey = saved.selected; renderMenuConfig(); }, backup);
  }
  await page.screenshot({ path: 'output/playwright/phase8-menu-verified.png' });
  return 'PASS: explicit group choice, keyboard into/out, announcements, real touch move/cancel, insertion marker, edge scroll, policy preservation, native drag; original draft restored.';
}
