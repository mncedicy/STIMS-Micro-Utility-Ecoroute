// src/app/docs/endpointsData.js

import { auditEndpoint } from './endpoints/audit';
import { managementEndpoints } from './endpoints/management';
import { lookupEndpoints } from './endpoints/lookups';

export const API_ENDPOINTS = [
    auditEndpoint,
    ...managementEndpoints,
    ...lookupEndpoints
];
