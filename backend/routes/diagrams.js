const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/diagrams');

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const model = req.body.id_escooter || 'diagram';
    cb(null, `model_${model}_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage: storage });

// GET diagram by escooter ID
router.get('/', auth, async (req, res) => {
  const { id_escooter } = req.query;
  if (!id_escooter) return res.status(400).json({ message: 'id_escooter required' });

  try {
    const [diagrams] = await db.query('SELECT * FROM diagram WHERE id_escooter = ?', [id_escooter]);
    if (diagrams.length > 0) {
      res.json(diagrams[0]);
    } else {
      res.json(null); // No diagram yet
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST upload new diagram for an escooter
router.post('/', auth, upload.single('diagram_picture'), async (req, res) => {
  const { id_escooter } = req.body;
  if (!id_escooter) return res.status(400).json({ message: 'id_escooter required' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    // Check if one already exists and delete the old one
    const [existing] = await db.query('SELECT * FROM diagram WHERE id_escooter = ?', [id_escooter]);
    if (existing.length > 0) {
      const oldPath = path.join(uploadDir, existing[0].diagram_picture);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      
      await db.query('UPDATE diagram SET diagram_picture = ? WHERE id_escooter = ?', [req.file.filename, id_escooter]);
      res.json({ message: 'Diagram updated', id: existing[0].id, diagram_picture: req.file.filename });
    } else {
      const [result] = await db.query('INSERT INTO diagram (id_escooter, diagram_picture) VALUES (?, ?)', [id_escooter, req.file.filename]);
      res.status(201).json({ message: 'Diagram created', id: result.insertId, diagram_picture: req.file.filename });
    }
  } catch (error) {
    console.error(error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET mapped parts for a diagram
router.get('/:id/parts', auth, async (req, res) => {
  const diagramId = req.params.id;
  try {
    const [parts] = await db.query(`
      SELECT l.diagram_number, p.id as id_part, p.sku, p.description, p.status 
      FROM list_diagram l
      JOIN parts p ON l.id_part = p.id
      WHERE l.id_diagram = ?
      ORDER BY CAST(l.diagram_number AS UNSIGNED) ASC, l.diagram_number ASC
    `, [diagramId]);
    res.json(parts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST map part to diagram
router.post('/:id/parts', auth, async (req, res) => {
  const id_diagram = req.params.id;
  const { id_part, diagram_number } = req.body;
  
  if (!id_part || !diagram_number) return res.status(400).json({ message: 'id_part and diagram_number required' });

  try {
    // Upsert or insert logic - composite primary key (id_part, id_diagram) means a part can only be on a diagram once.
    await db.query(`
      INSERT INTO list_diagram (id_part, id_diagram, diagram_number) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE diagram_number = ?
    `, [id_part, id_diagram, diagram_number, diagram_number]);
    res.json({ message: 'Part mapped successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE mapped part
router.delete('/:id_diagram/parts/:id_part', auth, async (req, res) => {
  const { id_diagram, id_part } = req.params;
  try {
    await db.query('DELETE FROM list_diagram WHERE id_diagram = ? AND id_part = ?', [id_diagram, id_part]);
    res.json({ message: 'Part unmapped' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
