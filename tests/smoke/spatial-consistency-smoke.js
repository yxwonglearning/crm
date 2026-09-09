const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'styles.css'), 'utf8');

function expect(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

expect(app, /function positionAnchoredSurface\(/, 'Floating surfaces must derive their origin from the triggering control.');
expect(app, /function setFloatingSurfaceOpen\([\s\S]*dataset\.floatingState = 'closed'[\s\S]*dataset\.floatingState = 'open'/, 'Floating surfaces must use explicit symmetric open and closed states.');
expect(app, /activateDashboardCalendarPopover\(\)/, 'Calendar details must be positioned after their triggering day is rendered.');
expect(html, /id="(?:notificationDrawer|accountMenu)"[^>]*anchored-popover[^>]*data-surface-kind="parallel"/g, 'Header popovers must be parallel anchored surfaces.');
expect(app, /modal\.dataset\.surfaceKind = 'modal'/, 'Scrim-backed surfaces must be explicitly classified as modal.');
expect(app, /function initializeParallelInspectors\([\s\S]*aria-modal', 'false'/, 'Inspectors must remain non-modal parallel surfaces.');
expect(css, /\.anchored-popover\[data-floating-state="open"\]/, 'Open floating surfaces must have a reversible visual state.');
expect(css, /--material-shadow-popover:[^;]+;[\s\S]*--material-shadow-inspector:[^;]+;[\s\S]*--material-shadow-modal:[^;]+;/, 'Popover, inspector, and modal depth must use standardized material tokens.');
expect(css, /@media \(prefers-reduced-transparency: reduce\)[\s\S]*\.anchored-popover,[\s\S]*\.parallel-inspector/, 'Parallel surfaces must provide an opaque reduced-transparency fallback.');
expect(css, /\.workflow-canvas-node\.is-selected[^}]*box-shadow/, 'Workflow selection must remain visible while its inspector is open.');
expect(css, /\.dashboard-widget-frame\.is-selected[^}]*box-shadow/, 'Dashboard selection must remain visible while its inspector is open.');
expect(css, /\.menu-tree-item\.is-selected[^}]*box-shadow/, 'Menu selection must remain visible while its inspector is open.');

console.log('Spatial consistency smoke checks passed.');
