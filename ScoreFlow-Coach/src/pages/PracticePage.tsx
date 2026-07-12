import { useEffect, useMemo, useState, type FormEvent } from 'react';
import ContextBar from '../components/ContextBar';
import SelectField from '../components/SelectField';
import SlideOver from '../components/SlideOver';
import { useWorkspace } from '../context/WorkspaceContext';

type PracticeBlock = { id:string; title:string; category:string; duration:number; notes:string; equipment:string };
type PracticePlan = { eventId:string; teamId:string; seasonId:string; focus:string; coachNotes:string; completed:boolean; blocks:PracticeBlock[]; updatedAt:string };

const STORAGE_KEY='scoreflow-coach-practice-plans-v1';
const categories=['Warm-up','Serving','Passing','Setting','Attacking','Blocking','Defense','Team Play','Conditioning','Cooldown'];
const quickDrills=[
  {title:'Dynamic warm-up',category:'Warm-up',duration:10,equipment:'Cones'},
  {title:'Serve receive lanes',category:'Passing',duration:20,equipment:'Volleyballs, cones'},
  {title:'Setter target work',category:'Setting',duration:15,equipment:'Targets, volleyballs'},
  {title:'Six-on-six wash',category:'Team Play',duration:25,equipment:'Full court'},
  {title:'Pressure serving',category:'Serving',duration:15,equipment:'Volleyballs'},
  {title:'Cool down and review',category:'Cooldown',duration:10,equipment:''}
];

export default function PracticePage(){
  const workspace=useWorkspace();
  const practices=useMemo(()=>workspace.scheduleEvents.filter((event)=>event.teamId===workspace.activeTeamId&&event.seasonId===workspace.activeSeasonId&&event.type==='practice'&&event.status!=='cancelled').sort((a,b)=>`${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),[workspace.scheduleEvents,workspace.activeTeamId,workspace.activeSeasonId]);
  const [plans,setPlans]=useState<PracticePlan[]>(readPlans);
  const [selectedEventId,setSelectedEventId]=useState('');
  const [editorOpen,setEditorOpen]=useState(false);

  useEffect(()=>{if(!practices.some((event)=>event.id===selectedEventId))setSelectedEventId(practices[0]?.id??'')},[practices,selectedEventId]);
  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(plans)),[plans]);

  const event=practices.find((item)=>item.id===selectedEventId);
  const plan=plans.find((item)=>item.eventId===selectedEventId)??emptyPlan(event?.id??'',workspace.activeTeamId,workspace.activeSeasonId);
  const total=plan.blocks.reduce((sum,block)=>sum+block.duration,0);

  function savePlan(patch:Partial<PracticePlan>){
    if(!selectedEventId)return;
    setPlans((current)=>{const existing=current.find((item)=>item.eventId===selectedEventId);const next={...(existing??emptyPlan(selectedEventId,workspace.activeTeamId,workspace.activeSeasonId)),...patch,updatedAt:new Date().toISOString()};return existing?current.map((item)=>item.eventId===selectedEventId?next:item):[...current,next]});
  }
  function addBlock(input:Omit<PracticeBlock,'id'>){savePlan({blocks:[...plan.blocks,{...input,id:`block-${Date.now()}-${Math.random().toString(36).slice(2,6)}`}]})}
  function removeBlock(id:string){savePlan({blocks:plan.blocks.filter((block)=>block.id!==id)})}
  function moveBlock(index:number,direction:-1|1){const target=index+direction;if(target<0||target>=plan.blocks.length)return;const blocks=[...plan.blocks];[blocks[index],blocks[target]]=[blocks[target],blocks[index]];savePlan({blocks})}

  const eventOptions=practices.map((item)=>({value:item.id,label:`${formatDate(item.date)} · ${item.title}`}));
  return <div className="practice-workspace">
    <ContextBar label="Practice context" />
    <section className="practice-header panel">
      <div><p className="eyebrow">Practice planning</p><h2>{event?.title??'Choose a scheduled practice'}</h2><p>{event?`${formatDate(event.date)} · ${formatTime(event.startTime)} · ${event.venue||'Location not set'}`:'Create a Practice event in Schedule first.'}</p></div>
      <div className="practice-event-picker"><span>Scheduled practice</span><SelectField value={selectedEventId} onChange={setSelectedEventId} options={eventOptions.length?eventOptions:[{value:'',label:'No practices scheduled'}]} disabled={!eventOptions.length}/></div>
      <div className="practice-total"><span>Plan length</span><strong>{total} min</strong><small>{plan.blocks.length} blocks</small></div>
    </section>

    <section className="practice-body">
      <div className="practice-main panel">
        <header><div><p className="eyebrow">Timed timeline</p><h3>Practice plan</h3></div><button className="button button-primary" disabled={!event} onClick={()=>setEditorOpen(true)} type="button">＋ Add block</button></header>
        <label className="practice-focus"><span>Primary focus</span><input disabled={!event} value={plan.focus} placeholder="Example: Serve receive and rotations 2/5" onChange={(e)=>savePlan({focus:e.target.value})}/></label>
        <div className="practice-timeline">
          {plan.blocks.map((block,index)=><article className="practice-block" key={block.id}>
            <span className="practice-time">{block.duration}<small>min</small></span>
            <div><span className="practice-category">{block.category}</span><h4>{block.title}</h4>{block.notes&&<p>{block.notes}</p>}{block.equipment&&<small>Equipment: {block.equipment}</small>}</div>
            <div className="practice-block-actions"><button disabled={index===0} onClick={()=>moveBlock(index,-1)} type="button">↑</button><button disabled={index===plan.blocks.length-1} onClick={()=>moveBlock(index,1)} type="button">↓</button><button onClick={()=>removeBlock(block.id)} type="button">×</button></div>
          </article>)}
          {event&&plan.blocks.length===0&&<div className="practice-empty"><span>＋</span><p>Add drills or use the quick library to build this practice.</p></div>}
          {!event&&<div className="practice-empty"><span>▦</span><p>No scheduled practice is available in this team and season.</p></div>}
        </div>
      </div>

      <aside className="practice-side panel">
        <section><p className="eyebrow">Quick drill library</p><h3>Common blocks</h3><div className="quick-drill-list">{quickDrills.map((drill)=><button disabled={!event} key={drill.title} onClick={()=>addBlock({...drill,notes:''})} type="button"><span>＋</span><div><strong>{drill.title}</strong><small>{drill.category} · {drill.duration} min</small></div></button>)}</div></section>
        <section className="practice-notes"><p className="eyebrow">Coach notes</p><textarea disabled={!event} rows={5} value={plan.coachNotes} placeholder="Equipment, player groups, reminders..." onChange={(e)=>savePlan({coachNotes:e.target.value})}/><label><input disabled={!event} checked={plan.completed} onChange={(e)=>savePlan({completed:e.target.checked})} type="checkbox"/> Mark practice complete</label></section>
      </aside>
    </section>

    <SlideOver open={editorOpen} title="Add practice block" onClose={()=>setEditorOpen(false)}><BlockForm onCancel={()=>setEditorOpen(false)} onSave={(input)=>{addBlock(input);setEditorOpen(false)}}/></SlideOver>
  </div>
}

function BlockForm({onCancel,onSave}:{onCancel:()=>void;onSave:(input:Omit<PracticeBlock,'id'>)=>void}){
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);onSave({title:String(data.get('title')??'').trim(),category:String(data.get('category')??'Team Play'),duration:Number(data.get('duration')??15),notes:String(data.get('notes')??'').trim(),equipment:String(data.get('equipment')??'').trim()})}
  return <form className="practice-editor-form" onSubmit={submit}><div className="editor-grid"><label><span>Block name</span><input autoFocus name="title" required/></label><label><span>Category</span><SelectField name="category" defaultValue="Team Play" options={categories.map((value)=>({value,label:value}))}/></label><label><span>Duration</span><SelectField name="duration" defaultValue="15" options={[5,10,15,20,25,30,40,45,60].map((value)=>({value:String(value),label:`${value} minutes`}))}/></label><label><span>Equipment</span><input name="equipment" placeholder="Volleyballs, cones..."/></label></div><label className="notes-field"><span>Coaching notes</span><textarea name="notes" rows={5}/></label><div className="slide-form-actions"><button className="button button-quiet" onClick={onCancel} type="button">Cancel</button><button className="button button-primary" type="submit">Add block</button></div></form>
}

function readPlans():PracticePlan[]{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]') as PracticePlan[]}catch{return[]}}
function emptyPlan(eventId:string,teamId:string,seasonId:string):PracticePlan{return{eventId,teamId,seasonId,focus:'',coachNotes:'',completed:false,blocks:[],updatedAt:new Date().toISOString()}}
function formatDate(value:string){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`))}
function formatTime(value:string){if(!value)return'TBD';const[h,m]=value.split(':').map(Number);return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(2000,0,1,h,m))}
