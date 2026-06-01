const { PORT } = require("./config");
const { readJsonBody, sendJson } = require("./http");
const { getLanAddresses } = require("./network");
const { asArray, loadState, mergeById, saveState } = require("./state");

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      port: PORT,
      addresses: getLanAddresses(),
      updatedAt: loadState().updatedAt
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    sendJson(res, 200, { ok: true, state: loadState() });
    return;
  }

  const state = loadState();

  const noteMatch = url.pathname.match(/^\/api\/notes\/([^/]+)$/);
  if (req.method === "DELETE" && noteMatch) {
    const id = decodeURIComponent(noteMatch[1]);
    state.notes = state.notes.filter((note) => note.id !== id);
    sendJson(res, 200, { ok: true, state: saveState(state, "delete-note") });
    return;
  }

  const fontMatch = url.pathname.match(/^\/api\/fonts\/([^/]+)$/);
  if (req.method === "DELETE" && fontMatch) {
    const id = decodeURIComponent(fontMatch[1]);
    state.fonts = state.fonts.filter((font) => font.id !== id);
    sendJson(res, 200, { ok: true, state: saveState(state, "delete-font") });
    return;
  }

  const body = await readJsonBody(req);

  if (req.method === "PUT" && url.pathname === "/api/state") {
    sendJson(res, 200, { ok: true, state: saveState(body.state || body, body.source || "put-state") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/notes") {
    state.notes = body.replace ? asArray(body.notes) : mergeById(state.notes, body.notes || []);
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "notes") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/settings") {
    state.settings = body.settings && typeof body.settings === "object" ? body.settings : {};
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "settings") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/fonts") {
    state.fonts = body.replace ? asArray(body.fonts) : mergeById(state.fonts, body.fonts || []);
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "fonts") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/reading-events") {
    state.readingEvents = state.readingEvents.concat(asArray(body.readingEvents));
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "reading-events") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/clear-notes") {
    state.notes = [];
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "clear-notes") });
    return;
  }

  sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
}

module.exports = {
  handleApi
};
