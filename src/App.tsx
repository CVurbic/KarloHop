import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";

const Index = lazy(() => import("./pages/Index"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SavjetiPage = lazy(() => import("./pages/SavjetiPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const BlogManager = lazy(() => import("./components/admin/BlogManager"));
const BlogEditorPage = lazy(() => import("./components/admin/BlogEditor"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/savjeti" element={<SavjetiPage />} />
            <Route path="/savjeti/:slug" element={<BlogPostPage />} />
            <Route path="/hop-upravljanje">
              <Route index element={<AdminLogin />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="clanci" element={<Suspense fallback={<PageLoader />}><BlogManager /></Suspense>} />
                <Route path="clanci/novi" element={<Suspense fallback={<PageLoader />}><BlogEditorPage /></Suspense>} />
                <Route path="clanci/:id" element={<Suspense fallback={<PageLoader />}><BlogEditorPage /></Suspense>} />
              </Route>
            </Route>
            <Route path="/:slug" element={<ProductPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
