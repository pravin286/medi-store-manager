import { useParams } from "wouter";
import { useGetStore } from "@workspace/api-client-react";
import { Map } from "@/components/map";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User, Store as StoreIcon, Calendar, MessageCircle, Siren } from "lucide-react";
import { format } from "date-fns";

export default function StoreDetail() {
  const { id } = useParams();
  const storeId = parseInt(id || "0", 10);

  const { data: store, isLoading, error } = useGetStore(storeId, {
   query: {
  enabled: !!storeId && !isNaN(storeId),
} as any,
  });
  const normalizedStore = store
  ? {
      ...store,
      imageUrl:
        (store as any).imageUrl ?? (store as any).image_url,
      storeName:
        (store as any).storeName ?? (store as any).store_name,
      ownerName:
        (store as any).ownerName ?? (store as any).owner_name,
      createdAt:
        (store as any).createdAt ?? (store as any).created_at,
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse space-y-6">
        <div className="h-64 bg-muted rounded-xl w-full"></div>
        <div className="h-10 bg-muted rounded w-2/3"></div>
        <div className="h-6 bg-muted rounded w-1/3"></div>
      </div>
    );
  }

  if (error || !normalizedStore) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <StoreIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Store Not Found</h2>
        <p className="text-muted-foreground mt-2">The store you are looking for does not exist or has been removed.</p>
      </div>
    );
  }
const s = normalizedStore!;
  const mapCenter: [number, number] = s.latitude && s.longitude 
    ? [s.latitude, s.longitude] 
    : [40.7128, -74.0060];

  const whatsappHref = s.whatsappNumber
    ? `https://wa.me/${s.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hi, I'm interested in your store "${s.storeName}" listed on MediDirectory.`
      )}`
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {s.is24x7 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100/40 p-4 shadow-sm">
          <span className="relative grid place-items-center w-10 h-10 rounded-full bg-rose-500 text-white shrink-0">
            <Siren className="h-5 w-5" />
            <span className="absolute inset-0 rounded-full bg-rose-400/60 animate-ping" />
          </span>
          <div>
            <p className="font-semibold text-rose-700">Emergency Pharmacy — Open 24×7</p>
            <p className="text-sm text-rose-600/80">This store is available round the clock for urgent medical needs.</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            {s.storeName}
          </h1>
          <div className="flex items-center text-muted-foreground mt-2 gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{s.address}</span>
          </div>
        </div>
        {s.discountPercentage > 0 && (
          <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-4 py-1.5 shadow-md shrink-0">
            {s.discountPercentage}% OFF ALL ITEMS
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-64 sm:h-80 bg-muted relative">
              {s.imageUrl ? (
                <img 
                  src={s.imageUrl} 
                  alt={s.storeName} 
                  className="w-full h-full object-cover"
                />
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
                  <Map 
                    center={mapCenter} 
                    marker={mapCenter}
                    interactive={true} 
                    className="h-[300px] w-full"
                  />
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
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Store Details</h3>
              
              <div className="space-y-3">
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
                    <p className="text-sm font-medium">Listed Since</p>
                    <p className="text-sm text-muted-foreground">
                      {s.createdAt && !isNaN(new Date(s.createdAt).getTime())
  ? format(new Date(s.createdAt), "MMMM d, yyyy")
  : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {whatsappHref ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full mt-4 rounded-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold shadow-lg shadow-[#25D366]/30 border-0"
                >
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Contact on WhatsApp
                  </a>
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled
                  className="w-full mt-4 rounded-full bg-muted text-muted-foreground"
                  title="This store has not added a WhatsApp number yet"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  WhatsApp not available
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
