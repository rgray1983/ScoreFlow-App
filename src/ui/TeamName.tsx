import { stackTeamNameLines } from "./boardChrome";

type TeamNameProps = {
  name: string;
  className?: string;
};

export function TeamName({ name, className = "" }: TeamNameProps) {
  return (
    <span className={className}>
      {stackTeamNameLines(name).map((line, index) => (
        <span key={`${index}-${line}`}>{line}</span>
      ))}
    </span>
  );
}
