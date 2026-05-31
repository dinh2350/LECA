'use client';

import useAuth from '@/services/auth/use-auth';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import Link from '@/components/link';
import { useTranslation } from '@/services/i18n/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation('profile');

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  const displayName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="settings-page">
      <h1 className="settings-header">{t('profile:title') || 'Settings'}</h1>

      {/* Account */}
      <div className="settings-section">
        <div className="settings-section-label">Account</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-ic">
              <Avatar className="h-9 w-9" data-testid="user-icon">
                <AvatarImage src={user?.photo?.path} alt={displayName} />
                <AvatarFallback
                  style={{
                    background: 'var(--amber-s)',
                    color: 'var(--amber)',
                    fontSize: '13px',
                    fontFamily: 'var(--fd)',
                    fontWeight: 800,
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="settings-row-inf">
              <div className="settings-row-t" data-testid="user-name">
                {displayName || 'Your name'}
              </div>
              <div className="settings-row-d" data-testid="user-email">
                {user?.email}
              </div>
            </div>
            <div className="settings-row-act">
              <Link href="/profile/edit" data-testid="edit-profile">
                {t('profile:actions.edit')} →
              </Link>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-ic">🔑</div>
            <div className="settings-row-inf">
              <div className="settings-row-t">Change password</div>
            </div>
            <div className="settings-row-act">
              <Link href="/password-change">→</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Practice preferences */}
      <div className="settings-section">
        <div className="settings-section-label">Practice preferences</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-ic">💬</div>
            <div className="settings-row-inf">
              <div className="settings-row-t">
                Show feedback after each turn
              </div>
              <div className="settings-row-d">
                Fluency, naturalness &amp; vocabulary tips
              </div>
            </div>
            <div className="settings-row-act">
              <div
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '999px',
                  background: 'var(--amber)',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: '3px',
                    top: '3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--bg)',
                  }}
                />
              </div>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-ic">🔊</div>
            <div className="settings-row-inf">
              <div className="settings-row-t">AI voice (TTS)</div>
              <div className="settings-row-d">On-device · Kokoro voice</div>
            </div>
            <div className="settings-row-act">Change →</div>
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="settings-section">
        <div className="settings-section-label">Privacy &amp; Data</div>
        <div className="settings-card">
          <div className="settings-privacy-note">
            <strong>How your data is processed:</strong> Audio is sent to Gemini
            2.0 Flash API (Google) for transcription and response.
            Transcriptions and pronunciation scores are stored with your
            account. Audio itself is not persisted after processing.
            <br />
            <br />
            On self-hosted deployments, all data stays on your
            institution&apos;s server.
          </div>
          <div className="settings-row">
            <div className="settings-row-ic">📦</div>
            <div className="settings-row-inf">
              <div className="settings-row-t">Export my data</div>
              <div className="settings-row-d">
                Sessions, scores, and account info as JSON
              </div>
            </div>
            <div className="settings-row-act">Export →</div>
          </div>
          <div className="settings-row">
            <div className="settings-row-ic">📜</div>
            <div className="settings-row-inf">
              <div className="settings-row-t">Privacy Policy</div>
            </div>
            <div className="settings-row-act">
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                View →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="settings-section">
        <div className="settings-section-label">Danger zone</div>
        <div className="settings-card">
          <div className="settings-row danger">
            <div className="settings-row-ic">🗑️</div>
            <div className="settings-row-inf">
              <div className="settings-row-t">Delete my account</div>
              <div
                className="settings-row-d"
                style={{ color: '#e05b5b', opacity: 0.8 }}
              >
                Permanently delete all data · Cannot be undone
              </div>
            </div>
            <div className="settings-row-act">Delete →</div>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        LECA v1.0.0 · Open-source · Apache 2.0
        <br />
        <a
          href="https://github.com/leca-ai/leca"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--amber)', textDecoration: 'none' }}
        >
          github.com/leca-ai/leca
        </a>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Profile);
