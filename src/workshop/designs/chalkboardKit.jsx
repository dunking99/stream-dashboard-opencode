import { FINISHED, LIVE, PRE } from '../matchData.js';
import { Magnets, PinnedCards, ChalkShirts, XsAndOs, Foosball } from './chalkMarkers.jsx';

// The chalkboard from "Lineup pitch" (frame, slate, chalk pitch, dust), with five different ways of
// putting the players on it.
export default {
  id: 'chalkboard-markers',
  title: 'Chalkboard markers',
  blurb: 'The wooden chalkboard, five ways of putting the players on it.',
  defaultWidth: 'centre',
  scenarios: [
    { label: 'Finished (Al Nassr 1–0 Neom SC)', props: { d: FINISHED } },
    { label: 'Live, 62nd minute', props: { d: LIVE } },
    { label: 'Before kick-off', props: { d: PRE } },
  ],
  variants: [
    { id: '1', name: 'Magnets', note: 'Glossy round magnets in each team’s colours, with a label-maker tape for the name. A player who’s gone off leaves an empty dashed ring; scorers get a little ball magnet and a dashed arrow to goal.', Component: Magnets },
    { id: '2', name: 'Pinned cards', note: 'An index card per player held on with a drawing pin in the team colour: big number, position, name in marker. Scorers get a gold star sticker, and a card for someone subbed off is taped “OFF” and its pin is gone.', Component: PinnedCards },
    { id: '3', name: 'Chalk shirts', note: 'A drawn shirt for every player, hatched in chalk. Scorers wear hoops, a shirt for a player who’s gone off is left as an empty dashed outline, and cards are drawn on the sleeve.', Component: ChalkShirts },
    { id: '4', name: 'X’s and O’s', note: 'Coaching notation. O for the home side, X for the away side, with the shape drawn as a dotted web between them. A short run arrow for scorers and a walk-off arrow to the touchline for substitutes.', Component: XsAndOs },
    { id: '5', name: 'Table football', note: 'Each row of the formation is a rod across the pitch, with the players screwed on as little men facing the other goal. A scorer’s shot is a ball by his feet.', Component: Foosball },
  ],
};
