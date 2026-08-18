import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_HOME_COLOR } from "../lib/color";
import { Button } from "../ui/Button";
import { ColorPicker } from "../ui/ColorPicker";
import { Field, TextInput } from "../ui/Field";
import { LogoUploader } from "../ui/LogoUploader";
import { InnerScreen } from "./InnerScreen";
import { useWorkspace } from "../state/workspace";
import styles from "./InnerScreen.module.css";

export function TeamPage() {
  const navigate = useNavigate();
  const homeTeam = useWorkspace((state) => state.homeTeam);
  const saveHomeTeam = useWorkspace((state) => state.saveHomeTeam);
  const [name, setName] = useState(homeTeam?.name && homeTeam.name !== "Team 1" ? homeTeam.name : "");
  const [location, setLocation] = useState(homeTeam?.location || "");
  const [color, setColor] = useState(homeTeam?.color || DEFAULT_HOME_COLOR);
  const [logo, setLogo] = useState(homeTeam?.logo || "");
  const [error, setError] = useState("");

  return (
    <InnerScreen
      eyebrow="Home Team"
      title="Setup Your Home Team."
      copy="Set this up once. Match setup will fill in your name, color, and logo."
    >
      <section className={`${styles.card} ${styles.form}`}>
        <LogoUploader
          name={name || "T"}
          logo={logo}
          color={color}
          onChange={(next) => {
            setError("");
            setLogo(next);
          }}
          onError={setError}
        />
        <Field label="Team Name">
          <TextInput value={name} placeholder="Sandhills Blazers" onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="City, State">
          <TextInput value={location} placeholder="Sandhills, SC" onChange={(event) => setLocation(event.target.value)} />
        </Field>
        <ColorPicker value={color} onChange={setColor} />
      </section>
      {error ? <p className={styles.note}>{error}</p> : null}
      <div className={styles.actions}>
        <Button
          onClick={() => {
            if (!name.trim()) {
              setError("Enter your team name.");
              return;
            }
            saveHomeTeam({ name: name.trim(), location: location.trim(), color, logo });
            navigate("/");
          }}
        >
          Save Home Team
        </Button>
        <Button to="/" tone="quiet">Cancel</Button>
      </div>
    </InnerScreen>
  );
}
