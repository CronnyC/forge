export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter" style={{ color: "var(--accent)" }}>
            FORGE
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Dynamic home fitness
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
