// src/app/api/v1/estimates/route.js
import { NextResponse } from 'next/server';
import { verifyAuthHeader } from '../../../lib/mockData';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    if (!verifyAuthHeader(req)) {
        return NextResponse.json({ error: "Unauthorized Secure Core Access Instance" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type, distance_value, distance_unit, vehicle_make, vehicle_model, passengers, legs, weight_value, weight_unit } = body;

        if (!type) {
            return NextResponse.json({ error: "Missing classification tracking type parameter node." }, { status: 400 });
        }

        let calculatedDistanceKm = 0;
        let displayMetricsSummary = "";

        // 1. VEHICLE TYPE FORMULATION RULE
        if (type === 'vehicle') {
            if (!distance_value || !distance_unit) return NextResponse.json({ error: "Missing distance parameters." }, { status: 400 });
            calculatedDistanceKm = distance_unit === 'mi' ? Number(distance_value) * 1.60934 : Number(distance_value);
            displayMetricsSummary = `Custom Fleet Car (${vehicle_make || 'Vehicle'} ${vehicle_model || ''})`;
        }
        // 2. SHIPPING TYPE FORMULATION RULE
        else if (type === 'shipping') {
            if (!distance_value || !distance_unit || !weight_value) return NextResponse.json({ error: "Missing shipping bounds payload parameters." }, { status: 400 });
            calculatedDistanceKm = distance_unit === 'mi' ? Number(distance_value) * 1.60934 : Number(distance_value);
            displayMetricsSummary = `Cargo Freight Run (${weight_value} ${weight_unit || 'kg'} Voyage)`;
        }
        // 3. FLIGHT AVIATION TYPE FORMULATION RULE (Graceful fallback maps static flight sector lengths)
        else if (type === 'flight') {
            if (!legs || legs.length === 0) return NextResponse.json({ error: "Missing aviation route legs parameters arrays." }, { status: 400 });
            const originCode = legs[0].departure_airport || 'JNB';
            const destinationCode = legs[0].destination_airport || 'CPT';

            // Standardise domestic logistics benchmark lines (JNB -> DUR approx 500km, JNB -> CPT approx 1300km)
            calculatedDistanceKm = originCode === 'JNB' && destinationCode === 'DUR' ? 500 : 1270;
            displayMetricsSummary = `Flight Manifest Sector (${originCode} ➔ ${destinationCode} • ${passengers || 1} Pax)`;
        }

        // Execute central mathematical tracking equations using static indicators multiplier constants
        const baseCarbonFactor = type === 'shipping' ? 0.12 : type === 'flight' ? 0.15 : 0.23;
        const passengerMultiplier = type === 'flight' ? Number(passengers || 1) : 1;
        const cargoWeightMultiplier = type === 'shipping' ? (weight_unit === 'lb' ? Number(weight_value) * 0.453592 / 1000 : Number(weight_value) / 1000) : 1;

        const carbon_kg = parseFloat((calculatedDistanceKm * baseCarbonFactor * passengerMultiplier * (type === 'shipping' ? cargoWeightMultiplier : 1)).toFixed(2));
        const carbon_g = Math.round(carbon_kg * 1000);
        const carbon_lb = parseFloat((carbon_kg * 2.20462).toFixed(2));
        const carbon_mt = parseFloat((carbon_kg / 1000).toFixed(5));

        return NextResponse.json({
            data: {
                id: `est_run_${Math.random().toString(36).substring(2, 11)}`,
                type: "estimate",
                attributes: {
                    category_display: displayMetricsSummary,
                    distance_value: Number(distance_value || calculatedDistanceKm),
                    distance_unit: distance_unit || 'km',
                    vehicle_make: vehicle_make || null,
                    vehicle_model: vehicle_model || null,
                    airport_origin: type === 'flight' ? legs[0].departure_airport : null,
                    airport_destination: type === 'flight' ? legs[0].destination_airport : null,
                    passengers: type === 'flight' ? Number(passengers) : null,
                    weight_value: type === 'shipping' ? Number(weight_value) : null,
                    weight_unit: type === 'shipping' ? weight_unit : null,
                    carbon_g,
                    carbon_lb,
                    carbon_kg,
                    carbon_mt,
                    estimated_at: new Date().toISOString()
                }
            }
        }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ error: "Malbuilt JSON payload layout tokens structure parameters." }, { status: 400 });
    }
}
