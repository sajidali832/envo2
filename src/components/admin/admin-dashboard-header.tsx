
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { CircleUser, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminDashboardHeaderProps {
    title: string;
    onRefresh?: () => void | Promise<void>;
}

export function AdminDashboardHeader({ title, onRefresh }: AdminDashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
      try {
        localStorage.removeItem("admin_auth");
        router.push("/admin");
      } catch (error) {
        console.error("Failed to logout", error);
      }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="font-headline text-2xl font-semibold">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
            {onRefresh && (
                 <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onRefresh}
                >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                </Button>
            )}
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full h-8 w-8"
                >
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
  );
}
