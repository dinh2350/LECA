# react-email Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Handlebars `.hbs` email templates with typed React components using `react-email`.

**Architecture:** `@react-email/render` renders React components to HTML strings server-side (no browser needed). The `MailService.sendMail()` private method swaps `Handlebars.compile` for `render()`. All three existing templates (activation, reset-password, confirm-new-email) become `.tsx` files. `nodemailer` transport is untouched.

**Tech Stack:** react-email, @react-email/components, @react-email/render, react, react-dom

---

## File Map

**New:**
- `apps/api/src/mail/mail-templates/activation.tsx`
- `apps/api/src/mail/mail-templates/reset-password.tsx`
- `apps/api/src/mail/mail-templates/confirm-new-email.tsx`

**Modified:**
- `apps/api/package.json`
- `apps/api/src/mail/mail.service.ts`

**Deleted:**
- `apps/api/src/mail/mail-templates/activation.hbs`
- `apps/api/src/mail/mail-templates/reset-password.hbs`
- `apps/api/src/mail/mail-templates/confirm-new-email.hbs`

---

### Task 1: Install packages

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install**

```bash
cd apps/api
pnpm add react-email @react-email/components @react-email/render react react-dom
pnpm add -D @types/react @types/react-dom
```

- [ ] **Step 2: Verify render works**

```bash
node -e "const { render } = require('@react-email/render'); console.log(typeof render)"
```

Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore(api): add react-email dependencies"
```

---

### Task 2: Create activation email template

**Files:**
- Create: `apps/api/src/mail/mail-templates/activation.tsx`

The existing `activation.hbs` has: app name header, 3 text lines, a CTA button linking to `{{url}}`.

- [ ] **Step 1: Create activation.tsx**

```tsx
import * as React from 'react';

interface ActivationEmailProps {
  title: string;
  url: string;
  actionTitle: string;
  app_name: string;
  text1: string;
  text2: string;
  text3: string;
}

export function ActivationEmail({
  title,
  url,
  actionTitle,
  app_name,
  text1,
  text2,
  text3,
}: ActivationEmailProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
      </head>
      <body style={{ margin: 0, fontFamily: 'arial' }}>
        <table style={{ border: '0', width: '100%' }}>
          <tbody>
            <tr style={{ background: '#eeeeee' }}>
              <td
                style={{
                  padding: '20px',
                  color: '#808080',
                  textAlign: 'center',
                  fontSize: '40px',
                  fontWeight: 600,
                }}
              >
                {app_name}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '20px',
                  color: '#808080',
                  fontSize: '16px',
                  fontWeight: 100,
                }}
              >
                {text1}
                <br />
                {text2} {app_name}.
                <br />
                {text3}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center' }}>
                <a
                  href={url}
                  style={{
                    display: 'inline-block',
                    padding: '20px',
                    background: '#00838f',
                    textDecoration: 'none',
                    color: '#ffffff',
                  }}
                >
                  {actionTitle}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/mail/mail-templates/activation.tsx
git commit -m "feat(api): add activation email React template"
```

---

### Task 3: Create reset-password email template

**Files:**
- Create: `apps/api/src/mail/mail-templates/reset-password.tsx`

The existing `reset-password.hbs` has the same structure as activation but with 4 text lines.

- [ ] **Step 1: Create reset-password.tsx**

```tsx
import * as React from 'react';

interface ResetPasswordEmailProps {
  title: string;
  url: string;
  actionTitle: string;
  app_name: string;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
}

export function ResetPasswordEmail({
  title,
  url,
  actionTitle,
  app_name,
  text1,
  text2,
  text3,
  text4,
}: ResetPasswordEmailProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
      </head>
      <body style={{ margin: 0, fontFamily: 'arial' }}>
        <table style={{ border: '0', width: '100%' }}>
          <tbody>
            <tr style={{ background: '#eeeeee' }}>
              <td
                style={{
                  padding: '20px',
                  color: '#808080',
                  textAlign: 'center',
                  fontSize: '40px',
                  fontWeight: 600,
                }}
              >
                {app_name}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '20px',
                  color: '#808080',
                  fontSize: '16px',
                  fontWeight: 100,
                }}
              >
                {text1}
                <br />
                {text2}
                <br />
                {text3}
                <br />
                {text4}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center' }}>
                <a
                  href={url}
                  style={{
                    display: 'inline-block',
                    padding: '20px',
                    background: '#00838f',
                    textDecoration: 'none',
                    color: '#ffffff',
                  }}
                >
                  {actionTitle}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/mail/mail-templates/reset-password.tsx
git commit -m "feat(api): add reset-password email React template"
```

---

### Task 4: Create confirm-new-email template

**Files:**
- Create: `apps/api/src/mail/mail-templates/confirm-new-email.tsx`

Same structure as `activation.tsx` — 3 text lines + CTA button.

- [ ] **Step 1: Create confirm-new-email.tsx**

```tsx
import * as React from 'react';

interface ConfirmNewEmailProps {
  title: string;
  url: string;
  actionTitle: string;
  app_name: string;
  text1: string;
  text2: string;
  text3: string;
}

export function ConfirmNewEmail({
  title,
  url,
  actionTitle,
  app_name,
  text1,
  text2,
  text3,
}: ConfirmNewEmailProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
      </head>
      <body style={{ margin: 0, fontFamily: 'arial' }}>
        <table style={{ border: '0', width: '100%' }}>
          <tbody>
            <tr style={{ background: '#eeeeee' }}>
              <td
                style={{
                  padding: '20px',
                  color: '#808080',
                  textAlign: 'center',
                  fontSize: '40px',
                  fontWeight: 600,
                }}
              >
                {app_name}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '20px',
                  color: '#808080',
                  fontSize: '16px',
                  fontWeight: 100,
                }}
              >
                {text1}
                <br />
                {text2} {app_name}.
                <br />
                {text3}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center' }}>
                <a
                  href={url}
                  style={{
                    display: 'inline-block',
                    padding: '20px',
                    background: '#00838f',
                    textDecoration: 'none',
                    color: '#ffffff',
                  }}
                >
                  {actionTitle}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/mail/mail-templates/confirm-new-email.tsx
git commit -m "feat(api): add confirm-new-email React template"
```

---

### Task 5: Update MailService + clean up

**Files:**
- Modify: `apps/api/src/mail/mail.service.ts`
- Delete: `apps/api/src/mail/mail-templates/activation.hbs`
- Delete: `apps/api/src/mail/mail-templates/reset-password.hbs`
- Delete: `apps/api/src/mail/mail-templates/confirm-new-email.hbs`

- [ ] **Step 1: Rewrite mail.service.ts**

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';
import { MaybeType } from '../utils/types/maybe.type';
import { AllConfigType } from '../config/config.type';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import * as React from 'react';
import { ActivationEmail } from './mail-templates/activation';
import { ResetPasswordEmail } from './mail-templates/reset-password';
import { ConfirmNewEmail } from './mail-templates/confirm-new-email';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.transporter = nodemailer.createTransport({
      host: configService.get('mail.host', { infer: true }),
      port: configService.get('mail.port', { infer: true }),
      ignoreTLS: configService.get('mail.ignoreTLS', { infer: true }),
      secure: configService.get('mail.secure', { infer: true }),
      requireTLS: configService.get('mail.requireTLS', { infer: true }),
      auth: {
        user: configService.get('mail.user', { infer: true }),
        pass: configService.get('mail.password', { infer: true }),
      },
    });
  }

  private async sendMail({
    template,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    template: React.ReactElement;
  }): Promise<void> {
    const html = await render(template);

    await this.transporter.sendMail({
      ...mailOptions,
      from: mailOptions.from
        ? mailOptions.from
        : `"${this.configService.get('mail.defaultName', { infer: true })}" <${this.configService.get('mail.defaultEmail', { infer: true })}>`,
      html,
    });
  }

  async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-email.text1'),
        i18n.t('confirm-email.text2'),
        i18n.t('confirm-email.text3'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', { infer: true }) +
        '/confirm-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      template: React.createElement(ActivationEmail, {
        title: emailConfirmTitle ?? '',
        url: url.toString(),
        actionTitle: emailConfirmTitle ?? '',
        app_name: this.configService.get('app.name', { infer: true }) ?? '',
        text1: text1 ?? '',
        text2: text2 ?? '',
        text3: text3 ?? '',
      }),
    });
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let resetPasswordTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.resetPassword'),
        i18n.t('reset-password.text1'),
        i18n.t('reset-password.text2'),
        i18n.t('reset-password.text3'),
        i18n.t('reset-password.text4'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', { infer: true }) +
        '/password-change',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    await this.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle,
      text: `${url.toString()} ${resetPasswordTitle}`,
      template: React.createElement(ResetPasswordEmail, {
        title: resetPasswordTitle ?? '',
        url: url.toString(),
        actionTitle: resetPasswordTitle ?? '',
        app_name: this.configService.get('app.name', { infer: true }) ?? '',
        text1: text1 ?? '',
        text2: text2 ?? '',
        text3: text3 ?? '',
        text4: text4 ?? '',
      }),
    });
  }

  async confirmNewEmail(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-new-email.text1'),
        i18n.t('confirm-new-email.text2'),
        i18n.t('confirm-new-email.text3'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', { infer: true }) +
        '/confirm-new-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      template: React.createElement(ConfirmNewEmail, {
        title: emailConfirmTitle ?? '',
        url: url.toString(),
        actionTitle: emailConfirmTitle ?? '',
        app_name: this.configService.get('app.name', { infer: true }) ?? '',
        text1: text1 ?? '',
        text2: text2 ?? '',
        text3: text3 ?? '',
      }),
    });
  }
}
```

- [ ] **Step 2: Enable JSX in tsconfig**

Open `apps/api/tsconfig.json` and add `"jsx": "react"` under `compilerOptions`:

```json
{
  "compilerOptions": {
    "jsx": "react"
  }
}
```

- [ ] **Step 3: Delete .hbs files**

```bash
rm apps/api/src/mail/mail-templates/activation.hbs
rm apps/api/src/mail/mail-templates/reset-password.hbs
rm apps/api/src/mail/mail-templates/confirm-new-email.hbs
```

- [ ] **Step 4: Build**

```bash
cd apps/api && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: No output.

- [ ] **Step 5: Remove handlebars package**

```bash
cd apps/api && pnpm remove handlebars
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/mail/ apps/api/tsconfig.json apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): replace Handlebars templates with react-email components"
```
