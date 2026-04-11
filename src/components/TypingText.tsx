import { useTypingEffect } from "@/hooks/useAnimations";

const TypingText = ({
  text,
  speed = 50,
  delay = 0,
  className = "",
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}) => {
  const { displayed, done } = useTypingEffect(text, speed, delay);

  return (
    <span className={className}>
      {displayed}
      <span className={`border-r-2 border-primary ml-0.5 ${done ? "animate-typing-cursor" : ""}`}>
        &nbsp;
      </span>
    </span>
  );
};

export default TypingText;
