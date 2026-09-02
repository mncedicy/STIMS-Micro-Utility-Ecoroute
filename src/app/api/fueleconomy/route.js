import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
        return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    try {
        const fueleconomyUrl = `https://www.fueleconomy.gov/ws/rest/${endpoint}`;
        const res = await fetch(fueleconomyUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`FuelEconomy upstream error ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error('[FuelEconomy Proxy Error]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}