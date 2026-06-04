import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetStore, 
  useApproveStore, 
  useRejectStore, 
  useDeleteStore,
  getGetStoreQueryKey,
  getAdminListStoresQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Map } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  MapPin, 
  User, 
  Store as StoreIcon, 
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  Pencil
} from "lucide-react";
import { format } from "date-fns";

export default function AdminStoreDetail() {
  const { id } = useParams();
  const storeId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

 const { data: store, isLoading, error } = useGetStore(storeId, {
  query: {
    enabled: !!storeId && !isNaN(storeId),
  } as any,
});
const normalizedStore = store
  ? {
      ...store,
      createdAt:
        (store as any).createdAt ?? (store as any).created_at,
    }
  : null;
  const approveMutation = useApproveStore();
  const rejectMutation = useRejectStore();
  const deleteMutation = useDeleteStore();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
        <div className="h-64 bg-muted rounded-xl w-full"></div>
        <div className="h-10 bg-muted rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !normalizedStore) {
   
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <StoreIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Store Not Found</h2>
        <Button variant="link" onClick={() => setLocation("/admin/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }
const s = normalizedStore!;
  const handleApprove = () => {
    approveMutation.mutate(
      { id: storeId},
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStoreQueryKey(storeId) });
          queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
          toast({ title: "Store approved successfully" });
        },
      }
    );
  };

  const handleRejectSubmit = () => {
    rejectMutation.mutate(
      { id: storeId, data: { reason: rejectionReason } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStoreQueryKey(storeId) });
          queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
          toast({ title: "Store rejected" });
          setRejectModalOpen(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to completely delete this store?")) return;
    
    deleteMutation.mutate(
      { id: storeId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
          toast({ title: "Store deleted" });
          setLocation("/admin/dashboard");
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 text-white text-base px-4 py-1"><CheckCircle className="w-4 h-4 mr-2" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-base px-4 py-1"><XCircle className="w-4 h-4 mr-2" /> Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-base px-4 py-1"><Clock className="w-4 h-4 mr-2" /> Pending Review</Badge>;
    }
  };

  const mapCenter: [number, number] =
  s.latitude != null && s.longitude != null
    ? [s.latitude, s.longitude]
    : [40.7128, -74.0060];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4 -ml-4 text-muted-foreground" onClick={() => setLocation("/admin/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {s.storeName}
            </h1>
            {getStatusBadge(s.status)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setLocation(`/admin/stores/${storeId}/edit`)} variant="outline">
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            {s.status !== "approved" && (
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700" disabled={approveMutation.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
            )}
            {s.status !== "rejected" && (
              <Button onClick={() => setRejectModalOpen(true)} variant="outline" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50" disabled={rejectMutation.isPending}>
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            )}
            <Button onClick={handleDelete} variant="destructive" disabled={deleteMutation.isPending}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {s.status === "rejected" && s.rejectionReason && (
        <div className="mb-6 p-4 bg-red-50 text-red-900 rounded-lg border border-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <h4 className="font-semibold text-red-800">Rejection Reason</h4>
            <p className="mt-1">{s.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-64 sm:h-80 bg-muted relative">
              {s.imageUrl ? (
                <img src={s.imageUrl} alt={s.storeName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground">
                  <StoreIcon className="h-20 w-20 opacity-20" />
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              {s.latitude && s.longitude ? (
                <div className="rounded-md overflow-hidden border">
                  <Map center={mapCenter} marker={mapCenter} className="h-[300px] w-full" />
                </div>
              ) : (
                <div className="h-[300px] bg-muted rounded-md flex items-center justify-center text-muted-foreground border">
                  Map coordinates not available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Discount Offered</h3>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(s.discountPercentage)}% OFF
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{s.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Owner</p>
                    <p className="text-sm text-muted-foreground">{s.ownerName}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Submission Date</p>
                   <p className="text-sm text-muted-foreground">
 {normalizedStore?.createdAt && !isNaN(new Date(normalizedStore.createdAt).getTime())
  ? format(new Date(normalizedStore.createdAt), "MMMM d, yyyy")
  : "-"}
</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Store</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this store listing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Incomplete address..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={rejectMutation.isPending}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  );
}
