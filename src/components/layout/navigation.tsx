"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ProfileDialog } from "@/components/layout/profile-dialog";
import { 
  Menu, 
  Globe, 
  Trophy, 
  Users, 
  UserPlus, 
  Search, 
  Plus, 
  Settings,
  LogOut,
  User,
  MessageCircle,
  Shield
} from "lucide-react";

const navigation = {
  en: [
    { name: "Home", href: "/", icon: Globe },
    { name: "Create Tournament", href: "/create-tournament", icon: Plus },
    { name: "Available Tournaments", href: "/tournaments", icon: Trophy },
    { name: "Player for Hire", href: "/pusher-registration", icon: UserPlus },
    { name: "Rent Pusher", href: "/rent-pusher", icon: Search },
    { name: "CWL Clan Registration", href: "/cwl/register", icon: Users },
    { name: "Join CWL Clans", href: "/cwl", icon: Users },
    { name: "Extra Services", href: "/services", icon: Settings },
  ],
  ar: [
    { name: "الرئيسية", href: "/", icon: Globe },
    { name: "إنشاء بطولة", href: "/create-tournament", icon: Plus },
    { name: "البطولات المتاحة", href: "/tournaments", icon: Trophy },
    { name: "لاعب للإيجار", href: "/pusher-registration", icon: UserPlus },
    { name: "استئجار لاعب", href: "/rent-pusher", icon: Search },
    { name: "تسجيل عشيرة CWL", href: "/cwl/register", icon: Users },
    { name: "الانضمام لعشائر CWL", href: "/cwl", icon: Users },
    { name: "خدمات إضافية", href: "/services", icon: Settings },
  ],
};

export default function Navigation() {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  const currentNav = navigation[language];

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const NavItems = () => (
    <>
      {currentNav.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
            onClick={() => setIsOpen(false)}
          >
            <Icon className="w-4 h-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  const UserMenu = () => {
    if (loading) {
      return (
        <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
      );
    }

    if (user) {
      return (
        <div className="flex items-center gap-2">
          <NotificationBell />
          
          <ProfileDialog user={user} onLogout={handleLogout}>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1 transition-all duration-200 hover:scale-105">
              <Avatar className="w-8 h-8 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
                <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block hover:text-primary transition-colors">
                {user.name || user.email}
              </span>
            </div>
          </ProfileDialog>
          
          {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <Shield className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline-block">Admin</span>
              </Link>
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/login">
            <User className="w-4 h-4 mr-2" />
            Login
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">Register</Link>
        </Button>
      </div>
    );
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Clash Tournaments</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-1">
              <NavItems />
            </div>
            
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {language === "en" ? "العربية" : "English"}
            </Button>

            {/* User Menu */}
            <UserMenu />
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side={language === "ar" ? "left" : "right"} className="w-64">
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex flex-col gap-1">
                  <NavItems />
                </div>
                
                <div className="border-t pt-4">
                  <UserMenu />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLanguage}
                  className="gap-2 justify-start"
                >
                  <Globe className="w-4 h-4" />
                  {language === "en" ? "العربية" : "English"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}