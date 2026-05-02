import test from "node:test";
import assert from "node:assert/strict";
import { computeTotalCents } from "./pricing.js";

test("computeTotalCents: exact full hours", () => {
  const a = new Date("2026-06-01T10:00:00.000Z");
  const b = new Date("2026-06-01T13:00:00.000Z");
  assert.equal(computeTotalCents(a, b, 1000), 3000);
});

test("computeTotalCents: partial hour rounds up", () => {
  const a = new Date("2026-06-01T10:00:00.000Z");
  const b = new Date("2026-06-01T10:30:00.000Z");
  assert.equal(computeTotalCents(a, b, 1000), 1000);
});

test("computeTotalCents: zero for negative or zero duration edge", () => {
  const t = new Date("2026-06-01T10:00:00.000Z");
  assert.equal(computeTotalCents(t, t, 100), 0);
});

test("computeTotalCents: multiple hours ceil", () => {
  const a = new Date("2026-06-01T10:00:00.000Z");
  const b = new Date("2026-06-01T11:01:00.000Z");
  assert.equal(computeTotalCents(a, b, 500), 1000);
});
