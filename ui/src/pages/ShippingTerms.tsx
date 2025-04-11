
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
import { getShippingTerms, saveShippingTerm, deleteShippingTerm } from "@/lib/dataService";
import { ShippingTerm } from "@/lib/types";
import { toast } from "sonner";
import { Plus, MoreVertical, Pencil, Trash, Ship } from "lucide-react";

const ShippingTerms = () => {
  const [shippingTerms, setShippingTerms] = useState<ShippingTerm[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTerm, setCurrentTerm] = useState<ShippingTerm>({
    fob: "",
    port: "",
    euroRate: 0,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadShippingTerms();
  }, []);

  const loadShippingTerms = () => {
    const storedTerms = getShippingTerms();
    setShippingTerms(storedTerms);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTerm((prev) => ({ 
      ...prev, 
      [name]: name === "euroRate" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveShippingTerm(currentTerm);
    loadShippingTerms();
    resetForm();
    setIsDialogOpen(false);
    toast.success(
      isEditing ? "Shipping term updated successfully" : "Shipping term added successfully"
    );
  };

  const resetForm = () => {
    setCurrentTerm({
      fob: "",
      port: "",
      euroRate: 0,
    });
    setIsEditing(false);
  };

  const handleEdit = (term: ShippingTerm) => {
    setCurrentTerm(term);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string | undefined) => {
    if (id) {
      deleteShippingTerm(id);
      loadShippingTerms();
      toast.success("Shipping term deleted successfully");
    }
  };

  return (
    <div>
      <PageHeader
        title="Shipping Terms"
        description="Manage shipping terms for invoices"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Shipping Term
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Shipping Term" : "Add New Shipping Term"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fob">FOB</Label>
                    <Input
                      id="fob"
                      name="fob"
                      value={currentTerm.fob}
                      onChange={handleChange}
                      placeholder="FOB term"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      name="port"
                      value={currentTerm.port}
                      onChange={handleChange}
                      placeholder="e.g., Mundra/New York"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="euroRate">EURO Rate</Label>
                    <Input
                      id="euroRate"
                      name="euroRate"
                      type="number"
                      step="0.01"
                      value={currentTerm.euroRate}
                      onChange={handleChange}
                      placeholder="Current EURO exchange rate"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {isEditing ? "Update Shipping Term" : "Add Shipping Term"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          {shippingTerms.length > 0 ? (
            <Table className="border-separate border-spacing-0">
              <TableHeader>
                <TableRow>
                  <TableHead>FOB</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>EURO Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingTerms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium">{term.fob}</TableCell>
                    <TableCell>{term.port}</TableCell>
                    <TableCell>{term.euroRate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(term)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(term.id)}>
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
              <Ship className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
              <h3 className="font-medium text-lg">No shipping terms yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Add your first shipping term to get started
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shipping Term
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

export default ShippingTerms;
