import { useAnimatedCounter, useScrollReveal } from "@/hooks/useAnimations";

const AnimatedStat = ({
  value,
  label,
  suffix = "",
  prefix = "",
  delay = 0,
}: {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  delay?: number;
}) => {
  const { ref, visible } = useScrollReveal();
  const count = useAnimatedCounter(visible ? value : 0, 2000, delay);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary font-mono cyber-text-glow animate-count-up">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-muted-foreground font-mono mt-1">{label}</div>
    </div>
  );
};

export default AnimatedStat;
