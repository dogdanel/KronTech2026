"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSpaceById = fetchSpaceById;
async function fetchSpaceById(spaceId) {
    const base = process.env.PARKING_SERVICE_URL;
    const secret = process.env.INTERNAL_SECRET;
    if (!base || !secret)
        throw new Error("PARKING_SERVICE_URL and INTERNAL_SECRET required");
    const res = await fetch(`${base}/internal/spaces/${spaceId}`, {
        headers: { "x-internal-secret": secret },
    });
    if (res.status === 404)
        return null;
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`parking-service error: ${res.status} ${text}`);
    }
    return (await res.json());
}
