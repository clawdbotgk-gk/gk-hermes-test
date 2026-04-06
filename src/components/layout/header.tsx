import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">TT</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">TT Manager</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/tournaments">
            <Button variant="ghost" size="sm">Tournaments</Button>
          </Link>
          <Link href="/videos">
            <Button variant="ghost" size="sm">Coaching Videos</Button>
          </Link>
          <Link href="/support">
            <Button variant="ghost" size="sm">Support</Button>
          </Link>
          <Link href="/new">
            <Button size="sm">New Tournament</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
