"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  User,
  Trophy, 
  DollarSign, 
  Settings, 
  FileText, 
  Image, 
  CreditCard, 
  BarChart3, 
  Shield, 
  LogOut,
  Menu,
  Package,
  Edit,
  UserCheck,
  Database,
  Clock
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview and statistics"
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage platform users"
  },
  {
    title: "Pushers",
    href: "/admin/pushers",
    icon: User,
    description: "Manage pusher players"
  },
  {
    title: "Clans",
    href: "/admin/clans",
    icon: Shield,
    description: "Manage CWL clans"
  },
  {
    title: "Tournaments",
    href: "/admin/tournaments",
    icon: Trophy,
    description: "Manage all tournaments"
  },
  {
    title: "Package Prices",
    href: "/admin/packages",
    icon: Package,
    description: "Edit tournament package prices"
  },
  {
    title: "Content Management",
    href: "/admin/content",
    icon: Edit,
    description: "Modify website content"
  },
  {
    title: "File Manager",
    href: "/admin/files",
    icon: Image,
    description: "Upload and manage files"
  },
  {
    title: "Payment Gateways",
    href: "/admin/payments",
    icon: CreditCard,
    description: "Manage payment methods"
  },
  {
    title: "User Permissions",
    href: "/admin/permissions",
    icon: UserCheck,
    description: "Manage user permissions"
  },
  {
    title: "Statistics",
    href: "/admin/statistics",
    icon: BarChart3,
    description: "View platform analytics"
  },
  {
    title: "Tournament Scheduler",
    href: "/admin/scheduler",
    icon: Clock,
    description: "Manage automatic tournament registration"
  },
  {
    title: "System Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "System configuration"
  },
  {
    title: "Activity Logs",
    href: "/admin/logs",
    icon: Database,
    description: "View admin activities"
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the admin area.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'pt-6' : ''}`}>
      <div className="px-6 py-4">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Platform Management</p>
      </div>
      
      <div className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={mobile ? () => setSidebarOpen(false) : undefined}
              >
                <Icon className="mr-3 h-5 w-5" />
                <span>{item.title}</span>
              </a>
            );
          })}
        </nav>
      </div>
      
      <div className="px-6 py-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">{user?.name || user?.email}</p>
            <Badge variant={user?.role === 'SUPER_ADMIN' ? 'destructive' : 'default'}>
              {user?.role}
            </Badge>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={logout}
          className="w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-900 overflow-y-auto border-r">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="md:pl-64">
        {/* Top Header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-900 border-b">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden mr-2"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h1 className="text-lg font-semibold">
                {sidebarItems.find(item => item.href === pathname)?.title || 'Admin Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={user?.role === 'SUPER_ADMIN' ? 'destructive' : 'default'}>
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}