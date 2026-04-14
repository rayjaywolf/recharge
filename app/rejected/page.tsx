import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, ShieldAlert } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function RejectedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md text-center shadow-xl border-t-4 border-t-destructive">
        <CardHeader className="flex flex-col items-center">
          <div className="h-16 w-16 mb-4 rounded-full bg-red-100 flex items-center justify-center">
             <UserX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Application Rejected</CardTitle>
          <CardDescription className="mt-2 text-base">
            Your KYC application has been manually reviewed and declined by the administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary p-4 rounded-md flex items-start gap-3 text-left">
             <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
             <div className="text-sm text-secondary-foreground">
                <p className="font-semibold">Access Revoked</p>
                <p className="mt-1 text-muted-foreground">The information provided did not meet the validation requirements. If you believe this is an error, please contact support.</p>
             </div>
          </div>
          <div className="pt-2">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
