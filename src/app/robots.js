// src/app/robots.js

export default function robots() {
    const baseDomainUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ecoroute.stims.co.za';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',      // Blocks backend routes from showing up on public search results pages
                '/*?token=',  // Blocks secure login token links
                '/*?userId=',  // Prevents user tracking hashes from being index cached
                '/downloads/'
            ],
        },
        sitemap: `${baseDomainUrl}/sitemap.xml`,
    };
}
