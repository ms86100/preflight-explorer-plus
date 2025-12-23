import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  // Note: 404 tracking is intentionally silent - can be enabled for analytics if needed
  // Avoiding console.error to keep production logs clean

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <p className="mb-4 text-sm text-muted-foreground">
          The page <code className="px-1 py-0.5 bg-muted-foreground/10 rounded">{location.pathname}</code> does not exist.
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
