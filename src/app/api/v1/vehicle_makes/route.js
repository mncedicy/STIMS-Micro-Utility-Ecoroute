// src/app/api/v1/vehicle_makes/route.js
import { NextResponse } from 'next/server';
import { dummyMakes, dummyModelsMap, verifyAuthHeader } from '../../../lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    if (!verifyAuthHeader(req)) {
        return NextResponse.json({ error: "Unauthorized Secure Core Access Instance" }, { status: 401 });
    }

    const payload = dummyMakes.map(m => ({
        data: {
            id: m.id,
            type: "vehicle_make",
            attributes: { name: m.name, number_of_models: dummyModelsMap[m.id]?.length || 0 }
        }
    }));

    return NextResponse.json(payload, { status: 200 });
}
