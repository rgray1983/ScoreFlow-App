import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAccount } from "../state/account";
import { usePremium } from "../state/premium";
import { toast } from "../state/toast";
import { hasCloudAccount } from "../live/firebase";
import { PREMIUM_THEMES, RESULTS_BACKGROUNDS, resultsBackgroundSrc, type ThemeId } from "../storage/premium";
import { ChevronIcon } from "../ui/icons";
import { Avatar } from "../ui/Avatar";
import { ProCard } from "../ui/ProCard";
import { StackedText } from "../ui/StackedText";
import { profileInitials } from "../storage/accountProfile";
import { InnerScreen } from "./InnerScreen";
import styles from "./InnerScreen.module.css";
import settingsStyles from "./SettingsPages.module.css";

function themeDotClass(id: ThemeId): string {
  const dots: Record<ThemeId, string> = {
    classic: settingsStyles.theme_classic,
    championship: settingsStyles.theme_championship,
    neon: settingsStyles.theme_neon,
    midnight: settingsStyles.theme_midnight,
    ice: settingsStyles.theme_ice,
    fire: settingsStyles.theme_fire
  };
  return dots[id];
}

export function SettingsPage() {
  const isPro = usePremium((state) => state.isPro);
  const cloudBackup = usePremium((state) => state.cloudBackup);
  const setCloudBackup = usePremium((state) => state.setCloudBackup);
  const requestProFocus = usePremium((state) => state.requestProFocus);
  const account = useAccount();
  const signedIn = hasCloudAccount(account.user);
  const backupOn = isPro && cloudBackup;
  const backupLabel = isPro ? (backupOn ? "On" : "Off") : "Pro";
  const backupCopy = isPro
    ? "Pro keeps unlimited match history in this app and syncs it to your account when cloud backup is on."
    : "Free keeps your latest 3 matches. Pro unlocks unlimited match history and account cloud backup.";

  useEffect(() => {
    account.boot();
  }, [account.boot]);

  function onBackupToggle(checked: boolean) {
    if (!isPro) {
      requestProFocus();
      toast("Cloud backup is a Pro feature", true);
      return;
    }
    if (checked && !signedIn) {
      toast("Sign in to use cloud backup", true);
      return;
    }
    setCloudBackup(checked);
  }

  return (
    <InnerScreen
      eyebrow="Settings"
      title="Your ScoreFlow. Your Way."
      copy="Control the look, backups, and premium features that make ScoreFlow feel like your team's app."
    >
      <Link className={`${styles.card} ${styles.navCard}`} to="/account">
        <span className={settingsStyles.accountNav}>
          <Avatar
            name={account.displayName}
            photo={account.avatar}
            initials={profileInitials(account.displayName, account.user?.email || account.email)}
            size="md"
          />
          <StackedText
            title="Account"
            copy={signedIn ? account.user?.email || "Signed in" : "Sign in, name, and photo"}
          />
        </span>
        <ChevronIcon className={styles.chevron} />
      </Link>
      <Link className={`${styles.card} ${styles.navCard}`} to="/settings/themes">
        <StackedText title="Themes" copy="Choose the app's visual style." />
        <ChevronIcon className={styles.chevron} />
      </Link>
      <Link className={`${styles.card} ${styles.navCard}`} to="/settings/graphics">
        <StackedText title="Background Graphics" copy="Match Results and social share backgrounds." />
        <ChevronIcon className={styles.chevron} />
      </Link>

      <section className={`${styles.card} ${settingsStyles.cloudCard}`}>
        <StackedText title="Cloud Backup" copy={backupCopy} />
        <button
          type="button"
          className={`${settingsStyles.toggle} ${backupOn ? settingsStyles.toggleOn : ""} ${isPro ? "" : settingsStyles.toggleLocked}`}
          role="switch"
          aria-checked={backupOn}
          aria-label="Cloud Backup"
          onClick={() => onBackupToggle(!backupOn)}
        >
          <span className={settingsStyles.track} aria-hidden="true">
            <span className={settingsStyles.knob} />
          </span>
          <b>{backupLabel}</b>
        </button>
      </section>

      <ProCard variant="settings" />
    </InnerScreen>
  );
}

export function SettingsThemesPage() {
  const navigate = useNavigate();
  const theme = usePremium((state) => state.theme);
  const isPro = usePremium((state) => state.isPro);
  const setTheme = usePremium((state) => state.setTheme);

  return (
    <InnerScreen
      eyebrow="Themes"
      title="Choose Your Look."
      copy="Classic is free. Premium themes unlock with ScoreFlow Pro."
      backTo="/settings"
    >
      <div className={settingsStyles.choiceGrid}>
        {PREMIUM_THEMES.map((item) => {
          const locked = item.pro && !isPro;
          const active = item.id === theme;
          return (
            <button
              key={item.id}
              type="button"
              className={`${settingsStyles.choice} ${active ? settingsStyles.active : ""} ${locked ? settingsStyles.locked : ""}`}
              onClick={() => {
                if (!setTheme(item.id)) navigate("/settings");
              }}
            >
              <span className={`${settingsStyles.themeDot} ${themeDotClass(item.id)}`} />
              <StackedText title={item.name} copy={locked ? "Pro unlock" : item.tag} />
              <b>{active ? "✓" : locked ? "★" : ""}</b>
            </button>
          );
        })}
      </div>
    </InnerScreen>
  );
}

export function SettingsGraphicsPage() {
  const navigate = useNavigate();
  const resultBackground = usePremium((state) => state.resultBackground);
  const isPro = usePremium((state) => state.isPro);
  const setResultBackground = usePremium((state) => state.setResultBackground);

  return (
    <InnerScreen
      eyebrow="Background Graphics"
      title="Results That Pop."
      copy="This graphic is used on Match Results and when you share or download. Your pick is saved on this device."
      backTo="/settings"
    >
      <div className={settingsStyles.choiceGrid}>
        {RESULTS_BACKGROUNDS.map((item) => {
          const locked = item.pro && !isPro;
          const active = item.id === resultBackground;
          return (
            <button
              key={item.id}
              type="button"
              className={`${settingsStyles.choice} ${settingsStyles.graphicChoice} ${active ? settingsStyles.active : ""} ${locked ? settingsStyles.locked : ""}`}
              onClick={() => {
                if (!setResultBackground(item.id)) navigate("/settings");
              }}
            >
              <span
                className={settingsStyles.graphicThumb}
                style={{ backgroundImage: `url("${resultsBackgroundSrc(item.id)}")` }}
              />
              <StackedText title={item.name} copy={locked ? "Pro graphic" : "Free graphic"} />
              <b>{active ? "✓" : locked ? "★" : ""}</b>
            </button>
          );
        })}
      </div>
    </InnerScreen>
  );
}
