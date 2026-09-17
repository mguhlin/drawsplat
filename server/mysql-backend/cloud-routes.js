const { isValidRoomKey, safeString } = require('./security');
function attachCloudRoutes(app, pool, { basePath, auth, checkBoardSafety }) {
  const route = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
  app.use(basePath + '/boards', auth.requirePermission('board.write'));
  app.get(basePath + '/boards', route(async (req, res) => {
    const [boards] = await pool.execute('SELECT board_key AS boardKey, title, revision, updated_at AS updatedAt FROM cloud_boards WHERE user_id = ? ORDER BY updated_at DESC LIMIT 200', [req.dsUser.id]);
    res.json({ ok: true, boards });
  }));
  app.get(basePath + '/boards/:key', route(async (req, res) => {
    const [rows] = await pool.execute('SELECT board_json AS board, revision, updated_at AS updatedAt FROM cloud_boards WHERE user_id = ? AND board_key = ?', [req.dsUser.id, req.params.key]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Board not found in your account.' });
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, ...rows[0] });
  }));
  app.put(basePath + '/boards/:key', route(async (req, res) => {
    const { board, revision } = req.body;
    if (!isValidRoomKey(req.params.key) || !board || !Array.isArray(board.panels) || !board.panels.length || !Number.isSafeInteger(revision) || revision < 0) {
      return res.status(400).json({ ok: false, error: 'A valid board and its revision are required.' });
    }
    const json = JSON.stringify(board);
    if (Buffer.byteLength(json) > Number(process.env.MAX_BOARD_JSON_BYTES || 20 * 1024 * 1024)) return res.status(413).json({ ok: false, error: 'This board is too large for online saving. Download a board file instead.' });
    const [configs] = await pool.query("SELECT config_json FROM compliance_config WHERE config_key = 'main' LIMIT 1");
    const safety = checkBoardSafety(board, configs[0]?.config_json || {});
    if (!safety.ok) return res.status(422).json({ ok: false, error: 'School content rules blocked this save. Download your board file and ask your teacher or administrator.' });
    const values = [safeString(board.title, 200), json, req.dsUser.id, req.params.key];
    if (revision === 0) {
      try { await pool.execute('INSERT INTO cloud_boards (title, board_json, user_id, board_key) VALUES (?, ?, ?, ?)', values); }
      catch (err) { if (err.code !== 'ER_DUP_ENTRY') throw err; return res.status(409).json({ ok: false, error: 'A saved copy already exists. Download your current work, then open the online copy.' }); }
    } else {
      const [result] = await pool.execute('UPDATE cloud_boards SET title = ?, board_json = ?, revision = revision + 1 WHERE user_id = ? AND board_key = ? AND revision = ?', [...values, revision]);
      if (!result.affectedRows) return res.status(409).json({ ok: false, error: 'The online copy changed on another device. Download your current work, then open the online copy.' });
    }
    res.json({ ok: true, boardKey: req.params.key, revision: revision + 1 });
  }));
  app.delete(basePath + '/boards/:key', route(async (req, res) => {
    await pool.execute('DELETE FROM cloud_boards WHERE user_id = ? AND board_key = ?', [req.dsUser.id, req.params.key]);
    res.json({ ok: true });
  }));
}
module.exports = { attachCloudRoutes };
