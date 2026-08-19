import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field, SelectInput, TextInput } from "../ui/Field";
import { Swatches } from "../ui/Swatches";
import { InnerScreen } from "./InnerScreen";
import { matchHasProgress } from "../storage/matchEngine";
import { useWorkspace } from "../state/workspace";
import styles from "./InnerScreen.module.css";
import setupStyles from "./SetupPage.module.css";

export function SetupPage() {
  const navigate = useNavigate();
  const fromMatch = Boolean((useLocation().state as { fromMatch?: boolean } | null)?.fromMatch);
  const draft = useWorkspace((state) => state.draft);
  const engine = useWorkspace((state) => state.engine);
  const updateDraft = useWorkspace((state) => state.updateDraft);
  const applyHomeTeamToDraft = useWorkspace((state) => state.applyHomeTeamToDraft);
  const startMatch = useWorkspace((state) => state.startMatch);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    applyHomeTeamToDraft();
  }, [applyHomeTeamToDraft]);

  function beginMatch() {
    startMatch();
    setConfirmOpen(false);
    navigate("/match");
  }

  return (
    <InnerScreen
      eyebrow="Match Setup"
      title="Your Match. Your Way."
      copy="Set names, colors, and format before the first serve."
      backTo={fromMatch ? "/match" : "/"}
    >
      <section className={styles.card}>
        <Field label="Match title">
          <TextInput value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} />
        </Field>
        <div className={setupStyles.gap} />
        <Field label="Match format">
          <SelectInput
            value={draft.format}
            onChange={(event) => updateDraft({ format: event.target.value === "highschool" ? "highschool" : "club" })}
          >
            <option value="club">Club — Best 2 of 3</option>
            <option value="highschool">High School — Best 3 of 5</option>
          </SelectInput>
        </Field>
      </section>

      <section className={styles.card}>
        <h2>Teams</h2>
        <div className={setupStyles.teams}>
          <div>
            <Field label="Home team">
              <TextInput value={draft.homeName} onChange={(event) => updateDraft({ homeName: event.target.value })} />
            </Field>
            <Swatches label="Home Color" value={draft.homeColor} onChange={(homeColor) => updateDraft({ homeColor })} />
          </div>
          <div>
            <Field label="Visitor team">
              <TextInput value={draft.awayName} onChange={(event) => updateDraft({ awayName: event.target.value })} />
            </Field>
            <Swatches label="Visitor Color" value={draft.awayColor} onChange={(awayColor) => updateDraft({ awayColor })} />
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <Button
          onClick={() => {
            if (matchHasProgress(engine)) setConfirmOpen(true);
            else beginMatch();
          }}
        >
          Start Scoreboard
        </Button>
        <Button to={fromMatch ? "/match" : "/"} tone="quiet">{fromMatch ? "Back to Match" : "Back Home"}</Button>
      </div>

      <Dialog
        open={confirmOpen}
        title="Replace the current match?"
        copy="Scores and sets on the board will be cleared. Names and colors from this screen will be used."
        confirmLabel="Start Scoreboard"
        onConfirm={beginMatch}
        onCancel={() => setConfirmOpen(false)}
      />
    </InnerScreen>
  );
}
