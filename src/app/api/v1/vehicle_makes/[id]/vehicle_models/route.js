// src/app/api/v1/vehicle_makes/[id]/vehicle_models/route.js
import { NextResponse } from 'next/server';
import { dummyModelsMap, verifyAuthHeader } from '../../../../../lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    if (!verifyAuthHeader(req)) {
        return NextResponse.json({ error: "Unauthorized Secure Core Access Instance" }, { status: 401 });
    }

    const resolvedParams = await params;
    const makeId = resolvedParams.id;
    const modelsList = dummyModelsMap[makeId] || [];

    const payload = modelsList.map((modelName, index) => ({
        data: {
            id: `mod_${makeId}_${index}`,
            type: "vehicle_model",
            attributes: { name: modelName, year: 2026, vehicle_make: makeId }
        }
    }));

    return NextResponse.json(payload, { status: 200 });
}
