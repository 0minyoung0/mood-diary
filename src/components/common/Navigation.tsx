import { NavLink } from "react-router-dom";
import { Home, PenSquare, Calendar, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "홈", icon: Home },
  { to: "/write", label: "작성", icon: PenSquare },
  { to: "/calendar", label: "캘린더", icon: Calendar },
  { to: "/stats", label: "통계", icon: BarChart3 },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-2xl justify-around px-4 sm:px-6 lg:px-8">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                <span className={cn(isActive && "font-medium")}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
