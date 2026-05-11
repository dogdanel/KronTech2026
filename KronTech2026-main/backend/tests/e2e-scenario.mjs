
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function jfetch(path, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(
      `${method} ${path} -> ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function futureRange() {
  const startMs = Date.now() + 1000 * 60 * 60 * 48;
  const start = new Date(startMs);
  const end = new Date(startMs + 2 * 60 * 60 * 1000);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}


function nonOverlappingFutureRange() {
  const startMs = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const start = new Date(startMs);
  const end = new Date(startMs + 2 * 60 * 60 * 1000);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

function rangeThatOverlaps(confirmed) {
  const s = new Date(confirmed.startAt);
  const mid = new Date(s.getTime() + 30 * 60 * 1000);
  return {
    startAt: new Date(s.getTime() - 10 * 60 * 1000).toISOString(),
    endAt: mid.toISOString(),
  };
}

async function step(name, fn) {
  process.stdout.write(`- ${name}... `);
  try {
    await fn();
    console.log("ok");
  } catch (e) {
    console.log("fail");
    throw e;
  }
}

async function main() {
  const suffix = uid();
  const hostEmail = `host-${suffix}@e2e.test`;
  const driverEmail = `driver-${suffix}@e2e.test`;
  const password = "e2e-test-pass";

  let hostToken;
  let driverToken;
  let spaceId;
  let bookingId;
  const range = futureRange();

  await step("GET /health", async () => {
    const h = await fetch(`${BASE}/health`);
    if (!h.ok) throw new Error(`health ${h.status}`);
    const j = await h.json();
    if (j.service !== "gateway") throw new Error("expected gateway health");
  });

  await step("register host", async () => {
    const r = await jfetch("/auth/register", {
      method: "POST",
      body: { email: hostEmail, password, displayName: "E2E Host", role: "host" },
    });
    if (!r.token || !r.user?.id) throw new Error("missing token");
    hostToken = r.token;
  });

  await step("register driver", async () => {
    const r = await jfetch("/auth/register", {
      method: "POST",
      body: { email: driverEmail, password, displayName: "E2E Driver", role: "driver" },
    });
    driverToken = r.token;
  });

  await step("host creates parking space", async () => {
    const r = await jfetch("/spaces", {
      method: "POST",
      token: hostToken,
      body: {
        title: `E2E spot ${suffix}`,
        address: "1 Test Lane",
        latitude: 44.4268,
        longitude: 26.1025,
        pricePerHourCents: 600,
        description: "covered e2e",
      },
    });
    spaceId = r.id;
    if (!spaceId) throw new Error("no space id");
  });

  await step("public list includes new space", async () => {
    const r = await jfetch("/spaces");
    if (!r.spaces?.some((s) => s.id === spaceId)) {
      throw new Error("new space not listed");
    }
  });

  await step("driver creates booking (confirmed)", async () => {
    const r = await jfetch("/bookings", {
      method: "POST",
      token: driverToken,
      body: { spaceId, startAt: range.startAt, endAt: range.endAt },
    });
    if (r.status !== "confirmed") throw new Error(`expected confirmed, got ${r.status}`);
    if (r.totalPriceCents == null) throw new Error("missing price");
    bookingId = r.id;
  });

  await step("driver list bookings (perspective=driver)", async () => {
    const r = await jfetch("/bookings?perspective=driver", { token: driverToken });
    if (!r.bookings?.some((b) => b.id === bookingId)) throw new Error("booking not in list");
  });

  await step("overlapping booking is rejected (409)", async () => {
    const ov = rangeThatOverlaps(range);
    try {
      await jfetch("/bookings", {
        method: "POST",
        token: driverToken,
        body: { spaceId, startAt: ov.startAt, endAt: ov.endAt },
      });
      throw new Error("expected 409");
    } catch (e) {
      if (e.status !== 409) throw e;
    }
  });

  await step("host cannot book own space (400)", async () => {
    const rOnly = nonOverlappingFutureRange();
    try {
      await jfetch("/bookings", {
        method: "POST",
        token: hostToken,
        body: { spaceId, startAt: rOnly.startAt, endAt: rOnly.endAt },
      });
      throw new Error("expected 400");
    } catch (e) {
      if (e.status !== 400) throw e;
    }
  });

  await step("driver cancels booking", async () => {
    const r = await jfetch(`/bookings/${bookingId}/cancel`, { method: "PATCH", token: driverToken });
    if (r.status !== "cancelled") throw new Error("expected cancelled");
  });

  await step("new booking after cancel succeeds (slot freed)", async () => {
    const r2 = futureRange();
    const r = await jfetch("/bookings", {
      method: "POST",
      token: driverToken,
      body: { spaceId, startAt: r2.startAt, endAt: r2.endAt },
    });
    if (r.status !== "confirmed") throw new Error("second booking not confirmed");
  });

  console.log("\nAll E2E scenario steps passed.");
}

main().catch((e) => {
  const code = e?.code ?? e?.cause?.code;
  if (code === "ECONNREFUSED") {
    console.error(
      "\nCould not connect to the gateway."
    );
  } else {
    console.error(e);
  }
  process.exit(1);
});
