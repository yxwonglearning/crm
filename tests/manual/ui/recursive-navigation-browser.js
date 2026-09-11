// Run on the local app. Fixtures remain in browser memory and are never saved or published.
async page => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const backup = await page.evaluate(() => ({
    sidebarMenu: structuredClone(state.sidebarMenu),
    menuConfigDraft: structuredClone(state.menuConfigDraft),
    selectedMenuItemKey: state.selectedMenuItemKey,
    user: state.user,
    compact: state.sidebarCompact,
    wasAuthenticated: document.body.classList.contains('is-auth'),
    menuSectionHidden: document.querySelector('#adminMenuConfigurationSection').hidden,
    visibleView: Array.from(document.querySelectorAll('.view')).find((view) => !view.hidden)?.id || ''
  }));
  const fixture = [
    { key: 'level_one', type: 'group', parentKey: null, label: 'Operations', icon: 'settings', enabled: true, order: 1 },
    { key: 'level_two', type: 'group', parentKey: 'level_one', label: 'Customer Operations', icon: 'users', enabled: true, order: 1 },
    { key: 'level_three', type: 'group', parentKey: 'level_two', label: 'Regional Accounts', icon: 'module', enabled: true, order: 1 },
    { key: 'level_four', type: 'group', parentKey: 'level_three', label: 'Active Portfolios', icon: 'dashboard', enabled: true, order: 1 },
    { key: 'deep_first', type: 'item', parentKey: 'level_four', label: 'Approval Requests', icon: 'approval', enabled: true, order: 1, destination: { type: 'view', key: 'customersView' } },
    { key: 'deep_middle', type: 'item', parentKey: 'level_four', label: 'Workflow Monitoring', icon: 'approval', enabled: true, order: 2, destination: { type: 'view', key: 'workflowMonitoringView' } },
    { key: 'deep_last', type: 'item', parentKey: 'level_four', label: 'Approval Delegation', icon: 'approval', enabled: true, order: 3, destination: { type: 'view', key: 'usersView' } },
    { key: 'other_group', type: 'group', parentKey: null, label: 'Other Work', icon: 'none', enabled: true, order: 2 },
    { key: 'other_home', type: 'item', parentKey: 'other_group', label: 'Homepage', icon: 'dashboard', enabled: true, order: 1, destination: { type: 'view', key: 'dashboardPagesView' } }
  ];
  try {
    await page.evaluate((items) => {
      state.user = { id: 'recursive-navigation-test', role: 'admin' };
      state.sidebarMenu = items;
      document.body.classList.remove('is-auth');
      document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== 'workflowMonitoringView'; });
      renderSidebarMenu();
    }, fixture);

    check(await page.locator('#mainSidebarNav .nav-node[data-nav-depth="4"]').count() === 3, 'fourth-level sibling destinations must render recursively');
    check(await page.locator('#mainSidebarNav .nav-group.is-current-path.is-expanded').count() === 4, 'every active-route ancestor must open');
    check(await page.locator('#mainSidebarNav .nav-node.is-current-path').count() === 5, 'active path must include the leaf and every ancestor');
    const connector = await page.locator('#mainSidebarNav .nav-node[data-nav-depth="3"]').evaluate((node) => ({
      width: getComputedStyle(node, '::after').borderLeftWidth,
      radius: getComputedStyle(node, '::after').borderBottomLeftRadius,
      color: getComputedStyle(node, '::after').borderBottomColor
    }));
    check(parseFloat(connector.width) > 0 && parseFloat(connector.radius) > 0, 'deep branch must have a curved flow connector');

    const activateSibling = async (viewId, activeIndex) => {
      await page.evaluate((id) => {
        document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== id; });
        syncSidebarCurrentState();
      }, viewId);
      await page.evaluate(() => document.getAnimations().forEach((animation) => animation.finish()));
      const states = await page.locator('#nav-children-level_four > .nav-branch > .nav-node').evaluateAll((nodes) => nodes.map((node) => ({
        activePath: node.classList.contains('is-current-path'),
        railThrough: node.classList.contains('is-current-rail-through'),
        railEntry: node.classList.contains('is-current-rail-entry'),
        branchColor: getComputedStyle(node, '::after').borderBottomColor
      })));
      check(states.filter((state) => state.activePath).length === 1 && states[activeIndex].activePath, `sibling ${activeIndex + 1} must be the only active branch`);
      states.forEach((state, index) => {
        if (index !== activeIndex) check(state.branchColor !== states[activeIndex].branchColor, `inactive sibling ${index + 1} must retain its muted branch: ${JSON.stringify(states)}`);
        check(state.railThrough === (index < activeIndex), `only rail segments before sibling ${activeIndex + 1} may carry through`);
        check(state.railEntry === (index === activeIndex), `only sibling ${activeIndex + 1} may receive the active entry rail`);
      });
    };
    await activateSibling('customersView', 0);
    await activateSibling('workflowMonitoringView', 1);
    await activateSibling('usersView', 2);
    await activateSibling('workflowMonitoringView', 1);
    check(await page.locator('#nav-children-other_group > .nav-branch > .nav-node.is-current-path').count() === 0, 'expanded inactive sibling branches must not inherit active styling');

    const other = page.getByRole('button', { name: 'Other Work', exact: true });
    await other.focus();
    const initiallyExpanded = await other.getAttribute('aria-expanded') === 'true';
    await page.keyboard.press('Enter');
    check((await other.getAttribute('aria-expanded') === 'true') !== initiallyExpanded, 'Enter must toggle a focused group button');
    check(await page.locator('#nav-children-other_group').getAttribute('aria-hidden') === String(initiallyExpanded), 'disclosure state must be reflected for assistive technology');
    await page.keyboard.press('Enter');
    check((await other.getAttribute('aria-expanded') === 'true') === initiallyExpanded, 'a second Enter press must restore the disclosure state');
    if (initiallyExpanded) {
      await page.keyboard.press('Enter');
      check(await page.locator('#nav-children-other_group').evaluate((region) => region.inert), 'collapsed descendants must leave the focus order');
      await page.keyboard.press('Enter');
    }

    await page.evaluate(() => setMainSidebarCompact(true, false));
    check(await page.locator('body').evaluate((body) => body.classList.contains('main-sidebar-compact')), 'compact mode must remain available');
    check(await page.locator('#mainSidebarNav .nav-group.has-current-page > .nav-group-trigger').first().evaluate((row) => getComputedStyle(row).boxShadow !== 'none'), 'compact active ancestor must retain icon/state emphasis');
    await page.evaluate(() => setMainSidebarCompact(false, false));

    await page.setViewportSize({ width: 800, height: 900 });
    check(await page.locator('#mainSidebarNav').evaluate((nav) => getComputedStyle(nav).overflowX === 'auto'), 'mobile must retain the horizontal top-navigation shell');
    check(await page.locator('#mainSidebarNav .nav-branch').first().evaluate((branch) => getComputedStyle(branch).display === 'grid'), 'nested mobile branches must retain the recursive grammar');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    check(await page.locator('#mainSidebarNav .nav-children').first().evaluate((region) => parseFloat(getComputedStyle(region).transitionDuration) === 0), 'reduced motion must remove disclosure transitions');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: 'output/playwright/recursive-navigation-expanded.png' });

    await page.evaluate((items) => {
      state.menuConfigDraft = { schemaVersion: 1, defaultModuleGroupKey: 'level_three', items: structuredClone(items) };
      state.selectedMenuItemKey = 'level_one';
      document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== 'sysadminView'; });
      document.querySelectorAll('.admin-section').forEach((section) => { section.hidden = section.id !== 'adminMenuConfigurationSection'; });
      renderMenuConfig();
    }, fixture);
    await page.locator('#menuConfigInspector [data-remove-menu-item]').click();
    check(await page.getByRole('heading', { name: 'Remove Menu Branch' }).isVisible(), 'deep deletion must require explicit confirmation');
    check((await page.locator('#confirmationModalMessage').innerText()).includes('6 descendant entries'), 'confirmation must state the full descendant impact');
    await page.locator('#confirmModalAction').click();
    check(await page.evaluate(() => state.menuConfigDraft.items.every((item) => !['level_one', 'level_two', 'level_three', 'level_four', 'deep_first', 'deep_middle', 'deep_last'].includes(item.key))), 'confirmed deletion must remove the complete branch');
    check(await page.evaluate(() => state.menuConfigDraft.defaultModuleGroupKey === ''), 'deleting a branch must clear a nested default module group');
  } finally {
    await page.evaluate((saved) => {
      state.sidebarMenu = saved.sidebarMenu;
      state.menuConfigDraft = saved.menuConfigDraft;
      state.selectedMenuItemKey = saved.selectedMenuItemKey;
      state.user = saved.user;
      document.body.classList.toggle('is-auth', saved.wasAuthenticated);
      setMainSidebarCompact(saved.compact, false);
      document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== saved.visibleView; });
      document.querySelector('#adminMenuConfigurationSection').hidden = saved.menuSectionHidden;
      renderSidebarMenu();
      if (state.menuConfigDraft) renderMenuConfig();
    }, backup);
  }
  return 'PASS: first/middle/last sibling activation, sibling switching, nested active paths, inactive expanded branches, keyboard disclosure, compact/mobile states, reduced motion, and recursive deletion; browser state restored.';
}
