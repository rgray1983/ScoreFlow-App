import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_HOME_COLOR } from "../lib/color";
import { Button } from "../ui/Button";
import { ColorPicker } from "../ui/ColorPicker";
import { Field, SelectInput, TextInput } from "../ui/Field";
import { LogoUploader } from "../ui/LogoUploader";
import { InnerScreen } from "./InnerScreen";
import { useWorkspace } from "../state/workspace";
import { usePremium } from "../state/premium";
import type { RosterPlayer, TeamProfile } from "../storage/teams";
import styles from "./InnerScreen.module.css";
import teamStyles from "./TeamPage.module.css";

export function TeamPage() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const isPro = usePremium((state) => state.isPro);
  const [id, setId] = useState(workspace.selectedTeamId);
  const home = workspace.homeTeam;
  const [name, setName] = useState(home?.name && home.name !== "Team 1" ? home.name : "");
  const [location, setLocation] = useState(home?.location || "");
  const [color, setColor] = useState(home?.color || DEFAULT_HOME_COLOR);
  const [logo, setLogo] = useState(home?.logo || "");
  const [roster, setRoster] = useState<RosterPlayer[]>(workspace.teams.find((t) => t.id === id)?.roster || []);
  const [error, setError] = useState("");
  function edit(team?: TeamProfile) {
    setId(team?.id || ""); setName(team?.name || ""); setLocation(team?.location || "");
    setColor(team?.color || DEFAULT_HOME_COLOR); setLogo(team?.logo || "");
    setRoster(team?.roster || []); setError("");
  }
  function player(index: number, patch: Partial<RosterPlayer>) {
    setRoster((current) => current.map((p, i) => i === index ? { ...p, ...patch } : p));
  }
  return <InnerScreen eyebrow={isPro ? "Pro Teams" : "Home Team"} title={isPro ? "Your Teams." : "Setup Your Home Team."}
    copy={isPro ? "Save each team's look and a simple roster for scoring highlights. Saved on this device." : "Set this up once. Match setup will fill in your name, color, and logo."}>
    {isPro ? <section className={`${styles.card} ${styles.form}`}>
      <Field label="Saved team"><SelectInput value={id} onChange={(e) => edit(workspace.teams.find((t) => t.id === e.target.value))}>
        <option value="">New team</option>
        {workspace.teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}
      </SelectInput></Field>
      <Button tone="quiet" onClick={() => edit()}>Create Team</Button>
    </section> : null}
    <section className={`${styles.card} ${styles.form}`}>
      <LogoUploader name={name || "T"} logo={logo} color={color} onChange={setLogo} onError={setError} />
      <Field label="Team Name"><TextInput value={name} maxLength={60} placeholder="Team Name" onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="City, State"><TextInput value={location} maxLength={80} placeholder="City, State" onChange={(e) => setLocation(e.target.value)} /></Field>
      <ColorPicker value={color} onChange={setColor} />
    </section>
    {isPro ? <section className={`${styles.card} ${styles.form}`}>
      <h2>Roster</h2><p>Optional. Tap a player during a match to call an Ace, Kill, or Block. No player statistics.</p>
      {roster.map((p, index) => <div key={p.id} className={teamStyles.player}>
        <Field label="Number"><TextInput aria-label={`Player ${index + 1} number`} inputMode="numeric" maxLength={3} value={p.number} onChange={(e) => player(index, { number: e.target.value.replace(/[^0-9]/g, "") })} /></Field>
        <Field label="Name"><TextInput aria-label={`Player ${index + 1} name`} maxLength={32} value={p.name} onChange={(e) => player(index, { name: e.target.value })} /></Field>
        <button type="button" className={teamStyles.remove} aria-label={`Remove player ${index + 1}`} onClick={() => setRoster((r) => r.filter((x) => x.id !== p.id))}>×</button>
      </div>)}
      <Button tone="quiet" onClick={() => setRoster((r) => [...r, { id: crypto.randomUUID(), name: "", number: "" }])}>Add Player</Button>
    </section> : <p className={styles.note}>Pro adds multiple saved teams, rosters, and player highlights.</p>}
    {error ? <p role="alert" className={styles.note}>{error}</p> : null}
    <div className={styles.actions}><Button onClick={() => {
      if (!name.trim()) { setError("Enter your team name."); return; }
      if (isPro && roster.some((p) => !p.name.trim())) { setError("Enter a name for each player, or remove the empty row."); return; }
      try {
        if (isPro) workspace.saveTeamProfile({ id: id || crypto.randomUUID(), name, location, color, logo, roster });
        else workspace.saveHomeTeam({ name, location, color, logo });
        navigate("/");
      } catch (e) { setError(e instanceof Error ? e.message : "Team could not be saved."); }
    }}>{isPro ? "Save Team" : "Save Home Team"}</Button><Button to="/" tone="quiet">Cancel</Button></div>
  </InnerScreen>;
}
