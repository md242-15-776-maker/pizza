const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const MenuItem = require('./models/MenuItem');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Seed initial 7 dishes once if database has never been initialized
const initialMenu = [
  { category: "pizza", image: "images/marg.jpg", name: "Margherita", description: "Tomato, mozzarella, fresh basil.", price: "$22", isSignature: true, badge: "POPULAR" },
  { category: "pizza", image: "images/sau.jpg", name: "Italian Sausage", description: "Sausage, rocket, shaved cheese.", price: "$26", isSignature: true, badge: "FRESH ROCKET" },
  { category: "pizza", image: "images/dess.jpg", name: "D’Essere", description: "Signature wood fired pizza.", price: "$28", isSignature: false, badge: "" },
  { category: "pasta", image: "images/sea.jpg", name: "Seafood Spaghetti", description: "Mussels, prawns, calamari.", price: "$32", isSignature: true, badge: "" },
  { category: "pasta", image: "images/spin.jpg", name: "Spinach & Ricotta", description: "Baked with tomato and parmesan.", price: "$24", isSignature: false, badge: "" },
  { category: "starter", image: "images/cal.jpg", name: "Calamari", description: "Crisp, with greens and aioli.", price: "$19", isSignature: true, badge: "" },
  { category: "sweet", image: "images/chee.jpg", name: "White Chocolate Cheesecake", description: "With berry sauce and ice cream.", price: "$16", isSignature: true, badge: "" }
];

mongoose.connection.once('open', async () => {
  const count = await MenuItem.countDocuments();
  if (count === 0) {
    await MenuItem.insertMany(initialMenu);
    console.log('Added initial 7 dishes to MongoDB!');
  }

  // Paste this part right below line 39:
  const sigCount = await MenuItem.countDocuments({ isSignature: true });
  if (sigCount === 0) {
    await MenuItem.updateOne({ name: "Margherita" }, { isSignature: true, badge: "POPULAR" });
    await MenuItem.updateOne({ name: "Italian Sausage" }, { isSignature: true, badge: "FRESH ROCKET" });
    await MenuItem.updateOne({ name: "Seafood Spaghetti" }, { isSignature: true, badge: "" });
    await MenuItem.updateOne({ name: "White Chocolate Cheesecake" }, { isSignature: true, badge: "" });
    await MenuItem.updateOne({ name: "Calamari" }, { isSignature: true, badge: "" });
    console.log('Marked 5 default signature dishes!');
  }
});
// 1. Get all menu items (Customer + Admin use this)
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Add a new menu item (Admin dashboard uses this)
app.post('/api/menu', async (req, res) => {
  try {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: 'Invalid dish data' });
  }
});

// 3. Delete a menu item (Admin dashboard uses this)
app.delete('/api/menu/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// 4. Update a menu item (Toggle Signature status or edit details)
app.put('/api/menu/:id', async (req, res) => {
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Update failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});