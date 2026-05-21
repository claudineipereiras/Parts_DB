const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const path = require('path');

// Routes
app.use('/api/auth', authRoutes);
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);
const optionsRoutes = require('./routes/options');
app.use('/api/options', optionsRoutes);
const partsRoutes = require('./routes/parts');
app.use('/api/parts', partsRoutes);
const escootersRoutes = require('./routes/escooters');
app.use('/api/escooters', escootersRoutes);
const brandsRoutes = require('./routes/brands');
app.use('/api/brands', brandsRoutes);
const diagramsRoutes = require('./routes/diagrams');
app.use('/api/diagrams', diagramsRoutes);

// Static Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.send('Escooter Parts DB API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
