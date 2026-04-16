import { useTranslations } from 'next-intl';
import { ThemeToggle } from "@/components/theme-toggle";
import Link from 'next/link';
import { LocaleToggle } from '@/components/locale-toggle';
import { TopHeader } from '@/components/top-header';

export default function HomePage() {
  const t = useTranslations('HomePage');

  const modules = [
    { id: 'app', href: '/managements/app' },
    { id: 'member', href: '/managements/member-managements' },
    { id: 'finance', href: '/managements/finance' },
    { id: 'inventory', href: '/managements/inventory' },
    { id: 'service', href: '/managements/service' },
    { id: 'event', href: '/managements/event' },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border p-4 px-8 flex justify-between items-center bg-bg-alt/80 backdrop-blur-md sticky top-0 z-20">
        <span className="font-bold text-2xl tracking-tighter text-primary font-mono italic">COMA.</span>
        <TopHeader />
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 max-w-7xl mx-auto p-8 md:p-12 w-full flex flex-col justify-center space-y-16">
        
        {/* Header Section */}
        <header className="text-center space-y-6 pt-10">
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-primary italic drop-shadow-sm">
              {t('title')}
            </h1>
            <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase opacity-70 text-secondary">
              {t('subtitle')}
            </p>
          </div>
          
          <div className="w-24 h-1.5 bg-accent mx-auto rounded-lg" />

          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
            {t('description')}
          </p>
        </header>

        {/* Bento Grid Layout */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
          {modules.map((m) => (
            <Link 
              href={m.href}
              key={m.id}
              className="group p-10 rounded-lg bg-secondary/10 border border-border/60 hover:border-primary hover:bg-secondary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-center min-h-55"
            >
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                  {t(`modules.${m.id}.title`)}
                </h3>
                <p className="text-text-muted text-sm md:text-base leading-relaxed opacity-90">
                  {t(`modules.${m.id}.desc`)}
                </p>
              </div>
            </Link>
          ))}
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12 flex flex-col items-center gap-4 bg-bg-alt/30">
        <p className="text-center italic text-text-muted max-w-lg px-4 text-sm">
          {t('footer_quote')}
        </p>
        <div className="text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] opacity-40 mt-4 text-primary">
          {t('footer_est')}
        </div>
      </footer>
    </main>
  );
}