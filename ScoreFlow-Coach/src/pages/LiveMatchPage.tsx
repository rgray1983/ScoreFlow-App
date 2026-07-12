import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';

type Side = 'home' | 'away';
type StatAction = 'Kill'|'Attack error'|'Ace'|'Serve error'|'Dig'|'Block touch'|'Solo block'|'Assist'|'Pass 0'|'Pass 1'|'Pass 2'|'Pass 3';
type LiveEvent = { id:string; kind:'score'|'stat'|'rotation'|'sub'|'timeout'|'system'; label:string; at:string };
type CourtPoint = { x:number; y:number };
type MatchState = { homeScore:number; awayScore:number; set:number; homeSets:number; awaySets:number; serving:Side; rotation:number; courtIds:string[]; benchIds:string[]; positions:Record<string,CourtPoint>; selectedPlayerId:string; events:LiveEvent[]; homeTimeouts:number; awayTimeouts:number; opponent:string; started:boolean };
type CourtPlayer = { id:string; name:string; number:string; position:string; libero:boolean };

const STORAGE_KEY='scoreflow-live-match-v2';
const statActions:StatAction[]=['Kill','Attack error','Ace','Serve error','Dig','Block touch','Solo block','Assist','Pass 0','Pass 1','Pass 2','Pass 3'];
const defaultPoints:CourtPoint[]=[{x:18,y:28},{x:50,y:28},{x:82,y:28},{x:18,y:68},{x:50,y:68},{x:82,y:68}];

export default function LiveMatchPage(){
  const workspace=useWorkspace();
  const navigate=useNavigate();
  const roster=useMemo(()=>workspace.rosterMemberships.filter((m)=>m.teamId===workspace.activeTeamId&&m.seasonId===workspace.activeSeasonId).map((membership)=>({membership,player:workspace.players.find((p)=>p.id===membership.playerId)})).filter((row):row is {membership:typeof workspace.rosterMemberships[number];player:typeof workspace.players[number]}=>Boolean(row.player&&!row.player.archived)),[workspace]);
  const players=useMemo<CourtPlayer[]>(()=>roster.map(({membership,player})=>({id:player.id,name:`${player.preferredName||player.firstName} ${player.lastName}`,number:membership.jerseyNumber||'—',position:membership.position||player.primaryPosition||'—',libero:membership.libero})),[roster]);
  const scheduled=workspace.scheduleEvents.filter((e)=>e.teamId===workspace.activeTeamId&&e.seasonId===workspace.activeSeasonId&&e.type==='match').sort((a,b)=>`${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))[0];
  const [match,setMatch]=useState<MatchState>(()=>readState(players,scheduled?.opponent||'Opponent'));
  const [showTimeline,setShowTimeline]=useState(false);
  const [showExit,setShowExit]=useState(false);
  const [wheelPlayerId,setWheelPlayerId]=useState('');
  const [draggingId,setDraggingId]=useState('');
  const [subOut,setSubOut]=useState('');
  const [flash,setFlash]=useState('');
  const dragMoved=useRef(false);

  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(match)),[match]);
  useEffect(()=>{document.body.classList.add('live-match-active');return()=>document.body.classList.remove('live-match-active')},[]);
  const court=match.courtIds.map((id)=>players.find((p)=>p.id===id)).filter(Boolean) as CourtPlayer[];
  const bench=match.benchIds.map((id)=>players.find((p)=>p.id===id)).filter(Boolean) as CourtPlayer[];
  const wheelPlayer=players.find((p)=>p.id===wheelPlayerId);
  const style={'--live-primary':workspace.activeTeam?.primaryColor??'#ef3340','--live-secondary':workspace.activeTeam?.secondaryColor??'#f4c95d'} as CSSProperties;

  function addEvent(kind:LiveEvent['kind'],label:string){setMatch((current)=>({...current,events:[{id:`event-${Date.now()}-${Math.random()}`,kind,label,at:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})},...current.events].slice(0,120)}))}
  function score(side:Side,delta:number){setMatch((current)=>({...current,[side==='home'?'homeScore':'awayScore']:Math.max(0,current[side==='home'?'homeScore':'awayScore']+delta)}));addEvent('score',`${side==='home'?workspace.activeTeam?.name||'Home':match.opponent} ${delta>0?'+1':'-1'}`)}
  function recordStat(action:StatAction){if(!wheelPlayer)return;addEvent('stat',`#${wheelPlayer.number} ${wheelPlayer.name} · ${action}`);setFlash(`${wheelPlayer.name}: ${action}`);setWheelPlayerId('');setTimeout(()=>setFlash(''),900)}
  function rotate(){setMatch((current)=>{const ids=current.courtIds.length?[current.courtIds[current.courtIds.length-1],...current.courtIds.slice(0,-1)]:current.courtIds;const positions={...current.positions};ids.forEach((id,index)=>{positions[id]=defaultPoints[index]});return{...current,rotation:current.rotation===6?1:current.rotation+1,courtIds:ids,positions}});addEvent('rotation',`Rotated to R${match.rotation===6?1:match.rotation+1}`)}
  function substitute(inId:string){if(!subOut||!inId)return;setMatch((current)=>{const slot=current.courtIds.indexOf(subOut);const positions={...current.positions,[inId]:current.positions[subOut]??defaultPoints[Math.max(0,slot)]};delete positions[subOut];return{...current,courtIds:current.courtIds.map((id)=>id===subOut?inId:id),benchIds:[...current.benchIds.filter((id)=>id!==inId),subOut],positions,selectedPlayerId:inId}});const outgoing=players.find((p)=>p.id===subOut);const incoming=players.find((p)=>p.id===inId);addEvent('sub',`#${incoming?.number} ${incoming?.name} in · #${outgoing?.number} ${outgoing?.name} out`);setSubOut('')}
  function movePlayer(event:ReactPointerEvent<HTMLDivElement>){if(!draggingId)return;const rect=event.currentTarget.getBoundingClientRect();const x=Math.max(8,Math.min(92,((event.clientX-rect.left)/rect.width)*100));const y=Math.max(18,Math.min(88,((event.clientY-rect.top)/rect.height)*100));dragMoved.current=true;setMatch((current)=>({...current,positions:{...current.positions,[draggingId]:{x,y}}}))}
  function finishDrag(){if(!draggingId)return;const playerId=draggingId;setDraggingId('');if(!dragMoved.current)setWheelPlayerId(playerId)}
  function undo(){setMatch((current)=>({...current,events:current.events.slice(1)}));setFlash('Last timeline event removed');setTimeout(()=>setFlash(''),900)}
  async function enterFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen()}catch{/* browser may block */}}
  function saveExit(){if(document.fullscreenElement)void document.exitFullscreen();navigate('/')}
  function newMatch(){localStorage.removeItem(STORAGE_KEY);setMatch(buildInitial(players,scheduled?.opponent||'Opponent'));setWheelPlayerId('')}

  return <div className="live-match-mode" style={style}>
    <header className="live-scorebar">
      <button className="live-home" onClick={()=>setShowExit(true)} type="button" aria-label="Leave match">⌂</button>
      <div className="live-team-score home"><span>{workspace.activeTeam?.abbreviation||'HOME'}</span><div className="score-controls"><button onClick={()=>score('home',-1)} type="button">−</button><strong>{match.homeScore}</strong><button onClick={()=>score('home',1)} type="button">+1</button></div></div>
      <div className="live-match-center"><small>SET {match.set} · R{match.rotation}</small><b>{match.homeSets} — {match.awaySets}</b><button className={`serve-pill ${match.serving}`} onClick={()=>setMatch((c)=>({...c,serving:c.serving==='home'?'away':'home'}))} type="button">{match.serving==='home'?'HOME':'AWAY'} SERVE</button></div>
      <div className="live-team-score away"><span>{match.opponent}</span><div className="score-controls"><button onClick={()=>score('away',-1)} type="button">−</button><strong>{match.awayScore}</strong><button onClick={()=>score('away',1)} type="button">+1</button></div></div>
      <button className="fullscreen-button" onClick={enterFullscreen} type="button" aria-label="Fullscreen">⛶</button>
    </header>

    <main className="live-stage">
      <section className="live-court-wrap">
        <div className="live-court" onPointerMove={movePlayer} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
          <div className="opponent-zone"><span>{match.opponent}</span></div><div className="court-net"><span>NET</span></div>
          {court.slice(0,6).map((player,index)=>{const point=match.positions[player.id]??defaultPoints[index];return <button className={`court-player${match.selectedPlayerId===player.id?' is-selected':''}${player.libero?' is-libero':''}`} style={{left:`${point.x}%`,top:`${point.y}%`}} key={player.id} onPointerDown={(event)=>{event.currentTarget.setPointerCapture(event.pointerId);dragMoved.current=false;setDraggingId(player.id);setMatch((c)=>({...c,selectedPlayerId:player.id}))}} type="button"><b>#{player.number}</b><strong>{player.name.split(' ')[0]}</strong><small>{player.position}</small></button>})}
          {wheelPlayer&&match.positions[wheelPlayer.id]&&<div className="stat-wheel-backdrop" onPointerDown={()=>setWheelPlayerId('')}><div className="stat-wheel" onPointerDown={(e)=>e.stopPropagation()} style={{left:`${match.positions[wheelPlayer.id].x}%`,top:`${match.positions[wheelPlayer.id].y}%`}}><div className="stat-wheel-player"><b>#{wheelPlayer.number}</b><span>{wheelPlayer.name.split(' ')[0]}</span></div>{statActions.map((action,index)=><button className={`wheel-action wheel-${index+1}`} key={action} onClick={()=>recordStat(action)} type="button">{action}</button>)}<button className="wheel-close" onClick={()=>setWheelPlayerId('')} type="button">×</button></div></div>}
        </div>
        <div className="live-bench"><span>Bench</span>{bench.map((player)=><button key={player.id} onClick={()=>setMatch((c)=>({...c,selectedPlayerId:player.id}))} type="button"><b>#{player.number}</b><small>{player.name.split(' ')[0]}</small></button>)}</div>
      </section>
      <footer className="live-command-bar"><button onClick={rotate} type="button">↻ Rotate</button><button onClick={()=>{setMatch((c)=>({...c,homeTimeouts:c.homeTimeouts+1}));addEvent('timeout','Home timeout')}} type="button">Timeout {match.homeTimeouts}</button><button onClick={undo} type="button">↶ Undo event</button><button onClick={()=>setShowTimeline(true)} type="button">☷ Timeline</button><div className="sub-console"><select value={subOut} onChange={(e)=>setSubOut(e.target.value)}><option value="">Player out</option>{court.map((p)=><option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}</select><select onChange={(e)=>substitute(e.target.value)} value=""><option value="">Player in</option>{bench.map((p)=><option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}</select></div></footer>
    </main>

    {flash&&<div className="live-flash">{flash}</div>}
    {showTimeline&&<div className="live-drawer-backdrop" onClick={()=>setShowTimeline(false)}><section className="live-timeline" onClick={(e)=>e.stopPropagation()}><header><div><span>Match timeline</span><strong>{match.events.length} events</strong></div><button onClick={()=>setShowTimeline(false)} type="button">×</button></header><div>{match.events.map((event)=><article key={event.id}><time>{event.at}</time><span className={`event-${event.kind}`}>{event.kind}</span><p>{event.label}</p></article>)}{match.events.length===0&&<p className="timeline-empty">Score changes, stats, rotations, substitutions, and timeouts will appear here.</p>}</div></section></div>}
    {showExit&&<div className="live-exit-backdrop"><section className="live-exit-card"><span>Live match</span><h2>Leave Match Mode?</h2><p>Your current score, court, and timeline are already saved on this device.</p><button className="button button-primary" onClick={()=>setShowExit(false)} type="button">Resume match</button><button className="button button-quiet" onClick={saveExit} type="button">Save & exit</button><button className="button button-quiet" onClick={newMatch} type="button">Reset match</button></section></div>}
  </div>
}

function buildInitial(players:CourtPlayer[],opponent:string):MatchState{const starters=players.filter((p)=>!p.libero).slice(0,6);const libero=players.find((p)=>p.libero);const courtIds=[...starters.map((p)=>p.id),...(starters.length<6&&libero?[libero.id]:[])].slice(0,6);const positions=Object.fromEntries(courtIds.map((id,index)=>[id,defaultPoints[index]]));return{homeScore:0,awayScore:0,set:1,homeSets:0,awaySets:0,serving:'home',rotation:1,courtIds,benchIds:players.map((p)=>p.id).filter((id)=>!courtIds.includes(id)),positions,selectedPlayerId:courtIds[0]||players[0]?.id||'',events:[],homeTimeouts:0,awayTimeouts:0,opponent,started:true}}
function readState(players:CourtPlayer[],opponent:string){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null') as MatchState|null;if(!saved)return buildInitial(players,opponent);const ids=new Set(players.map((p)=>p.id));const courtIds=saved.courtIds.filter((id)=>ids.has(id)).slice(0,6);const known=new Set(courtIds);const benchIds=[...saved.benchIds.filter((id)=>ids.has(id)&&!known.has(id)),...players.map((p)=>p.id).filter((id)=>!known.has(id)&&!saved.benchIds.includes(id))];const positions={...Object.fromEntries(courtIds.map((id,index)=>[id,defaultPoints[index]])),...(saved.positions??{})};return{...saved,opponent:saved.opponent||opponent,courtIds,benchIds,positions,selectedPlayerId:ids.has(saved.selectedPlayerId)?saved.selectedPlayerId:(courtIds[0]||benchIds[0]||'')}}catch{return buildInitial(players,opponent)}}