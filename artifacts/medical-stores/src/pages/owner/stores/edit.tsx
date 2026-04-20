import { useLocation, useParams } from "wouter";
import { useGetStore, useUpdateStore, getListMyStoresQueryKey, getGetStoreQueryKey } from "@workspace/api-client-react";
import { StoreForm } from "@/components/store-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function EditStore() {
  const { id } = useParams();
  const storeId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: store, isLoading } = useGetStore(storeId, {
    query: {
      enabled: !!storeId && !isNaN(storeId),
    },
  });

  const updateMutation = useUpdateStore();

  const handleSubmit = (data: any) => {
    updateMutation.mutate(
      { id: storeId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyStoresQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStoreQueryKey(storeId) });
          toast({
            title: "Store Updated!",
            description: "Your store details have been successfully updated.",
          });
          setLocation("/owner/dashboard");
        },
        onError: (err: any) => {
          toast({
            title: "Update failed",
            description: err.error || "Failed to update store",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 w-48 bg-muted rounded animate-pulse mb-8"></div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-[400px] bg-muted rounded-xl animate-pulse"></div>
          <div className="h-[400px] bg-muted rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold">Store Not Found</h2>
        <Button variant="link" onClick={() => setLocation("/owner/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4 -ml-4 text-muted-foreground" onClick={() => setLocation("/owner/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Store Details</h1>
        <p className="text-muted-foreground mt-1">Update your listing information. Status will remain unchanged.</p>
      </div>

      <StoreForm 
        initialData={store}
        onSubmit={handleSubmit} 
        isSubmitting={updateMutation.isPending} 
      />
    </div>
  );
}
