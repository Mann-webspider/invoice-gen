import React, { useState } from 'react';
import { Product, InvoiceItem, ProductSection } from '../../lib/types';

interface ProductTableProps {
  sections: ProductSection[];
  products: Product[];
  onAddItem: (sectionId: string, item: InvoiceItem) => void;
  onUpdateItem: (sectionId: string, itemId: string, updates: Partial<InvoiceItem>) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onAddSection: (title: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  sections,
  products,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddSection
}) => {
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const handleAddItem = (sectionId: string) => {
    if (products.length === 0) return;
    
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product: products[0],
      quantity: 1,
      unitType: 'Boxes',
      totalSQM: products[0].sqmPerBox,
      totalFOB: products[0].price
    };
    onAddItem(sectionId, newItem);
  };

  const handleQuantityChange = (sectionId: string, itemId: string, quantity: number, product: Product) => {
    const totalSQM = quantity * product.sqmPerBox;
    const totalFOB = quantity * product.price;
    onUpdateItem(sectionId, itemId, { quantity, totalSQM, totalFOB });
  };

  const handleProductChange = (sectionId: string, itemId: string, product: Product) => {
    onUpdateItem(sectionId, itemId, { 
      product,
      totalSQM: product.sqmPerBox,
      totalFOB: product.price
    });
  };

  return (
    <div className="product-sections">
      {sections.map((section) => (
        <div key={section.id} className="product-section">
          <h3>{section.title}</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>HSN Code</th>
                <th>Size</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Total SQM</th>
                <th>Price</th>
                <th>Total FOB</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <select
                      value={item.product.id}
                      onChange={(e) => {
                        const product = products.find(p => p.id === e.target.value);
                        if (product) handleProductChange(section.id, item.id, product);
                      }}
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.description}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{item.product.hsnCode}</td>
                  <td>{item.product.size}</td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => 
                        handleQuantityChange(section.id, item.id, parseInt(e.target.value), item.product)
                      }
                    />
                  </td>
                  <td>{item.unitType}</td>
                  <td>{item.totalSQM.toFixed(2)}</td>
                  <td>{item.product.price.toFixed(2)}</td>
                  <td>{item.totalFOB.toFixed(2)}</td>
                  <td>
                    <button onClick={() => onRemoveItem(section.id, item.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => handleAddItem(section.id)}>Add Item</button>
        </div>
      ))}

      <div className="add-section">
        <input
          type="text"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="New section title"
        />
        <button 
          onClick={() => {
            if (newSectionTitle.trim()) {
              onAddSection(newSectionTitle);
              setNewSectionTitle('');
            }
          }}
        >
          Add Section
        </button>
      </div>
    </div>
  );
};

export default ProductTable;
