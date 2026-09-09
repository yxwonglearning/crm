const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'public', 'styles.css'), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(styles.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced-motion media query is missing.');
assert(styles.includes('@media (prefers-reduced-transparency: reduce)'), 'Reduced-transparency media query is missing.');
assert(styles.includes('@media (prefers-contrast: more)'), 'Increased-contrast media query is missing.');
assert(styles.includes('scroll-behavior: auto !important'), 'Reduced motion must disable smooth CSS scrolling.');
assert(styles.includes('transition-property: color, background-color, border-color, box-shadow, opacity'), 'Reduced motion must retain non-spatial state feedback.');
assert(styles.includes('animation: none !important'), 'Reduced motion must suppress spatial drawer and running animations.');
assert(styles.includes('backdrop-filter: none !important'), 'Transparency fallback must remove backdrop blur.');
assert(styles.includes('outline: 3px solid var(--focus) !important'), 'Increased contrast must strengthen visible focus.');
assert(app.includes("window.matchMedia?.('(prefers-reduced-motion: reduce)')"), 'JavaScript reduced-motion preference helper is missing.');
assert((app.match(/behavior: preferredScrollBehavior\(\)/g) || []).length === 2, 'Every smooth programmatic scroll must use the motion-aware helper.');
assert(!/behavior:\s*['"]smooth['"]/.test(app), 'Hard-coded smooth programmatic scrolling remains.');

process.stdout.write('Accessibility preference contract smoke passed.\n');
