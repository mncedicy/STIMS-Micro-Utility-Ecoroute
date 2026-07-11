// src/app/lib/mockData.js
export const dummyMakes = [
    { id: "toyota", name: "Toyota" },
    { id: "ford", name: "Ford" },
    { id: "isuzu", name: "Isuzu" },
    { id: "vw", name: "Volkswagen" }
];

export const dummyModelsMap = {
    toyota: ["Hilux Bakkie", "Corolla", "Quantum Van", "Fortuner"],
    ford: ["Ranger Bakkie", "Transit Custom", "Everest"],
    isuzu: ["D-Max Bakkie", "N-Series Truck"],
    vw: ["Caddy Cargo", "Crafter Van", "Polo Vivo"]
};

// Helper middleware verification logic block
export function verifyAuthHeader(req) {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return false;
    }
    return true;
}
