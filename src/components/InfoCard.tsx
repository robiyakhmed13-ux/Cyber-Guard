import { LucideIcon } from "lucide-react";

const InfoCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) => (
  <div className="bg-card border border-border rounded p-6 hover:cyber-glow transition-all duration-300 group hover-scale">
    <Icon className="h-8 w-8 text-primary mb-4 group-hover:animate-pulse-glow" />
    <h3 className="font-mono text-sm font-bold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

export default InfoCard;
