import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  Footprints,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NotificationBell } from './NotificationBell';
import { GlobalSearch } from './GlobalSearch';
import { OnboardingTour } from './onboarding/OnboardingTour';
// Notificações push desativadas - não funcionam bem no mobile
// import { usePushNotifications } from '@/hooks/usePushNotifications';
// import { PushNotificationPrompt } from './PushNotificationPrompt';
// import { UpdateBanner } from './UpdateBanner';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/agenda', label: 'Agenda', icon: Calendar },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/relatorios', label: 'Relatórios', icon: FileText },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { tourKey, isActive: isTourActive, currentStep } = useOnboarding();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpenedForTour, setSidebarOpenedForTour] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // Manter sidebar aberto durante todo o tour no mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    const isNavStep = currentStep && ['configuracoes', 'clientes', 'agenda', 'dashboard', 'relatorios'].includes(currentStep);
    const isLastStep = currentStep === 'complete';
    
    // Fechar sidebar apenas quando o tour terminar completamente
    if (isLastStep && sidebarOpenedForTour) {
      setMobileOpen(false);
      setSidebarOpenedForTour(false);
      return;
    }
    
    // Abrir e manter sidebar aberto durante todo o tour quando destacando navegação
    if (isTourActive && isNavStep && isMobile) {
      if (!sidebarOpenedForTour) {
        // Abrir pela primeira vez
        const timer = setTimeout(() => {
          setMobileOpen(true);
          setSidebarOpenedForTour(true);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        // Manter aberto durante mudanças de etapa
        if (!mobileOpen) {
          setMobileOpen(true);
        }
      }
    }
    
    // Resetar flag quando o tour não estiver mais ativo
    if (!isTourActive && sidebarOpenedForTour) {
      setSidebarOpenedForTour(false);
    }
  }, [isTourActive, currentStep, sidebarOpenedForTour, mobileOpen]);
  
  // Notificações push desativadas
  // usePushNotifications();

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          {profile?.clinic_logo_url ? (
            <img
              src={profile.clinic_logo_url}
              alt={profile.clinic_name || 'Logo da clínica'}
              className="w-10 h-10 rounded-xl object-cover border-2 border-sidebar-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Footprints className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">
              {profile?.clinic_name || 'PodoAgenda'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {profile?.clinic_name ? 'Gestão Podológica' : 'Gestão Podológica'}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const navId = `nav-${item.path.replace('/', '') || 'dashboard'}`;
          return (
            <Link
              key={item.path}
              id={navId}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        <div className="flex items-center gap-3 px-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'Foto do usuário'}
              className="w-10 h-10 rounded-full object-cover border-2 border-sidebar-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sidebar-accent-foreground font-semibold">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.clinic_name || 'Podologia'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Buscar (Ctrl+K)"
            >
              <Search className="h-5 w-5" />
            </Button>
            {profile?.notifications_enabled && location.pathname !== '/configuracoes' && <NotificationBell />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLogoutDialog(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            {profile?.clinic_logo_url ? (
              <img
                src={profile.clinic_logo_url}
                alt={profile.clinic_name || 'Logo da clínica'}
                className="w-8 h-8 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Footprints className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-foreground">
              {profile?.clinic_name || 'PodoAgenda'}
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Sheet 
              open={mobileOpen} 
              onOpenChange={(open) => {
                // Não permitir fechar o sidebar durante o tour (exceto na última etapa)
                const isLastStep = currentStep === 'complete';
                if (isTourActive && !isLastStep && !open) {
                  return; // Prevenir fechamento durante o tour
                }
                setMobileOpen(open);
              }}
            >
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-sidebar">
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Onboarding Tour */}
      <OnboardingTour key={tourKey} />

      {/* Modal de Confirmação de Logout */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-9 sm:text-sm sm:h-10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={signOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-9 sm:text-sm sm:h-10"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen flex flex-col">
        {/* Notificações push desativadas */}
        {/* <PushNotificationPrompt /> */}
        {/* <UpdateBanner /> */}
        <div className="flex-1 p-4 lg:p-8">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Desenvolvido com 💙 por{' '}
              <span className="font-semibold text-foreground">Jadson Santos</span>
              {' '}&copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
