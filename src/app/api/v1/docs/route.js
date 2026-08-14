// src/app/api/v1/docs/route.js

import { NextResponse } from 'next/server';
import { ALLOWED_ORIGINS } from '../config/apiConfig';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const origin = req.headers.get('origin');
    const corsHeaders = {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'http://localhost:3000',
        'Content-Type': 'application/json'
    };

    const openApiSpec = {
        openapi: '3.0.3',
        info: {
            title: 'EcoRoute Enterprise Telemetry & Carbon Accounting API',
            version: '1.0.0',
            description: 'Programmatic REST tunnel for fleet asset management, real-time emissions calculation, and SARS compliance carbon tax reporting in South Africa.'
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Local development / Production Tunnel'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    description: 'Corporate API Token (format: ecoroute_live_...)'
                }
            },
            schemas: {
                EmissionLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        vehicle_id: { type: 'string', format: 'uuid', nullable: true },
                        category_display: { type: 'string', example: 'VEHICLE' },
                        distance_km: { type: 'number', example: 310.2 },
                        carbon_kg: { type: 'number', example: 71.346 },
                        cost_center: { type: 'string', example: 'Logistics-Midrand' },
                        emission_date: { type: 'string', format: 'date', example: '2026-07-20' }
                    }
                },
                Vehicle: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        make: { type: 'string', example: 'Toyota' },
                        model: { type: 'string', example: 'Hilux 2.4' },
                        year: { type: 'integer', example: 2022 },
                        registration_number: { type: 'string', example: 'CA 998-443' },
                        carbon_multiplier: { type: 'number', example: 0.195 }
                    }
                }
            }
        },
        security: [{ BearerAuth: [] }],
        paths: {
            '/history': {
                get: {
                    summary: 'List historical emission log entries',
                    parameters: [
                        { name: 'start_date', in: 'query', schema: { type: 'string', format: 'date' } },
                        { name: 'end_date', in: 'query', schema: { type: 'string', format: 'date' } },
                        { name: 'type', in: 'query', schema: { type: 'string', example: 'VEHICLE' } },
                        { name: 'vehicle_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
                    ],
                    responses: {
                        200: { description: 'Successful records array retrieval' },
                        401: { description: 'Missing or malformed Authorization header' },
                        429: { description: 'Rate limit or monthly quota exhaustion' }
                    }
                }
            },
            '/vehicles': {
                get: {
                    summary: 'Retrieve active fleet vehicle roster',
                    responses: {
                        200: { description: 'Active vehicle list returned' }
                    }
                }
            },
            '/vehicles/add': {
                post: {
                    summary: 'Register new vehicle asset (Enforces 1-car free tier rule)',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['registration', 'make', 'model', 'year'],
                                    properties: {
                                        registration: { type: 'string', example: 'GP 443-121' },
                                        make: { type: 'string', example: 'Ford' },
                                        model: { type: 'string', example: 'Ranger 2.0' },
                                        year: { type: 'integer', example: 2021 }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Vehicle registered successfully' },
                        403: { description: 'Plan limit reached (Free tier max 1 car)' }
                    }
                }
            },
            '/vehicles/disable': {
                post: {
                    summary: 'Soft-deactivate a vehicle asset node',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['vehicle_id'],
                                    properties: {
                                        vehicle_id: { type: 'string', format: 'uuid' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Vehicle successfully deactivated' }
                    }
                }
            }
        }
    };

    return new NextResponse(JSON.stringify(openApiSpec, null, 2), { status: 200, headers: corsHeaders });
}

export async function OPTIONS(req) {
    return new NextResponse(null, { status: 204 });
}
