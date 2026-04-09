import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-display text-3xl text-foreground">Unauthorized</h1>
        <p className="font-body text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
        <Link to="/" className="font-body text-sm text-terracotta hover:underline">
          Return home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
