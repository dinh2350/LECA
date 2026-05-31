'use client';

import { RoleEnum } from '@/services/api/types/role';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import Link from '@/components/link';
import { useTranslation } from '@/services/i18n/client';

const NAV_ITEMS = [
  {
    icon: '👥',
    label: 'User Management',
    href: '/admin-panel/users',
    active: true,
  },
  { icon: '🏫', label: 'Classes', href: '#' },
  { icon: '🤖', label: 'AI Model Config', href: '#' },
  { icon: '🔒', label: 'Content Safety', href: '#' },
  { icon: '📊', label: 'System Health', href: '#' },
  { icon: '📋', label: 'Audit Logs', href: '#' },
  { icon: '⚙️', label: 'Settings', href: '#' },
];

function AdminPanel() {
  const { t } = useTranslation('admin-panel-home');

  return (
    <div className="adm-layout">
      {/* Sidebar */}
      <aside className="adm-sidebar">
        <div className="adm-sys-block">
          <div className="adm-sys-lbl">System Status</div>
          <div className="adm-sys-val">● All services running</div>
        </div>
        <nav className="adm-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`adm-nav-item${item.active ? ' active' : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="adm-main">
        <div className="adm-main-header">
          <div className="adm-main-title">
            {t('title') || 'Admin Dashboard'}
          </div>
          <div className="adm-main-acts">
            <button className="adm-btn">Import CSV</button>
            <Link href="/admin-panel/users/create" className="adm-btn primary">
              + Add user
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="adm-kpis">
          <div className="adm-kpi-card">
            <div className="adm-kpi-label">Total users</div>
            <div className="adm-kpi-value">284</div>
            <div className="adm-kpi-sub">across 9 classes</div>
          </div>
          <div className="adm-kpi-card">
            <div className="adm-kpi-label">Active this week</div>
            <div className="adm-kpi-value green">201</div>
            <div className="adm-kpi-sub">71% engagement</div>
          </div>
          <div className="adm-kpi-card">
            <div className="adm-kpi-label">LLM Backend</div>
            <div className="adm-kpi-value small">
              <span
                style={{
                  fontFamily: 'var(--fm)',
                  background: 'var(--green-s)',
                  color: 'var(--green)',
                  border: '1px solid rgba(60,184,135,0.28)',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '13px',
                }}
              >
                llama3-8b
              </span>
            </div>
            <div className="adm-kpi-sub">Mac Mini M4 · Ollama</div>
          </div>
          <div className="adm-kpi-card warn">
            <div className="adm-kpi-label">Flagged students</div>
            <div className="adm-kpi-value yellow">7</div>
            <div className="adm-kpi-sub">score declined &gt;10 pts</div>
          </div>
        </div>

        {/* Config panels */}
        <div className="adm-cfg-grid">
          <div className="adm-cfg-card">
            <div className="adm-cfg-title">🤖 AI Model Configuration</div>
            <div className="adm-cfg-row">
              <span className="adm-cfg-key">LECA_LLM_BACKEND</span>
              <span className="adm-cfg-val">llama3-8b</span>
            </div>
            <div className="adm-cfg-row">
              <span className="adm-cfg-key">Model status</span>
              <span className="adm-cfg-val ok">Running</span>
            </div>
            <div className="adm-cfg-row">
              <span className="adm-cfg-key">Avg. latency (P95)</span>
              <span className="adm-cfg-val ok">2.4s</span>
            </div>
            <div className="adm-cfg-row">
              <span className="adm-cfg-key">Concurrent sessions</span>
              <span className="adm-cfg-val">1–2 max</span>
            </div>
            <button
              className="adm-btn"
              style={{ width: '100%', marginTop: '12px' }}
            >
              Change model →
            </button>
          </div>
          <div className="adm-cfg-card">
            <div className="adm-cfg-title">🔒 Content Safety</div>
            <div className="adm-cfg-row">
              <span className="adm-cfg-key">LECA_CONTENT_SAFETY</span>
              <span className="adm-cfg-val">standard</span>
            </div>
            <div className="adm-cfg-row">
              <span className="adm-cfg-key">Age gate enforced</span>
              <span className="adm-cfg-val ok">Yes</span>
            </div>
            <div className="adm-cfg-row">
              <span className="adm-cfg-key">Child learner mode</span>
              <span className="adm-cfg-val warn">Off</span>
            </div>
            <div className="adm-cfg-row">
              <span className="adm-cfg-key">Telemetry to LECA Cloud</span>
              <span className="adm-cfg-val ok">Disabled</span>
            </div>
            <button
              className="adm-btn"
              style={{ width: '100%', marginTop: '12px' }}
            >
              Configure →
            </button>
          </div>
        </div>

        {/* User table preview */}
        <div className="adm-section-title">All users</div>
        <table className="adm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Class</th>
              <th>Level</th>
              <th>Last active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="adm-user-name">Minh Anh Tran</div>
              </td>
              <td>minh.anh@school.edu</td>
              <td>
                <span className="adm-pill amber">B1–B2 Morning</span>
              </td>
              <td>
                <span className="adm-pill amber">Intermediate</span>
              </td>
              <td>Today, 9:41</td>
              <td>
                <div className="adm-row-acts">
                  <button className="adm-row-btn">View</button>
                  <button className="adm-row-btn">Reset pw</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div className="adm-user-name">Bao Nguyen</div>
              </td>
              <td>bao.nguyen@school.edu</td>
              <td>
                <span className="adm-pill amber">B1–B2 Morning</span>
              </td>
              <td>
                <span className="adm-pill green">Beginner</span>
              </td>
              <td style={{ color: '#e05b5b' }}>5 days ago</td>
              <td>
                <div className="adm-row-acts">
                  <button className="adm-row-btn">View</button>
                  <button className="adm-row-btn">Reset pw</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div className="adm-user-name">Thu Pham</div>
              </td>
              <td>thu.pham@school.edu</td>
              <td>
                <span className="adm-pill blue">A2 Evening</span>
              </td>
              <td>
                <span className="adm-pill amber">Intermediate</span>
              </td>
              <td>Yesterday</td>
              <td>
                <div className="adm-row-acts">
                  <button className="adm-row-btn">View</button>
                  <button className="adm-row-btn">Reset pw</button>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={6} className="adm-more">
                Showing 3 of 284 users ·{' '}
                <Link href="/admin-panel/users">Search or filter users →</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default withPageRequiredAuth(AdminPanel, { roles: [RoleEnum.ADMIN] });
