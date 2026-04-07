import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            Safe<span className="text-primary">Net</span>
          </span>
        </div>


        <div className="flex items-center gap-3">
          <button className="hidden md:inline-flex px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
            giriş yap
          </button>
          <button className="md:hidden text-muted-foreground" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Keşfet</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Rapor Ekle</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">API</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-foreground">Hakkında</a>
          <button className="w-full px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md">
            giriş yap
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
