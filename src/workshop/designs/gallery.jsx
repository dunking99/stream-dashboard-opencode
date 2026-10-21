import Dash from '../dash/Dash.jsx';

// A whole-page design, not a component: it takes the full window (see fullPage in Workshop.jsx).
export default {
  id: 'gallery',
  title: 'Gallery (full page)',
  blurb: 'The whole dashboard as a broadcast control room.',
  fullPage: true,
  Page: Dash,
  scenarios: [],
  variants: [],
};
