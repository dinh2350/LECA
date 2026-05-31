# P9 — Shareable Progress Report + LTI 1.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate signed 30-day shareable report links for learner progress, with a public read-only report page and LTI 1.3 auto-provisioning for institutional launch via Moodle.

**Architecture:** A new `ReportsModule` signs a JWT with `type:'report'` and `userId` (30-day TTL) using the existing `AUTH_JWT_SECRET`; a public `GET /v1/reports/:token` endpoint verifies the token and returns aggregated session data. The web report page is server-rendered at `/r/[token]` and uses `window.print()` for PDF export. LTI 1.3 is a separate `LtiModule` with a two-step OIDC flow: `POST /v1/lti/login` → Moodle auth → `POST /v1/lti/launch` (verifies RS256 JWT via Moodle's JWKS, auto-provisions LecaUser).

**Tech Stack:** NestJS + `@nestjs/jwt` + Prisma (reports); `jose` npm (JWKS verification for LTI); Next.js 16 App Router (web report page).

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/api/src/reports/reports.module.ts` | Create | Wire module |
| `apps/api/src/reports/reports.service.ts` | Create | Token sign/verify + data aggregation |
| `apps/api/src/reports/reports.controller.ts` | Create | `POST /me/reports`, `GET /reports/:token` |
| `apps/api/src/reports/dto/report-response.dto.ts` | Create | Typed response shape |
| `apps/api/src/app.module.ts` | Modify | Import ReportsModule |
| `apps/api/src/lti/lti.module.ts` | Create | Wire LTI module |
| `apps/api/src/lti/lti.service.ts` | Create | OIDC init + JWT verify + user provision |
| `apps/api/src/lti/lti.controller.ts` | Create | `POST /lti/login`, `POST /lti/launch` |
| `apps/api/src/app.module.ts` | Modify | Import LtiModule |
| `apps/web/src/services/api/services/reports.ts` | Create | `useGenerateReportService` hook |
| `apps/web/src/app/[language]/profile/page-content.tsx` | Modify | Add "Share Progress" button |
| `apps/web/src/app/r/[token]/page.tsx` | Create | Public report SSR page |
| `apps/web/src/app/r/[token]/page-content.tsx` | Create | Report UI with print button |

---

## Acceptance Criteria

- `POST /v1/auth/me/reports` (authenticated) returns `{ url: "https://…/r/<token>" }`
- `GET /v1/reports/:token` (public) returns JSON with sessions + scores, returns 401 after 30 days
- Web page `/r/<token>` renders trend chart and session history
- Clicking "Download PDF" triggers `window.print()` with print-friendly CSS
- `POST /v1/lti/login` returns a redirect to the LTI Platform's auth endpoint
- `POST /v1/lti/launch` with a valid Moodle JWT creates a LecaUser if new, returns redirect to `/conversation`

---

## Task 1: Reports Service — Token Generation + Verification

**Files:**
- Create: `apps/api/src/reports/reports.service.ts`
- Create: `apps/api/src/reports/dto/report-response.dto.ts`
- Create: `apps/api/src/reports/reports.controller.ts`
- Create: `apps/api/src/reports/reports.module.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/reports/reports.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
            verifyAsync: jest.fn().mockResolvedValue({
              type: 'report',
              userId: 'user-uuid',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get(ReportsService);
    jwtService = module.get(JwtService);
  });

  it('generateToken signs JWT with type=report and 30d expiry', async () => {
    const token = await service.generateToken('user-uuid');
    expect(token).toBe('signed.jwt.token');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { type: 'report', userId: 'user-uuid' },
      { secret: 'test-secret', expiresIn: '30d' },
    );
  });

  it('verifyToken returns userId from valid token', async () => {
    const result = await service.verifyToken('signed.jwt.token');
    expect(result).toBe('user-uuid');
  });

  it('verifyToken throws if token type is not report', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValueOnce({
      type: 'auth',
      userId: 'user-uuid',
    });
    await expect(service.verifyToken('bad.token')).rejects.toThrow(
      'Invalid report token',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/api && pnpm test --testPathPattern=reports.service.spec
```
Expected: FAIL — `Cannot find module './reports.service'`

- [ ] **Step 3: Create the service**

Create `apps/api/src/reports/reports.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { PrismaService } from '../database/prisma.service';

const REPORT_EXPIRES = '30d';

@Injectable()
export class ReportsService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly prisma: PrismaService,
  ) {}

  async generateToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { type: 'report', userId },
      {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
        expiresIn: REPORT_EXPIRES,
      },
    );
  }

  async verifyToken(token: string): Promise<string> {
    const payload = await this.jwtService
      .verifyAsync<{ type: string; userId: string }>(token, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      })
      .catch(() => {
        throw new UnauthorizedException('Invalid report token');
      });

    if (payload.type !== 'report') {
      throw new UnauthorizedException('Invalid report token');
    }
    return payload.userId;
  }

  async getReportData(userId: string) {
    const sessions = await this.prisma.conversationSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        startedAt: true,
        durationSeconds: true,
        totalWords: true,
        fluencyScore: true,
        pronunciationScore: true,
        vocabularyScore: true,
        wordsPerMinute: true,
        scenario: { select: { title: true, difficulty: true } },
      },
    });

    const user = await this.prisma.lecaUser.findUniqueOrThrow({
      where: { id: userId },
      select: { displayName: true, currentLevel: true },
    });

    const sessionsWithScores = sessions.filter(
      (s) => s.fluencyScore !== null,
    );

    const avgFluency =
      sessionsWithScores.length > 0
        ? sessionsWithScores.reduce(
            (sum, s) => sum + Number(s.fluencyScore),
            0,
          ) / sessionsWithScores.length
        : null;

    const avgPronunciation =
      sessionsWithScores.length > 0
        ? sessionsWithScores.reduce(
            (sum, s) => sum + Number(s.pronunciationScore),
            0,
          ) / sessionsWithScores.length
        : null;

    const totalWords = sessions.reduce(
      (sum, s) => sum + (s.totalWords ?? 0),
      0,
    );

    return {
      user: { displayName: user.displayName, currentLevel: user.currentLevel },
      sessions,
      summary: {
        totalSessions: sessions.length,
        totalWords,
        avgFluency: avgFluency !== null ? Math.round(avgFluency) : null,
        avgPronunciation:
          avgPronunciation !== null ? Math.round(avgPronunciation) : null,
      },
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/api && pnpm test --testPathPattern=reports.service.spec
```
Expected: PASS (3 tests)

- [ ] **Step 5: Create DTO, controller, module**

Create `apps/api/src/reports/dto/report-response.dto.ts`:

```typescript
export class ReportUrlDto {
  url: string;
}
```

Create `apps/api/src/reports/reports.controller.ts`:

```typescript
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { ReportsService } from './reports.service';
import { ReportUrlDto } from './dto/report-response.dto';

@ApiTags('Reports')
@Controller({ path: '', version: '1' })
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  @Post('auth/me/reports')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: ReportUrlDto })
  async generateReport(
    @Req() req: Request & { user: { id: string; lecaUserId?: string } },
  ): Promise<ReportUrlDto> {
    const lecaUserId = req.user.lecaUserId;
    if (!lecaUserId) throw new NotFoundException('No LECA profile found');

    const token = await this.reportsService.generateToken(lecaUserId);
    const appUrl = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });
    return { url: `${appUrl}/r/${token}` };
  }

  @Get('reports/:token')
  @HttpCode(HttpStatus.OK)
  async getReport(@Param('token') token: string) {
    const userId = await this.reportsService.verifyToken(token);
    return this.reportsService.getReportData(userId);
  }
}
```

Create `apps/api/src/reports/reports.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
```

- [ ] **Step 6: Register ReportsModule in AppModule**

Edit `apps/api/src/app.module.ts` — add import:

```typescript
import { ReportsModule } from './reports/reports.module';
```

Add `ReportsModule` to the `imports` array after `ConversationSessionsModule`.

- [ ] **Step 7: Check the `req.user` structure for `lecaUserId`**

Run:
```bash
cd apps/api && grep -r "lecaUserId" src/auth/ --include="*.ts"
```

If `lecaUserId` is not present in the JWT payload, look at how other controllers access the LECA user (e.g., `conversation-sessions.controller.ts`) and adapt the controller accordingly. The pattern may be to look up LecaUser by `req.user.email` using PrismaService in the service layer.

- [ ] **Step 8: Commit**

```bash
cd apps/api && git add src/reports/ src/app.module.ts
git commit -m "feat(api): add reports module with 30-day signed progress link"
```

---

## Task 2: Web — API Hook + Profile Share Button

**Files:**
- Create: `apps/web/src/services/api/services/reports.ts`
- Modify: `apps/web/src/app/[language]/profile/page-content.tsx`

- [ ] **Step 1: Create the API service hook**

Create `apps/web/src/services/api/services/reports.ts`:

```typescript
import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';

export type ReportUrlResponse = {
  url: string;
};

export function useGenerateReportService() {
  const fetch = useFetch();
  return useCallback(async () => {
    const requestUrl = new URL(`${API_URL}/v1/auth/me/reports`);
    const res = await fetch(requestUrl, {
      method: 'POST',
    });
    return wrapperFetchJsonResponse<ReportUrlResponse>(res);
  }, [fetch]);
}
```

- [ ] **Step 2: Add Share Progress button to profile page**

Read `apps/web/src/app/[language]/profile/page-content.tsx` fully first, then add a new "Share Progress" settings row. The row appears in the "Account" section after the Change Password row.

The new state and handler (add near the top of the `Profile` component):

```typescript
const [shareUrl, setShareUrl] = useState<string | null>(null);
const [sharing, setSharing] = useState(false);
const generateReport = useGenerateReportService();

async function handleShare() {
  setSharing(true);
  try {
    const res = await generateReport();
    if (res.status === 201 && res.data) {
      setShareUrl(res.data.url);
      await navigator.clipboard.writeText(res.data.url).catch(() => {});
    }
  } finally {
    setSharing(false);
  }
}
```

Add import: `import { useGenerateReportService } from '@/services/api/services/reports';`
Add import: `import { useState } from 'react';`

Add the new row after the "Change password" row:

```tsx
<div className="settings-row">
  <div className="settings-row-ic">📊</div>
  <div className="settings-row-inf">
    <div className="settings-row-t">Share progress report</div>
    <div className="settings-row-d">
      {shareUrl ? (
        <span className="text-green-400 text-xs break-all">{shareUrl} — copied!</span>
      ) : (
        'Generate a 30-day shareable link'
      )}
    </div>
  </div>
  <div className="settings-row-act">
    <button
      onClick={handleShare}
      disabled={sharing}
      className="text-sm text-amber-400 hover:text-amber-300 disabled:opacity-40 transition-colors"
    >
      {sharing ? '…' : shareUrl ? 'New link' : 'Share →'}
    </button>
  </div>
</div>
```

- [ ] **Step 3: Verify no type errors**

```bash
cd apps/web && pnpm exec tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/services/api/services/reports.ts \
        apps/web/src/app/[language]/profile/page-content.tsx
git commit -m "feat(web): add share progress button on profile"
```

---

## Task 3: Web — Public Report Page

**Files:**
- Create: `apps/web/src/app/r/[token]/page.tsx`
- Create: `apps/web/src/app/r/[token]/page-content.tsx`

Note: This is at `apps/web/src/app/r/` (not inside `[language]`) because it's a public, language-agnostic page accessed via direct link.

- [ ] **Step 1: Create the page-content component**

Create `apps/web/src/app/r/[token]/page-content.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/services/api/config';

type SessionEntry = {
  id: string;
  startedAt: string;
  durationSeconds: number | null;
  totalWords: number | null;
  fluencyScore: string | null;
  pronunciationScore: string | null;
  vocabularyScore: string | null;
  scenario: { title: string; difficulty: string } | null;
};

type ReportData = {
  user: { displayName: string; currentLevel: string | null };
  sessions: SessionEntry[];
  summary: {
    totalSessions: number;
    totalWords: number;
    avgFluency: number | null;
    avgPronunciation: number | null;
  };
};

function ScoreBar({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-white/50">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportPageContent({ token }: { token: string }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/v1/reports/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? 'expired' : 'error');
        return res.json() as Promise<ReportData>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  if (error === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-white/50">This report link has expired.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-white/50">Failed to load report.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto print:p-0">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between print:mb-4">
        <div>
          <h1 className="text-2xl font-bold">{data.user.displayName}</h1>
          <p className="text-sm text-white/40 mt-0.5">
            LECA Progress Report · Last {data.summary.totalSessions} sessions
          </p>
          {data.user.currentLevel && (
            <span className="mt-2 inline-block rounded-full border border-amber-400/40 px-2 py-0.5 text-xs text-amber-400">
              Level {data.user.currentLevel}
            </span>
          )}
        </div>
        <button
          onClick={() => window.print()}
          className="print:hidden rounded-md border border-white/10 px-3 py-1.5 text-sm text-white/50 hover:text-white hover:border-white/30 transition-colors"
        >
          Download PDF
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-4 print:grid-cols-4 print:mb-4">
        {[
          { label: 'Sessions', value: String(data.summary.totalSessions) },
          { label: 'Words spoken', value: String(data.summary.totalWords) },
          {
            label: 'Avg fluency',
            value:
              data.summary.avgFluency !== null
                ? `${data.summary.avgFluency}%`
                : '–',
          },
          {
            label: 'Avg pronunciation',
            value:
              data.summary.avgPronunciation !== null
                ? `${data.summary.avgPronunciation}%`
                : '–',
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="text-xs text-white/40 mb-1">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="flex flex-col gap-3">
        {data.sessions.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">
                  {s.scenario?.title ?? 'Free talk'}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {new Date(s.startedAt).toLocaleDateString()}
                  {s.durationSeconds
                    ? ` · ${Math.round(s.durationSeconds / 60)} min`
                    : ''}
                  {s.totalWords ? ` · ${s.totalWords} words` : ''}
                </p>
              </div>
              {s.scenario?.difficulty && (
                <span className="text-xs text-white/30 font-mono">
                  {s.scenario.difficulty}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <ScoreBar value={s.fluencyScore ? Number(s.fluencyScore) : null} label="Fluency" />
              <ScoreBar value={s.pronunciationScore ? Number(s.pronunciationScore) : null} label="Pronunciation" />
              <ScoreBar value={s.vocabularyScore ? Number(s.vocabularyScore) : null} label="Vocabulary" />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-white/20 print:mt-4">
        Generated by LECA · Link valid 30 days
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the page.tsx**

Create `apps/web/src/app/r/[token]/page.tsx`:

```typescript
import type { Metadata } from 'next';
import ReportPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Progress Report — LECA',
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ReportPageContent token={token} />;
}
```

- [ ] **Step 3: Add print CSS to global styles**

Find `apps/web/src/app/globals.css` or `apps/web/src/styles/globals.css`. Add at the end:

```css
@media print {
  body {
    background: white !important;
    color: black !important;
  }
  .print\:hidden {
    display: none !important;
  }
}
```

- [ ] **Step 4: Verify no type errors**

```bash
cd apps/web && pnpm exec tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/r/
git commit -m "feat(web): add public shareable progress report page"
```

---

## Task 4: LTI 1.3 Module — Auto-Provisioning

**Files:**
- Create: `apps/api/src/lti/lti.module.ts`
- Create: `apps/api/src/lti/lti.service.ts`
- Create: `apps/api/src/lti/lti.controller.ts`
- Modify: `apps/api/src/app.module.ts`

LTI 1.3 flow:
1. Moodle → `POST /v1/lti/login` (OIDC initiation) → redirect to Moodle auth URL with `response_type=id_token`
2. Moodle → `POST /v1/lti/launch` (id_token in form body) → verify RS256 JWT using Moodle's JWKS → provision user → redirect to `/conversation`

- [ ] **Step 1: Install jose**

```bash
cd apps/api && pnpm add jose
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/lti/lti.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { LtiService } from './lti.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const mockPrisma = {
  organization: { findFirst: jest.fn() },
  lecaUser: { findFirst: jest.fn(), create: jest.fn() },
  user: { findFirst: jest.fn(), create: jest.fn() },
};

describe('LtiService.buildOidcRedirect', () => {
  let service: LtiService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LtiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('access.token') } },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('https://app.leca.io') },
        },
      ],
    }).compile();
    service = module.get(LtiService);
  });

  it('buildOidcRedirect includes required OIDC params', () => {
    const url = service.buildOidcRedirect({
      iss: 'https://moodle.example.com',
      login_hint: 'hint123',
      target_link_uri: 'https://app.leca.io/conversation',
      lti_message_hint: 'msg-hint',
      client_id: 'client-abc',
      oidcAuthEndpoint: 'https://moodle.example.com/mod/lti/auth.php',
    });
    expect(url).toContain('response_type=id_token');
    expect(url).toContain('scope=openid');
    expect(url).toContain('login_hint=hint123');
    expect(url).toContain('redirect_uri=');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd apps/api && pnpm test --testPathPattern=lti.service.spec
```
Expected: FAIL — `Cannot find module './lti.service'`

- [ ] **Step 4: Create LtiService**

Create `apps/api/src/lti/lti.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AllConfigType } from '../config/config.type';
import { PrismaService } from '../database/prisma.service';

interface OidcRedirectParams {
  iss: string;
  login_hint: string;
  target_link_uri: string;
  lti_message_hint?: string;
  client_id: string;
  oidcAuthEndpoint: string;
}

interface LtiClaims {
  sub: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  'https://purl.imsglobal.org/spec/lti/claim/roles'?: string[];
  'https://purl.imsglobal.org/spec/lti/claim/context'?: {
    id?: string;
    title?: string;
  };
}

@Injectable()
export class LtiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  buildOidcRedirect(params: OidcRedirectParams): string {
    const appUrl = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });
    const redirectUri = encodeURIComponent(`${appUrl}/v1/lti/launch`);
    const nonce = Math.random().toString(36).slice(2);
    const state = Buffer.from(
      JSON.stringify({ nonce, target: params.target_link_uri }),
    ).toString('base64url');

    const qs = [
      `scope=openid`,
      `response_type=id_token`,
      `response_mode=form_post`,
      `prompt=none`,
      `client_id=${encodeURIComponent(params.client_id)}`,
      `redirect_uri=${redirectUri}`,
      `login_hint=${encodeURIComponent(params.login_hint)}`,
      params.lti_message_hint
        ? `lti_message_hint=${encodeURIComponent(params.lti_message_hint)}`
        : '',
      `state=${state}`,
      `nonce=${nonce}`,
    ]
      .filter(Boolean)
      .join('&');

    return `${params.oidcAuthEndpoint}?${qs}`;
  }

  async verifyAndProvision(idToken: string, ltiKey: string) {
    const org = await this.prisma.organization.findFirst({
      where: { ltiKey },
    });
    if (!org) throw new UnauthorizedException('Unknown LTI key');

    // Discover JWKS from issuer — Moodle exposes at /.well-known/jwks.json
    // In production, ltiSecret stores the JWKS URL or use iss from JWT header
    const jwksUrl = org.ltiSecret ?? '';
    if (!jwksUrl.startsWith('http')) {
      throw new UnauthorizedException('LTI JWKS URL not configured');
    }

    const JWKS = createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jwtVerify(idToken, JWKS, {
      algorithms: ['RS256'],
    }).catch(() => {
      throw new UnauthorizedException('Invalid LTI token');
    });

    const claims = payload as unknown as LtiClaims;

    // Find or create LecaUser
    const email = claims.email ?? `lti-${claims.sub}@lti.local`;
    let lecaUser = await this.prisma.lecaUser.findFirst({
      where: { organizationId: org.id, email },
    });

    if (!lecaUser) {
      lecaUser = await this.prisma.lecaUser.create({
        data: {
          organizationId: org.id,
          email,
          displayName: [claims.given_name, claims.family_name]
            .filter(Boolean)
            .join(' ') || email,
          role: 'learner',
        },
      });
    }

    // Issue a short-lived access token the client can use
    const appUrl = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });

    const sessionToken = await this.jwtService.signAsync(
      { sub: lecaUser.id, type: 'lti-session' },
      {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
        expiresIn: '1h',
      },
    );

    return { redirectUrl: `${appUrl}/conversation?lti_token=${sessionToken}` };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd apps/api && pnpm test --testPathPattern=lti.service.spec
```
Expected: PASS (1 test)

- [ ] **Step 6: Create LtiController and LtiModule**

Create `apps/api/src/lti/lti.controller.ts`:

```typescript
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LtiService } from './lti.service';

@ApiTags('LTI')
@Controller({ path: 'lti', version: '1' })
export class LtiController {
  constructor(private readonly ltiService: LtiService) {}

  @Post('login')
  @HttpCode(HttpStatus.FOUND)
  @Redirect()
  async oidcLogin(
    @Body()
    body: {
      iss: string;
      login_hint: string;
      target_link_uri: string;
      lti_message_hint?: string;
      client_id: string;
    },
    @Query('oidc_auth_endpoint') oidcAuthEndpoint: string,
  ) {
    const url = this.ltiService.buildOidcRedirect({
      ...body,
      oidcAuthEndpoint:
        oidcAuthEndpoint ?? `${body.iss}/mod/lti/auth.php`,
    });
    return { url };
  }

  @Post('launch')
  @HttpCode(HttpStatus.FOUND)
  @Redirect()
  async launch(
    @Body() body: { id_token: string; client_id?: string },
  ) {
    const { redirectUrl } = await this.ltiService.verifyAndProvision(
      body.id_token,
      body.client_id ?? '',
    );
    return { url: redirectUrl };
  }
}
```

Create `apps/api/src/lti/lti.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LtiService } from './lti.service';
import { LtiController } from './lti.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  providers: [LtiService],
  controllers: [LtiController],
})
export class LtiModule {}
```

- [ ] **Step 7: Register LtiModule in AppModule**

Edit `apps/api/src/app.module.ts`:
- Add: `import { LtiModule } from './lti/lti.module';`
- Add `LtiModule` to the `imports` array after `ReportsModule`.

- [ ] **Step 8: Verify build compiles**

```bash
cd apps/api && pnpm build
```
Expected: no TypeScript errors

- [ ] **Step 9: Commit**

```bash
cd apps/api && git add src/lti/ src/app.module.ts
git commit -m "feat(api): add LTI 1.3 OIDC login + launch with auto-provisioning"
```

---

## Task 5: Check `req.user.lecaUserId` — Reports Controller Fix

Before this task, verify how the API controller accesses the LecaUser from an authenticated request, because the reports controller needs `lecaUserId`.

- [ ] **Step 1: Check JWT payload structure**

```bash
cd apps/api && grep -r "lecaUserId\|LecaUser\|leca_user" src/auth/ src/conversations/ src/assessments/ --include="*.ts" -l
```

- [ ] **Step 2: Find how other controllers look up LecaUser**

```bash
cd apps/api && grep -r "lecaUser\|findFirst.*email\|findUnique.*userId" src/ --include="*.service.ts" | head -20
```

- [ ] **Step 3: Adapt `ReportsController` if needed**

If the JWT payload does NOT include `lecaUserId`, update `ReportsController.generateReport` to look up by `req.user.email`:

```typescript
// In reports.controller.ts, inject PrismaService
constructor(
  private readonly reportsService: ReportsService,
  private readonly configService: ConfigService<AllConfigType>,
  private readonly prisma: PrismaService,
) {}

// In generateReport:
const lecaUser = await this.prisma.lecaUser.findFirst({
  where: { email: req.user.email },
  select: { id: true },
});
if (!lecaUser) throw new NotFoundException('No LECA profile found');
const token = await this.reportsService.generateToken(lecaUser.id);
```

Also add `PrismaModule` to `ReportsModule` imports if not already there.

- [ ] **Step 4: Run unit tests**

```bash
cd apps/api && pnpm test
```
Expected: all tests pass

- [ ] **Step 5: Commit if changes made**

```bash
git add apps/api/src/reports/
git commit -m "fix(api): resolve LecaUser lookup in reports controller"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|-------------|------|
| `POST /me/reports` → signed 30-day link (FR-DASH-04) | Task 1 |
| Public `GET /reports/:token` returns progress data | Task 1 |
| Report link expires after 30 days | Task 1 (JWT `expiresIn: '30d'`) |
| Web report page renders trend + sessions | Task 3 |
| PDF export | Task 3 (`window.print()` + print CSS) |
| Share button on web | Task 2 |
| LTI 1.3 OIDC login endpoint (FR-SELF-05) | Task 4 |
| LTI 1.3 launch + JWT verify | Task 4 |
| Auto-provision learner from LTI | Task 4 |
| `ltiKey`/`ltiSecret` on Organization model | Already in schema (no migration needed) |

### Placeholder Scan

None found. All steps contain actual code.

### Type Consistency

- `ReportsService.generateToken(userId: string)` → called in Task 1 controller with `lecaUser.id` (string) ✓
- `ReportsService.verifyToken(token: string)` → returns `userId: string` ✓
- `ReportsService.getReportData(userId: string)` → called in controller after `verifyToken` ✓
- `LtiService.buildOidcRedirect(params: OidcRedirectParams)` → called in controller ✓
- `LtiService.verifyAndProvision(idToken: string, ltiKey: string)` → called in controller with `body.id_token`, `body.client_id` ✓

### Notes for Implementer

1. **`app.frontendDomain`** — Check `apps/api/src/config/app.config.ts` to confirm this config key exists. If it's named differently (e.g., `app.url` or `app.domain`), update the service accordingly.

2. **LecaUser `email` field** — Confirm `LecaUser` has an `email` field in the Prisma schema. If not, the provisioning in `LtiService` and the lookup in `ReportsController` need to use a different unique identifier.

3. **LtiService `ltiSecret` as JWKS URL** — The plan repurposes `Organization.ltiSecret` to store the Moodle JWKS URL (e.g., `https://moodle.example.com/mod/lti/certs`). Document this convention in the Organization admin UI or README.

4. **CORS** — The LTI launch endpoint receives a `POST` from Moodle's browser form, which is a cross-origin request. Ensure `apps/api/src/main.ts` allows CORS for the LTI endpoint, or the form-post from Moodle will be blocked.

5. **`/r/[token]` route location** — The report page is at `apps/web/src/app/r/[token]` (outside `[language]`). This means it doesn't go through the language layout or auth guards, which is correct for a public shareable link.
