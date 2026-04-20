import { useLocation } from "wouter";
import { useCreateStore, getListMyStoresQueryKey } from "@workspace/api-client-react";
import { StoreForm } from "@/components/store-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function NewStore() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateStore();

  const handleSubmit = (data: any) => {
    createMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyStoresQueryKey() });
          toast({
            title: "Store Submitted!",
            description: "Your store has been submitted and is pending admin approval.",
          });
          setLocation("/owner/dashboard");
        },
        onError: (err: any) => {
          toast({
            title: "Submission failed",
            description: err.error || "Failed to create store",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4 -ml-4 text-muted-foreground" onClick={() => setLocation("/owner/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Submit New Store</h1>
        <p className="text-muted-foreground mt-1">Provide details about your medical store to be listed.</p>
      </div>

      <StoreForm 
        onSubmit={handleSubmit} 
        isSubmitting={createMutation.isPending} 
      />
    </div>
  );
}
