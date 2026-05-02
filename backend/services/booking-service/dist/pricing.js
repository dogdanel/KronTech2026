"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTotalCents = computeTotalCents;
function computeTotalCents(startAt, endAt, pricePerHourCents) {
    const ms = endAt.getTime() - startAt.getTime();
    const hours = Math.ceil(ms / (1000 * 60 * 60));
    return Math.max(0, hours * pricePerHourCents);
}
