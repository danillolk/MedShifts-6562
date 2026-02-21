import { Metadata } from "./metadata";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return (
    <TooltipProvider>
      <Metadata />
      {children}
    </TooltipProvider>
  );
}