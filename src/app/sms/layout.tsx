export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen w-full max-w-screen-md mx-auto px-4 py-10">
      {children}
    </div>
  );
}
