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
