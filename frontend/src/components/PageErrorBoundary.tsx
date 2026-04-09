import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  title?: string;
};

type State = { hasError: boolean; message: string | null };

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? "Something went wrong" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PageErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <h1 className="font-display text-xl text-foreground">{this.props.title ?? "This page could not be displayed"}</h1>
          <p className="max-w-md font-body text-sm text-muted-foreground">
            {this.state.message}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false, message: null });
              window.location.reload();
            }}
          >
            Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
