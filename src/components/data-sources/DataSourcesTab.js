/**
 * Data Sources Tab Component
 * Information about data sources, verification methodology, and confidence levels
 */

/**
 * Render the Data Sources tab
 */
export function renderDataSources() {
  return `
    <div class="data-sources-tab">
      ${renderDataSourcesHeader()}
      ${renderSourcesAndMethodology()}
      ${renderVerificationProcess()}
      ${renderDisclaimer()}
    </div>
    ${renderDataSourcesStyles()}
  `;
}

/**
 * Header section
 */
function renderDataSourcesHeader() {
  return `
    <div class="data-sources-header">
      <h2>Data Sources & Verification Methodology</h2>
      <p class="text-muted">Understanding how permit data is collected, verified, and maintained</p>
    </div>
  `;
}

/**
 * Sources and Methodology section
 */
function renderSourcesAndMethodology() {
  return `
    <div class="data-sources-section card">
      <div class="sources-grid">
        <div class="sources-column">
          <h3 class="sources-title">Primary Sources</h3>
          <ul class="sources-list">
            <li>
              <strong>Universal Weather & Aviation</strong>
              <span class="source-desc">Industry-leading trip support provider with global coverage</span>
            </li>
            <li>
              <strong>NBAA / EBAA / IBAC</strong>
              <span class="source-desc">Business aviation association guidance and publications</span>
            </li>
            <li>
              <strong>CAA Publications</strong>
              <span class="source-desc">Official AIPs, NOTAMs, and regulatory notices</span>
            </li>
            <li>
              <strong>Handler Networks</strong>
              <span class="source-desc">Real-world processing times from ground handlers</span>
            </li>
            <li>
              <strong><a href="https://briefme.aero" target="_blank" rel="noopener">BriefMe.aero</a></strong>
              <span class="source-desc">Flight briefing platform with permit guidance</span>
            </li>
          </ul>
        </div>
        <div class="sources-column">
          <h3 class="sources-title">Confidence Levels</h3>
          <div class="confidence-levels">
            <div class="confidence-item">
              <span class="confidence-badge confidence-high">High</span>
              <span class="confidence-desc">Multiple sources, verified within 6 months</span>
            </div>
            <div class="confidence-item">
              <span class="confidence-badge confidence-medium">Medium</span>
              <span class="confidence-desc">Single source or older verification</span>
            </div>
            <div class="confidence-item">
              <span class="confidence-badge confidence-low">Low</span>
              <span class="confidence-desc">Limited data, always verify with CAA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Verification Process section (enhancement)
 */
function renderVerificationProcess() {
  return `
    <div class="data-sources-section card">
      <h3 class="sources-title">Verification Process</h3>
      <div class="verification-grid">
        <div class="verification-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Data Collection</h4>
            <p>Information gathered from CAA websites, handler networks, and industry publications</p>
          </div>
        </div>
        <div class="verification-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Cross-Reference</h4>
            <p>Data validated against multiple sources when available</p>
          </div>
        </div>
        <div class="verification-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Periodic Review</h4>
            <p>Regular updates based on regulatory changes and user feedback</p>
          </div>
        </div>
        <div class="verification-step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h4>Community Updates</h4>
            <p>Users can submit corrections via the Request Update feature</p>
          </div>
        </div>
      </div>

      <div class="update-info">
        <div class="update-stat">
          <span class="stat-label">Database Coverage</span>
          <span class="stat-value">203 Countries</span>
        </div>
        <div class="update-stat">
          <span class="stat-label">Airport Records</span>
          <span class="stat-value">109+ Airports</span>
        </div>
        <div class="update-stat">
          <span class="stat-label">FBO Entries</span>
          <span class="stat-value">70+ Handlers</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Disclaimer section
 */
function renderDisclaimer() {
  return `
    <div class="disclaimer-section">
      <h3>Important Disclaimer</h3>
      <p>
        This permit book is for <strong>reference purposes only</strong>. Lead times vary based on operator history,
        current events, documentation completeness, and CAA workload. <strong>Always verify current requirements</strong>
        with your permit service provider or the relevant CAA before committing to an itinerary.
      </p>
      <p class="disclaimer-note">
        Requirements can change without notice due to political events, security situations, or regulatory updates.
        The information provided here represents our best understanding at the time of last verification but should
        never be treated as official or authoritative.
      </p>
    </div>
  `;
}

/**
 * Component-scoped styles
 */
function renderDataSourcesStyles() {
  return `
    <style>
      .data-sources-tab {
        max-width: 900px;
        margin: 0 auto;
      }

      .data-sources-header {
        margin-bottom: var(--spacing-lg);
      }

      .data-sources-header h2 {
        margin: 0 0 var(--spacing-xs);
        color: var(--primary);
      }

      .data-sources-section {
        margin-bottom: var(--spacing-xl);
      }

      .data-sources-section.card {
        background: var(--white);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      /* Sources Grid */
      .sources-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-xl);
      }

      .sources-title {
        color: var(--accent);
        margin: 0 0 var(--spacing-md);
        font-size: 1.1rem;
      }

      .sources-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .sources-list li {
        margin-bottom: var(--spacing-md);
        line-height: 1.4;
      }

      .sources-list li strong {
        display: block;
        color: var(--primary);
      }

      .source-desc {
        display: block;
        font-size: 0.85rem;
        color: var(--gray-600);
        margin-top: 2px;
      }

      .sources-list a {
        color: var(--primary);
        text-decoration: none;
      }

      .sources-list a:hover {
        text-decoration: underline;
      }

      /* Confidence Levels */
      .confidence-levels {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .confidence-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .confidence-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        min-width: 70px;
        text-align: center;
      }

      .confidence-badge.confidence-high {
        background: rgba(40, 167, 69, 0.15);
        color: #155724;
      }

      .confidence-badge.confidence-high::before {
        content: "\\2713 ";
      }

      .confidence-badge.confidence-medium {
        background: rgba(255, 193, 7, 0.2);
        color: #856404;
      }

      .confidence-badge.confidence-medium::before {
        content: "\\007E ";
      }

      .confidence-badge.confidence-low {
        background: rgba(220, 53, 69, 0.15);
        color: #721c24;
      }

      .confidence-badge.confidence-low::before {
        content: "? ";
      }

      .confidence-desc {
        font-size: 0.9rem;
        color: var(--gray-700);
      }

      /* Verification Process */
      .verification-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }

      .verification-step {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--gray-100);
        border-radius: var(--radius-md);
      }

      .step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--accent);
        color: var(--white);
        border-radius: 50%;
        font-weight: 600;
        flex-shrink: 0;
      }

      .step-content h4 {
        margin: 0 0 var(--spacing-xs);
        font-size: 0.95rem;
        color: var(--primary);
      }

      .step-content p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--gray-600);
        line-height: 1.4;
      }

      /* Update Stats */
      .update-info {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-lg);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--gray-200);
      }

      .update-stat {
        display: flex;
        flex-direction: column;
      }

      .stat-label {
        font-size: 0.8rem;
        color: var(--gray-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary);
      }

      /* Disclaimer */
      .disclaimer-section {
        background: #fff3cd;
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        border-left: 4px solid var(--warning);
      }

      .disclaimer-section h3 {
        color: var(--primary);
        margin: 0 0 var(--spacing-sm);
        font-size: 1.1rem;
      }

      .disclaimer-section h3::before {
        content: "\\26A0\\FE0F ";
      }

      .disclaimer-section p {
        margin: 0 0 var(--spacing-sm);
        color: var(--gray-700);
        line-height: 1.6;
      }

      .disclaimer-section p:last-child {
        margin-bottom: 0;
      }

      .disclaimer-note {
        font-size: 0.9rem;
        color: var(--gray-600);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .data-sources-section.card {
          padding: var(--spacing-md);
        }

        .sources-grid {
          grid-template-columns: 1fr;
        }

        .verification-grid {
          grid-template-columns: 1fr;
        }

        .update-info {
          flex-direction: column;
          gap: var(--spacing-md);
        }
      }
    </style>
  `;
}
