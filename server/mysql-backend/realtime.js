/**
 * DrawSplatTM realtime — minimal SSE fan-out for the MySQL backend.
 *
 * Two channel families are exposed:
 *   - user:<userId>   — session-lock + per-user notifications (time limits, freeze)
 *   - board:<roomKey> — board.updated, board.frozen, board.unfrozen broadcasts
 *
 * The client subscribes to whichever channels its session has rights to
 * (decided by the route, not this module).
 *
 * This is in-process only; for multi-instance deployments swap the subscriber
 * map for Redis pub/sub. The endpoint shape stays the same.
 */

const { isValidRoomKey } = require('./security');

const channels = new Map();

function add(channel, res) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(res);
  res.on('close', () => {
    const set = channels.get(channel);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) channels.delete(channel);
  });
}

function attach(app, basePath, auth) {
  app.get(basePath + '/events', auth.requirePermission('realtime.subscribe'), (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();
    res.write('retry: 5000\n\n');

    const userChannel = `user:${req.dsUser.id}`;
    add(userChannel, res);

    const boardKeys = String(req.query.boards || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(isValidRoomKey)
      .slice(0, 25);
    for (const roomKey of boardKeys) add(`board:${roomKey}`, res);

    const heartbeat = setInterval(() => {
      try { res.write(`: heartbeat ${Date.now()}\n\n`); } catch (e) {}
    }, 25000);
    res.on('close', () => clearInterval(heartbeat));

    res.write(`event: hello\ndata: ${JSON.stringify({ ok: true, userId: req.dsUser.id, channels: [userChannel].concat(boardKeys.map(k => `board:${k}`)) })}\n\n`);
  });
}

function publish(channel, eventName, data) {
  const set = channels.get(channel);
  if (!set || set.size === 0) return 0;
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data || {})}\n\n`;
  let sent = 0;
  for (const res of set) {
    try { res.write(payload); sent++; } catch (e) {}
  }
  return sent;
}

function publishUser(userId, eventName, data) { return publish(`user:${userId}`, eventName, data); }
function publishBoard(roomKey, eventName, data) { return publish(`board:${roomKey}`, eventName, data); }

module.exports = { attach, publish, publishUser, publishBoard };
