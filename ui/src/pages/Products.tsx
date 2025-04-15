
import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { getProducts, saveProduct, deleteProduct } from "@/lib/dataService";
import { Product } from "@/lib/types";
import { toast } from "sonner";
import { Plus, MoreVertical, Pencil, Trash, Package } from "lucide-react";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product>({
    marksAndNos: "",
    description: "",
    hsnCode: "",
    size: "",
    price: 0,
    sqmPerBox: 0,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const storedProducts = getProducts();
    setProducts(storedProducts);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({ 
      ...prev, 
      [name]: name === "price" || name === "sqmPerBox" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProduct(currentProduct);
    loadProducts();
    resetForm();
    setIsDialogOpen(false);
    toast.success(
      isEditing ? "Product updated successfully" : "Product added successfully"
    );
  };

  const resetForm = () => {
    setCurrentProduct({
      marksAndNos: "",
      description: "",
      hsnCode: "",
      size: "",
      price: 0,
      sqmPerBox: 0,
    });
    setIsEditing(false);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string | undefined) => {
    if (id) {
      deleteProduct(id);
      loadProducts();
      toast.success("Product deleted successfully");
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage product information for invoices"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="marksAndNos">Marks & Nos.</Label>
                    <Input
                      id="marksAndNos"
                      name="marksAndNos"
                      value={currentProduct.marksAndNos}
                      onChange={handleChange}
                      placeholder="Marks and numbers"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      value={currentProduct.description}
                      onChange={handleChange}
                      placeholder="Product description"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hsnCode">HSN Code</Label>
                    <Input
                      id="hsnCode"
                      name="hsnCode"
                      value={currentProduct.hsnCode}
                      onChange={handleChange}
                      placeholder="HSN code"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      name="size"
                      value={currentProduct.size}
                      onChange={handleChange}
                      placeholder="e.g., 600x600mm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (EUR)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={currentProduct.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sqmPerBox">SQM/BOX</Label>
                    <Input
                      id="sqmPerBox"
                      name="sqmPerBox"
                      type="number"
                      step="0.01"
                      value={currentProduct.sqmPerBox}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {isEditing ? "Update Product" : "Add Product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          {products.length > 0 ? (
            <Table className="border-separate border-spacing-0">
              <TableHeader>
                <TableRow>
                  <TableHead>Marks & Nos.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Price (EUR)</TableHead>
                  <TableHead>SQM/BOX</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.marksAndNos}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{product.hsnCode}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell>{product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.sqmPerBox.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(product.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <Package className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
              <h3 className="font-medium text-lg">No products yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Add your first product to get started
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>{/* Same form as above */}</DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
