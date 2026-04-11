const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="border-b border-border py-12 mb-8">
    <div className="container animate-slide-in">
      <h1 className="text-3xl md:text-4xl font-bold text-primary cyber-text-glow mb-2">
        {`> ${title}`}
      </h1>
      <p className="text-muted-foreground font-mono text-sm max-w-2xl">
        {subtitle}
      </p>
    </div>
  </div>
);

export default PageHeader;
