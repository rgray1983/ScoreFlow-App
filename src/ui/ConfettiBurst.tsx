import styles from "./ConfettiBurst.module.css";

type ConfettiBurstProps = {
  active: boolean;
  colors: string[];
};

export function ConfettiBurst({ active, colors }: ConfettiBurstProps) {
  if (!active) return null;
  const palette = colors.length ? colors : ["#fff"];
  const pieces = Array.from({ length: 56 }, (_, index) => ({
    id: index,
    left: `${(index * 17) % 100}%`,
    delay: `${(index % 8) * 0.05}s`,
    duration: `${1.15 + (index % 5) * 0.12}s`,
    color: palette[index % palette.length],
    rotate: `${(index * 47) % 360}deg`,
    size: `${6 + (index % 7)}px`
  }));

  return (
    <div className={styles.burst} aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={styles.piece}
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.size,
            background: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            transform: `rotate(${piece.rotate})`
          }}
        />
      ))}
    </div>
  );
}
