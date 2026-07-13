import { useMemo, useState } from 'react';
import type { MatchFormat, MatchSide, ScheduleEvent, ScheduleLocationType } from '../types/workspace';

type SetupPlayer = { id:string; name:string; number:string; position:string; libero:boolean; starter:boolean; photoUrl:string };
export type MatchSetupValue = {
  scheduleEventId:string;
  opponent:string;
  locationType:ScheduleLocationType;
  format:MatchFormat;
  regularSetTarget:number;
  decidingSetTarget:number;
  winByTwo:boolean;
  initialServe:MatchSide;
  startingPlayerIds:string[];
  liberoPlayerId:string;
  rotation:number;
};

type Props = {
  teamName:string;
  events:ScheduleEvent[];
  players:SetupPlayer[];
  onCancel:()=>void;
  onStart:(value:MatchSetupValue)=>void;
};

export default function MatchSetupScreen({teamName,events,players,onCancel,onStart}:Props){
  const matchEvents=useMemo(()=>events.filter((event)=>event.type==='match'&&event.status!=='completed').sort((a,b)=>`${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),[events]);
  const [eventId,setEventId]=useState(matchEvents[0]?.id??'quick');
  const selectedEvent=matchEvents.find((event)=>event.id===eventId);
  const [quickOpponent,setQuickOpponent]=useState('');
  const [quickLocation,setQuickLocation]=useState<ScheduleLocationType>('home');
  const [format,setFormat]=useState<MatchFormat>('best-of-5');
  const [regularTarget,setRegularTarget]=useState(25);
  const [decidingTarget,setDecidingTarget]=useState(15);
  const [winByTwo,setWinByTwo]=useState(true);
  const [serve,setServe]=useState<MatchSide>('home');
  const defaultStarters=players.filter((player)=>player.starter&&!player.libero).slice(0,6).map((player)=>player.id);
  const [starters,setStarters]=useState<string[]>(defaultStarters.length===6?defaultStarters:players.filter((player)=>!player.libero).slice(0,6).map((player)=>player.id));
  const defaultLibero=players.find((player)=>player.libero)?.id??'';
  const [liberoId,setLiberoId]=useState(defaultLibero);
  const [rotation,setRotation]=useState(1);
  const opponent=selectedEvent?.opponent??quickOpponent.trim();
  const locationType=selectedEvent?.locationType??quickLocation;
  const canStart=Boolean(opponent&&starters.length===6);

  function toggleStarter(id:string){setStarters((current)=>current.includes(id)?current.filter((item)=>item!==id):current.length<6?[...current,id]:current)}
  function submit(){if(!canStart)return;onStart({scheduleEventId:selectedEvent?.id??'',opponent,locationType,format,regularSetTarget:regularTarget,decidingSetTarget:decidingTarget,winByTwo,initialServe:serve,startingPlayerIds:starters,liberoPlayerId:liberoId,rotation})}

  return <div className="match-setup-screen">
    <header className="match-setup-header"><button className="live-home" onClick={onCancel} type="button" aria-label="Return to Coach Hub">⌂</button><div><p className="eyebrow">ScoreFlow Coach</p><h1>Match setup</h1></div><span className="setup-step">Ready room</span></header>
    <main className="match-setup-layout">
      <section className="match-setup-panel setup-match-card">
        <div className="setup-heading"><div><p className="eyebrow">Match</p><h2>Choose today’s match</h2></div><span>{teamName}</span></div>
        <div className="scheduled-match-grid">{matchEvents.map((event)=><button className={eventId===event.id?'is-selected':''} key={event.id} onClick={()=>setEventId(event.id)} type="button"><small>{formatDate(event.date)} · {formatTime(event.startTime)}</small><strong>{event.opponent||event.title}</strong><span>{event.locationType.toUpperCase()} · {event.venue||'Venue not set'}</span></button>)}<button className={eventId==='quick'?'is-selected':''} onClick={()=>setEventId('quick')} type="button"><small>Unscheduled</small><strong>Quick Match</strong><span>Enter the opponent now</span></button></div>
        {eventId==='quick'&&<div className="quick-match-fields"><label><span>Opponent</span><input value={quickOpponent} onChange={(event)=>setQuickOpponent(event.target.value)} placeholder="Opponent team name" /></label><label><span>Location</span><select value={quickLocation} onChange={(event)=>setQuickLocation(event.target.value as ScheduleLocationType)}><option value="home">Home</option><option value="away">Away</option><option value="neutral">Neutral</option></select></label></div>}
      </section>

      <section className="match-setup-panel setup-rules-card">
        <div className="setup-heading"><div><p className="eyebrow">Rules</p><h2>Match format</h2></div></div>
        <div className="format-toggle"><button className={format==='best-of-3'?'is-selected':''} onClick={()=>setFormat('best-of-3')} type="button">Best of 3<small>First to 2 sets</small></button><button className={format==='best-of-5'?'is-selected':''} onClick={()=>setFormat('best-of-5')} type="button">Best of 5<small>First to 3 sets</small></button></div>
        <div className="rules-grid"><label><span>Regular sets</span><select value={regularTarget} onChange={(event)=>setRegularTarget(Number(event.target.value))}><option value={25}>25 points</option><option value={21}>21 points</option></select></label><label><span>Deciding set</span><select value={decidingTarget} onChange={(event)=>setDecidingTarget(Number(event.target.value))}><option value={15}>15 points</option><option value={25}>25 points</option></select></label><label className="rule-check"><input type="checkbox" checked={winByTwo} onChange={(event)=>setWinByTwo(event.target.checked)} /><span>Win by two</span></label></div>
        <div className="serve-choice"><span>First serve</span><button className={serve==='home'?'is-selected':''} onClick={()=>setServe('home')} type="button">{teamName}</button><button className={serve==='away'?'is-selected':''} onClick={()=>setServe('away')} type="button">{opponent||'Opponent'}</button></div>
      </section>

      <section className="match-setup-panel setup-lineup-card">
        <div className="setup-heading"><div><p className="eyebrow">Lineup</p><h2>Starting six</h2></div><strong>{starters.length}/6 selected</strong></div>
        <div className="setup-player-grid">{players.filter((player)=>!player.libero).map((player)=><button className={starters.includes(player.id)?'is-selected':''} key={player.id} onClick={()=>toggleStarter(player.id)} type="button">{player.photoUrl?<img src={player.photoUrl} alt="" />:<span>#{player.number}</span>}<strong>{player.name}</strong><small>{player.position}</small></button>)}</div>
        <div className="lineup-footer"><label><span>Libero</span><select value={liberoId} onChange={(event)=>setLiberoId(event.target.value)}><option value="">No Libero</option>{players.map((player)=><option key={player.id} value={player.id}>#{player.number} {player.name}</option>)}</select></label><label><span>Initial rotation</span><select value={rotation} onChange={(event)=>setRotation(Number(event.target.value))}>{[1,2,3,4,5,6].map((value)=><option key={value} value={value}>Rotation {value}</option>)}</select></label></div>
      </section>

      <footer className="match-setup-actions"><div><strong>{opponent?`${teamName} vs. ${opponent}`:'Choose or enter an opponent'}</strong><small>{format==='best-of-5'?'First to 3 sets':'First to 2 sets'} · {regularTarget} points · deciding set to {decidingTarget}</small></div><button className="button button-quiet" onClick={onCancel} type="button">Cancel</button><button className="button button-primary" disabled={!canStart} onClick={submit} type="button">Start Match</button></footer>
    </main>
  </div>
}

function formatDate(value:string){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`))}
function formatTime(value:string){if(!value)return'TBD';const[hours,minutes]=value.split(':').map(Number);return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(2000,0,1,hours,minutes))}
