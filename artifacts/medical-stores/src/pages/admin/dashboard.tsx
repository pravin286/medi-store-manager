import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useGetAdminStats, 
  useAdminListStores, 
  useApproveStore, 
  useRejectStore, 
  useDeleteStore,
  getGetAdminStatsQueryKey,
  getAdminListStoresQueryKey,
  getListStoresQueryKey
} from "@workspace/api-client-react";
import type { AdminListStoresStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye, 
  Store as StoreIcon,
  Activity,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | AdminListStoresStatus>("all");
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [storeToReject, setStoreToReject] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: stores, isLoading: storesLoading } = useAdminListStores({
    search: search || undefined,
    status: statusTab === "all" ? undefined : statusTab,
  });

  const approveMutation = useApproveStore();
  const rejectMutation = useRejectStore();
  const deleteMutation = useDeleteStore();

  const handleApprove = (id: number) => {
    approveMutation.mutate(
      { id, data: {} },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStoresQueryKey() });
          toast({ title: "Store approved successfully" });
        },
        onError: (err: any) => {
          toast({ title: "Failed to approve", description: err.error, variant: "destructive" });
        }
      }
    );
  };

  const handleRejectSubmit = () => {
    if (!storeToReject) return;
    
    rejectMutation.mutate(
      { id: storeToReject, data: { reason: rejectionReason } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStoresQueryKey() });
          toast({ title: "Store rejected successfully" });
          setRejectModalOpen(false);
          setStoreToReject(null);
          setRejectionReason("");
        },
        onError: (err: any) => {
          toast({ title: "Failed to reject", description: err.error, variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this store? This cannot be undone.")) return;
    
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStoresQueryKey() });
          toast({ title: "Store deleted successfully" });
        },
        onError: (err: any) => {
          toast({ title: "Failed to delete", description: err.error, variant: "destructive" });
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldIcon className="h-8 w-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Manage directory listings and platform statistics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stores</CardTitle>
            <StoreIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.totalStores || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statsLoading ? "-" : stats?.pendingStores || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statsLoading ? "-" : stats?.approvedStores || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statsLoading ? "-" : stats?.rejectedStores || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Discount</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{statsLoading ? "-" : `${Math.round(stats?.averageDiscount || 0)}%`}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as any)} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Stores</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stores..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading stores...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : stores?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No stores found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                stores?.map((store) => (
                  <TableRow key={store.id} className="cursor-pointer" onClick={() => setLocation(`/admin/stores/${store.id}`)}>
                    <TableCell className="font-medium">{store.storeName}</TableCell>
                    <TableCell>{store.ownerName}</TableCell>
                    <TableCell>
                      {store.discountPercentage > 0 ? (
                        <span className="text-green-600 font-semibold">{store.discountPercentage}%</span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(store.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(store.status)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/admin/stores/${store.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {store.status !== "approved" && (
                            <DropdownMenuItem onClick={() => handleApprove(store.id)} className="text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                          )}
                          
                          {store.status !== "rejected" && (
                            <DropdownMenuItem 
                              onClick={() => {
                                setStoreToReject(store.id);
                                setRejectionReason("");
                                setRejectModalOpen(true);
                              }} 
                              className="text-yellow-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleDelete(store.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Store</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this store listing. This will be visible to the store owner.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Incomplete address, unverifiable pharmacy license..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShieldIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
