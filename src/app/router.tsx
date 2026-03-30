import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { GlobalErrorBoundary } from "../components/GlobalErrorBoundary";
import { GuidePage } from "../pages/GuidePage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProductPage } from "../pages/ProductPage";
import { App } from "./App";

const ARPage = lazy(() => import("../pages/ARPage").then(({ ARPage }) => ({ default: ARPage })));

export const router = createBrowserRouter([
  {
    path: "/products/:slug/ar",
    element: (
      <GlobalErrorBoundary>
        <Suspense fallback={null}>
          <ARPage />
        </Suspense>
      </GlobalErrorBoundary>
    ),
    errorElement: <NotFoundPage />,
  },
  {
    path: "/",
    element: (
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    ),
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "products/:slug", element: <ProductPage /> },
      { path: "guide", element: <GuidePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
