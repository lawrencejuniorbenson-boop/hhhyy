let AUTH_TOKEN = sessionStorage.getItem('pp_auth_token') || null;
let IS_ADMIN = sessionStorage.getItem('pp_is_admin') === 'true';

const CAT_LBL = { all: 'All', digital: 'Digital', payment: 'Payment', liability: 'Liability', asset: 'Asset', other: 'Other' };
const CAT_COL = { digital: '#2563EB', payment: '#7C3AED', liability: '#059669', asset: '#D97706', other: '#0891B2' };
const STS_CSS = { Active: 'b-active', Pipeline: 'b-pipeline', 'In Review': 'b-review', Paused: 'b-paused', Completed: 'b-completed', Cancelled: 'b-cancelled' };
const PRI_CSS = { Critical: 'b-crit', High: 'b-high', Medium: 'b-med', Low: 'b-low' };
const CMP_CSS = { Compliant: 'b-compliant', 'Pending Review': 'b-pending', 'Non-Compliance': 'b-noncompliant', Exempt: 'b-exempt', 'Non-Compliant': 'b-noncompliant' };
const RSK_CSS = { Low: 'b-low-risk', Medium: 'b-med-risk', High: 'b-high-risk', Critical: 'b-crit-risk' };

const BRANCHES = [
  'Abelemkpe Branch',
  'Abossey-Okai Branch',
  'Accra Central Branch',
  'Achimota Branch',
  'Adabraka Branch',
  'Adum Addo Kuffour Branch',
  'Adum Prempeh II Street Branch',
  'Ahodwo Branch',
  'Amakom Branch',
  'Ashaley Botwe Branch',
  'Atomic Junction Branch',
  'Dansoman Branch',
  'Dome Branch',
  'East Legon Branch',
  'Head Office – Airport',
  'Kasoa Main Branch',
  'Kejetia Branch',
  'Koforidua Branch',
  'Kokomlemle Branch',
  'Kronum Branch',
  'Labone Branch',
  'Madina Estate Branch',
  'Manhyia Branch',
  'Nima Branch',
  'North Industrial Area Branch',
  'Odorkor Branch',
  'Osu Oxford Street Branch',
  'Spintex Basket Junction Branch',
  'Spintex Manet Junction Branch',
  'Sunyani Branch',
  'Takoradi Harbour Branch',
  'Takoradi Market Circle Branch',
  'Tamale Branch',
  'Tarkwa Branch',
  'Techiman Branch',
  'Tema Community 1 Branch',
  'Tema Community Eleven (11) Branch',
  'Tema East Branch',
  'Tema Harbour Branch',
  'Weija Branch'
];

function getApiUrl(path) {
  if (window.location.protocol === 'file:') {
    return 'http://localhost:8080' + path;
  }
  return path;
}
