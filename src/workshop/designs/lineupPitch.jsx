import { FINISHED, LIVE, PRE } from '../matchData.js';
import { Chalkboard } from './pitchChalk.jsx';
import { StickerAlbum } from './pitchPanini.jsx';
import { TransitMap } from './pitchTransit.jsx';
import { StainedGlass } from './pitchGlass.jsx';
import { PixelPitch } from './pitchPixel.jsx';

// The lineup pitch map on its own: five unrelated ideas for it, same match, same data.
export default {
  id: 'lineup-pitch',
  title: 'Lineup pitch',
  blurb: 'Both starting XIs on a pitch. Five different ideas for it.',
  defaultWidth: 'centre',
  scenarios: [
    { label: 'Finished (Al Nassr 1–0 Neom SC)', props: { d: FINISHED } },
    { label: 'Live, 62nd minute', props: { d: LIVE } },
    { label: 'Before kick-off', props: { d: PRE } },
  ],
  variants: [
    { id: '1', name: 'Chalkboard', note: 'A wooden tactics board in the dressing room. Chalk lines with the wobble and dust, circles for players, crossed out when they come off, and the coach’s dashed arrow towards goal for each scorer.', Component: Chalkboard },
    { id: '2', name: 'Sticker album', note: 'An open football sticker album, a page per team. The XI are stickers stuck down in formation; scorers get foil, substituted-off stickers are half peeled, and the players who came on are swap stickers.', Component: StickerAlbum },
    { id: '3', name: 'Transit map', note: 'A rail network diagram. Each row of the formation is a coloured line, players are stations, rows join at 45 degrees and the halfway line is the river. A status board reports closures (subs) and delays (cards).', Component: TransitMap },
    { id: '4', name: 'Stained glass', note: 'A cathedral window. Each player owns the ground nearest to them, computed as a Voronoi diagram, and every piece is a pane of coloured glass in black lead. It also shows who controls how much of the pitch.', Component: StainedGlass },
    { id: '5', name: 'Pixel kickabout', note: '8-bit, top-down, in the spirit of the old Amiga football games. Sprites from character maps, striped grass, scorers do the arms-up hop, and the players who came on wait in a pixel dugout.', Component: PixelPitch },
  ],
};
