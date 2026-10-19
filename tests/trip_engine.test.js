'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {plan,km,visitHours,groupWarnings}=require('../apps/planner/trip-engine.js');
const point=(id,lat,lon,country='Thailand',visit='2h')=>({id,en:id,locEn:`Test, ${country}`,lat,lon,visit});
test('planner keeps nearby places together but prevents implausibly distant day routes',()=>{
 const bangkok=point('bkk',13.7563,100.5018),chiangmai=point('cnx',18.7883,98.9853),lamphun=point('lam',18.58,99.01);
 let x=plan([bangkok,chiangmai,lamphun],{days:2,hoursPerDay:8,travelMode:'driving'});
 assert.equal(x.unassigned.length,0);assert.deepEqual(x.groups.map(g=>g.length),[1,2]);
 x=plan([bangkok,chiangmai,lamphun],{days:1,hoursPerDay:8,travelMode:'driving'});
 assert.equal(x.groups.flat().length,1);assert.equal(x.unassigned.length,2);assert.match(x.issues.join(' '),/more days/);
});
test('planner never mixes different countries on the same day and explains transfers',()=>{
 const a=point('th',19,99,'Thailand'),b=point('la',19.001,99,'Laos');
 const x=plan([a,b],{days:2,hoursPerDay:10,travelMode:'driving'});
 assert.deepEqual(x.groups.map(g=>g.length),[1,1]);
 assert.match(x.issues.join(' '),/multiple countries/);
 assert.match(groupWarnings([['th','la']],[a,b],'driving').join(' '),/different countries/);
 assert.match(groupWarnings([['th'],['la']],[a,b],'driving').join(' '),/crosses countries/);
});
test('walking mode rejects distant stops and plans time allowances',()=>{
 const a=point('a',18,99,'Thailand','2–4h'),b=point('b',18.2,99,'Thailand','3h');
 assert.equal(visitHours(a),3);assert.ok(km(a,b)>10);
 assert.equal(plan([a,b],{days:1,hoursPerDay:9,travelMode:'walking'}).unassigned.length,1);
 assert.equal(plan([a,b],{days:2,hoursPerDay:9,travelMode:'walking'}).unassigned.length,0);
});
test('hours/day and per-day cap do not silently overflow a saved itinerary',()=>{
 const a=point('x',18,99,'Thailand','8h'),b=point('y',18,99,'Thailand','4h');
 const x=plan([a,b],{days:1,hoursPerDay:6,travelMode:'driving'});
 assert.equal(x.groups[0].length,1);assert.equal(x.unassigned.length,1);
 assert.ok(x.issues.some(i=>i.includes('daily visit-time')));
 const points=Array.from({length:25},(_,i)=>point('point-'+i,18,99));
 const capped=plan(points,{days:1,hoursPerDay:12,travelMode:'driving'});
 assert.equal(capped.groups[0].length,6);assert.equal(capped.unassigned.length,19);
});
