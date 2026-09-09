// Run with Form Design open in a signed-in local admin browser:
// playwright-cli.cmd -s=ux-phase8 run-code --filename tests/manual/ui/phase8-reorder-browser.js
async page => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const backup = await page.evaluate(() => ({
    layouts: structuredClone(state.formDesignLayouts),
    key: formDesignStorageKey(state.activeConfigModule),
    stored: localStorage.getItem(formDesignStorageKey(state.activeConfigModule)),
    selected: state.selectedFormDesignFieldKey,
    fields: JSON.stringify(activeConfigFields())
  }));
  const order = () => page.locator('#formDesignCanvas .form-design-preview-field').evaluateAll(cards => cards.map(c => c.dataset.designField));
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y, id: 1 }] });
  try {
    const initial = await order();
    check(initial.length > 2, 'Fixture needs three visible main fields');
    const first = () => page.locator('#formDesignCanvas .form-design-preview-field').nth(0);
    await first().focus();
    await page.keyboard.press('Enter');
    check(await page.getByRole('button', { name: 'Move up', exact: true }).isDisabled(), 'First field cannot move up');
    await page.keyboard.press('Enter'); // focused Move down
    const moved = await order();
    check(moved[1] === initial[0] && moved[0] === initial[1], 'Keyboard move must update displayed order');
    await page.waitForFunction(() => document.querySelector('#formDesignAnnouncement').textContent.includes('moved after'));
    await page.getByRole('button', { name: 'Move up', exact: true }).click();
    check(JSON.stringify(await order()) === JSON.stringify(initial), 'Reverse move restores order');

    await first().scrollIntoViewIfNeeded();
    const source = await first().locator('.form-reorder-grip').boundingBox();
    const target = await page.locator('#formDesignCanvas .form-design-preview-field').nth(1).boundingBox();
    const x = source.x + source.width / 2, y = source.y + source.height / 2;
    const tx = target.x + target.width / 2, ty = target.y + target.height - 8;
    await touch('touchStart', x, y);
    await touch('touchMove', tx, ty);
    check(await page.locator('#formDesignCanvas .is-drop-after').count() === 1, 'Touch shows insertion marker');
    await touch('touchCancel');
    check(JSON.stringify(await order()) === JSON.stringify(initial), 'Touch cancellation preserves order');
    await touch('touchStart', x, y);
    await touch('touchMove', tx, ty);
    await touch('touchEnd');
    check((await order())[1] === initial[0], 'Real touch release commits the visible move');

    await first().scrollIntoViewIfNeeded();
    const grip = await first().locator('.form-reorder-grip').boundingBox();
    const canvas = await page.locator('#formDesignCanvas').boundingBox();
    const beforeScroll = await page.locator('#formDesignCanvas').evaluate(el => el.scrollTop);
    await touch('touchStart', grip.x + grip.width / 2, grip.y + grip.height / 2);
    await touch('touchMove', canvas.x + canvas.width / 3, canvas.y + canvas.height - 5);
    await page.waitForFunction(before => document.querySelector('#formDesignCanvas').scrollTop > before + 20, beforeScroll);
    await touch('touchCancel');
    const stopped = await page.locator('#formDesignCanvas').evaluate(el => el.scrollTop);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    check(await page.locator('#formDesignCanvas').evaluate(el => el.scrollTop) === stopped, 'Cancellation stops autoscroll');
    check(await page.evaluate(() => JSON.stringify(activeConfigFields())) === backup.fields, 'Field permissions and visibility must remain unchanged');
    await first().scrollIntoViewIfNeeded();
    await first().click({ position: { x: 10, y: 10 } });
    await page.screenshot({ path: 'output/playwright/phase8-form-verified.png' });
  } finally {
    await touch('touchCancel').catch(() => {});
    await cdp.detach();
    await page.evaluate(saved => {
      state.formDesignLayouts = saved.layouts;
      if (saved.stored === null) localStorage.removeItem(saved.key); else localStorage.setItem(saved.key, saved.stored);
      state.selectedFormDesignFieldKey = saved.selected;
      renderFormDesignDrawer();
    }, backup);
  }
  return 'PASS: keyboard visible order, announcements, real touch move/cancel, sustained edge scroll, unchanged field policy; original draft restored.';
}
