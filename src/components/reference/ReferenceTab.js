/**
 * Reference Tab Component
 * Comprehensive reference for aviation permit requirements, CAA contacts,
 * slot coordination, airports of entry, AIPs, and essential resources
 * Also includes Changelog and Data Sources sub-tabs
 */

import { renderChangelog, initChangelog } from '../changelog/Changelog.js';
import { renderDataSources } from '../data-sources/DataSourcesTab.js';

// Sub-tab state
let currentSubTab = 'reference';

/**
 * Render the Reference tab with sub-navigation
 */
export function renderReference() {
  setTimeout(initReferenceTab, 100);

  return `
    <div class="reference-container">
      ${renderSubTabs()}
      <div id="reference-content">
        ${renderSubTabContent()}
      </div>
    </div>
    ${renderReferenceContainerStyles()}
  `;
}

/**
 * Render sub-tab navigation
 */
function renderSubTabs() {
  const subTabs = [
    { id: 'reference', label: 'Reference Guide', icon: '📚' },
    { id: 'changelog', label: 'Changelog', icon: '📝' },
    { id: 'datasources', label: 'Data Sources', icon: 'ℹ️' },
  ];

  return `
    <div class="sub-tabs">
      ${subTabs.map(tab => `
        <button
          class="sub-tab-btn ${currentSubTab === tab.id ? 'active' : ''}"
          data-subtab="${tab.id}"
        >
          <span class="sub-tab-icon">${tab.icon}</span>
          <span class="sub-tab-label">${tab.label}</span>
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Render current sub-tab content
 */
function renderSubTabContent() {
  switch (currentSubTab) {
    case 'reference':
      return renderReferenceContent();
    case 'changelog':
      return renderChangelog();
    case 'datasources':
      return renderDataSources();
    default:
      return renderReferenceContent();
  }
}

/**
 * Initialize reference tab and attach handlers
 */
function initReferenceTab() {
  attachSubTabHandlers();

  // Initialize changelog if that's the current sub-tab
  if (currentSubTab === 'changelog') {
    if (typeof initChangelog === 'function') {
      initChangelog();
    }
  }
}

/**
 * Attach sub-tab event handlers
 */
function attachSubTabHandlers() {
  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const subTabId = e.currentTarget.dataset.subtab;
      switchSubTab(subTabId);
    });
  });
}

/**
 * Switch sub-tab
 */
function switchSubTab(subTabId) {
  currentSubTab = subTabId;

  // Update buttons
  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    const isActive = btn.dataset.subtab === subTabId;
    btn.classList.toggle('active', isActive);
  });

  // Update content
  const contentEl = document.getElementById('reference-content');
  if (contentEl) {
    contentEl.innerHTML = renderSubTabContent();

    // Initialize changelog if switching to it
    if (subTabId === 'changelog' && typeof initChangelog === 'function') {
      setTimeout(initChangelog, 100);
    }
  }
}

/**
 * Main reference content
 */
function renderReferenceContent() {
  return `
    <div class="reference-tab">
      ${renderQuickReferenceCards()}
      ${renderCAAContactDirectory()}
      ${renderSlotCoordination()}
      ${renderAirportsOfEntry()}
      ${renderAIPResources()}
      ${renderEssentialResources()}
      ${renderDocumentationChecklist()}
      ${renderWorkingDaysHolidays()}
      ${renderEmergencyContacts()}
    </div>
    ${renderReferenceStyles()}
  `;
}

/**
 * Quick Reference Cards - Lead times, requirements, sanctions
 */
function renderQuickReferenceCards() {
  return `
    <div class="reference-section">
      <div class="quick-ref-grid">
        <div class="quick-ref-card">
          <h3 class="quick-ref-title">Longest Lead Times</h3>
          <ul class="quick-ref-list">
            <li><strong>Italy (First-time):</strong> 45 days</li>
            <li><strong>Venezuela:</strong> 25-30 days</li>
            <li><strong>Mongolia:</strong> 14 days</li>
            <li><strong>Myanmar:</strong> 9-14 days</li>
            <li><strong>Togo:</strong> 10 days</li>
          </ul>
        </div>
        <div class="quick-ref-card">
          <h3 class="quick-ref-title">Quick Processing</h3>
          <ul class="quick-ref-list">
            <li><strong>UAE:</strong> 2-3 days (online)</li>
            <li><strong>Singapore:</strong> 2-3 days (digital)</li>
            <li><strong>Bahamas:</strong> 2-3 days charter</li>
            <li><strong>Panama:</strong> 1-2 days</li>
            <li><strong>Most EU Private:</strong> Not required</li>
          </ul>
        </div>
        <div class="quick-ref-card">
          <h3 class="quick-ref-title">Unique Requirements</h3>
          <ul class="quick-ref-list">
            <li><strong>China:</strong> Sponsor letter mandatory</li>
            <li><strong>Philippines:</strong> Color aircraft photo</li>
            <li><strong>Bolivia:</strong> Company logo + signature</li>
            <li><strong>Colombia:</strong> Engine/ELT serials</li>
            <li><strong>Brazil:</strong> ATPs from registry state</li>
          </ul>
        </div>
        <div class="quick-ref-card">
          <h3 class="quick-ref-title warning">Sanctions/Restrictions</h3>
          <ul class="quick-ref-list">
            <li><strong>Cuba:</strong> OFAC - 12 categories</li>
            <li><strong>Iran:</strong> US sanctions apply</li>
            <li><strong>North Korea:</strong> US persons banned</li>
            <li><strong>Russia:</strong> Western sanctions</li>
            <li><strong>Ukraine:</strong> Airspace closed</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

/**
 * CAA Contact Directory by region
 */
function renderCAAContactDirectory() {
  return `
    <div class="reference-section card">
      <h2 class="section-title">CAA Permit Contact Directory</h2>
      <p class="section-desc">Key civil aviation authority contacts for permits. Use the Override feature on country cards to save contacts you've verified.</p>

      <div class="contact-grid">
        <div class="contact-region">
          <h4 class="region-title">Europe</h4>
          <table class="contact-table">
            <tr><td><strong>UK CAA</strong></td><td>flight.ops@caa.co.uk</td></tr>
            <tr><td><strong>Germany LBA</strong></td><td>slot@lba.de</td></tr>
            <tr><td><strong>France DGAC</strong></td><td>survolbureauaccord@aviation-civile.gouv.fr</td></tr>
            <tr><td><strong>Italy ENAC</strong></td><td>foreignflights@enac.gov.it</td></tr>
            <tr><td><strong>Spain AESA</strong></td><td>autorizaciones.otv@seguridadaerea.es</td></tr>
            <tr><td><strong>Switzerland FOCA</strong></td><td>permits@bazl.admin.ch</td></tr>
            <tr><td><strong>Austria ACG</strong></td><td>flugbewilligungen@austrocontrol.at</td></tr>
          </table>
        </div>
        <div class="contact-region">
          <h4 class="region-title">Middle East & Africa</h4>
          <table class="contact-table">
            <tr><td><strong>UAE GCAA</strong></td><td>permits@gcaa.gov.ae</td></tr>
            <tr><td><strong>Saudi GACA</strong></td><td>permits@gaca.gov.sa</td></tr>
            <tr><td><strong>Qatar QCAA</strong></td><td>permits@qcaa.gov.qa</td></tr>
            <tr><td><strong>Kenya KCAA</strong></td><td>info@kcaa.or.ke</td></tr>
            <tr><td><strong>South Africa SACAA</strong></td><td>permits@caa.co.za</td></tr>
            <tr><td><strong>Morocco DGAC</strong></td><td>survol@onda.ma</td></tr>
            <tr><td><strong>Egypt ECAA</strong></td><td>overflights.permits@civilaviation.gov.eg</td></tr>
          </table>
        </div>
        <div class="contact-region">
          <h4 class="region-title">Asia-Pacific</h4>
          <table class="contact-table">
            <tr><td><strong>India DGCA</strong></td><td>jdga@dgca.nic.in</td></tr>
            <tr><td><strong>Singapore CAAS</strong></td><td>airnavservices_atcl@caas.gov.sg</td></tr>
            <tr><td><strong>Hong Kong CAD</strong></td><td>atd@cad.gov.hk</td></tr>
            <tr><td><strong>Japan JCAB</strong></td><td>hqt-cat-atc-slot@gxb.mlit.go.jp</td></tr>
            <tr><td><strong>Australia CASA</strong></td><td>approvals@casa.gov.au</td></tr>
            <tr><td><strong>Indonesia DGCA</strong></td><td>foreignoversea@hubud.dephub.go.id</td></tr>
            <tr><td><strong>Thailand CAAT</strong></td><td>info@caat.or.th</td></tr>
          </table>
        </div>
        <div class="contact-region">
          <h4 class="region-title">Americas</h4>
          <table class="contact-table">
            <tr><td><strong>USA FAA</strong></td><td>9-awa-avr-fc@faa.gov (foreign carriers)</td></tr>
            <tr><td><strong>Canada TC</strong></td><td>tc.sorfa@tc.gc.ca</td></tr>
            <tr><td><strong>Mexico AFAC</strong></td><td>permisos@afac.gob.mx</td></tr>
            <tr><td><strong>Brazil ANAC</strong></td><td>autorizacoes.voos@anac.gov.br</td></tr>
            <tr><td><strong>Argentina ANAC</strong></td><td>permisos@anac.gob.ar</td></tr>
            <tr><td><strong>Colombia UAEAC</strong></td><td>permisosdevuelo@aerocivil.gov.co</td></tr>
            <tr><td><strong>Bahamas CAD</strong></td><td>bcad@bahamas.gov.bs</td></tr>
          </table>
        </div>
      </div>

      <div class="tip-box">
        <strong>Tip:</strong> Emails change frequently. Use the "Override" button on country cards to save verified contacts locally. Your data persists between sessions and can be exported for backup.
      </div>
    </div>
  `;
}

/**
 * Airport Slot Coordination Guide - Enhanced
 */
function renderSlotCoordination() {
  return `
    <div class="reference-section card">
      <h2 class="section-title">Airport Slot Coordination</h2>
      <p class="section-desc">Europe has 180+ coordinated airports. Business aviation must request slots at Level 3 airports using the GCR format.</p>

      <div class="slot-grid">
        <div class="slot-card level-3">
          <h4 class="slot-level">Level 3 - Coordinated (Slots Required)</h4>
          <p class="slot-desc">Must have allocated slot to operate</p>
          <ul class="slot-list">
            <li><strong>UK:</strong> EGLL, EGKK, EGSS, EGGW</li>
            <li><strong>France:</strong> LFPG, LFPO, LFMN</li>
            <li><strong>Germany:</strong> EDDF, EDDM, EDDS, EDDL</li>
            <li><strong>Spain:</strong> LEMD, LEBL, LEPA</li>
            <li><strong>Italy:</strong> LIRF, LIMC, LIPZ</li>
            <li><strong>Switzerland:</strong> LSZH, LSGG (winter)</li>
          </ul>
        </div>
        <div class="slot-card level-2">
          <h4 class="slot-level">Level 2 - Facilitated (Notification)</h4>
          <p class="slot-desc">Schedule notification required</p>
          <ul class="slot-list">
            <li>Many regional airports during peak</li>
            <li>Summer: Mediterranean islands</li>
            <li>Winter: Ski resort airports (LOWI)</li>
            <li>Schedule adjustments negotiable</li>
          </ul>
        </div>
        <div class="slot-card level-1">
          <h4 class="slot-level">Level 1 - Non-Coordinated</h4>
          <p class="slot-desc">No slot coordination needed</p>
          <ul class="slot-list">
            <li>Most GA/business aviation airports</li>
            <li>PPR may still apply</li>
            <li>Check airport operating hours</li>
            <li>Customs availability varies</li>
          </ul>
        </div>
        <div class="slot-card peak-periods">
          <h4 class="slot-level">Peak Periods & Events</h4>
          <ul class="slot-list">
            <li><strong>Summer (Jun-Sep):</strong> Mediterranean, Ibiza, Mykonos</li>
            <li><strong>Winter (Dec-Feb):</strong> Ski resorts - LOWI, LSGS, LSZS</li>
            <li><strong>Monaco GP:</strong> LFMN, LFMD - book 3+ months ahead</li>
            <li><strong>Davos/WEF:</strong> LSZS, LSZH - January</li>
            <li><strong>Cannes Film:</strong> LFMN, LFMD - May</li>
          </ul>
        </div>
      </div>

      <h3 class="subsection-title">Slot Coordinator Directory</h3>
      <div class="coordinator-table-wrapper">
        <table class="coordinator-table">
          <thead>
            <tr>
              <th>Coordinator</th>
              <th>Coverage</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Portal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>EUACA</strong></td>
              <td>Most EU airports</td>
              <td><a href="mailto:slots@euaca.org">slots@euaca.org</a></td>
              <td>+32 2 206 1120</td>
              <td><a href="https://www.airport-coordination.eu" target="_blank" rel="noopener">Portal</a></td>
            </tr>
            <tr>
              <td><strong>ACL UK</strong></td>
              <td>UK airports</td>
              <td><a href="mailto:slots@acl-uk.org">slots@acl-uk.org</a></td>
              <td>+44 20 7626 1477</td>
              <td><a href="https://www.acl-uk.org" target="_blank" rel="noopener">Portal</a></td>
            </tr>
            <tr>
              <td><strong>COHOR</strong></td>
              <td>France (LFPG, LFPO, etc.)</td>
              <td><a href="mailto:slots@cohor.org">slots@cohor.org</a></td>
              <td>+33 1 49 89 33 00</td>
              <td><a href="https://www.cohor.org" target="_blank" rel="noopener">Portal</a></td>
            </tr>
            <tr>
              <td><strong>FHKD</strong></td>
              <td>Germany</td>
              <td><a href="mailto:slots@fhkd.org">slots@fhkd.org</a></td>
              <td>+49 69 69 07 06 0</td>
              <td><a href="https://www.fhkd.org" target="_blank" rel="noopener">Portal</a></td>
            </tr>
            <tr>
              <td><strong>SACTA</strong></td>
              <td>Spain (LEMD, LEBL, etc.)</td>
              <td><a href="mailto:slots@aena.es">slots@aena.es</a></td>
              <td>+34 91 321 10 00</td>
              <td><a href="https://e-slots.aena.es" target="_blank" rel="noopener">Portal</a></td>
            </tr>
            <tr>
              <td><strong>ASSOCLEARANCE</strong></td>
              <td>Italy</td>
              <td><a href="mailto:slots@assoclearance.it">slots@assoclearance.it</a></td>
              <td>+39 06 65 95 36 90</td>
              <td><a href="https://www.assoclearance.eu" target="_blank" rel="noopener">Portal</a></td>
            </tr>
            <tr>
              <td><strong>SLOT CH</strong></td>
              <td>Switzerland (LSZH, LSGG)</td>
              <td><a href="mailto:info@slotcoordination.ch">info@slotcoordination.ch</a></td>
              <td>+41 43 816 53 53</td>
              <td><a href="https://www.slot-coordination.ch" target="_blank" rel="noopener">Portal</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="info-box">
        <strong>GCR Format:</strong> Business aviation uses the General Aviation Slot Clearance Request format with ICAO codes. Request via coordinator website, email, or through your handler. Allow 24-72 hours for busy periods.
      </div>

      <div class="tip-box">
        <strong>Future Integration:</strong> We are exploring integration with EUACA's online slot request system. This would allow direct slot requests from within this application.
      </div>
    </div>
  `;
}

/**
 * Airports of Entry Guide - Enhanced
 */
function renderAirportsOfEntry() {
  return `
    <div class="reference-section card">
      <h2 class="section-title">Airports of Entry (AOE) & Customs</h2>
      <p class="section-desc">International flights must clear customs/immigration at designated ports of entry. First landing in country must be at an AOE.</p>

      <div class="aoe-grid">
        <div class="aoe-region">
          <h4 class="aoe-title">United States</h4>
          <ul class="aoe-list">
            <li>All international arrivals must land at CBP-designated AOE</li>
            <li>Over 300 AOE airports available</li>
            <li>eAPIS required 60 min before departure</li>
            <li>APIS transmitter required for aircraft</li>
          </ul>
          <div class="contact-box">
            <strong>CBP Contact Center:</strong> <a href="tel:+18772275511">1-877-227-5511</a><br>
            <strong>eAPIS Portal:</strong> <a href="https://eapis.cbp.dhs.gov" target="_blank" rel="noopener">eapis.cbp.dhs.gov</a><br>
            <strong>AOE List:</strong> <a href="https://www.cbp.gov/travel/pleasure-boats-background/private-flyers" target="_blank" rel="noopener">CBP Private Aircraft</a>
          </div>
        </div>
        <div class="aoe-region">
          <h4 class="aoe-title">European Union (Schengen)</h4>
          <ul class="aoe-list">
            <li>First Schengen entry = full customs/immigration</li>
            <li>Internal Schengen = domestic treatment</li>
            <li>UK/Ireland not in Schengen</li>
            <li>Most international airports are AOE</li>
            <li>24h notice for customs at smaller fields</li>
          </ul>
          <div class="contact-box">
            <strong>EU Entry/Exit System:</strong> Starting 2024<br>
            <strong>ETIAS:</strong> <a href="https://www.etiasvisa.com" target="_blank" rel="noopener">etiasvisa.com</a> (coming soon for visa-exempt travelers)
          </div>
        </div>
        <div class="aoe-region">
          <h4 class="aoe-title">United Kingdom</h4>
          <ul class="aoe-list">
            <li>GAR form required (General Aviation Report)</li>
            <li>Submit via email to destination airport</li>
            <li>Most GA airports can arrange customs</li>
            <li>24h advance notice typical</li>
            <li>Post-Brexit: Full border controls apply</li>
          </ul>
          <div class="contact-box">
            <strong>Border Force GA:</strong> <a href="mailto:generalaviation@homeoffice.gov.uk">generalaviation@homeoffice.gov.uk</a><br>
            <strong>GAR Forms:</strong> <a href="https://www.gov.uk/government/publications/general-aviation-report-gar" target="_blank" rel="noopener">gov.uk GAR</a><br>
            <strong>24hr Customs Airports:</strong> EGLL, EGKK, EGGW, EGSS, EGLF
          </div>
        </div>
        <div class="aoe-region">
          <h4 class="aoe-title">Canada</h4>
          <ul class="aoe-list">
            <li>CANPASS Corporate for frequent flyers</li>
            <li>eDeclaration via ArriveCAN app</li>
            <li>Advance clearance at select airports</li>
            <li>User fee airports vs designated AOE</li>
          </ul>
          <div class="contact-box">
            <strong>CBSA Info:</strong> <a href="tel:+18004619999">1-800-461-9999</a><br>
            <strong>CANPASS:</strong> <a href="https://www.cbsa-asfc.gc.ca/prog/canpass/menu-eng.html" target="_blank" rel="noopener">CBSA CANPASS</a>
          </div>
        </div>
      </div>

      <h3 class="subsection-title">Key Regional Notes</h3>
      <div class="regional-notes-grid">
        <div class="regional-note">
          <strong>Caribbean</strong>
          <p>Each island requires separate clearance. Multi-stop trips need advance planning for customs at each destination.</p>
        </div>
        <div class="regional-note">
          <strong>Middle East</strong>
          <p>Sponsor/inviter often required. UAE, Saudi Arabia need sponsor letter. Israel stamp may affect entry to other countries.</p>
        </div>
        <div class="regional-note">
          <strong>Asia-Pacific</strong>
          <p>Australia has strict biosecurity. China requires designated AOE only - no diversions. Japan needs advance landing permission.</p>
        </div>
        <div class="regional-note">
          <strong>Africa</strong>
          <p>Yellow fever vaccination often required. Multiple countries may need carnet for aircraft. Kenya, South Africa have established GA procedures.</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * AIP Resources by region
 */
function renderAIPResources() {
  return `
    <div class="reference-section card">
      <h2 class="section-title">Aeronautical Information Publications (AIPs)</h2>
      <p class="section-desc">Official country AIPs contain detailed airport information, procedures, and regulations. Many require free registration.</p>

      <div class="aip-grid">
        <div class="aip-region">
          <h3 class="aip-title">Europe (via EUROCONTROL)</h3>
          <ul class="aip-list">
            <li><a href="https://www.ead.eurocontrol.int" target="_blank" rel="noopener">EUROCONTROL EAD</a> - All EU/EFTA AIPs (free registration)</li>
            <li><a href="https://nats-uk.ead-it.com/cms-nats/opencms/en/Publications/AIP/" target="_blank" rel="noopener">UK NATS AIP</a></li>
            <li><a href="https://www.sia.aviation-civile.gouv.fr" target="_blank" rel="noopener">France SIA</a></li>
            <li><a href="https://aip.dfs.de" target="_blank" rel="noopener">Germany DFS AIP</a></li>
            <li><a href="https://www.enav.it" target="_blank" rel="noopener">Italy ENAV</a></li>
            <li><a href="https://aip.enaire.es" target="_blank" rel="noopener">Spain ENAIRE</a></li>
          </ul>
        </div>
        <div class="aip-region">
          <h3 class="aip-title">Americas</h3>
          <ul class="aip-list">
            <li><a href="https://www.faa.gov/air_traffic/publications/atpubs/aip_html/" target="_blank" rel="noopener">USA FAA AIP</a></li>
            <li><a href="https://www.navcanada.ca/en/aip-canada.aspx" target="_blank" rel="noopener">Canada NAV CANADA AIP</a></li>
            <li><a href="https://ais.anac.gov.br" target="_blank" rel="noopener">Brazil ANAC AIS</a></li>
            <li><a href="https://www.seneam.gob.mx" target="_blank" rel="noopener">Mexico SENEAM</a></li>
            <li><a href="https://ais.anac.gob.ar" target="_blank" rel="noopener">Argentina ANAC AIS</a></li>
          </ul>
        </div>
        <div class="aip-region">
          <h3 class="aip-title">Asia-Pacific</h3>
          <ul class="aip-list">
            <li><a href="https://www.airservicesaustralia.com/aip" target="_blank" rel="noopener">Australia AIP</a></li>
            <li><a href="https://www.aip.net.nz" target="_blank" rel="noopener">New Zealand AIP</a></li>
            <li><a href="https://aim-india.aai.aero" target="_blank" rel="noopener">India AAI AIM</a></li>
            <li><a href="https://www.caas.gov.sg" target="_blank" rel="noopener">Singapore CAAS</a></li>
            <li><a href="https://www.hkatc.gov.hk/eaip" target="_blank" rel="noopener">Hong Kong eAIP</a></li>
            <li><a href="https://aisjapan.mlit.go.jp" target="_blank" rel="noopener">Japan AIS</a></li>
          </ul>
        </div>
        <div class="aip-region">
          <h3 class="aip-title">Middle East & Africa</h3>
          <ul class="aip-list">
            <li><a href="https://www.gcaa.gov.ae" target="_blank" rel="noopener">UAE GCAA</a></li>
            <li><a href="https://gaca.gov.sa" target="_blank" rel="noopener">Saudi Arabia GACA</a></li>
            <li><a href="https://www.atns.com" target="_blank" rel="noopener">South Africa ATNS AIP</a></li>
            <li><a href="https://www.onda.ma" target="_blank" rel="noopener">Morocco ONDA</a></li>
            <li><a href="https://www.kcaa.or.ke" target="_blank" rel="noopener">Kenya KCAA</a></li>
            <li><a href="https://www.asecna.aero" target="_blank" rel="noopener">ASECNA (West/Central Africa)</a></li>
          </ul>
        </div>
      </div>

      <div class="tip-box">
        <strong>Tip:</strong> For comprehensive worldwide AIP links, see <a href="https://erau.libguides.com/uas/electronic-aips-country" target="_blank" rel="noopener">Embry-Riddle's eAIP Directory</a> or <a href="https://wiki.ivao.aero/en/home/operations/Global-AIP" target="_blank" rel="noopener">IVAO Global AIP</a>.
      </div>
    </div>
  `;
}

/**
 * Essential Resources
 */
function renderEssentialResources() {
  return `
    <div class="reference-section card">
      <h2 class="section-title">Essential Resources</h2>

      <div class="resources-grid">
        <div class="resource-category">
          <h3 class="resource-title">Trip Support Providers</h3>
          <ul class="resource-list">
            <li><a href="https://www.universalweather.com" target="_blank" rel="noopener">Universal Weather & Aviation</a> - Industry leader</li>
            <li><a href="https://ww2.jeppesen.com/aviation-services/" target="_blank" rel="noopener">Jeppesen International Trip Planning</a></li>
            <li><a href="https://www.worldfuel.com/aviation" target="_blank" rel="noopener">World Fuel Services</a></li>
            <li><a href="https://www.hadid.aero" target="_blank" rel="noopener">Hadid International Services</a></li>
            <li><a href="https://www.jetex.com" target="_blank" rel="noopener">Jetex Flight Support</a></li>
            <li><a href="https://briefme.aero" target="_blank" rel="noopener">BriefMe.aero</a> - Flight briefing platform</li>
          </ul>
        </div>
        <div class="resource-category">
          <h3 class="resource-title">Regulatory & Industry Bodies</h3>
          <ul class="resource-list">
            <li><a href="https://www.nbaa.org" target="_blank" rel="noopener">NBAA</a> - National Business Aviation Association</li>
            <li><a href="https://www.ebaa.org" target="_blank" rel="noopener">EBAA</a> - European Business Aviation Association</li>
            <li><a href="https://www.ibac.org" target="_blank" rel="noopener">IBAC</a> - International Business Aviation Council</li>
            <li><a href="https://www.icao.int" target="_blank" rel="noopener">ICAO</a> - International Civil Aviation Organization</li>
            <li><a href="https://www.faa.gov" target="_blank" rel="noopener">FAA</a> - Federal Aviation Administration</li>
            <li><a href="https://www.easa.europa.eu" target="_blank" rel="noopener">EASA</a> - EU Aviation Safety Agency</li>
          </ul>
        </div>
        <div class="resource-category">
          <h3 class="resource-title">NOTAMs & Weather</h3>
          <ul class="resource-list">
            <li><a href="https://notams.aim.faa.gov/" target="_blank" rel="noopener">FAA NOTAM Search</a></li>
            <li><a href="https://www.icao.int/notams-0" target="_blank" rel="noopener">ICAO Global NOTAM Repository</a></li>
            <li><a href="https://www.aviationweather.gov" target="_blank" rel="noopener">Aviation Weather Center</a></li>
            <li><a href="https://eurocontrol.int" target="_blank" rel="noopener">EUROCONTROL</a></li>
            <li><a href="https://briefme.aero" target="_blank" rel="noopener">BriefMe.aero</a> - Integrated briefing</li>
            <li><a href="https://foreflight.com/" target="_blank" rel="noopener">ForeFlight</a> - Mobile weather & planning</li>
          </ul>
        </div>
        <div class="resource-category">
          <h3 class="resource-title">Customs & Immigration</h3>
          <ul class="resource-list">
            <li><a href="https://www.cbp.gov/travel/pleasure-boats-background/private-flyers" target="_blank" rel="noopener">US CBP - Private Aircraft</a></li>
            <li><a href="https://eapis.cbp.dhs.gov" target="_blank" rel="noopener">eAPIS - Electronic Advance Passenger Info</a></li>
            <li><a href="https://travel.state.gov" target="_blank" rel="noopener">US State Dept - Travel Advisories</a></li>
            <li><a href="https://www.iatatravelcentre.com" target="_blank" rel="noopener">IATA Travel Centre</a></li>
            <li><a href="https://www.timaticweb.com" target="_blank" rel="noopener">Timatic</a> - Visa/passport requirements</li>
          </ul>
        </div>
        <div class="resource-category">
          <h3 class="resource-title">Flight Planning Tools</h3>
          <ul class="resource-list">
            <li><a href="https://nbaa.org/aircraft-operations/international/nbaa-international-flight-plan-format-guide/" target="_blank" rel="noopener">NBAA International Flight Plan Guide</a></li>
            <li><a href="https://www.faa.gov/about/office_org/headquarters_offices/ato/service_units/air_traffic_services/flight_plan_filing" target="_blank" rel="noopener">FAA Flight Plan Filing</a></li>
            <li><a href="https://www.eurocontrol.int/service/network-manager-operations-centre" target="_blank" rel="noopener">EUROCONTROL NM</a></li>
          </ul>
        </div>
        <div class="resource-category">
          <h3 class="resource-title">Data APIs (for Developers)</h3>
          <ul class="resource-list">
            <li><a href="https://www.icao.int/dataservices" target="_blank" rel="noopener">ICAO API</a> - NOTAMs, aerodrome data (beta)</li>
            <li><a href="https://aviationweather.gov/data/api/" target="_blank" rel="noopener">NOAA Weather API</a> - METARs/TAFs</li>
            <li><a href="https://nms.aim.faa.gov/" target="_blank" rel="noopener">FAA NMS</a> - NOTAM Management System</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

/**
 * Standard Permit Documentation Checklist
 */
function renderDocumentationChecklist() {
  return `
    <div class="reference-section card">
      <h2 class="section-title">Standard Permit Documentation</h2>

      <div class="checklist-grid">
        <div class="checklist-card">
          <h4 class="checklist-title">Aircraft Documents</h4>
          <ul class="checklist-list">
            <li>Certificate of Registration</li>
            <li>Certificate of Airworthiness</li>
            <li>Air Operator Certificate (AOC)</li>
            <li>Operations Specifications</li>
            <li>Insurance Certificate (specific coverage verbiage)</li>
            <li>Noise Certificate</li>
            <li>Radio License</li>
          </ul>
        </div>
        <div class="checklist-card">
          <h4 class="checklist-title">Crew Documents</h4>
          <ul class="checklist-list">
            <li>Pilot licenses (ATP from registry state for some)</li>
            <li>Medical certificates</li>
            <li>Passport copies (validity 6+ months)</li>
            <li>Visa documentation</li>
            <li>Type ratings</li>
            <li>English proficiency</li>
          </ul>
        </div>
        <div class="checklist-card">
          <h4 class="checklist-title">Flight Details</h4>
          <ul class="checklist-list">
            <li>Proposed routing (entry/exit FIRs)</li>
            <li>Flight schedule (dates/times UTC)</li>
            <li>Purpose of flight</li>
            <li>Passenger manifest (some countries)</li>
            <li>Cargo manifest (if applicable)</li>
            <li>Charter agreement copy (charter ops)</li>
          </ul>
        </div>
        <div class="checklist-card">
          <h4 class="checklist-title">Country-Specific</h4>
          <ul class="checklist-list">
            <li>Sponsor letter (China, Saudi)</li>
            <li>Color aircraft photo (Philippines)</li>
            <li>Engine/ELT serials (Colombia)</li>
            <li>Maintenance logs (Kenya)</li>
            <li>Security questionnaire (Germany)</li>
            <li>Apostille (Venezuela)</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

/**
 * CAA Working Days & Holidays
 */
function renderWorkingDaysHolidays() {
  return `
    <div class="reference-section card">
      <h2 class="section-title">CAA Working Days & Holidays</h2>
      <p class="section-desc">Lead times are typically in <strong>business/working days</strong>. Account for weekends, holidays, and CAA operating hours.</p>

      <div class="working-days-grid">
        <div class="working-day-card">
          <h4>Middle East Weekend</h4>
          <p>Fri-Sat (Saudi, UAE, etc.)</p>
        </div>
        <div class="working-day-card">
          <h4>Mongolia CAA Hours</h4>
          <p>0030Z-0900Z Mon-Fri only</p>
        </div>
        <div class="working-day-card">
          <h4>UK CAA Charter</h4>
          <p>Mon-Fri only, no after-hours</p>
        </div>
        <div class="working-day-card">
          <h4>China Golden Week</h4>
          <p>Oct 1-7, Feb (CNY) - extended delays</p>
        </div>
        <div class="working-day-card">
          <h4>Ramadan</h4>
          <p>Middle East/Muslim countries - reduced hours</p>
        </div>
        <div class="working-day-card">
          <h4>European August</h4>
          <p>Many CAAs on reduced staffing</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Emergency & 24/7 Support Contacts
 */
function renderEmergencyContacts() {
  return `
    <div class="reference-section emergency-section">
      <h2 class="section-title">Emergency & 24/7 Support</h2>
      <div class="emergency-grid">
        <div class="emergency-contact">
          <h4>Universal Weather 24/7</h4>
          <p>+1 713 944 1622</p>
        </div>
        <div class="emergency-contact">
          <h4>Jeppesen Trip Support</h4>
          <p>+1 303 328 4170</p>
        </div>
        <div class="emergency-contact">
          <h4>FAA Flight Service</h4>
          <p>1-800-WX-BRIEF</p>
        </div>
        <div class="emergency-contact">
          <h4>ARINC (Global)</h4>
          <p>+1 410 266 2266</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Container styles for sub-tabs
 */
function renderReferenceContainerStyles() {
  return `
    <style>
      .reference-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .sub-tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
        background: var(--white);
        padding: var(--spacing-sm);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }

      .sub-tab-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: none;
        border-radius: var(--radius-md);
        color: var(--gray-600);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .sub-tab-btn:hover {
        background: var(--gray-100);
        color: var(--primary);
      }

      .sub-tab-btn.active {
        background: var(--primary);
        color: var(--white);
      }

      .sub-tab-icon {
        font-size: 1rem;
      }

      @media (max-width: 600px) {
        .sub-tabs {
          flex-wrap: wrap;
        }

        .sub-tab-btn {
          flex: 1;
          justify-content: center;
          min-width: 100px;
        }

        .sub-tab-label {
          display: none;
        }

        .sub-tab-icon {
          font-size: 1.2rem;
        }
      }
    </style>
  `;
}

/**
 * Component-scoped styles for reference content
 */
function renderReferenceStyles() {
  return `
    <style>
      .reference-tab {
        max-width: 1200px;
        margin: 0 auto;
      }

      .reference-section {
        margin-bottom: var(--spacing-xl);
      }

      .reference-section.card {
        background: var(--white);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .section-title {
        color: var(--primary);
        margin: 0 0 var(--spacing-sm);
        font-size: 1.25rem;
      }

      .section-desc {
        color: var(--gray-600);
        margin: 0 0 var(--spacing-lg);
      }

      /* Quick Reference Cards */
      .quick-ref-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-md);
      }

      .quick-ref-card {
        background: var(--white);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        box-shadow: var(--shadow-sm);
      }

      .quick-ref-title {
        color: var(--accent);
        margin: 0 0 var(--spacing-sm);
        font-size: 1rem;
      }

      .quick-ref-title.warning {
        color: var(--danger);
      }

      .quick-ref-list {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.8;
      }

      /* Contact Directory */
      .contact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .region-title {
        color: var(--accent);
        margin: 0 0 var(--spacing-sm);
        font-size: 1rem;
      }

      .contact-table {
        width: 100%;
        font-size: 0.8rem;
        border-collapse: collapse;
      }

      .contact-table tr {
        border-bottom: 1px solid var(--gray-200);
      }

      .contact-table td {
        padding: var(--spacing-xs) 0;
      }

      /* Slot Coordination */
      .slot-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-md);
      }

      .slot-card {
        background: var(--gray-100);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        border-left: 4px solid var(--gray-400);
      }

      .slot-card.level-3 {
        border-left-color: var(--danger);
      }

      .slot-card.level-2 {
        border-left-color: var(--warning);
      }

      .slot-card.level-1 {
        border-left-color: var(--success);
      }

      .slot-card.coordinators {
        border-left-color: var(--info);
      }

      .slot-level {
        margin: 0 0 var(--spacing-xs);
        font-size: 0.95rem;
      }

      .slot-card.level-3 .slot-level { color: var(--danger); }
      .slot-card.level-2 .slot-level { color: #856404; }
      .slot-card.level-1 .slot-level { color: var(--success); }
      .slot-card.coordinators .slot-level { color: var(--info); }

      .slot-desc {
        font-size: 0.85rem;
        color: var(--gray-600);
        margin: 0 0 var(--spacing-sm);
      }

      .slot-list {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.6;
      }

      .slot-card.peak-periods {
        border-left-color: var(--accent);
        background: linear-gradient(135deg, var(--gray-100) 0%, #fff8e1 100%);
      }

      .slot-card.peak-periods .slot-level {
        color: var(--accent);
      }

      /* Subsection Titles */
      .subsection-title {
        color: var(--primary);
        margin: var(--spacing-xl) 0 var(--spacing-md);
        font-size: 1.1rem;
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--gray-200);
      }

      /* Coordinator Table */
      .coordinator-table-wrapper {
        overflow-x: auto;
        margin-bottom: var(--spacing-md);
      }

      .coordinator-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
        min-width: 600px;
      }

      .coordinator-table th {
        text-align: left;
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--gray-100);
        color: var(--primary);
        font-weight: 600;
        border-bottom: 2px solid var(--gray-300);
      }

      .coordinator-table td {
        padding: var(--spacing-sm) var(--spacing-md);
        border-bottom: 1px solid var(--gray-200);
        vertical-align: middle;
      }

      .coordinator-table tbody tr:hover {
        background: var(--gray-50);
      }

      .coordinator-table a {
        color: var(--primary);
        text-decoration: none;
      }

      .coordinator-table a:hover {
        text-decoration: underline;
      }

      /* Contact Box */
      .contact-box {
        margin-top: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--gray-100);
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        line-height: 1.8;
      }

      .contact-box a {
        color: var(--primary);
        text-decoration: none;
      }

      .contact-box a:hover {
        text-decoration: underline;
      }

      /* Regional Notes Grid */
      .regional-notes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-md);
        margin-top: var(--spacing-md);
      }

      .regional-note {
        background: var(--gray-100);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--accent);
      }

      .regional-note strong {
        color: var(--primary);
        display: block;
        margin-bottom: var(--spacing-xs);
      }

      .regional-note p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--gray-700);
        line-height: 1.5;
      }

      /* AOE Grid */
      .aoe-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-lg);
      }

      .aoe-title {
        color: var(--accent);
        margin: 0 0 var(--spacing-sm);
        font-size: 1rem;
      }

      .aoe-list {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 0.85rem;
        line-height: 1.8;
      }

      /* AIP Resources */
      .aip-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-lg);
      }

      .aip-title {
        color: var(--accent);
        margin: 0 0 var(--spacing-sm);
        font-size: 1rem;
      }

      .aip-list {
        list-style: none;
        padding: 0;
        margin: 0;
        line-height: 2;
      }

      .aip-list a {
        color: var(--primary);
        text-decoration: none;
      }

      .aip-list a:hover {
        text-decoration: underline;
      }

      /* Resources Grid */
      .resources-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-xl);
      }

      .resource-title {
        color: var(--accent);
        margin: 0 0 var(--spacing-sm);
        font-size: 1rem;
      }

      .resource-list {
        list-style: none;
        padding: 0;
        margin: 0;
        line-height: 2.2;
      }

      .resource-list a {
        color: var(--primary);
        text-decoration: none;
      }

      .resource-list a:hover {
        text-decoration: underline;
      }

      /* Checklist Grid */
      .checklist-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-md);
      }

      .checklist-card {
        background: var(--gray-100);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        border-left: 4px solid var(--accent);
      }

      .checklist-title {
        color: var(--primary);
        margin: 0 0 var(--spacing-sm);
        font-size: 0.95rem;
      }

      .checklist-list {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.8;
      }

      .checklist-list li::before {
        content: "\\2610 ";
        margin-right: var(--spacing-xs);
      }

      /* Working Days Grid */
      .working-days-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--spacing-md);
      }

      .working-day-card {
        background: var(--gray-100);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
      }

      .working-day-card h4 {
        color: var(--primary);
        margin: 0 0 var(--spacing-xs);
        font-size: 0.9rem;
      }

      .working-day-card p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--gray-600);
      }

      /* Emergency Section */
      .emergency-section {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        border: 1px solid var(--warning);
      }

      .emergency-section .section-title {
        color: var(--primary);
      }

      .emergency-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
      }

      .emergency-contact h4 {
        color: var(--primary);
        margin: 0 0 var(--spacing-xs);
        font-size: 0.95rem;
      }

      .emergency-contact p {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
      }

      /* Info/Tip Boxes */
      .tip-box {
        margin-top: var(--spacing-lg);
        padding: var(--spacing-md);
        background: var(--gray-100);
        border-radius: var(--radius-md);
        font-size: 0.9rem;
      }

      .info-box {
        margin-top: var(--spacing-lg);
        padding: var(--spacing-md);
        background: #e7f3ff;
        border-radius: var(--radius-md);
        border-left: 4px solid var(--info);
        font-size: 0.9rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .reference-section.card {
          padding: var(--spacing-md);
        }

        .quick-ref-grid,
        .contact-grid,
        .slot-grid,
        .aoe-grid,
        .aip-grid,
        .resources-grid,
        .checklist-grid,
        .working-days-grid,
        .emergency-grid,
        .regional-notes-grid {
          grid-template-columns: 1fr;
        }

        .coordinator-table {
          font-size: 0.75rem;
          min-width: 500px;
        }

        .coordinator-table th,
        .coordinator-table td {
          padding: var(--spacing-xs) var(--spacing-sm);
        }

        .subsection-title {
          font-size: 1rem;
        }
      }
    </style>
  `;
}
