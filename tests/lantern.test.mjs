import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rules, makeDrops, newRound, startRound, pauseRound, resumeRound, moveJar, advanceRound, visibleDrops } from "../public/lantern-model.js";
import { setupLantern } from "../public/lantern.js";

function until(state, time) {
  while (state.elapsed < time && state.status === "running") state = advanceRound(state,Math.min(0.05,time-state.elapsed));
  return state;
}

test("seeded schedules are reproducible, bounded, immutable and varied", () => {
  assert.deepEqual(makeDrops(42),makeDrops(42));
  assert.notDeepEqual(makeDrops(42),makeDrops(43));
  assert.deepEqual(makeDrops(-1),makeDrops(0xffffffff));
  for (const seed of [0,1,42,0xffffffff,NaN]) {
    const drops=makeDrops(seed);
    assert.equal(drops.length,44);assert.ok(Object.isFrozen(drops));
    assert.equal(new Set(drops.map(drop=>drop.id)).size,44);
    drops.forEach((drop,index) => {
      assert.ok(Object.isFrozen(drop));
      assert.ok(Number.isInteger(drop.lane) && drop.lane>=0 && drop.lane<rules.lanes);
      assert.ok(drop.at>=0 && drop.arrival>drop.at && drop.arrival<rules.duration);
      assert.ok(index===0 || drop.arrival>drops[index-1].arrival);
      assert.equal(drop.kind,index%4===3 ? "leaf" : "light");
    });
  }
});

test("invalid time steps and non-running states cannot change a round", () => {
  const ready=newRound(1), running=startRound(ready);
  assert.equal(ready.status,"ready");assert.equal(running.status,"running");
  for (const seconds of [-1,0,0.10001,1,NaN,Infinity,"0.05",undefined]) assert.strictEqual(advanceRound(running,seconds),running);
  for (const state of [ready,pauseRound(running),{...running,status:"finished"}]) {
    assert.strictEqual(advanceRound(state,0.05),state);
    assert.strictEqual(moveJar(state,0),state);
  }
  assert.strictEqual(startRound(running),running);
  assert.strictEqual(resumeRound(ready),ready);
});

test("jar movement is bounded and does not change time, schedule or score", () => {
  const state=startRound(newRound(7));
  assert.equal(moveJar(state,-20).lane,0);assert.equal(moveJar(state,99).lane,4);
  for (const lane of [NaN,Infinity,1.5,"1",null]) assert.strictEqual(moveJar(state,lane),state);
  const moved=moveJar(state,3);
  assert.equal(state.lane,2);assert.equal(moved.lane,3);
  assert.equal(moved.elapsed,state.elapsed);assert.equal(moved.caught,0);
  assert.strictEqual(moved.drops,state.drops);
});

test("a light is counted once on crossing the jar, not on appearance or repeat frames", () => {
  let state=startRound(newRound(5));
  const first=state.drops[0];state=moveJar(state,first.lane);
  state=until(state,first.arrival-0.02);
  assert.equal(state.caught,0);
  const before=JSON.stringify(state);
  const caught=advanceRound(state,0.04);
  assert.equal(caught.caught,1);assert.deepEqual(caught.lastEvent,{id:0,kind:"light"});
  assert.equal(JSON.stringify(state),before);
  assert.equal(advanceRound(caught,0.05).caught,1);
});

test("missing a firefly costs no life, while three caught leaves end the round", () => {
  let state=startRound(newRound(4));
  for (const drop of state.drops) {
    state=moveJar(state,drop.kind === "leaf" ? drop.lane : (drop.lane+1)%rules.lanes);
    state=until(state,drop.arrival+0.001);
    if(state.status === "finished") break;
  }
  assert.equal(state.caught,0);assert.equal(state.leaves,3);
  assert.equal(state.outcome,"leaves");assert.equal(state.status,"finished");
  assert.strictEqual(advanceRound(state,0.1),state);
});

test("time expires exactly at the duration without negative time or extra catches", () => {
  let state=startRound(newRound(8));
  for(const drop of state.drops) {
    state=moveJar(state,(drop.lane+1)%rules.lanes);
    state=until(state,drop.arrival+0.001);
  }
  state=until(state,rules.duration);
  assert.equal(state.elapsed,32);assert.equal(state.outcome,"time");
  assert.equal(state.caught,0);assert.equal(state.leaves,0);
  assert.strictEqual(advanceRound(state,0.1),state);
});

test("every sampled seed has a reachable win with the same input rules", () => {
  for(let seed=0;seed<40;seed++) {
    let state=startRound(newRound(seed));
    for(const drop of state.drops) {
      state=moveJar(state,drop.kind === "light" ? drop.lane : (drop.lane+1)%rules.lanes);
      state=until(state,drop.arrival+0.001);
      if(state.status === "finished") break;
    }
    assert.equal(state.outcome,"won",`seed ${seed}`);assert.equal(state.caught,rules.target);
    assert.equal(state.leaves,0);assert.ok(state.elapsed<rules.duration);
    assert.strictEqual(moveJar(state,0),state);
  }
});

test("pause and resume preserve every falling object and a fresh round resets all progress", () => {
  const running=until(startRound(newRound(23)),2), paused=pauseRound(running);
  assert.deepEqual(visibleDrops(paused),visibleDrops(running));
  assert.strictEqual(advanceRound(paused,0.1),paused);
  assert.deepEqual(resumeRound(paused),running);
  const fresh=newRound(24);
  assert.equal(fresh.elapsed,0);assert.equal(fresh.caught,0);assert.equal(fresh.leaves,0);
  assert.equal(fresh.lastEvent,null);assert.equal(fresh.status,"ready");
  assert.notDeepEqual(fresh.drops,running.drops);
});

test("visible drops exist only between spawn and arrival, with bounded progress", () => {
  const base=newRound(2);assert.deepEqual(visibleDrops(base),[]);
  for(let elapsed=0;elapsed<=32;elapsed+=0.05) {
    const visible=visibleDrops({...base,elapsed});
    for(const drop of visible) assert.ok(drop.progress>=0 && drop.progress<1);
    assert.equal(new Set(visible.map(drop=>drop.id)).size,visible.length);
  }
  const first=base.drops[0];
  assert.ok(visibleDrops({...base,elapsed:first.at}).some(drop=>drop.id===0));
  assert.ok(!visibleDrops({...base,elapsed:first.arrival}).some(drop=>drop.id===0));
});

function controllerFixture() {
  const root={hidden:false,activeElement:null,listeners:new Map(),addEventListener(type,fn){this.listeners.set(type,fn);}};
  function element() {
    return { textContent:"",innerHTML:"",hidden:false,disabled:false,dataset:{},attributes:{},listeners:new Map(),
      style:{setProperty(key,value){this[key]=value;}},classList:{toggle(){}},
      addEventListener(type,fn){this.listeners.set(type,fn);},
      setAttribute(key,value){this.attributes[key]=value;},focus(){root.activeElement=this;},scrollIntoView(options){this.scrolled=options;} };
  }
  const ids=["catch-game","playfield","falling-items","catch-jar","game-overlay","overlay-title","overlay-copy","round-action","light-count","leaf-count","time-left","game-status","pause-round","move-left","move-right"];
  const nodes=Object.fromEntries(ids.map(id=>[id,element()]));
  const lanes=Array.from({length:5},(_,index)=>({...element(),dataset:{lane:String(index)}}));
  nodes["catch-game"].querySelectorAll=()=>lanes;
  root.querySelector=selector=>nodes[selector.slice(1)];
  const frames=new Map();let next=0;
  const view={listeners:new Map(),requestAnimationFrame(fn){frames.set(++next,fn);return next;},cancelAnimationFrame(id){frames.delete(id);},addEventListener(type,fn){this.listeners.set(type,fn);}};
  setupLantern(root,view);
  const click=node=>{if(!node.disabled)node.listeners.get("click")();};
  const frame=time=>{const entry=frames.entries().next().value;if(entry){frames.delete(entry[0]);entry[1](time);}};
  const key=(key,props={})=>{const event={key,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...props};nodes["catch-game"].listeners.get("keydown")(event);return event;};
  return {root,nodes,lanes,view,frames,click,frame,key};
}

test("controller starts only explicitly, moves via buttons and keys, and pauses manually", () => {
  const f=controllerFixture();assert.equal(f.frames.size,0);assert.equal(f.nodes["move-left"].disabled,true);
  f.click(f.nodes["round-action"]);assert.equal(f.frames.size,1);assert.equal(f.nodes["game-overlay"].hidden,true);
  assert.deepEqual(f.nodes["catch-game"].scrolled,{block:"start"});
  f.key("1");assert.equal(f.lanes[0].attributes["aria-pressed"],"true");
  assert.equal(f.nodes["move-left"].disabled,true);
  f.key("d");assert.equal(f.lanes[1].attributes["aria-pressed"],"true");
  f.click(f.lanes[4]);assert.equal(f.nodes["move-right"].disabled,true);
  f.click(f.nodes["move-left"]);assert.equal(f.lanes[3].attributes["aria-pressed"],"true");
  f.key("Escape");assert.equal(f.frames.size,0);assert.equal(f.nodes["game-overlay"].hidden,false);
  assert.equal(f.root.activeElement,f.nodes["round-action"]);
  f.key("Escape",{repeat:true});assert.equal(f.frames.size,0);
  f.click(f.nodes["round-action"]);assert.equal(f.frames.size,1);
  assert.equal(f.lanes[3].attributes["aria-pressed"],"true");
});

test("controller does not intercept modified keys or start play from an unrelated key", () => {
  const f=controllerFixture();assert.equal(f.key("ArrowLeft").defaultPrevented,false);
  f.click(f.nodes["round-action"]);
  for(const modifier of ["ctrlKey","metaKey","altKey"]) assert.equal(f.key("p",{[modifier]:true}).defaultPrevented,false);
  assert.equal(f.key("Tab").defaultPrevented,false);assert.equal(f.frames.size,1);
});

test("hidden tab, blur and page exit pause without auto-resuming or accumulating time", () => {
  for(const cause of ["visibilitychange","blur","pagehide"]) {
    const f=controllerFixture();f.click(f.nodes["round-action"]);f.frame(0);f.frame(100);
    const clock=f.nodes["time-left"].innerHTML, sprites=f.nodes["falling-items"].innerHTML;
    if(cause === "visibilitychange"){f.root.hidden=true;f.root.listeners.get(cause)();}
    else f.view.listeners.get(cause)();
    assert.equal(f.frames.size,0);assert.equal(f.nodes["game-overlay"].hidden,false);
    f.root.hidden=false;f.root.listeners.get("visibilitychange")();
    assert.equal(f.frames.size,0);
    f.click(f.nodes["round-action"]);f.frame(50000);
    assert.equal(f.nodes["time-left"].innerHTML,clock);assert.equal(f.nodes["falling-items"].innerHTML,sprites);
  }
});

test("a delayed frame pauses instead of jumping ahead, and starting hidden stays paused", () => {
  const f=controllerFixture();f.click(f.nodes["round-action"]);f.frame(0);f.frame(5000);
  assert.equal(f.frames.size,0);assert.match(f.nodes["game-status"].textContent,/interruption/);
  assert.equal(f.nodes["time-left"].innerHTML,"32<small>s</small>");
  const hidden=controllerFixture();hidden.root.hidden=true;hidden.click(hidden.nodes["round-action"]);
  assert.equal(hidden.frames.size,0);assert.equal(hidden.nodes["game-overlay"].hidden,false);
});

test("the controller reaches an ending, stops frames, then resets on explicit replay", () => {
  const f=controllerFixture();f.click(f.nodes["round-action"]);
  for(let time=0;time<=34000 && f.frames.size;time+=50)f.frame(time);
  assert.equal(f.frames.size,0);assert.equal(f.nodes["game-overlay"].hidden,false);
  assert.equal(f.nodes["round-action"].textContent,"Catch another evening");
  assert.equal(f.root.activeElement,f.nodes["round-action"]);
  f.click(f.nodes["round-action"]);
  assert.equal(f.frames.size,1);assert.equal(f.nodes["light-count"].innerHTML,"0 <small>/ 12</small>");
  assert.equal(f.nodes["leaf-count"].innerHTML,"0 <small>/ 3</small>");
  assert.equal(f.nodes["time-left"].innerHTML,"32<small>s</small>");
});

test("the new game has labelled native controls, reduced decoration and no external services", () => {
  const read=name=>readFileSync(new URL(`../public/${name}`,import.meta.url),"utf8");
  const html=read("lantern.html"),js=read("lantern.js"),css=read("lantern.css");
  assert.equal((html.match(/data-lane="[0-4]"/g)||[]).length,5);
  assert.match(html,/aria-describedby="game-help"/);assert.match(html,/role="status" aria-live="polite"/);
  assert.match(html,/visual timing game/i);assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/\.scoreboard\{position:sticky;top:12px/);
  assert.doesNotMatch(js,/fetch\(|localStorage|sessionStorage|setInterval|setTimeout/);
  assert.match(read("floor.html"),/href="lantern.html">Play the sketch/);
});
