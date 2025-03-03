import { Metadata } from "next";
import ProductosPage from "@/components/productos/ProductosPage";

export const metadata: Metadata = {
  title: "Productos | Levercast",
  description: "Gestión de productos",
};

export default function Page() {
  return <ProductosPage />;
} 