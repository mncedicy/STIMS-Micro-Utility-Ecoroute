// /src/app/sitemap.js

export default async function sitemap() {
    const baseDomainUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ecoroute.stims.co.za';

    // Define static product marketing page endpoints route matrix maps
    const staticRoutes = [
        {
            url: baseDomainUrl,
            lastModified: new Date().toISOString(),
            changeFrequency: 'daily',
            priority: 1.0, // Tells Google Search that your homepage is the absolute priority node
        },
        {
            url: `${baseDomainUrl}/legal`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseDomainUrl}/privacy`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    return [...staticRoutes];
}
