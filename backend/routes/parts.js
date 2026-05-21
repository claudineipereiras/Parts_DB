const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');

// Ensure uploads dir exists
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const sku = req.body.sku || 'temp_' + Date.now();
    cb(null, sku + ext);
  }
});

const upload = multer({ storage: storage });

// GET all parts
router.get('/', auth, async (req, res) => {
  try {
    const { id_model } = req.query;
    let query = 'SELECT p.*, b.name as brand_name, e.model as escooter_model FROM parts p LEFT JOIN brand b ON p.id_make = b.id LEFT JOIN escooter e ON p.id_model = e.id';
    const params = [];
    
    if (id_model) {
      query += ' WHERE p.id_model = ?';
      params.push(id_model);
    }
    
    query += ' ORDER BY p.id DESC';
    
    const [parts] = await db.query(query, params);
    res.json(parts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new part
router.post('/', auth, upload.single('photo'), async (req, res) => {
  const { sku, description, id_make, id_model, status } = req.body;
  
  try {
    const [existing] = await db.query('SELECT * FROM parts WHERE sku = ?', [sku]);
    if (existing.length > 0) {
      // Clean up uploaded file if SKU already exists
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'SKU already exists' });
    }

    let photo_path = null;
    if (req.file) {
      photo_path = req.file.filename;
    }

    await db.query(
      'INSERT INTO parts (sku, description, id_make, id_model, photo_path, status) VALUES (?, ?, ?, ?, ?, ?)',
      [sku, description, id_make || null, id_model || null, photo_path, status || 'Active']
    );
    res.status(201).json({ message: 'Part created successfully' });
  } catch (error) {
    console.error(error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update part
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  const partId = req.params.id;
  const { sku, description, id_make, id_model, status } = req.body;

  try {
    const [existingPart] = await db.query('SELECT photo_path FROM parts WHERE id = ?', [partId]);
    if (existingPart.length === 0) return res.status(404).json({ message: 'Part not found' });

    let photo_path = existingPart[0].photo_path;

    if (req.file) {
      photo_path = req.file.filename;
      // Delete old photo if exists and it's different
      if (existingPart[0].photo_path && existingPart[0].photo_path !== photo_path) {
        const oldPath = path.join(uploadDir, existingPart[0].photo_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await db.query(
      'UPDATE parts SET sku = ?, description = ?, id_make = ?, id_model = ?, photo_path = ?, status = ? WHERE id = ?',
      [sku, description, id_make || null, id_model || null, photo_path, status || 'Active', partId]
    );

    res.json({ message: 'Part updated successfully' });
  } catch (error) {
    console.error(error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE part
router.delete('/:id', auth, async (req, res) => {
  const partId = req.params.id;
  try {
    const [existingPart] = await db.query('SELECT photo_path FROM parts WHERE id = ?', [partId]);
    if (existingPart.length === 0) return res.status(404).json({ message: 'Part not found' });

    await db.query('DELETE FROM parts WHERE id = ?', [partId]);

    // Delete photo
    if (existingPart[0].photo_path) {
        const oldPath = path.join(uploadDir, existingPart[0].photo_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    res.json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const csv = require('csv-parser');
const stream = require('stream');
const csvUpload = multer({ storage: multer.memoryStorage() });

// POST bulk parts
router.post('/bulk', auth, csvUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const results = [];
  const errors = [];
  
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);
  
  const [brands] = await db.query('SELECT id, name FROM brand');
  const [models] = await db.query('SELECT id, model, id_brand FROM escooter');

  bufferStream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      // Validate
      for (let i = 0; i < results.length; i++) {
        const row = results[i];
        const rowNum = i + 2; 
        
        if (!row.sku || !row.description) {
           errors.push(`Row ${rowNum}: SKU and description are required`);
           continue;
        }

        let id_make = null;
        if (row.make) {
           const b = brands.find(br => br.name.toLowerCase() === row.make.toLowerCase().trim());
           if (!b) errors.push(`Row ${rowNum}: Brand '${row.make}' not found`);
           else id_make = b.id;
        }

        let id_model = null;
        if (row.model) {
           const m = models.find(mo => mo.model.toLowerCase() === row.model.toLowerCase().trim());
           if (!m) errors.push(`Row ${rowNum}: Model '${row.model}' not found`);
           else id_model = m.id;
        }

        if (id_make && id_model) {
           const m = models.find(mo => mo.id === id_model);
           if (m && m.id_brand !== id_make) errors.push(`Row ${rowNum}: Model '${row.model}' does not belong to Brand '${row.make}'`);
        }
        
        row._processed = {
           sku: row.sku,
           description: row.description,
           id_make,
           id_model,
           status: row.status || 'Active'
        };
      }

      if (errors.length > 0) return res.status(400).json({ message: 'Validation failed', errors });

      const fileSkus = results.map(r => r._processed.sku);
      if (new Set(fileSkus).size !== fileSkus.length) {
         return res.status(400).json({ message: 'Validation failed', errors: ['Duplicate SKUs found within the CSV file'] });
      }

      if (fileSkus.length > 0) {
        const [existingParts] = await db.query('SELECT sku FROM parts WHERE sku IN (?)', [fileSkus]);
        if (existingParts.length > 0) {
           return res.status(400).json({ message: 'Validation failed', errors: existingParts.map(p => `SKU '${p.sku}' already exists`) });
        }
      } else {
        return res.status(400).json({ message: 'CSV is empty' });
      }

      try {
        const values = results.map(r => [r._processed.sku, r._processed.description, r._processed.id_make, r._processed.id_model, null, r._processed.status]);
        await db.query('INSERT INTO parts (sku, description, id_make, id_model, photo_path, status) VALUES ?', [values]);
        res.status(201).json({ message: `Successfully imported ${results.length} parts.` });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during insertion' });
      }
    });
});

module.exports = router;
