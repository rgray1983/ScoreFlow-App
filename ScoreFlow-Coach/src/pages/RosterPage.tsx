import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import ContextBar from '../components/ContextBar';
import SelectField from '../components/SelectField';
import SlideOver from '../components/SlideOver';
import { useWorkspace } from '../context/WorkspaceContext';
import type { DominantHand, Player, PlayerStatus, RosterMembership } from '../types/workspace';

const positions = ['Outside Hitter','Middle Blocker','Opposite','Setter','Libero','Defensive Specialist'];
const rosterStatuses: PlayerStatus[] = ['active','limited','injured','away','inactive'];
const footOptions = [{ value:'', label:'Feet' }, ...Array.from({length:5},(_,i)=>({value:String(i+3),label:`${i+3} ft`}))];
const inchOptions = [{ value:'', label:'Inches' }, ...Array.from({length:12},(_,i)=>({value:String(i),label:`${i} in`}))];
type Filter = 'all'|'available'|'starters'|'captains'|'liberos'|'injured';

export default function RosterPage(){
  const workspace=useWorkspace();
  const [selectedPlayerId,setSelectedPlayerId]=useState<string|null>(null);
  const [creating,setCreating]=useState(false);
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState<Filter>('all');
  const selectedPlayer=workspace.players.find((p)=>p.id===selectedPlayerId);
  const roster=workspace.rosterMemberships.filter((m)=>m.teamId===workspace.activeTeamId&&m.seasonId===workspace.activeSeasonId);
  const rows=useMemo(()=>roster.map((membership)=>({membership,player:workspace.players.find((p)=>p.id===membership.playerId)})).filter((row):row is {membership:RosterMembership;player:Player}=>Boolean(row.player&&!row.player.archived)),[roster,workspace.players]);
  const filtered=rows.filter(({membership,player})=>{
    const haystack=`${membership.jerseyNumber} ${player.firstName} ${player.lastName} ${player.preferredName} ${membership.position} ${player.primaryPosition}`.toLowerCase();
    if(query&&!haystack.includes(query.toLowerCase())) return false;
    if(filter==='available'&&!['active'].includes(membership.status)) return false;
    if(filter==='starters'&&!membership.starter) return false;
    if(filter==='captains'&&!membership.captain) return false;
    if(filter==='liberos'&&!membership.libero) return false;
    if(filter==='injured'&&membership.status!=='injured') return false;
    return true;
  });
  const available=rows.filter(({membership})=>membership.status==='active').length;
  const limited=rows.filter(({membership})=>membership.status==='limited').length;
  const injured=rows.filter(({membership})=>membership.status==='injured').length;
  const away=rows.filter(({membership})=>membership.status==='away').length;
  const canAdd=Boolean(workspace.activeOrganizationId&&workspace.activeTeamId&&workspace.activeSeasonId);
  const teamStyle={'--team-secondary':workspace.activeTeam?.secondaryColor??'#5d9df5'} as CSSProperties;
  const filters:[Filter,string][]=[['all','All'],['available','Available'],['starters','Starters'],['captains','Captains'],['liberos','Liberos'],['injured','Injured']];

  return <div className="roster-workspace" style={teamStyle}>
    <ContextBar label="Roster context" />
    <section className="roster-head panel">
      <div><p className="eyebrow">Season roster</p><h2>{workspace.activeTeam?.name??'Select a team'}</h2><p>{workspace.activeSeason?.name??'Select a season'} · {rows.length} players</p></div>
      <div className="roster-stats"><span><b>{available}</b>Available</span><span><b>{limited}</b>Limited</span><span><b>{injured}</b>Injured</span><span><b>{away}</b>Away</span></div>
      <button className="button button-primary" disabled={!canAdd} onClick={()=>setCreating(true)} type="button">＋ Add player</button>
    </section>
    <section className="roster-tools panel">
      <label className="roster-search"><span>⌕</span><input aria-label="Search roster" placeholder="Search name, number, or position" value={query} onChange={(e)=>setQuery(e.target.value)} /></label>
      <div className="roster-filters">{filters.map(([value,label])=><button className={filter===value?'is-active':''} key={value} onClick={()=>setFilter(value)} type="button">{label}</button>)}</div>
    </section>
    <section className="roster-list-panel panel">
      <header><div><p className="eyebrow">Active roster</p><h3>{filtered.length} shown</h3></div><span className="sync-pill"><span/> Saved on device</span></header>
      <div className="roster-list">{filtered.map(({player,membership})=><button className="roster-row" key={membership.id} onClick={()=>setSelectedPlayerId(player.id)} type="button">
        <span className="roster-number">#{membership.jerseyNumber||'—'}</span>
        <span className="roster-copy"><strong>{player.preferredName||player.firstName} {player.lastName}</strong><small>{membership.position||player.primaryPosition||'Position not set'} · Class of {player.graduationYear||'—'}</small></span>
        <span className="roster-roles">{membership.captain&&<em className="role-captain">Captain</em>}{membership.libero&&<em className="role-libero">Libero</em>}{membership.starter&&<em className="role-starter">Starter</em>}</span>
        <span className={`roster-availability availability-${membership.status}`}>{statusLabel(membership.status)}</span><span className="player-row-arrow">›</span>
      </button>)}{filtered.length===0&&<div className="players-empty"><span>◇</span><p>No roster players match this view.</p></div>}</div>
    </section>
    <SlideOver open={creating||Boolean(selectedPlayer)} title={creating?'Add player':'Edit roster player'} onClose={()=>{setCreating(false);setSelectedPlayerId(null)}}><PlayerForm player={selectedPlayer} onDone={()=>{setCreating(false);setSelectedPlayerId(null)}}/></SlideOver>
  </div>;
}

function PlayerForm({player,onDone}:{player?:Player;onDone:()=>void}){
  const workspace=useWorkspace();
  const membership=workspace.rosterMemberships.find((m)=>m.playerId===player?.id&&m.teamId===workspace.activeTeamId&&m.seasonId===workspace.activeSeasonId);
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);const playerInput={organizationId:workspace.activeOrganizationId,firstName:String(data.get('firstName')??'').trim(),lastName:String(data.get('lastName')??'').trim(),preferredName:String(data.get('preferredName')??'').trim(),graduationYear:String(data.get('graduationYear')??'').trim(),height:String(data.get('height')??'').trim(),dominantHand:String(data.get('dominantHand')) as DominantHand,primaryPosition:String(data.get('primaryPosition')??''),secondaryPosition:String(data.get('secondaryPosition')??''),notes:String(data.get('notes')??'').trim()};const playerId=player?.id??workspace.addPlayer(playerInput);if(player)workspace.updatePlayer(player.id,playerInput);const rosterInput={playerId,teamId:workspace.activeTeamId,seasonId:workspace.activeSeasonId,jerseyNumber:String(data.get('jerseyNumber')??'').trim(),position:String(data.get('rosterPosition')??''),status:String(data.get('status')) as PlayerStatus,captain:data.get('captain')==='on',libero:data.get('libero')==='on',starter:data.get('starter')==='on',notes:String(data.get('rosterNotes')??'').trim()};if(membership)workspace.updateRosterMembership(membership.id,rosterInput);else if(workspace.activeTeamId&&workspace.activeSeasonId)workspace.addRosterMembership(rosterInput);onDone()}
  const positionOptions=[{value:'',label:'Select position'},...positions.map((position)=>({value:position,label:position}))];
  return <form className="player-editor-form" onSubmit={submit}><section><p className="form-section-title">Player profile</p><div className="editor-grid"><label><span>First name</span><input autoFocus name="firstName" defaultValue={player?.firstName} required/></label><label><span>Last name</span><input name="lastName" defaultValue={player?.lastName} required/></label><label><span>Preferred name</span><input name="preferredName" defaultValue={player?.preferredName}/></label><label><span>Graduation year</span><input name="graduationYear" inputMode="numeric" maxLength={4} defaultValue={player?.graduationYear}/></label><label><span>Height</span><HeightPicker defaultValue={player?.height}/></label><label><span>Dominant hand</span><SelectField name="dominantHand" defaultValue={player?.dominantHand??'right'} options={[{value:'right',label:'Right'},{value:'left',label:'Left'},{value:'ambidextrous',label:'Ambidextrous'}]}/></label><label><span>Primary position</span><SelectField name="primaryPosition" defaultValue={player?.primaryPosition??''} options={positionOptions}/></label><label><span>Secondary position</span><SelectField name="secondaryPosition" defaultValue={player?.secondaryPosition??''} options={[{value:'',label:'None'},...positions.map((position)=>({value:position,label:position}))]}/></label></div></section><section><p className="form-section-title">Season roster</p><div className="editor-grid"><label><span>Jersey number</span><input name="jerseyNumber" inputMode="numeric" defaultValue={membership?.jerseyNumber}/></label><label><span>Roster position</span><input name="rosterPosition" defaultValue={membership?.position} placeholder="OH"/></label><label><span>Availability</span><SelectField name="status" defaultValue={membership?.status??'active'} options={rosterStatuses.map((status)=>({value:status,label:statusLabel(status)}))}/></label></div><div className="role-checks"><label><input type="checkbox" name="captain" defaultChecked={membership?.captain}/> Captain</label><label><input type="checkbox" name="libero" defaultChecked={membership?.libero}/> Libero</label><label><input type="checkbox" name="starter" defaultChecked={membership?.starter}/> Starter</label></div></section><label className="notes-field"><span>Coach notes</span><textarea name="notes" defaultValue={player?.notes} rows={3}/></label><div className="slide-form-actions"><button className="button button-quiet" type="button" onClick={onDone}>Cancel</button><button className="button button-primary" type="submit">Save player</button></div></form>
}

function HeightPicker({defaultValue=''}:{defaultValue?:string}){const initial=parseHeight(defaultValue);const[feet,setFeet]=useState(initial.feet);const[inches,setInches]=useState(initial.inches);const value=feet?`${feet}′${inches||'0'}″`:'';return <div className="height-picker"><input name="height" type="hidden" value={value}/><SelectField ariaLabel="Height in feet" value={feet} onChange={setFeet} options={footOptions}/><SelectField ariaLabel="Height in inches" value={inches} onChange={setInches} options={inchOptions} disabled={!feet}/></div>}
function parseHeight(value:string){const match=value.match(/(\d+)\D+(\d+)/);return{feet:match?.[1]??'',inches:match?.[2]??''}}
function statusLabel(status:PlayerStatus){return status==='active'?'Available':status[0].toUpperCase()+status.slice(1)}
