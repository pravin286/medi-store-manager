import { useLocation, useParams } from "wouter";
import {
  useGetStore,
  useUpdateStore,
  getAdminListStoresQueryKey,
  getGetStoreQueryKey,
  getListStoresQueryKey,
} from "@workspace/api-client-react";
import { StoreForm } from "@/components/store-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminEditStore() {
  const { id } = useParams();
  const storeId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

const { data: store, isLoading } = useGetStore(storeId, {
  query: {
    enabled: !!storeId && !isNaN(storeId),
  } as any,
});


  
  const updateMutation = useUpdateStore();

  // ✅ NORMALIZE API RESPONSE (snake_case → camelCase)
  const normalizedStore = store
    ? {
        ...store,
        storeName: (store as any).storeName ?? (store as any).store_name,
        ownerName: (store as any).ownerName ?? (store as any).owner_name,
        imageUrl: (store as any).imageUrl ?? (store as any).image_url,
        discountPercentage:
          (store as any).discountPercentage ??
          (store as any).discount_percentage,
        whatsappNumber:
          (store as any).whatsappNumber ??
          (store as any).whatsapp_number,
        is24x7:
  typeof (store as any).is24x7 === "boolean"
    ? (store as any).is24x7
    : Boolean((store as any).is_24x7),
      }
    : null;

  const handleSubmit = (data: any) => {
    updateMutation.mutate(
      { id: storeId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getAdminListStoresQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetStoreQueryKey(storeId),
          });
          queryClient.invalidateQueries({
            queryKey: getListStoresQueryKey(),
          });

          toast({
            title: "Store Updated!",
            description:
              "Store details have been successfully updated.",
          });

          setLocation(`/admin/stores/${storeId}`);
        },
        onError: (err: any) => {
          toast({
            title: "Update failed",
            description: err?.error || "Failed to update store",
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

  if (!normalizedStore) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold">Store Not Found</h2>
        <Button
          variant="link"
          onClick={() => setLocation("/admin/dashboard")}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4 -ml-4 text-muted-foreground"
          onClick={() =>
            setLocation(`/admin/stores/${storeId}`)
          }
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Store Details
        </Button>

        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Edit Store — Admin
        </h1>

        <p className="text-muted-foreground mt-1">
          Editing{" "}
          <span className="font-medium text-foreground">
            {normalizedStore.storeName ?? "-"}
          </span>
          . Changes take effect immediately.
        </p>
      </div>

      <StoreForm
        initialData={normalizedStore}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}