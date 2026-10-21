import { LiveLineupView } from '../../components/LiveLineup.jsx';
import { at, FINISHED, PRE } from '../matchData.js';

// The live lineup panel that sits beside the video in the real app. Same component, mock matches.
const Frame = ({ d }) => <div style={{ height: 820 }}><LiveLineupView detail={d} /></div>;

export default {
  id: 'live-lineup',
  title: 'Live lineup',
  blurb: 'The panel beside the video: who is on the pitch now, with goals, assists, cards and subs.',
  defaultWidth: 'phone',
  scenarios: [
    { label: 'Before kick-off', props: { d: PRE } },
    { label: '30th minute', props: { d: at(30, 'live') } },
    { label: '62nd minute (subs made)', props: { d: at(62, 'live') } },
    { label: 'Full time', props: { d: FINISHED } },
  ],
  variants: [{ id: 'A', name: 'Pitch + bench', note: 'Portrait pitch, both XIs as shirts. Substitutes take the place of the player they replaced; badges show goals, assists, cards and subs.', Component: Frame }],
};
