'use client';

import FacebookAuth from './facebook/facebook-auth';
import { isFacebookAuthEnabled } from './facebook/facebook-config';
import GoogleAuth from './google/google-auth';
import { isGoogleAuthEnabled } from './google/google-config';

export default function SocialAuth() {
  return (
    <div className="flex flex-col gap-2">
      {isGoogleAuthEnabled && (
        <div>
          <GoogleAuth />
        </div>
      )}
      {isFacebookAuthEnabled && (
        <div>
          <FacebookAuth />
        </div>
      )}
    </div>
  );
}
