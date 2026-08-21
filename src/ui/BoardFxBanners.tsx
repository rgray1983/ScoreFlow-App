import type { MatchState, Side } from "../scoring";
import { pointBannerCopy } from "./boardChrome";
import styles from "../screens/MatchPage.module.css";

type BoardFxBannersProps = {
  match: MatchState;
  pointSide: Side | null;
  pointKey: number;
  setWinnerSide: Side | null;
  setWinnerKey: number;
};

export function BoardFxBanners({
  match,
  pointSide,
  pointKey,
  setWinnerSide,
  setWinnerKey
}: BoardFxBannersProps) {
  if (!pointSide && !setWinnerSide) return null;

  const pointName = pointSide === "home" ? match.homeName : pointSide === "away" ? match.awayName : "";
  const pointColor = pointSide === "home" ? match.homeColor : pointSide === "away" ? match.awayColor : match.homeColor;

  return (
    <div className={styles.fxSlot} aria-live="polite">
      {pointSide ? (
        <span
          key={`point-${pointKey}`}
          className={`${styles.pointBanner} ${styles.pointBannerShow} scoreflow-board-fx`}
          style={{ ["--point-banner-color" as string]: pointColor }}
        >
          {pointBannerCopy(pointName)}
        </span>
      ) : null}
      {setWinnerSide ? (
        <div
          key={`set-${setWinnerKey}`}
          className={`${styles.setWinBadge} ${styles.setWinShow} scoreflow-board-fx`}
        >
          Winner!
        </div>
      ) : null}
    </div>
  );
}
