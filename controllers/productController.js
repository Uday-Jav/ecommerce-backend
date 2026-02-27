const Product = require('../models/productModel');
const db = require('../database/db');

async function getAllProducts(req, res) {
  try {
    const products = await Product.getAllProducts();
    res.status(200).json({ data: products });
  } catch (error) {
    console.error('Error in getAllProducts controller:', error.message);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.getProductById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ data: product });
  } catch (error) {
    console.error('Error in getProductById controller:', error.message);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, price, description, category } = req.body;
    let imageFilename = "";

    if (req.file) {
      imageFilename = req.file.filename;
    } else {
      // fallback in case they still sent a text URL (or nothing)
      imageFilename = req.body.image || null;
    }

    if (!name || price == null) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const newProduct = await Product.createProduct({
      name,
      price,
      description,
      image: imageFilename,
      category,
    });

    // GENERATE BROADCAST NOTIFICATION
    db.run(
      `INSERT INTO notifications (user_id, message, type) VALUES ('all', 'New product "${name}" is now available!', 'new_product')`,
      [],
      (notifErr) => {
        if (notifErr) console.error("Notification creation failed:", notifErr);
      }
    );

    res.status(201).json({ data: newProduct });
  } catch (error) {
    console.error('Error in createProduct controller:', error.message);
    res.status(500).json({ message: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, price, description, image, category } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (!name || price == null) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const updated = await Product.updateProduct(id, {
      name,
      price,
      description,
      image,
      category,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error in updateProduct controller:', error.message);
    res.status(500).json({ message: 'Failed to update product' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const deleted = await Product.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct controller:', error.message);
    res.status(500).json({ message: 'Failed to delete product' });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

