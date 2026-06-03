import { Link } from "wouter";
import { useListMyStores } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store as StoreIcon, Plus, MapPin, Edit, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { data: stores, isLoading } = useListMyStores();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">Manage your medical store listings</p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link href="/owner/stores/new">
            <Plus className="w-4 h-4" />
            Submit New Store
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stores?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg border border-dashed shadow-sm">
          <StoreIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No stores listed yet</h3>
          <p className="text-muted-foreground mt-1 mb-6">Submit your first medical store to get started.</p>
          <Button asChild>
            <Link href="/owner/stores/new">Submit a Store</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores?.map((store) => (
            <Card key={store.id} className="overflow-hidden flex flex-col h-full">
              <div className="relative h-40 bg-muted">
                {store.imageUrl ? (
                  <img src={store.imageUrl} alt={store.storeName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground">
                    <StoreIcon className="h-10 w-10 opacity-20" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(store.status)}
                </div>
              </div>
              
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold line-clamp-1 mb-2">{store.storeName}</h3>
                <div className="flex items-start gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-sm line-clamp-2">{store.address}</p>
                </div>
                
                {store.status === "rejected" && store.rejectionReason && (
                  <div className="mt-2 p-3 bg-red-50 text-red-800 rounded-md text-sm mb-4 border border-red-100">
                    <span className="font-semibold block mb-1">Rejection Reason:</span>
                    {store.rejectionReason}
                  </div>
                )}

                <div className="mt-auto pt-4 border-t flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Listed: {store?.createdAt && !isNaN(new Date(store.createdAt).getTime()) ? format(new Date(store.createdAt), "MMM d, yyyy") : "-"}
                  </div>
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <Link href={`/owner/stores/${store.id}/edit`}>
                      <Edit className="h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
