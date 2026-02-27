const db = require('../database/db');

function getAllProducts() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM products';

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching all products:', err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

function getProductById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM products WHERE id = ?';

    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('Error fetching product by id:', err.message);
        return reject(err);
      }
      resolve(row || null);
    });
  });
}

function createProduct({ name, price, description, image, category }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO products (name, price, description, image, category)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [name, price, description ?? null, image ?? null, category ?? null];

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error creating product:', err.message);
        return reject(err);
      }

      resolve({
        id: this.lastID,
        name,
        price,
        description: description ?? null,
        image: image ?? null,
        category: category ?? null,
      });
    });
  });
}

function updateProduct(id, { name, price, description, image, category }) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE products
      SET name = ?, price = ?, description = ?, image = ?, category = ?
      WHERE id = ?
    `;

    const params = [name, price, description ?? null, image ?? null, category ?? null, id];

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error updating product:', err.message);
        return reject(err);
      }

      resolve(this.changes > 0);
    });
  });
}

function deleteProduct(id) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM products WHERE id = ?';

    db.run(sql, [id], function (err) {
      if (err) {
        console.error('Error deleting product:', err.message);
        return reject(err);
      }

      resolve(this.changes > 0);
    });
  });
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

