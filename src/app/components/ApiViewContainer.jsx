// /src/app/components/ApiViewContainer.jsx
'use client';

import React from 'react';
import CorporateApiPanel from './CorporateApiPanel';

export default function ApiViewContainer({ user, isPremium }) {
    return (
        <CorporateApiPanel
            user={user}
            isPremium={isPremium}
        />
    );
}
