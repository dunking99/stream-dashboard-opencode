// Every component under design. To add one:
//   1. make src/workshop/designs/<name>.jsx whose default export is
//        { id, title, blurb,
//          defaultWidth?: 'phone' | 'panel' | 'wide' | 'centre' | 'fill',
//          scenarios: [{ label, props }],                      // the states each variant is shown in
//          variants:  [{ id, name, note, Component }] }        // Component receives a scenario's props
//   2. import it here and add it to GROUPS.
// Once a variant is chosen, move it into src/components/ and wire it into the real app.
import eventRow from './designs/eventRow.jsx';
import sourceCard from './designs/sourceCard.jsx';
import matchCentre from './designs/matchCentre.jsx';
import lineupPitch from './designs/lineupPitch.jsx';
import chalkboardKit from './designs/chalkboardKit.jsx';

export const GROUPS = [eventRow, sourceCard, matchCentre, lineupPitch, chalkboardKit];
