
import { useAppContext } from "@/context/AppContext";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
