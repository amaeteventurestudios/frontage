/* Frontage catalog: every site in the pane, by group. A site is live once its folder has an index.html
   and `live: true`. `picks` is filled from the site's Hallmark stamp after its sweep. */
export const GROUPS = [
  { id: 'space',   name: 'Space and earth',        kind: 'deep' },
  { id: 'matter',  name: 'Machines and matter',    kind: 'deep' },
  { id: 'code',    name: 'Intelligence and code',  kind: 'deep' },
  { id: 'motion',  name: 'Motion and animation',   kind: 'creative' },
  { id: 'play',    name: 'Sound, play and culture', kind: 'creative' },
  { id: 'stretch', name: 'Formats nobody expects', kind: 'stretch' },
];

export const KINDS = { deep: 'Deep tech', creative: 'Creative', stretch: 'Stretch' };

const s = (n, slug, group, name, what, theme, shape, signature) =>
  ({ n, slug, group, name, what, theme, shape, signature, wave: Math.ceil(n / 5), live: !!PICKS[slug], picks: PICKS[slug] || null });

/* Picks recorded from each site's Hallmark stamp after its sweep */
const PICKS = {
  'harmattan-orbital': {
    made: 'Hallmark (floor, Blueprint theme, draw 6c604a), Three.js globe, orbit maths computed in the page',
    theme: 'Blueprint, cyanotype sheet', shape: 'Narrative Workflow', genre: 'modern-minimal',
    hero: 'Stage: the headline beside a live globe with a time scrubber',
    signature: 'The three stations\' coverage circles on a globe, with a sample satellite moving through them as you drag time',
    sections: 'Hero, the Namib as a full-bleed photograph, four steps on a dimension line, the station register, next passes by station, the booking title block, footer',
    material: 'Real: station coordinates, orbital mechanics, pass times and coverage worked out live. Pictures: two Wikimedia Commons photographs. Absent: customers, prices, uptime',
    sweep: 'sloplint: Floor clean except 76 (Commons is blocked in the build sandbox, so the render tier could not load the photos); 39b, 44c and 79 waived on the record',
  },
  'silica-coast': {
    made: 'Hallmark (floor, Refract theme, draw 9f3cce with the shape swapped), generated light on canvas, structure diagrams drawn to real proportions',
    theme: 'Refract, glass light, pool colourway', shape: 'Feature Stack (the draw dealt Map / Diagram; swapped because the zoom needs a pinned pane)', genre: 'atmospheric',
    hero: 'Poster: a wafer catching a prism of sunlight, the headline low left on plain paper',
    signature: 'One scroll from a 300 mm wafer down to a 50 nm fin transistor, the pinned scale changing as you go',
    sections: 'Hero, five scales pinned beside their diagrams, what leaves the floor as rows, Lekki as the lit band, the contact close, mast footer',
    material: 'Real: typical wafer, die, bump, microbump and gate dimensions, the Lekki Free Zone and Lekki Deep Sea Port. Pictures: diagrams built in the page. Absent: customers, capacity, prices',
    sweep: 'sloplint: 0 FAIL; 77 and 82 waived on the record',
  },
  'rig-and-bone': {
    made: 'Hallmark (floor, Sticker theme, draw 6c0246), an SVG rig solved by two-bone inverse kinematics in the page',
    theme: 'Sticker, sheet colourway', shape: 'Split Studio', genre: 'playful',
    hero: 'Settled: the headline beside a die-cut mannequin you pose',
    signature: 'Drag a hand or a foot and the elbow or knee solves live; the same solve is printed as code at the foot of the page',
    sections: 'Hero rig, six weeks as stuck-down cards, questions, the sign-up form, the IK code, colophon',
    material: 'Real: the law-of-cosines IK solve, Blender 4.x as the tool. Pictures: the rig built in the page. Absent: prices, dates, student numbers, testimonials',
    sweep: 'sloplint: 0 FAIL; 39b, 44c and 79 waived on the record',
  },
  'squeeze-drum': {
    made: 'Hallmark (floor, Halftone theme, draw 5d4933), a Web Audio synth and a canvas pitch trace in the page',
    theme: 'Halftone, cream', shape: 'Marquee Hero', genre: 'playful',
    hero: 'Corridor: the headline over a drum pad you press and slide to bend the note',
    signature: 'A spot-coloured drum pad whose dot screen thickens as you squeeze, and the note bends up to an octave',
    sections: 'Hero pad, five voices of the dundun ensemble on a rail, the pitch trace beside how the note is made, the back of the box, the trial band, statement footer',
    material: 'Real: the dundun family (iya ilu, gangan, kannango, atele, gudugudu) and how the squeeze tightens the head. Pictures: the instrument built in the page. Absent: price, users, reviews; the trial buttons send nothing',
    sweep: 'sloplint: 0 FAIL; 39b waived for the pad',
  },
};

export const SITES = [
  s(1,  'harmattan-orbital', 'space',  'Harmattan Orbital', 'Ground stations in Kano, Nairobi and Windhoek for small satellites', 'Blueprint', 'Map / diagram', 'A 3D globe where you drag time and watch pass windows open over Kano, Nairobi and Windhoek'),
  s(2,  'ndani-geo',         'space',  'Ndani Geo', 'Underground imaging to find water before drilling a borehole', 'Furrow', 'Narrative workflow', 'Scrolling slices down through the rock, one layer per section'),
  s(3,  'sabi-nowcast',      'space',  'Sabi Nowcast', 'Rain warnings by the street for farmers and traders', 'Solstice', 'Workbench', 'A rain cell sweeps the map as you drag through the next 90 minutes'),
  s(4,  'equator-range',     'space',  'Equator Range', 'A launch site on the equator', 'Vantage', 'Marquee hero', 'Pick a launch latitude and the trajectory redraws with the speed the Earth’s spin gives you'),
  s(5,  'mangrove-ledger',   'space',  'Mangrove Ledger', 'Measuring carbon in mangrove forests from laser scans', 'Spore', 'Split studio', 'A point-cloud forest you rotate and measure tree by tree'),
  s(6,  'okpara-joints',     'matter', 'Okpara Joints', 'Actuators for robot arms and legs', 'Werkstatt', 'Component playground', 'An exploded actuator you pull apart and snap back together'),
  s(7,  'silica-coast',      'matter', 'Silica Coast', 'Chip packaging and test on the coast at Lekki', 'Refract', 'Feature stack', 'One scroll zooms from the wafer to a single transistor in five steps'),
  s(8,  'gridlet',           'matter', 'Gridlet', 'Controllers for village mini-grids', 'Console', 'Workbench', 'Dusk falls, homes switch on, and you balance solar, battery and load'),
  s(9,  'saltwell-cells',    'matter', 'Saltwell Cells', 'Sodium-ion battery lab', 'Lumen', 'Long document', 'A lab notebook page where ions shuttle across the cell as you charge it'),
  s(10, 'pylonfly',          'matter', 'Pylonfly', 'Drones that inspect power lines', 'Wayfind', 'Photographic', 'A drone’s-eye flight along a line that flags faults as it passes'),
  s(11, 'orature',           'code',   'Orature', 'Speech models for African languages', 'Overprint', 'Catalogue', 'A grid of languages where each tile speaks and draws its waveform'),
  s(12, 'quiet-gate',        'code',   'Quiet Gate', 'A firewall against prompt injection', 'Terminal', 'Conversational FAQ', 'Paste an attack and watch it get taken apart, line by line'),
  s(13, 'kilowatt-exchange', 'code',   'Kilowatt Exchange', 'A market for spare GPU time in African data centres', 'Grid', 'Index-first', 'A live order board, marked as sample data'),
  s(14, 'proofwork',         'code',   'Proofwork', 'Formal verification for payment code', 'Vellum', 'Manifesto', 'A proof tree that unfolds as you read the argument'),
  s(15, 'agent-yard',        'code',   'Agent Yard', 'Watching teams of AI agents at work', 'Ultraviolet', 'Bento grid', 'Swimlanes of agents handing work to each other in real time'),
  s(16, 'frame-thirteen',    'motion', 'Frame Thirteen', 'An independent 2D animation studio', 'Pasteup', 'Portfolio grid', 'A flipbook hero you scrub frame by frame'),
  s(17, 'rig-and-bone',      'motion', 'Rig and Bone', 'A six-week course in character rigging for animators', 'Sticker', 'Component playground', 'A puppet whose joints you drag, the arm following like a real rig'),
  s(18, 'easing-kitchen',    'motion', 'Easing Kitchen', 'An animation library app developers download', 'Squeeze', 'Catalogue', 'Every timing curve animates the same pot lid, so you feel the difference before you copy it'),
  s(19, 'night-bus-titles',  'motion', 'Night Bus Titles', 'A studio for film title sequences', 'Dusk', 'Marquee hero', 'A kinetic title card that plays on load and replays on click'),
  s(20, 'bogolan-motion',    'motion', 'Bogolan Motion', 'A stop-motion studio inspired by mud cloth', 'Loom', 'Photographic', 'Toggle between smooth motion and 12 frames a second'),
  s(21, 'squeeze-drum',      'play',   'Squeeze Drum', 'A synth plugin modelled on the Yoruba talking drum', 'Halftone', 'Marquee hero', 'A drum you press and squeeze to bend its pitch'),
  s(22, 'owambe-plans',      'play',   'Owambe Plans', 'Planning big parties', 'Carnival', 'Map / diagram', 'A floor plan where you drag tables and the guest count updates'),
  s(23, 'oware-club',        'play',   'Oware Club', 'A paid online oware league with seasons and ranked play', 'Terrazzo', 'Ecosystem index', 'A playable board in the hero, with the real sowing and capture rules'),
  s(24, 'danfo-fm',          'play',   'Danfo FM', 'A community radio app', 'Broadside', 'Long document', 'A tuning dial that sweeps across stations'),
  s(25, 'gele-lab',          'play',   'Gele Lab', 'A gele stylist who takes bridal and event bookings', 'Bloom', 'Narrative workflow', 'A 3D cloth that folds step by step into a finished gele as you scroll'),
  s(26, 'eko-filings',       'stretch', 'Eko Filings', 'A service that registers and licenses small businesses in Lagos', 'Newsprint', 'Index-first', 'Answer three questions and it lays out the filings your business needs, in order'),
  s(27, 'sentinel-slides',   'stretch', 'Sentinel Slides', 'A network of malaria test labs', 'Dose', 'Split studio', 'A microscope view you focus to find the parasite'),
  s(28, 'circle',            'stretch', 'Circle', 'A rotating savings group app, like ajo, susu and chama', 'Coral', 'Narrative workflow', 'A ring of members passing the pot round, in your own currency'),
  s(29, 'long-rains-review', 'stretch', 'The Long Rains Review', 'A literary quarterly', 'Editorial', 'Specimen', 'A shelf of issue spines you pull out to read the contents'),
  s(30, 'harvest-cover',     'stretch', 'Harvest Cover', 'Crop insurance that pays out when the rain fails', 'Almanac', 'Letter', 'Enter your farm and see the rainfall trigger that would pay you'),
];
