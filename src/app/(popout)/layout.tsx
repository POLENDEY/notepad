export default function PopoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-[#faf9f7] text-stone-900 dark:bg-stone-900 dark:text-stone-50">
      {children}
    </div>
  );
}
