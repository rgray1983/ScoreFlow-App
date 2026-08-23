import { useEffect, useState } from "react";
import { useAccount } from "../state/account";
import { hasCloudAccount } from "../live/firebase";
import { resizeAvatarFile } from "../lib/logo";
import { profileInitials } from "../storage/accountProfile";
import { toast } from "../state/toast";
import { Button } from "../ui/Button";
import { Field, TextInput } from "../ui/Field";
import { CameraIcon } from "../ui/icons";
import { Avatar } from "../ui/Avatar";
import { InnerScreen } from "./InnerScreen";
import styles from "./AccountPage.module.css";
import innerStyles from "./InnerScreen.module.css";
import settingsStyles from "./SettingsPages.module.css";

export function AccountPage() {
  const account = useAccount();
  const signedIn = hasCloudAccount(account.user);
  const [name, setName] = useState(account.displayName);
  const initials = profileInitials(account.displayName, account.user?.email || account.email);

  useEffect(() => {
    account.boot();
  }, [account.boot]);

  useEffect(() => {
    setName(account.displayName);
  }, [account.displayName]);

  function saveName() {
    const next = name.trim();
    if (next === account.displayName) return;
    void account.setDisplayName(next);
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    try {
      await account.setAvatar(await resizeAvatarFile(file));
    } catch {
      toast("Could not read that photo.", true);
    }
  }

  return (
    <InnerScreen
      eyebrow="Account"
      title="Your Scorer Profile."
      copy="This name and photo are yours. They can show on the live viewer later as who's scoring the match."
      backTo="/"
    >
      <section className={`${innerStyles.card} ${styles.hero}`}>
        <label className={styles.photo}>
          <input
            type="file"
            accept="image/*"
            aria-label="Change photo"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void onAvatar(file);
            }}
          />
          <Avatar
            name={account.displayName}
            photo={account.avatar}
            initials={initials}
            size="lg"
          />
          <span className={styles.camera} aria-hidden="true">
            <CameraIcon className={styles.cameraIcon} />
          </span>
        </label>
        <p className={styles.hint}>Tap the photo to change it</p>
        <div className={styles.nameField}>
          <Field label="Display name">
            <TextInput
              value={name}
              maxLength={32}
              placeholder="Name shown on live matches"
              autoComplete="nickname"
              onChange={(event) => setName(event.target.value)}
              onBlur={saveName}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
          </Field>
        </div>
      </section>

      <section className={`${innerStyles.card} ${settingsStyles.accountCard}`}>
        <div className={styles.identity}>
          <span>Sign in</span>
          <strong>{signedIn ? account.user?.email : "Not signed in"}</strong>
          <small>
            {signedIn
              ? "Your profile can sync with this account. ScoreFlow Pro billing will live here."
              : "Sign in to keep your profile, history, and future Pro billing on this account."}
          </small>
        </div>
        {signedIn ? (
          <div className={settingsStyles.accountActions}>
            <Button type="button" tone="quiet" disabled={account.busy} onClick={() => void account.signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <form
            className={settingsStyles.accountForm}
            onSubmit={(event) => {
              event.preventDefault();
              void account.signInEmail(false);
            }}
          >
            <Field label="Email">
              <TextInput
                type="email"
                autoComplete="email"
                value={account.email}
                onChange={(event) => account.setEmail(event.target.value)}
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                autoComplete="current-password"
                value={account.password}
                onChange={(event) => account.setPassword(event.target.value)}
              />
            </Field>
            <div className={settingsStyles.accountActions}>
              <Button type="submit" disabled={account.busy}>Sign in</Button>
              <Button type="button" tone="quiet" disabled={account.busy} onClick={() => void account.signInEmail(true)}>
                Create account
              </Button>
              <Button type="button" tone="quiet" disabled={account.busy} onClick={() => void account.signInProvider("google")}>
                Continue with Google
              </Button>
              <Button type="button" tone="quiet" disabled={account.busy} onClick={() => void account.signInProvider("apple")}>
                Continue with Apple
              </Button>
            </div>
          </form>
        )}
      </section>
    </InnerScreen>
  );
}
