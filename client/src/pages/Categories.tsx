import { useState } from "react";
import FinancialDashboardLayout from "@/components/FinancialDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, FolderOpen, Tag, TrendingDown, TrendingUp, Download, Upload } from "lucide-react";

export default function Categories() {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<number | null>(null);
  
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    type: "expense" as "expense" | "revenue",
  });

  const [subcategoryFormData, setSubcategoryFormData] = useState({
    categoryId: 0,
    name: "",
    description: "",
  });

  const categoriesQuery = trpc.categories.list.useQuery();
  const subcategoriesQuery = trpc.subcategories.list.useQuery();
  const createCategoryMutation = trpc.categories.create.useMutation();
  const updateCategoryMutation = trpc.categories.update.useMutation();
  const deleteCategoryMutation = trpc.categories.delete.useMutation();
  const createSubcategoryMutation = trpc.subcategories.create.useMutation();
  const updateSubcategoryMutation = trpc.subcategories.update.useMutation();
  const deleteSubcategoryMutation = trpc.subcategories.delete.useMutation();

  const categories = categoriesQuery.data || [];
  const subcategories = subcategoriesQuery.data || [];

  const handleCategoryDialogClose = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategoryId(null);
    setCategoryFormData({ name: "", description: "", type: "expense" });
  };

  const handleSubcategoryDialogClose = () => {
    setIsSubcategoryDialogOpen(false);
    setEditingSubcategoryId(null);
    setSubcategoryFormData({ categoryId: 0, name: "", description: "" });
  };

  const exportCategoriesQuery = trpc.categories.exportCSV.useQuery(undefined, { enabled: false });
  const exportSubcategoriesQuery = trpc.subcategories.exportCSV.useQuery(undefined, { enabled: false });
  const importCategoriesMutation = trpc.categories.importCSV.useMutation();
  const importSubcategoriesMutation = trpc.subcategories.importCSV.useMutation();

  const handleExportCategories = async () => {
    try {
      const categoriesData = await exportCategoriesQuery.refetch();
      const subcategoriesData = await exportSubcategoriesQuery.refetch();
      
      if (!categoriesData.data || !subcategoriesData.data) {
        toast.error("Erro ao exportar dados");
        return;
      }

      // Exportar categorias
      const categoriesCSV = [
        categoriesData.data.headers.join(","),
        ...categoriesData.data.rows.map(row => row.join(",")),
      ].join("\n");
      
      const categoriesBlob = new Blob([categoriesCSV], { type: "text/csv;charset=utf-8;" });
      const categoriesUrl = URL.createObjectURL(categoriesBlob);
      const categoriesLink = document.createElement("a");
      categoriesLink.href = categoriesUrl;
      categoriesLink.download = `categorias_${new Date().toISOString().split('T')[0]}.csv`;
      categoriesLink.click();
      URL.revokeObjectURL(categoriesUrl);

      // Exportar subcategorias
      const subcategoriesCSV = [
        subcategoriesData.data.headers.join(","),
        ...subcategoriesData.data.rows.map(row => row.join(",")),
      ].join("\n");
      
      const subcategoriesBlob = new Blob([subcategoriesCSV], { type: "text/csv;charset=utf-8;" });
      const subcategoriesUrl = URL.createObjectURL(subcategoriesBlob);
      const subcategoriesLink = document.createElement("a");
      subcategoriesLink.href = subcategoriesUrl;
      subcategoriesLink.download = `subcategorias_${new Date().toISOString().split('T')[0]}.csv`;
      subcategoriesLink.click();
      URL.revokeObjectURL(subcategoriesUrl);

      toast.success("Dados exportados com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao exportar dados");
    }
  };

  const handleImportCategories = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("Arquivo CSV vazio ou inválido");
        return;
      }

      // Remover cabeçalho
      const dataLines = lines.slice(1);
      const data = dataLines.map(line => {
        // Parse CSV considerando vírgulas dentro de aspas
        const matches = line.match(/(?:"([^"]*)"|([^,]+))(?:,|$)/g);
        if (!matches) return [];
        return matches.map(m => m.replace(/^"(.*)",$/, '$1').replace(/,$/, '').trim());
      });

      // Determinar se é categorias ou subcategorias pelo nome do arquivo
      const isSubcategories = file.name.toLowerCase().includes('subcategoria');

      if (isSubcategories) {
        const result = await importSubcategoriesMutation.mutateAsync({ data });
        toast.success(`${result.success} subcategorias importadas com sucesso!`);
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} erros encontrados. Verifique o console.`);
          console.error("Erros de importação:", result.errors);
        }
        subcategoriesQuery.refetch();
      } else {
        const result = await importCategoriesMutation.mutateAsync({ data });
        toast.success(`${result.success} categorias importadas com sucesso!`);
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} erros encontrados. Verifique o console.`);
          console.error("Erros de importação:", result.errors);
        }
        categoriesQuery.refetch();
      }

      // Limpar input
      e.target.value = "";
    } catch (error: any) {
      toast.error(error.message || "Erro ao importar arquivo");
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategoryId) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategoryId,
          data: categoryFormData,
        });
        toast.success("Categoria atualizada com sucesso!");
      } else {
        await createCategoryMutation.mutateAsync(categoryFormData);
        toast.success("Categoria criada com sucesso!");
      }
      categoriesQuery.refetch();
      handleCategoryDialogClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar categoria");
    }
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subcategoryFormData.categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    try {
      if (editingSubcategoryId) {
        await updateSubcategoryMutation.mutateAsync({
          id: editingSubcategoryId,
          data: subcategoryFormData,
        });
        toast.success("Subcategoria atualizada com sucesso!");
      } else {
        await createSubcategoryMutation.mutateAsync(subcategoryFormData);
        toast.success("Subcategoria criada com sucesso!");
      }
      subcategoriesQuery.refetch();
      handleSubcategoryDialogClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar subcategoria");
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      type: category.type,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleEditSubcategory = (subcategory: any) => {
    setEditingSubcategoryId(subcategory.id);
    setSubcategoryFormData({
      categoryId: subcategory.categoryId,
      name: subcategory.name,
      description: subcategory.description || "",
    });
    setIsSubcategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta categoria? Todas as subcategorias vinculadas também serão excluídas.")) {
      try {
        await deleteCategoryMutation.mutateAsync({ id });
        toast.success("Categoria excluída com sucesso!");
        categoriesQuery.refetch();
        subcategoriesQuery.refetch();
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir categoria");
      }
    }
  };

  const handleDeleteSubcategory = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta subcategoria?")) {
      try {
        await deleteSubcategoryMutation.mutateAsync({ id });
        toast.success("Subcategoria excluída com sucesso!");
        subcategoriesQuery.refetch();
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir subcategoria");
      }
    }
  };

  const expenseCategories = categories.filter(c => c.type === "expense");
  const revenueCategories = categories.filter(c => c.type === "revenue");

  return (
    <FinancialDashboardLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Categorias e Subcategorias
            </h1>
            <p className="text-muted-foreground mt-2">
              Classificação contábil para relatórios DRE
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsCategoryDialogOpen(true)} className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
            <Button onClick={() => setIsSubcategoryDialogOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nova Subcategoria
            </Button>
            <Button onClick={handleExportCategories} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => document.getElementById('import-categories-input')?.click()} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <input
              id="import-categories-input"
              type="file"
              accept=".csv"
              onChange={handleImportCategories}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categorias de Despesa */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingDown className="w-5 h-5" />
                Despesas
              </CardTitle>
              <CardDescription>{expenseCategories.length} categorias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenseCategories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Subcategorias */}
                  <div className="ml-7 space-y-2">
                    {subcategories
                      .filter((sub) => sub.categoryId === category.id)
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between bg-muted/50 rounded px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{sub.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSubcategory(sub)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubcategory(sub.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma categoria de despesa cadastrada
                </p>
              )}
            </CardContent>
          </Card>

          {/* Categorias de Receita */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                Receitas
              </CardTitle>
              <CardDescription>{revenueCategories.length} categorias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenueCategories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Subcategorias */}
                  <div className="ml-7 space-y-2">
                    {subcategories
                      .filter((sub) => sub.categoryId === category.id)
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between bg-muted/50 rounded px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{sub.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSubcategory(sub)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubcategory(sub.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              {revenueCategories.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma categoria de receita cadastrada
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog de Categoria */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategoryId ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <Label htmlFor="category-name">Nome *</Label>
                <Input
                  id="category-name"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Ex: Pessoal, Operacional, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="category-type">Tipo *</Label>
                <Select
                  value={categoryFormData.type}
                  onValueChange={(value: "expense" | "revenue") =>
                    setCategoryFormData({ ...categoryFormData, type: value })
                  }
                >
                  <SelectTrigger id="category-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="revenue">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category-description">Descrição</Label>
                <Textarea
                  id="category-description"
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, description: e.target.value })
                  }
                  placeholder="Descrição opcional"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCategoryDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategoryId ? "Atualizar" : "Criar Categoria"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Subcategoria */}
        <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubcategoryId ? "Editar Subcategoria" : "Nova Subcategoria"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubcategorySubmit} className="space-y-4">
              <div>
                <Label htmlFor="subcategory-category">Categoria *</Label>
                <Select
                  value={subcategoryFormData.categoryId.toString()}
                  onValueChange={(value) =>
                    setSubcategoryFormData({ ...subcategoryFormData, categoryId: parseInt(value) })
                  }
                >
                  <SelectTrigger id="subcategory-category">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name} ({category.type === "expense" ? "Despesa" : "Receita"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategory-name">Nome *</Label>
                <Input
                  id="subcategory-name"
                  value={subcategoryFormData.name}
                  onChange={(e) =>
                    setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })
                  }
                  placeholder="Ex: Salários, Freelancer, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="subcategory-description">Descrição</Label>
                <Textarea
                  id="subcategory-description"
                  value={subcategoryFormData.description}
                  onChange={(e) =>
                    setSubcategoryFormData({ ...subcategoryFormData, description: e.target.value })
                  }
                  placeholder="Descrição opcional"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleSubcategoryDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSubcategoryId ? "Atualizar" : "Criar Subcategoria"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </FinancialDashboardLayout>
  );
}
