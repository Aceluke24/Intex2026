export const PublicSafetyNote = ({ className = "" }: { className?: string }) => {
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      To protect the safety of those we serve, identifying details are never shared.
    </p>
  );
};
